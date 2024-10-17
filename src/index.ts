import connectDb from "./db/db";
import { app } from "./app";
import { Request, Response } from "express";
const port = process.env.PORT || 3000;
connectDb()
    .then(() => {
        app.listen(port, () => {
            console.log(`App is listening at port : ${port}`);
        });
    })
    .catch((error) => {
        console.log("MongoDb connection failed !!!", error);
    });

app.on("error", (error) => {
    console.error("Error occurred:", error);
    throw error;
});

app.use("/api", (req: Request, res: Response) => {
    res.send("Hello from express");
});
