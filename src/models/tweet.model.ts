import mongoose, { Model, Document, Schema } from "mongoose";
interface ITweet extends Document {
    owner: Schema.Types.ObjectId;
    content: string;
}
const tweetSchema = new Schema<ITweet>(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        content: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);
export const Tweet: Model<ITweet> = mongoose.model<ITweet>("Tweet", tweetSchema);
