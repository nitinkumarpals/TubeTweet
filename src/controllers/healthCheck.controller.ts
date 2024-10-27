import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response, text } from "express";
import { Tweet } from "../models/tweet.model";
const healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: "OK",
        timestamp: Date.now()
    };

    try {
        res.status(200).json(
            new ApiResponse(
                200,
                healthCheck,
                "Health check successful",
            )
        );
    } catch (error) {
        throw new ApiError(503, "Service Unavailable");
    }
});

export { healthCheck };
