import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/fileUpload";
import { Request, Response } from "express";
import { videoDetailsSchema } from "../schemas/videoDetails.schema";
import { idSchema } from "../schemas/id.schema";

const getAllVideos = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const pipeline: mongoose.PipelineStage[] = [];
    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
            }
        });
    }
    if (userId) {
        const userIdString =
            typeof userId === "string" ? userId : userId.toString();
        if (!isValidObjectId(userIdString)) {
            throw new ApiError(400, "Invalid userId");
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userIdString)
            }
        });
    }

    pipeline.push({ $match: { isPublished: true } });

    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy.toString()]: sortType === "asc" ? 1 : -1
            } as { [key: string]: 1 | -1 }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    );
    pipeline.push({
        $project: {
            _id: 1,
            title: 1,
            description: 1,
            videoFile: {
                url: 1,
                _id: 1
            },
            thumbnail: {
                url: 1,
                _id: 1
            },
            duration: 1,
            views: 1,
            isPublished: 1,
            ownerDetails: 1,
            createdAt: 1
        }
    });
    // Calculate skip value for pagination
    const skip =
        (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit as string, 10) });
    const video = await Video.aggregate(pipeline);
    // const options = {
    //     page: parseInt(page as string, 10),
    //     limit: parseInt(limit as string, 10)
    // };

    // const video = await Video.aggregatePaginate(videoAggregate, options);
    return res
        .status(200)
        .json(new ApiResponse(200, {video}, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;
    const parsedBody = videoDetailsSchema.safeParse(body);
    if (!parsedBody.success) {
        const error = parsedBody.error.errors
            .map((err) => `${err.path[0]} ${err.message}`)
            .join(", ");
        throw new ApiError(400, error);
    }
    const { title, description } = parsedBody.data;
    const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
    };
    const videoLocalPath = files?.videoFile?.[0].path;
    const thumbnailLocalPath = files?.thumbnail?.[0].path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is missing");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing");
    }
    const videoUrl = await uploadOnCloudinary(videoLocalPath);
    if (!videoUrl?.url) {
        throw new ApiError(500, "Failed to upload video on cloudinary");
    }
    const thumbnailUrl = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailUrl?.url) {
        throw new ApiError(500, "Failed to upload thumbnail on cloudinary");
    }
    const video = await Video.create({
        videoFile: {
            url: videoUrl.secure_url,
            public_id: videoUrl.public_id
        },
        thumbnail: {
            url: thumbnailUrl.secure_url,
            public_id: thumbnailUrl.public_id
        },
        title,
        description,
        duration: videoUrl.duration,
        views: 0,
        isPublished: true,
        owner: req.user?._id
    });
    if (!video) {
        throw new ApiError(500, "Failed to Video Object");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { video: video },
                "Video Object created successfully"
            )
        );
});

const getVideoById = asyncHandler(async (req: Request, res: Response) => {
    const parseId = idSchema.safeParse(req.params.videoId);
    if (!parseId.success) {
        throw new ApiError(400, "id is not valid ObjectId");
    }
    const videoId = new mongoose.Types.ObjectId(parseId.data);
    const video = await Video.aggregate([
        {
            $match: { _id: videoId }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            userName: 1,
                            "avatar.url": 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                "videoFile.url": 1,
                "thumbnail.url": 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                owner: 1,
                createdAt: 1
                //todo add likesCounts and isLiked
            }
        }
    ]);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    res.status(200).json(new ApiResponse(200, { video: video }, "Video found"));
});

const updateVideo = asyncHandler(async (req: Request, res: Response) => {
    const parseId = idSchema.safeParse(req.params.videoId);
    if (!parseId.success) {
        throw new ApiError(400, "id is not valid ObjectId");
    }
    const videoId = new mongoose.Types.ObjectId(parseId.data);
    const parsedBody = videoDetailsSchema.safeParse(req.body);
    if (!parsedBody.success) {
        const error = parsedBody.error.errors
            .map((err) => `${err.path[0]} ${err.message}`)
            .join(", ");
        throw new ApiError(400, error);
    }
    const { title, description } = parsedBody.data;
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to perform this action"
        );
    }
    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail?.url) {
        throw new ApiError(500, "Failed to upload thumbnail on cloudinary");
    }
    const existingVideo = await Video.findById(videoId, "thumbnail");
    const oldThumbnailId = existingVideo?.thumbnail?.public_id;
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.secure_url
            }
        },
        {
            new: true,
            select: "thumbnail"
        }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video");
    }
    if (oldThumbnailId) await deleteFromCloudinary(oldThumbnailId, "image");

    res.status(200).json(
        new ApiResponse(
            200,
            { video: updatedVideo },
            "Video updated successfully"
        )
    );
});

const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
    const parseId = idSchema.safeParse(req.params.videoId);
    if (!parseId.success) {
        throw new ApiError(400, "id is not valid ObjectId");
    }
    const videoId = new mongoose.Types.ObjectId(parseId.data);
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to perform this action"
        );
    }
    const deleteVideo = await Video.findByIdAndDelete(videoId);
    if (!deleteVideo) {
        throw new ApiError(500, "Failed to delete video");
    }
    const videoFile = deleteVideo.videoFile?.public_id;
    if (videoFile) await deleteFromCloudinary(videoFile, "video");

    const thumbnail = deleteVideo.thumbnail?.public_id;
    if (thumbnail) await deleteFromCloudinary(thumbnail, "image");

    res.status(200).json(
        new ApiResponse(
            200,
            { deletedVideo: deleteVideo.title },
            "Video deleted successfully"
        )
    );
});

const togglePublishStatus = asyncHandler(
    async (req: Request, res: Response) => {
        const parseId = idSchema.safeParse(req.params.videoId);
        if (!parseId.success) {
            throw new ApiError(400, "id is not valid ObjectId");
        }
        const videoId = new mongoose.Types.ObjectId(parseId.data);

        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }
        if (video?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(
                403,
                "You are not authorized to perform this action"
            );
        }

        const toggledVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    isPublished: !video?.isPublished
                }
            },
            {
                new: true
            }
        );
        if (!toggledVideo) {
            throw new ApiError(500, "Failed to toggle video status");
        }
        res.status(200).json(
            new ApiResponse(
                200,
                { Published: toggledVideo.isPublished },
                "Video status toggled successfully"
            )
        );
    }
);
export {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos
};
