import mongoose, { isValidObjectId } from "mongoose";
import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Subscription } from "../models/subscription.model";
import { User } from "../models/user.model";
import { idSchema } from "../schemas/id.schema";

const toggleSubscription = asyncHandler(async (req: Request, res: Response) => {
    const parseId = idSchema.safeParse(req.params.channelId);
    if (!parseId.success) {
        throw new ApiError(400, "id is not valid ObjectId");
    }
    const channelId = new mongoose.Types.ObjectId(parseId.data); 
    const userId = req.user?._id;
    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    });
    console.log(existingSubscription);
    if (existingSubscription) {
        // Unsubscribe: Delete the existing subscription
        const subscribe = await existingSubscription.deleteOne();
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { subscription: subscribe },
                    "Unsubscribed successfully"
                )
            );
    } else {
        // Subscribe: Create a new subscription
        const subscribe = await Subscription.create({
            subscriber: userId,
            channel: channelId
        });
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { subscription: subscribe },
                    "Subscribed successfully"
                )
            );
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(
    async (req: Request, res: Response) => {
        const parseId = idSchema.safeParse(req.params.channelId);
        if (!parseId.success) {
            throw new ApiError(400, "id is not valid ObjectId");
        }
        const channelId = new mongoose.Types.ObjectId(parseId.data);
        const subscriberList = await Subscription.aggregate([
            {
                $match: {
                    channel: channelId
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscribers"
                }
            },
            {
                $unwind: "$subscribers"
            },
            {
                $project: {
                    _id: 1,
                    subscriber: "$subscribers.userName",
                    subscriberId: "$subscribers._id"
                }
            }
        ]);

        res.status(200).json(
            new ApiResponse(
                200,
                { subscribers: subscriberList },
                "Subscribers fetched successfully"
            )
        );
    }
);

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(
    async (req: Request, res: Response) => {
        const subscriberId = req.user?._id;
        const channelSubscribed = await Subscription.aggregate([
            {
                $match: {
                    subscriber: subscriberId
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channelUser"
                }
            },
            {
                $unwind: "$channelUser"
            },
            {
                $project: {
                    _id: 1,
                    channel: "$channelUser.userName",
                    channelId: "$channelUser._id"
                }
            }
        ]);
        res.status(200).json(
            new ApiResponse(
                200,
                { subscribedTo: channelSubscribed },
                "Subscribed channels fetched successfully"
            )
        );
    }
);
export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
