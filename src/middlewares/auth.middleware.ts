import jwt, { JwtPayload } from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
export const verifyJwt = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token =
                req.cookies?.accessToken ||
                req.header("Authorization")?.split(" ")[1];

            if (!token) {
                throw new ApiError(401, "Unauthorized");
            }

            const decodedToken = (await jwt.verify(
                token,
                process.env.ACCESS_TOKEN_SECRET as string
            )) as JwtPayload;

            const user = await User.findById(decodedToken?._id).select(
                "-password -refreshToken"
            );
            if (!user) {
                throw new ApiError(401, "Invalid Access Token");
            }
            req.user = user;
            //req.user = decodedToken;
            next();

        } catch (error) {
            if (error instanceof Error) {
                throw new ApiError(
                    401,
                    error.message || "Invalid Access Token"
                );
            } else {
                throw new ApiError(401, "An unknown error occurred");
            }
        }
    }
);
