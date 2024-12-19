import mongoose from "mongoose";
import { DB_NAME } from "../constants";
const connectDb = async() => {
    mongoose
        .connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        .then((connectionInstance) => {
            console.log(
                "Connected to MongoDB:",
                connectionInstance.connection.host
            );
        })
        .catch((error) => {
            console.error("MongoDB connection error:", error);
            console.error(error.stack);
            process.exit(1);
        });
};
export default connectDb;
