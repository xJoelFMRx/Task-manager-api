// Imports the Task data model to interact with the database
import Task from "../models/task.js";
import { AppError } from "../utils/AppError.js";

// Controller to get a task by id (only if it belongs to the authenticated user)
export const getTaskById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const task = await Task.findOne({ _id: id, user: req.user.userId });
        if (!task) {
            throw new AppError(req.t("task_not_found"), 404);
        }
        res.json(task);
    } catch (error) {
        next(error);
    }
};

// Controller to create a new task
export const createTask = async (req, res, next) => {
    try {
        const { title } = req.body;
        if (
            typeof title !== "string" ||
            !title.trim() 
        ) {
            throw new AppError(req.t("title_required"), 400);
        }

        // Checks if the user already has a task with this exact title
        const taskExists = await Task.findOne({ title: title.trim(), user: req.user.userId });
        if (taskExists) {
            throw new AppError(req.t("task_already_exists"), 409);
        }

        const task = new Task({ title: title.trim(), user: req.user.userId });
        await task.save();
        res.status(201).json(task);
    } catch (error){
        next(error);
    }
};

// Controller to get all tasks belonging to the authenticated user
export const getTasks = async (req, res, next) => {
    try {
        const tasks = await Task.find({ user: req.user.userId });
        res.json(tasks);
    } catch (error){
        next(error);
    }
};

// Controller to update an existing task
export const updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Only allow updating title and completed
        const updateFields = {};
        if (typeof req.body.title === "string" && req.body.title.trim()) {
            updateFields.title = req.body.title.trim();
        }
        if (typeof req.body.completed === "boolean") {
            updateFields.completed = req.body.completed;
        }
        const task = await Task.findOneAndUpdate(
            { _id: id, user: req.user.userId },
            updateFields,
            { new: true }
        );
        if (!task){
            throw new AppError(req.t("task_not_found"), 404);
        }
        res.json(task);
    } catch (error){
        next(error);
    }
};

// Controller to delete an existing task
export const deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const task = await Task.findOneAndDelete({ _id: id, user: req.user.userId });
        if (!task){
            throw new AppError(req.t("task_not_found"), 404);
        }
        res.json({ message: req.t("task_deleted") });
    } catch (error){
        next(error);
    }
};