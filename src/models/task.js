import mongoose from "mongoose";

// Defines the schema for a task, linked to the user who owns it
const taskSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    completed:{
        type: Boolean,
        default: false
    },
    // Reference to the User who owns this task
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    // Automatically adds createdAt and updatedAt fields 
    timestamps: true
}); 

// Exports the Task model based on the schema above
export default mongoose.model("Task", taskSchema);