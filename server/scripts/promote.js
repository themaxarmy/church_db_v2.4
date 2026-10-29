// Usage: npm run promote -- you@example.com
// Makes an existing account an approved super admin. Use it once to bootstrap the first admin.
import { users, pool } from '../db.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run promote -- you@example.com');
  process.exit(1);
}

try {
  const user = await users.promoteByEmail(email);
  if (!user) {
    console.error(`No account found for ${email}. Sign up in the app first.`);
    process.exitCode = 1;
  } else {
    console.log(`${user.email} is now an approved super_admin.`);
  }
} finally {
  await pool.end();
}
