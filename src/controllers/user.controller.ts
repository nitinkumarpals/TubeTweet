import { userSchema } from "../schemas/user.schema";
import { signInSchema } from "../schemas/signIn.schema";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/fileUpload";
import { ApiResponse } from "../utils/ApiResponse";

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

// get the user detail from body
// validation - not empty and other zod validation
// check if user is already registered: username, email
// check for images, check for avatar
// upload the images on cloudinary, avatar
// create the user object - create entry in db
// remove the password and avatar from the response

const registerUser = asyncHandler(async (req: Request, res: Response) => {
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
    if (!filteredUser) {
        throw new ApiError(500, "Failed to create user");
    }
    return res
        .status(201)
        .json(new ApiResponse(201, filteredUser, "User created successfully"));
});

//req body  -> data
//data validation using zod
//check if user exists
//check if password is correct
//create access token and refresh token
//send cookies

const loginUser = asyncHandler(async (req: Request, res: Response) => {
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
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined }
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options).json(
            new ApiResponse(
            200,
            {},
            "User logged out successfully"
        ));
});
export { registerUser, loginUser, logoutUser };
