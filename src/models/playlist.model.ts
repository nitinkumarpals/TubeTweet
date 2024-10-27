import mongoose, { Model, Schema, Document } from "mongoose";
interface IPlaylist extends Document {
    name: string;
    description: string;
    videos: Schema.Types.ObjectId[];
    owner: Schema.Types.ObjectId;
}

const playlistSchema = new Schema<IPlaylist>(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        videos: {
            type: [{ type: Schema.Types.ObjectId, ref: "Video" }]
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

export const Playlist: Model<IPlaylist> = mongoose.model<IPlaylist>(
    "Playlist",
    playlistSchema
);
