import mongoose, { Model, Schema, Document } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
interface IComment extends Document {
    content: string;
    video: Schema.Types.ObjectId;
    owner: Schema.Types.ObjectId;
}

const commentSchema = new Schema<IComment>(
    {
        content: {
            type: String,
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);
commentSchema.plugin(mongooseAggregatePaginate);
export const Comment: Model<IComment> = mongoose.model<IComment>(
    "Comment",
    commentSchema
);
