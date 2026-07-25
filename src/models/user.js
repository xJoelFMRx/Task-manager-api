import mongoose from "mongoose";

// Defines the schema for a user, including credentials for authentication
const userSchema = new mongoose.Schema({
    // Email must be unique, used as the login identifier
    email: {
        type: String,
        required: true,
        unique: true
    },
    // Stores the hashed password (never the plain text password)
    password: {
        type: String,
        required: true
    }
}, {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
})

// Exports the User model based on the schema above
export default mongoose.model("User", userSchema);