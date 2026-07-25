// Imports the function that reads accumulated validation errors from express-validator.
import { validationResult } from "express-validator";

// Middleware to handle validation errors coming from express-validator's check() rules.
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Return the same { message } shape used everywhere else in the API,
        // taking the first validation error so error responses stay consistent.
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
};