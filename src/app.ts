import express from "express";
import cookieParser from "cookie-parser";

import cors from "cors";
const app = express();
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
//{ extended: true } we can give object inside object
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.ts";
import tweetRouter from "./routes/tweet.routes.ts";
import healthCheckRouter from "./routes/healthCheck.routes.ts";
import subscriptionRouter from "./routes/subscription.routes.ts";
import videosRouter from "./routes/video.routes.ts";
import playlistRouter from "./routes/playlist.routes.ts";
//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/healthCheck", healthCheckRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videosRouter);
app.use("/api/v1/playlists", playlistRouter);

export { app };
