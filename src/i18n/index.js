// Imports createRequire so JSON files can be loaded with require(),
// which works the same way across Node versions (no "import ... with { type: 'json' }"
// syntax needed, which differs between Node releases).
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Loads each language's messages from its JSON file.
const en = require("./messages.en.json");
const es = require("./messages.es.json");

// Combines each per-language file into a single lookup object,
// so the rest of the app can keep doing messages[lang][key] without caring
// how many language files exist under the hood.
export const messages = { en, es };

// Default language used when the request doesn't specify a supported one.
export const DEFAULT_LANG = "en";