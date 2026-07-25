// Shared validation patterns used across routes and controllers,
// so email/password rules stay consistent everywhere they're enforced.

// Practical email format check: local@domain.tld, no spaces, no double "@".
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength: at least 6 characters, with at least one uppercase letter,
// one lowercase letter, and one number.
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;