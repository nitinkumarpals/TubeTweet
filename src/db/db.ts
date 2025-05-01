import mongoose from "mongoose";

const connectDb = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        mongoose.set("bufferTimeoutMS", 30000);
        const connectionInstance = await mongoose.connect(
            process.env.MONGODB_URI
        );
        
        // Safely log connection details
        console.log(
            "✅ Connected to MongoDB:",
            connectionInstance.connection.host,
            "Database:",
            connectionInstance.connection.db?.databaseName || 
            connectionInstance.connection.name || 
            "Unknown Database"
        );
        return connectionInstance;
    } catch (error: any) {
        console.error("❌ MongoDB connection error:", error.message);
        console.error("Full error stack:", error.stack);
        process.exit(1);
    }
};

export default connectDb;
