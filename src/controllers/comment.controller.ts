import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { commentSchema } from "../schemas/comment.schema";
import { Video } from "../models/video.model";
const addComment = asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid VideoId");
    }

    const { content } = req.body;

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "video not found");
    }
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    });
    if (!comment) {
        throw new ApiError(500, "Failed to add comment");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to perform this action"
        );
    }
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if (!deletedComment) {
        throw new ApiError(500, "Failed to delete comment");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

const updateComment = asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }
    const body = commentSchema.safeParse(req.body);
    if (!body.success) {
        const error = body.error.errors
            .map((err) => `${err.path[0]} ${err.message}`)
            .join(", ");
        throw new ApiError(400, error);
    }
    const { content } = body.data;
    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    console.log(
        "Comment owner:" + comment.owner.toString(),
        "User id:" + req.user?._id.toString()
    );

    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Only comment owner can edit their comment");
    }
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        { new: true }
    );
    if (!updatedComment) {
        throw new ApiError(500, "Failed to update comment");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        );
});

const getVideoComments = asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip =
        (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid VideoId");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    const commentsAggregate = await Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                owner: { $first: "$owner" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
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
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                },
                isLiked: 1
            }
        },
        {
            $skip: skip
        },
        { $limit: parseInt(limit as string, 10) }
    ]);
    return res
        .status(200)
        .json(new ApiResponse(200, { comments: commentsAggregate }, "Success"));
});

export { addComment, deleteComment, updateComment, getVideoComments };
