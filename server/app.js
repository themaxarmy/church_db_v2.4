import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { users, records, rateLimits } from './db.js';

// The Express app, shared by the local server (index.js) and the Netlify Function (functions/api.mjs).
const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(cookieParser());
// Photos are shrunk in the browser before upload; Netlify Functions reject requests over ~6MB.
app.use(express.json({ limit: '2mb' }));

// One line per request, e.g. "POST /api/auth/signin 401 12ms — Incorrect email or password".
app.use((req, res, next) => {
  const start = Date.now();
  const json = res.json.bind(res);
  res.json = (body) => {
    res.locals.error = body?.error;
    return json(body);
  };
  res.on('finish', () => {
    const error = res.locals.error ? ` — ${res.locals.error}` : '';
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms${error}${res.locals.detail ?? ''}`);
  });
  next();
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Wraps async handlers so rejections reach the error middleware.
const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

// --- Rate limiting (per IP, fixed window, counted in the database) ---
// Stored in the database because serverless function instances don't share memory.

// On Netlify, functions/api.mjs sets this to the header Netlify's edge fills with the real client IP.
const clientIp = (req) => (req.app.locals.clientIpHeader && req.get(req.app.locals.clientIpHeader)) || req.ip;

const rateLimit = ({ name, windowMs, max }) =>
  route(async (req, res, next) => {
    const { hits, resetAt } = await rateLimits.hit(`${name}:${clientIp(req)}`, windowMs);
    if (hits > max) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))));
      throw new HttpError(429, 'Too many requests. Please try again later.');
    }
    next();
  });

const authLimiter = rateLimit({ name: 'auth', windowMs: 15 * 60 * 1000, max: 20 });
const submitLimiter = rateLimit({ name: 'submit', windowMs: 60 * 60 * 1000, max: 10 });

// --- Auth ---

const COOKIE = 'token';
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProduction,
  path: '/',
};

const setSession = (res, user) => {
  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  const decoded = jwt.decode(token);
  res.cookie(COOKIE, token, { ...cookieOptions, maxAge: decoded.exp * 1000 - Date.now() });
};

// Reloads the user from the database on every request so status/role changes apply immediately.
const loadUser = async (req) => {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;
  try {
    const { sub } = jwt.verify(token, config.jwtSecret);
    return await users.findById(sub);
  } catch {
    return null;
  }
};

const requireAuth = route(async (req, res, next) => {
  req.user = await loadUser(req);
  if (!req.user) throw new HttpError(401, 'Not signed in');
  next();
});

const requireApproved = (req, res, next) => {
  if (req.user.status !== 'approved') return next(new HttpError(403, 'Your account is awaiting approval'));
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission to do this'));
  next();
};

const requireSuperAdmin = [requireApproved, requireRole('super_admin')];
const requireAdmin = [requireApproved, requireRole('admin', 'super_admin')];

// --- Validation ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PICTURE_RE = /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+=*$/;
const MAX_PICTURE_LENGTH = 1.5 * 1024 * 1024; // characters of base64, about 1.1MB of image
const MAX_NAME_LENGTH = 200;
const PHONE_RE = /^\+?[0-9 ()\-.]{6,30}$/;
const GENDERS = ['male', 'female'];
const ROLES = ['user', 'admin', 'super_admin'];

const requireUuid = (id) => {
  if (!UUID_RE.test(id)) throw new HttpError(404, 'Not found');
  return id;
};

const readCredentials = (body) => {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  return { email, password };
};

// Optional fields that are blank become null, so they're stored as empty.
const cleanText = (value, label, required, max = MAX_NAME_LENGTH) => {
  if (value === undefined || value === null) {
    if (required) throw new HttpError(400, `${label} is required`);
    return value;
  }
  if (typeof value !== 'string') throw new HttpError(400, `${label} must be text`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new HttpError(400, `${label} is required`);
  if (trimmed.length > max) throw new HttpError(400, `${label} is too long`);
  return trimmed || null;
};

const cleanPhone = (value, label) => {
  const phone = cleanText(value, label, false, 30);
  if (phone && !PHONE_RE.test(phone)) throw new HttpError(400, `${label} is not a valid phone number`);
  return phone;
};

const cleanEmail = (value) => {
  const email = cleanText(value, 'Email', false, 254);
  if (email && !EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid email address');
  return email && email.toLowerCase();
};

const cleanGender = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (!GENDERS.includes(value)) throw new HttpError(400, `Gender must be one of: ${GENDERS.join(', ')}`);
  return value;
};

const ageOn = (dateOfBirth, today = new Date()) => {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const hadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  return today.getFullYear() - year - (hadBirthday ? 0 : 1);
};

const cleanDateOfBirth = (value, required) => {
  if (value === undefined) {
    if (required) throw new HttpError(400, 'Date of birth is required');
    return undefined;
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, 'Date of birth must be a date (YYYY-MM-DD)');
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, 'Date of birth is not a valid date');
  }
  if (date > new Date()) throw new HttpError(400, 'Date of birth cannot be in the future');
  if (date.getUTCFullYear() < 1900) throw new HttpError(400, 'Date of birth is not a valid date');
  return value;
};

const cleanPicture = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !PICTURE_RE.test(value)) {
    throw new HttpError(400, 'Picture must be a PNG, JPEG, GIF or WebP image');
  }
  if (value.length > MAX_PICTURE_LENGTH) throw new HttpError(413, 'Picture is too large (1MB max)');
  return value;
};

const cleanRecord = (body, { partial }) => {
  const record = {
    firstName: cleanText(body?.firstName, 'First name', !partial),
    lastName: cleanText(body?.lastName, 'Last name', !partial),
    otherNames: cleanText(body?.otherNames, 'Other names', false),
    dateOfBirth: cleanDateOfBirth(body?.dateOfBirth, !partial),
    picture: cleanPicture(body?.picture),
    gender: cleanGender(body?.gender),
    phone: cleanPhone(body?.phone, 'Phone'),
    email: cleanEmail(body?.email),
    address: cleanText(body?.address, 'Address', false, 500),
    ministry: cleanText(body?.ministry, 'Ministry', false, 100),
    guardianName: cleanText(body?.guardianName, 'Parent or guardian name', false),
    guardianPhone: cleanPhone(body?.guardianPhone, 'Parent or guardian phone'),
    emergencyContactName: cleanText(body?.emergencyContactName, 'Emergency contact name', false),
    emergencyContactPhone: cleanPhone(body?.emergencyContactPhone, 'Emergency contact phone'),
    emergencyContactRelationship: cleanText(body?.emergencyContactRelationship, 'Emergency contact relationship', false, 100),
  };
  if (!partial) requireGuardianIfMinor(record);
  return record;
};

const requireGuardianIfMinor = (record) => {
  if (ageOn(record.dateOfBirth) < 18 && !(record.guardianName && record.guardianPhone)) {
    throw new HttpError(400, "A parent or guardian's name and phone are required for anyone under 18");
  }
};

// --- Routes ---

const api = express.Router();

api.get('/health', (req, res) => res.json({ ok: true }));

api.post('/auth/signup', authLimiter, route(async (req, res) => {
  const { email, password } = readCredentials(req.body);
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid email address');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  if (password.length > 200) throw new HttpError(400, 'Password is too long');

  let user;
  try {
    user = await users.create(email, await bcrypt.hash(password, 12));
  } catch (err) {
    if (err.code === '23505') throw new HttpError(409, 'An account with this email already exists');
    throw err;
  }
  setSession(res, user);
  res.status(201).json({ user });
}));

api.post('/auth/signin', authLimiter, route(async (req, res) => {
  const { email, password } = readCredentials(req.body);
  const credentials = email && password ? await users.findCredentialsByEmail(email) : null;
  const valid = credentials && (await bcrypt.compare(password, credentials.password_hash));
  if (!valid) {
    // The client gets one generic message; the server log says which part was wrong.
    if (!config.isProduction) res.locals.detail = credentials ? ' (wrong password)' : ` (no account for ${email})`;
    throw new HttpError(401, 'Incorrect email or password');
  }

  const user = await users.findById(credentials.id);
  setSession(res, user);
  res.json({ user });
}));

api.post('/auth/signout', (req, res) => {
  res.clearCookie(COOKIE, cookieOptions);
  res.json({ message: 'Signed out' });
});

api.get('/auth/me', route(async (req, res) => {
  res.json({ user: await loadUser(req) });
}));

api.post('/auth/reset-password', authLimiter, (req, res) => {
  res.status(501).json({ error: 'Password reset is not available yet. Contact an administrator.' });
});

api.get('/records', requireAuth, requireApproved, route(async (req, res) => {
  res.json({ records: await records.findAll() });
}));

// Public: the /collect form submits here without signing in. Approved staff are recorded as the submitter.
api.post('/records', submitLimiter, route(async (req, res) => {
  const input = cleanRecord(req.body, { partial: false });
  const user = await loadUser(req);
  const record = await records.create(input, user?.status === 'approved' ? user.id : null);
  res.status(201).json(record);
}));

api.get('/records/:id', requireAuth, requireApproved, route(async (req, res) => {
  const record = await records.findById(requireUuid(req.params.id));
  if (!record) throw new HttpError(404, 'Record not found');
  res.json(record);
}));

api.put('/records/:id', requireAuth, requireAdmin, route(async (req, res) => {
  const id = requireUuid(req.params.id);
  const updates = cleanRecord(req.body, { partial: true });
  if (updates.firstName === null || updates.lastName === null) {
    throw new HttpError(400, 'First and last name cannot be removed');
  }
  const existing = await records.findById(id);
  if (!existing) throw new HttpError(404, 'Record not found');
  const changed = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
  requireGuardianIfMinor({ ...existing, ...changed });

  const record = await records.update(id, updates, req.user.id);
  if (!record) throw new HttpError(404, 'Record not found');
  res.json(record);
}));

// Archived records stay in the database but are hidden from the dashboard by default.
const setArchived = (archived) => route(async (req, res) => {
  const record = await records.setArchived(requireUuid(req.params.id), archived, req.user.id);
  if (!record) throw new HttpError(404, 'Record not found');
  res.json(record);
});

api.patch('/records/:id/archive', requireAuth, requireAdmin, setArchived(true));
api.patch('/records/:id/restore', requireAuth, requireAdmin, setArchived(false));

api.delete('/records/:id', requireAuth, requireAdmin, route(async (req, res) => {
  if (!(await records.remove(requireUuid(req.params.id)))) throw new HttpError(404, 'Record not found');
  res.status(204).end();
}));

api.get('/users', requireAuth, requireSuperAdmin, route(async (req, res) => {
  res.json({ users: await users.findAll() });
}));

const updateStatus = (status) => route(async (req, res) => {
  const id = requireUuid(req.params.id);
  if (id === req.user.id) throw new HttpError(400, 'You cannot change your own status');
  const user = await users.setStatus(id, status, req.user.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json(user);
});

api.patch('/users/:id/approve', requireAuth, requireSuperAdmin, updateStatus('approved'));
api.patch('/users/:id/reject', requireAuth, requireSuperAdmin, updateStatus('rejected'));

api.patch('/users/:id/role', requireAuth, requireSuperAdmin, route(async (req, res) => {
  const id = requireUuid(req.params.id);
  if (id === req.user.id) throw new HttpError(400, 'You cannot change your own role');
  if (!ROLES.includes(req.body?.role)) throw new HttpError(400, `Role must be one of: ${ROLES.join(', ')}`);
  const user = await users.setRole(id, req.body.role);
  if (!user) throw new HttpError(404, 'User not found');
  res.json(user);
}));

app.use('/api', api);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

export default app;
