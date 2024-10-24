import mongoose, { Model, Schema, Document } from "mongoose";

interface ISubscription extends Document {
    subscriber: Schema.Types.ObjectId;
    channel: Schema.Types.ObjectId;
}
const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        channel: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

export const Subscription: Model<ISubscription> = mongoose.model<ISubscription>(
    "Subscription",
    subscriptionSchema
);
