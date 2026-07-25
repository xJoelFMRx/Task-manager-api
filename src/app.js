// Imports the Express library to create the server
import express from "express";
// Imports the routes defined in userRoutes.js
import userRoutes from "./routes/userRoutes.js";
// Imports the routes defined in taskRoutes.js
import taskRoutes from "./routes/taskRoutes.js";
// Imports the centralized error-handling middleware
import { errorHandler } from "./middlewares/errorHandler.js";
// Imports the i18n middleware (detects language and attaches req.t)
import { i18n } from "./middlewares/i18n.js";

// Creates an instance of the Express application
const app = express();

// Allows the server to receive and parse JSON data (useful for APIs)
app.use(express.json());

// Detects the request language (via Accept-Language) and attaches req.t for all routes
app.use(i18n);

// Defines a GET route at the root ("/") that responds with a simple message indicating the API is running
app.get("/", (req, res) => {
    res.send("API running 🚀");
});

// Uses the routes defined in userRoutes.js to handle user-related requests
app.use("/api", userRoutes);

// Uses the routes defined in taskRoutes.js to handle task-related requests
app.use("/api", taskRoutes);

// Centralized error-handling middleware
app.use(errorHandler);

// Exports the application so it can be used in other files (e.g., to start the server)
export default app;