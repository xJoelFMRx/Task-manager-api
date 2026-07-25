// Imports the User model, bcrypt to hash passwords, and jwt to handle tokens
import User from "../models/user.js";
import Task from "../models/task.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import { EMAIL_REGEX, PASSWORD_REGEX } from "../utils/validators.js";

// Controller to delete the authenticated user and their tasks
export const deleteProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        // Deletes all tasks belonging to the user
        await Task.deleteMany({ user: userId });
        // Deletes the user
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            throw new AppError(req.t("user_not_found"), 404);
        }
        res.json({ message: req.t("user_and_tasks_deleted") });
    } catch (error) {
        next(error);
    }
};

// Controller to update the authenticated user's profile (email and/or password)
export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { email, password } = req.body;
        const updateFields = {};
        if (email) {
            if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
                throw new AppError(req.t("invalid_email"), 400);
            }
            // Prevents updating to an email already used by another account.
            const emailInUse = await User.findOne({ email, _id: { $ne: userId } });
            if (emailInUse) {
                throw new AppError(req.t("user_already_exists"), 409);
            }
            updateFields.email = email;
        }
        if (password) {
            if (typeof password !== "string" || !PASSWORD_REGEX.test(password)) {
                throw new AppError(req.t("password_weak"), 400);
            }
            updateFields.password = await bcrypt.hash(password, 10);
        }
        if (Object.keys(updateFields).length === 0) {
            throw new AppError(req.t("update_no_valid_fields"), 400);
        }
        // Prevents changing other sensitive fields
        const user = await User.findByIdAndUpdate(userId, updateFields, { new: true });
        if (!user) {
            throw new AppError(req.t("user_not_found"), 404);
        }
        res.json({ email: user.email });
    } catch (error) {
        next(error);
    }
};

// Controller to register a new user
export const register = async (req, res, next) => {
    try {
        // Extracts the email and password from the request body
        const { email, password } = req.body;

        // Checks if the user already exists in the database
        const userExists = await User.findOne({ email });
        if (userExists){
            throw new AppError(req.t("user_already_exists"), 409);
        }

        // Hashes the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Creates a new user and saves it to the database
        const user = new User({ email, password: hashedPassword });
        await user.save();

        // Responds with a success message
        res.status(201).json({ message: req.t("user_registered") });
    } catch (error){
        next(error);
    }
};

// Controller to log in 
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user){
            throw new AppError(req.t("incorrect_credentials"), 401);
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch){
            throw new AppError(req.t("incorrect_credentials"), 401);
        }
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        res.json({ token });
    }catch (error){
        next(error);
    }
};