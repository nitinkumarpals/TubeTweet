import mongoose from "mongoose";
import { Video } from "../models/video.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/fileUpload";
import { Request, Response } from "express";
import { videoDetailsSchema } from "../schemas/videoDetails.schema";
import { idSchema } from "../schemas/id.schema";

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
        videoFile: videoUrl.secure_url,
        thumbnail: thumbnailUrl.secure_url,
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
    const video = await Video.findById({
        _id: videoId
    });
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
    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail?.url) {
        throw new ApiError(500, "Failed to upload thumbnail on cloudinary");
    }
    const existingVideo = await Video.findById(videoId, "thumbnail");
    const oldThumbnailId = existingVideo?.thumbnail
        ?.split("/")
        .pop()
        ?.split(".")[0];
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
    if (oldThumbnailId) await deleteFromCloudinary(oldThumbnailId);

    res.status(200).json(
        new ApiResponse(
            200,
            { video: updatedVideo },
            "Video updated successfully"
        )
    );
});
export { publishAVideo, getVideoById, updateVideo };
