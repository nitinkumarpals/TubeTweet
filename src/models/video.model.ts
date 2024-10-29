import mongoose, {
    Model,
    Schema,
    Document,
    AggregatePaginateModel
} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface VideoInterface extends Document {
    videoFile: {
        url: string;
        public_id: string;
    };
    thumbnail: {
        url: string;
        public_id: string;
    };
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
            type: {
                url: String,
                public_id: String
            },
            required: true
        },
        thumbnail: {
            type: {
                url: String,
                public_id: String
            },
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

export const Video: AggregatePaginateModel<VideoInterface> =
    mongoose.model<VideoInterface>(
        "Video",
        videoSchema
    ) as AggregatePaginateModel<VideoInterface>;
