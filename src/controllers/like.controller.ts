import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";

const toggleVideoLike = asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }
    const likedAlready = await Like.findOne({
        video: videoId,
        owner: req.user?._id
    });
    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Like removed"));
    }
    await Like.create({
        video: videoId,
        owner: req.user?._id
    });
    return res
        .status(201)
        .json(new ApiResponse(201, { isLiked: true }, "Like added"));
});

const toggleCommentLike = asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid videoId");
    }
    const likedAlready = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    });
    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Like removed"));
    }
    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    });
    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Like added"));
});

const toggleTweetLike = asyncHandler(async (req: Request, res: Response) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid videoId");
    }
    const likedAlready = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    });
    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Like removed"));
    }
    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    });
    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Like added"));
});

const getLikedVideos = asyncHandler(async (req: Request, res: Response) => {
    const likedVideosAggregate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    { $unwind: "$ownerDetails" }
                ]
            }
        },
        {
            $unwind: "$likedVideo"
        },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1
                    }
                }
            }
        }
    ]);
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
