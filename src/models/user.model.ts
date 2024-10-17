import mongoose, { Model, Schema, Document } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
export interface IUser extends Document {
    userName: string;
    email: string;
    password: string;
    fullName: string;
    avatar: string;
    coverImage?: string;
    watchHistory: mongoose.Types.ObjectId[];
    refreshToken?: string;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string | undefined;
    generateRefreshToken(): string | undefined;
}
const userSchema = new Schema<IUser>(
    {
        userName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudnary url
            required: true
        },
        coverImage: {
            type: String //cloudnary url
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

// Pre-save hook to hash the password
userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);

    next();
});

// Method to check if the provided password is correct
userSchema.methods.isPasswordCorrect = async function (
    password: string
): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string | undefined {
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.ACCESS_TOKEN_EXPIRY) {
        console.error(
            `Missing environment variable: ${!process.env.ACCESS_TOKEN_SECRET ? "ACCESS_TOKEN_SECRET" : "ACCESS_TOKEN_EXPIRY"}`
        );
        return undefined;
    } else {
        jwt.sign(
            {
                _id: this._id,
                email: this.email,
                userName: this.userName,
                fullName: this.fullName
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        );
    }
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function (): string | undefined {
    if (
        !process.env.REFRESH_TOKEN_SECRET ||
        !process.env.REFRESH_TOKEN_EXPIRY
    ) {
        console.error(
            `Missing environment variable: ${!process.env.REFRESH_TOKEN_SECRET ? "REFRESH_TOKEN_SECRET" : "REFRESH_TOKEN_EXPIRY"}`
        );
        return undefined;
    } else {
        jwt.sign(
            {
                _id: this._id
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        );
    }
};

// Export the User model
export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
