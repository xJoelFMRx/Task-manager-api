// Imports mongoose to handle the connection to the MongoDB database
import mongoose from "mongoose";

// Function to connect to the MongoDB database using the URL defined in the environment variables
export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected ✅");
    } catch (error){
        console.error("Error connecting to MongoDB ❌", error.message);
        process.exit(1);
    }
};