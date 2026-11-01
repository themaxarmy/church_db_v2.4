// The ministries a record can belong to. One list, shared with the API's validation (server/app.js),
// so everyone picks from the same names instead of typing their own.
import list from '../../shared/ministries.json';

export const MINISTRIES: readonly string[] = list;
