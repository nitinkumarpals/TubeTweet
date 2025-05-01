import path from 'path'
import dotenv from 'dotenv'

// Load .env file from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import connectDb from "./db/db";
import { app } from "./app";
import { Request, Response } from "express";

console.log("🔍 Checking MongoDB URI:", process.env.MONGODB_URI ? "✅ Found" : "❌ Not Found");
const port = process.env.PORT || 3000;

// Wait for database connection before starting the server
async function startServer() {
    try {
        console.log("🚀 Starting server...");
        await connectDb();
        console.log(`✅ Server ready on port ${port}`);

        app.listen(port, () => {
            console.log(`🌐 App is listening at: http://localhost:${port}`);
        });
    } catch (error: any) {
        console.error("❌ Server startup failed:", error.message);
        process.exit(1);
    }
}

// Global error handlers
app.on("error", (error) => {
    console.error("🚨 Application error:", error);
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).send("Not found");
});

// Initialize server
startServer();
