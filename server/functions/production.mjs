// Imported first by api.mjs so config.js sees production mode (HTTPS-only cookie, no sign-in detail in logs).
// Set here rather than as a Netlify env var: on the free plan those also apply to the build,
// where NODE_ENV=production makes npm skip the dev tools the build needs.
process.env.NODE_ENV = 'production';
