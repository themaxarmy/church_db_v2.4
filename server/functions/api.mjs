// Netlify Function that serves the whole API. netlify.toml rewrites /api/* here.
import serverless from 'serverless-http';
import app from '../app.js';

// Netlify's edge sets this header to the real client IP; the rate limiter keys on it.
app.locals.clientIpHeader = 'x-nf-client-connection-ip';

const handle = serverless(app);

export const handler = (event, context) => {
  // Depending on how the request arrived, the path may be the function's own; the routes live under /api.
  event.path = event.path.replace(/^\/\.netlify\/functions\/api(?=\/|$)/, '/api');
  return handle(event, context);
};
