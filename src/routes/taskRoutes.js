// Imports the Express router
import { Router } from "express";
// Imports the task controllers
import { createTask, getTasks, updateTask, deleteTask, getTaskById } from "../controllers/taskController.js";
// Imports the authentication middleware
import { auth } from "../middlewares/auth.js";

// Creates a router instance
const router = Router();

// Defines the routes for task operations, all protected by the authentication middleware
router.post("/tasks", auth, createTask);
router.get("/tasks", auth, getTasks);
router.get("/tasks/:id", auth, getTaskById);
router.put("/tasks/:id", auth, updateTask);
router.delete("/tasks/:id", auth, deleteTask);

// Exports the router for use in other files
export default router;