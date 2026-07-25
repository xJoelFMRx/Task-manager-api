// Imports the dotenv module to manage environment variables.
import dotenv from "dotenv"
// Imports the Express application from app.js.
import app from "./src/app.js";
// Imports the function to connect to the database.
import { connectDB } from "./src/config/db.js";

// Loads environment variables from the .env file.
dotenv.config();

// Connects to the MongoDB database before starting the server.
connectDB();

// Defines the port the server will listen on, using an environment variable or a default value.
const PORT = process.env.PORT || 3000;

// Starts the server and listens on the defined port, logging a message to the console when ready.
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
