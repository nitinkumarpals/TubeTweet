import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse";
import { Video } from "../models/video.model";
import { Subscription } from "../models/subscription.model";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";

const getChannelStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const totalSubscribers = await Subscription.aggregate([
        { $match: new mongoose.Types.ObjectId(userId) },
        {
            $group: {
                _id: null,
                subscribersCount: {
                    $sum: 1
                }
            }
        }
    ]);
    const video = await Subscription.aggregate([
        { $match: new mongoose.Types.ObjectId(userId) },
        {
            $lookup: {
                from: "likes",
                foreignField: "video",
                localField: "_id",
                as: "likes"
            }
        },
        {
            $project: {
                totalLikes: {
                    $size: "$likes"
                },
                totalViews: "$views",
                totalVideos: 1
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: {
                    $sum: "$totalLikes"
                },
                totalViews: {
                    $sum: "$totalViews"
                },
                totalVideos: {
                    $sum: 1
                }
            }
        }
    ]);

    const channelStats = {
        totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
        totalLikes: video[0]?.totalLikes || 0,
        totalViews: video[0]?.totalViews || 0,
        totalVideos: video[0]?.totalVideos || 0
    };
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { channelStats },
                "Channel stats fetched successfully"
            )
        );
});

const getChannelVideos = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                createdAt: {
                    $dateToParts: { date: "$createdAt" }
                },
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 1,
                "videoFile.url": 1,
                "thumbnail.url": 1,
                title: 1,
                description: 1,
                createdAt: {
                    year: 1,
                    month: 1,
                    day: 1
                },
                isPublished: 1,
                likesCount: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, { videos }, "Videos fetched successfully"));
});

export { getChannelVideos, getChannelStats };
