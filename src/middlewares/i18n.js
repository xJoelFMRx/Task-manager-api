// Imports the message dictionary and the default language.
import { messages, DEFAULT_LANG } from "../i18n/index.js";

// Middleware that detects the preferred language from the Accept-Language header
// and attaches a small translation helper (req.t) to the request.
export const i18n = (req, res, next) => {
    const header = req.header("Accept-Language") || DEFAULT_LANG;
    // Only "en" and "es" are supported; anything else falls back to the default.
    const lang = header.toLowerCase().startsWith("es") ? "es" : DEFAULT_LANG;

    req.lang = lang;
    // Looks up a message by key in the detected language, falling back to English,
    // and finally to the key itself if it doesn't exist anywhere.
    req.t = (key) => messages[lang]?.[key] || messages[DEFAULT_LANG][key] || key;

    next();
};