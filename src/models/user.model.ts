import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const userSchema = new Schema(
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

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);

  next();
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.ACCESS_TOKEN_EXPIRY) {
    console.error(
      `Missing environment variable: ${!process.env.ACCESS_TOKEN_SECRET ? "ACCESS_TOKEN_SECRET" : "ACCESS_TOKEN_EXPIRY"}`
    );
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
userSchema.methods.generateRefreshToken = function () {
  if (!process.env.REFRESH_TOKEN_SECRET || !process.env.REFRESH_TOKEN_EXPIRY) {
    console.error(
      `Missing environment variable: ${!process.env.REFRESH_TOKEN_SECRET ? "REFRESH_TOKEN_SECRET" : "REFRESH_TOKEN_EXPIRY"}`
    );
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

export const User = mongoose.model("User", userSchema);
