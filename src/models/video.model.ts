import mongoose, { Model, Schema, Document } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

interface VideoInterface extends Document {
    videoFile: string;
    thumbnail: string;
    title: string;
    description: string;
    duration: number;
    views: number;
    isPublished: boolean;
    owner: Schema.Types.ObjectId;
}

const videoSchema = new Schema<VideoInterface>(
    {
        videoFile: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video: Model<VideoInterface> = mongoose.model<VideoInterface>(
    "Video",
    videoSchema
);
