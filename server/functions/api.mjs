// Netlify Function (v2 format, loaded as an ES module) that serves the whole API at /api/*.
// Express expects Node's req/res, so serverless-http runs it from a Lambda-style event built from the Request.
import '../production.js'; // must stay first: runs before config.js reads NODE_ENV
import serverless from 'serverless-http';
import app from '../app.js';

// The rate limiter keys on this header; it's filled in below from Netlify's client IP.
const CLIENT_IP_HEADER = 'x-nf-client-connection-ip';
app.locals.clientIpHeader = CLIENT_IP_HEADER;

const handle = serverless(app);

export default async (request, context) => {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers);
  if (context?.ip) headers[CLIENT_IP_HEADER] = context.ip;
  const hasBody = !['GET', 'HEAD'].includes(request.method);

  const result = await handle(
    {
      httpMethod: request.method,
      path: url.pathname,
      headers,
      multiValueHeaders: {},
      queryStringParameters: url.search ? Object.fromEntries(url.searchParams) : null,
      multiValueQueryStringParameters: null,
      body: hasBody ? Buffer.from(await request.arrayBuffer()).toString('base64') : null,
      isBase64Encoded: hasBody,
    },
    {},
  );

  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(result.headers ?? {})) responseHeaders.set(key, String(value));
  // Set-Cookie can repeat, so serverless-http returns it here.
  for (const [key, values] of Object.entries(result.multiValueHeaders ?? {})) {
    responseHeaders.delete(key);
    for (const value of values) responseHeaders.append(key, String(value));
  }

  const noBody = [204, 304].includes(result.statusCode) || !result.body;
  const body = noBody ? null : result.isBase64Encoded ? Buffer.from(result.body, 'base64') : result.body;
  return new Response(body, { status: result.statusCode, headers: responseHeaders });
};

export const config = { path: '/api/*' };
