import { userSchema } from "../schemas/user.schema";
import { signInSchema } from "../schemas/signIn.schema";
import { changePasswordSchema } from "../schemas/changePassword.schema";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/fileUpload";
import { ApiResponse } from "../utils/ApiResponse";
import jwt from "jsonwebtoken";
import { updateAccountDetailSchema } from "../schemas/updateAccountDetail.schema";
const generateAccessAndRefreshTokens = async (
    userId: string
): Promise<{
    accessToken: string | undefined;
    refreshToken: string | undefined;
}> => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        if (!accessToken || !refreshToken) {
            throw new ApiError(
                500,
                "Failed to generate access and refresh tokens"
            );
        }
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Failed to generate access and refresh tokens");
    }
};

const registerUser = asyncHandler(async (req: Request, res: Response) => {
    // get the user detail from body
    // validation - not empty and other zod validation
    // check if user is already registered: username, email
    // check for images, check for avatar
    // upload the images on cloudinary, avatar
    // create the user object - create entry in db
    // remove the password and avatar from the response
    const body = req.body;
    const parsedBody = userSchema.safeParse(body);

    if (!parsedBody.success) {
        const error = parsedBody.error.errors
            .map((err) => `${err.path[0]} ${err.message}`)
            .join(", ");
        throw new ApiError(400, error);
    }

    const { email, userName, fullName, password } = parsedBody.data;

    const existedUser = await User.findOne({
        $or: [{ email }, { userName }]
    });

    if (existedUser) {
        throw new ApiError(409, "Username or email already exists");
    }

    const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
    };
    const avatarLocalPath = files?.avatar?.[0].path;
    const coverImageLocalPath = files?.coverImage?.[0].path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
    const coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatarUrl) {
        throw new ApiError(400, "Avatar upload failed");
    }

    const user = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        email,
        avatar: {
            url: avatarUrl.secure_url,
            public_id: avatarUrl.public_id
        },
        coverImage: coverImageUrl
            ? {
                  url: coverImageUrl.secure_url,
                  public_id: coverImageUrl.public_id
              }
            : undefined,
        password
    });
    const filteredUser = {
        ...user.toObject(),
        password: undefined,
        refreshToken: undefined
    };
    if (!filteredUser) {
        throw new ApiError(500, "Failed to create user");
    }
    return res
        .status(201)
        .json(new ApiResponse(201, filteredUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
    //req body  -> data
    //data validation using zod
    //check if user exists
    //check if password is correct
    //create access token and refresh token
    //send cookies
    const body = req.body;
    const parsedBody = signInSchema.safeParse(body);
    if (!parsedBody.success) {
        const error = parsedBody.error.errors
            .map((err) => `${err.path[0]} ${err.message}`)
            .join(", ");
        throw new ApiError(400, error);
    }
    const { userName, email, password } = parsedBody.data;
    if (!(userName || email)) {
        throw new ApiError(400, "Username or email is required");
    }
    const user = await User.findOne({
        $or: [{ email }, { userName }]
    });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password); // user Not Mongoose User
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user?._id as string
    );
    const loggedInUser = {
        ...user.toObject(),
        password: undefined,
        refreshToken
    };
    const options = {
        httpOnly: true,
        secure: true
    };
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }
    const decodedToken = await jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
    );

    const user = await User.findById((decodedToken as { _id: string })._id);
    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired");
    }
    const options = {
        httpOnly: true,
        secure: true
    };
    const { accessToken, refreshToken: newRefreshToken } =
        await generateAccessAndRefreshTokens(user?._id as string);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Access token refreshed successfully"
            )
        );
});

const changeCurrentPassword = asyncHandler(
    async (req: Request, res: Response) => {
        const body = req.body;
        const parsedBody = changePasswordSchema.safeParse(body);
        if (!parsedBody.success) {
            const error = parsedBody.error.errors
                .map((err) => `${err.path[0]} ${err.message}`)
                .join(", ");
            throw new ApiError(400, error);
        }
        const { currentPassword, newPassword, confirmNewPassword } =
            parsedBody.data;
        const user = await User.findById(req.user?._id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
        if (!isPasswordCorrect) {
            throw new ApiError(401, "Incorrect current password");
        }
        if (newPassword !== confirmNewPassword) {
            throw new ApiError(400, "Passwords do not match");
        }
        user.password = newPassword;
        await user.save({ validateBeforeSave: false });
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password changed successfully"));
    }
);

const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User retrieved successfully"));
});

const updateAccountDetail = asyncHandler(
    async (req: Request, res: Response) => {
        const body = req.body;
        const parsedBody = updateAccountDetailSchema.safeParse(body);
        if (!parsedBody.success) {
            const error = parsedBody.error.errors
                .map((err) => `${err.path[0]} ${err.message}`)
                .join(", ");
            throw new ApiError(400, error);
        }
        const { fullName, email } = parsedBody.data;
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullName,
                    email
                }
            },
            {
                new: true
            }
        ).select("-password -refreshToken");
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { user },
                    "Account details updated successfully"
                )
            );
    }
);

const updateUserAvatar = asyncHandler(async (req: Request, res: Response) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url) {
        throw new ApiError(500, "Failed to upload avatar on cloudinary");
    }
    const publicId = req.user?.avatar.public_id;
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: {
                    avatar: avatar?.url,
                    public_id: avatar?.public_id
                }
            }
        },
        { new: true }
    ).select("-password -refreshToken");
    if (publicId) {
        await deleteFromCloudinary(publicId, "image");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: user?.avatar },
                "Avatar updated successfully"
            )
        );
});

const updateCoverImage = asyncHandler(async (req: Request, res: Response) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage?.url) {
        throw new ApiError(500, "Failed to upload cover image on cloudinary");
    }
    const publicId = req.user?.coverImage?.public_id;
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: {
                    coverImage: coverImage?.url,
                    public_id: coverImage?.public_id
                }
            }
        },
        { new: true }
    ).select("-password -refreshToken");
    if (publicId) {
        await deleteFromCloudinary(publicId, "image");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: user?.coverImage },
                "Cover image updated successfully"
            )
        );
});

const getUserChannelProfile = asyncHandler(
    async (req: Request, res: Response) => {
        const { userName } = req.params;
        if (!userName) {
            throw new ApiError(400, "User name is missing");
        }

        const channel = await User.aggregate([
            {
                $match: {
                    userName: userName?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions", // because everything in model is lowercase and become plural
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: { $size: "$subscribers" },
                    subscribedToCount: { $size: "$subscribedTo" },
                    isSubscribed: {
                        // i have to check that in your subscribers object i am subscribed or not
                        $cond: {
                            if: {
                                $in: [req.user?._id, "$subscribers.subscriber"]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    fullName: 1,
                    userName: 1,
                    subscribersCount: 1,
                    subscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1
                }
            }
        ]);

        if (!channel?.length) {
            throw new ApiError(404, "Channel not found");
        }
        return res
            .status(200)
            .json(
                new ApiResponse(200, channel[0], "Channel found successfully")
            );
    }
);

const getWatchHistory = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: req.user?._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
};
