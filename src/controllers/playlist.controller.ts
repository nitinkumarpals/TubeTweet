import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { idSchema } from "../schemas/id.schema";
import { playlistSchema } from "../schemas/playlist.schema";

const createPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const body = playlistSchema.safeParse(req.body);
    if (!body.success) {
        const error = body.error.errors
            .map((err) => `${err.path[0]} ${err.message}`)
            .join(", ");
        throw new ApiError(400, error);
    }
    const { name, description } = body.data;
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    });
    if (!playlist) {
        throw new ApiError(500, "Failed to create playlist");
    }
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { playlist: playlist },
                "Playlist created successfully"
            )
        );
});

const updatePlaylist = asyncHandler(async (req: Request, res: Response) => {
    const body = playlistSchema.safeParse(req.body);
    if (!body.success) {
        const error = body.error.errors
            .map((err) => `${err.path[0]} ${err.message}`)
            .join(", ");
        throw new ApiError(400, error);
    }
    const { name, description } = body.data;
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400, "Invalid PlaylistId");
    }
    if (playlist.owner.toString() !== req.user?.id.toString()) {
        throw new ApiError(400, "only owner can edit the playlist");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $set: {
                name,
                description
            }
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "playlist updated successfully"
            )
        );
});

const deletePlaylist = asyncHandler(async (req: Request, res: Response) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== playlist.owner.toString()) {
        throw new ApiError(400, "only owner can delete the playlist");
    }
    await Playlist.findByIdAndUpdate(playlist?._id);
    return res
        .status(204)
        .json(new ApiResponse(204, {}, "playlist deleted successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const { playlistId, videoId } = req.params;
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid PlaylistId or VideoId");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    const video = await Playlist.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to perform this action"
        );
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet: {
                videos: video?._id
            }
        },
        { new: true }
    );
    if (!updatedPlaylist) {
        throw new ApiError(500, "Failed to add video to playlist");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { playlist: updatedPlaylist },
                "Video added to playlist successfully"
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(
    async (req: Request, res: Response) => {
        const { playlistId, videoId } = req.params;
        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid PlaylistId or VideoId");
        }
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }
        const video = await Playlist.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }
        if (playlist.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(
                403,
                "You are not authorized to perform this action"
            );
        }
        const updatedPlaylist = await Playlist.findOneAndUpdate(
            { _id: playlistId },
            {
                $pull: {
                    videos: videoId
                }
            },
            { new: true }
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { playlist: updatedPlaylist },
                    "Video removed from playlist successfully"
                )
            );
    }
);
const getPlaylistById = asyncHandler(async (req: Request, res: Response) => {
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }
    const playlistVideos = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $match: {
                "videos.isPublished": true
            }
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
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }
    ]);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlistVideos,
                "Playlist fetched successfully"
            )
        );
});
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlists,
                "User playlists fetched successfully"
            )
        );
});
export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    getUserPlaylists
};
