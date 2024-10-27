import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import tweetSchema from "../schemas/tweet.schema";
const createTweet = asyncHandler(async (req: Request, res: Response) => {
    const id = req.user?._id;
    if (!id) {
        throw new ApiError(401, "Unauthorized");
    }
    const body = req.body;
    const parsedBody = tweetSchema.safeParse(body);
    if (!parsedBody.success) {
        throw new ApiError(400, "Invalid request body");
    }
    const { content } = parsedBody.data;
    const tweet = await Tweet.create({
        owner: id,
        content
    });
    res.status(201).json(
        new ApiResponse(201, { tweet: tweet }, "Tweet created successfully")
    );
});

const getUserTweets = asyncHandler(async (req: Request, res: Response) => {
    const tweets = await Tweet.find({ owner: req.user?._id });
    res.status(200).json(
        new ApiResponse(200, { tweets: tweets }, "Tweets fetched successfully")
    );
});

const updateTweets = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;
    const parsedBody = tweetSchema.safeParse(body);
    if (!parsedBody.success) {
        throw new ApiError(400, "Invalid request body");
    }
    const { content } = parsedBody.data;
    const updatedTweet = await Tweet.findByIdAndUpdate(
        req.params.tweetId,
        {
            content
        },
        { new: true }
    );

    if (!updatedTweet) {
        throw new ApiError(404, "Tweet not found");
    }
    res.status(200).json(
        new ApiResponse(
            200,
            { tweet: updatedTweet },
            "Tweet updated successfully"
        )
    );
});

const deleteTweet = asyncHandler(async (req: Request, res: Response) => {
    const deleteTweet = await Tweet.findByIdAndDelete(req.params.tweetId);
    if(!deleteTweet){
        throw new ApiError(404, "Tweet not found");
    }
    res.status(200).json(
        new ApiResponse(
            200,
            "Tweet deleted successfully"
        )
    );
});
export { createTweet, getUserTweets, updateTweets, deleteTweet };
