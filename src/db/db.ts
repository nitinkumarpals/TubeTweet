import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`
        );
        console.log(
            `\n MongoDb Connected !! DB HOST: ${connectionInstance.connection.host}`
        );
        //${connectionInstance.connection.host} this will give me url of mongodb
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`MongoDb connection FAILED:`, error);
            console.error(error.stack);
        } else {
            console.error(`MongoDb connection FAILED:  ${error}`);
        }
        process.exit(1);
    }
};

export default connectDb;
