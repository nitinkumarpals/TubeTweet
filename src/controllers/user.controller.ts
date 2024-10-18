import { userSchema } from "../schemas/user.schema";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/fileUpload";
import { ApiResponse } from "../utils/ApiResponse";
// get the user detail from body
// validation - not empty and other zod validation
// check if user is already registered: username, email
// check for images, check for avatar
// upload the images on cloudinary, avatar
// create the user object - create entry in db
// remove the password and avatar from the response

export const registerUser = asyncHandler(
    async (req: Request, res: Response) => {
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
        try {
            const user = await User.create({
                fullName,
                userName: userName.toLowerCase(),
                email,
                avatar: avatarUrl.url,
                coverImage: coverImageUrl?.url || "",
                password
            });
            console.log("object created successfully");
            const filteredUser = {
                ...user.toObject(),
                password: undefined,
                refreshToken: undefined
            };
            return res
                .status(201)
                .json(
                    new ApiResponse(
                        201,
                        filteredUser,
                        "User created successfully"
                    )
                );
        } catch (error: Error | any) {
            throw new ApiError(500, "Failed to create user", error);
        }
    }
);
