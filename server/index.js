// Local API server. On Netlify the same app runs as a function instead (functions/api.mjs).
import app from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}/api`);
});
