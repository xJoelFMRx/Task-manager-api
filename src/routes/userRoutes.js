import { EMAIL_REGEX, PASSWORD_REGEX } from "../utils/validators.js";
// Imports the Express Router that allows defining routes 
import { Router } from "express";
// Imports the user registration controller
import { register, login, updateProfile, deleteProfile } from "../controllers/userController.js";
// Imports the authentication middleware
import { auth } from "../middlewares/auth.js";
// Imports the check function from express-validator to declare validation rules.
import { check } from "express-validator";
// Imports the validation-error-handling middleware.
import { validate } from "../middlewares/validate.js";

// Creates a router instance
const router = Router();

// Endpoint to delete the user and their tasks
router.delete("/profile", auth, deleteProfile);

// Defines the POST route for user registration with validations
router.post(
    "/register",
    [
        check("email").matches(EMAIL_REGEX).withMessage((value, { req }) => req.t("invalid_email")),
        check("password").matches(PASSWORD_REGEX).withMessage((value, { req }) => req.t("password_weak"))
    ],
    validate,
    register
);

// Defines the POST route for user login with validations
router.post(
    "/login",
    [
        check("email").matches(EMAIL_REGEX).withMessage((value, { req }) => req.t("invalid_email")),
        check("password").exists().withMessage((value, { req }) => req.t("password_required"))
    ],
    validate,
    login
);

// Endpoint to update profile (email and/or password)
router.patch("/profile", auth, updateProfile);

// Defines a protected GET route that uses the authentication middleware
router.get("/profile-info", auth, (req, res) => {
    res.json({ message: req.t("protected_route"), user: req.user });   
})

// Exports the router so it can be used in other files (e.g., in app.js)
export default router;