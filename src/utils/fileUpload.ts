import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { unlinkSync } from "node:fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.FILE_UPLOAD_CLOUD_NAME,
    api_key: process.env.FILE_UPLOAD_API_KEY,
    api_secret: process.env.FILE_UPLOAD_API_SECRET
});

const uploadOnCloudinary = async (
    localFilePath: string
): Promise<UploadApiResponse | null> => {
    try {
        if (!localFilePath) return null;
        //upload the file on
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        console.log("File is uploaded on cloudinary", response.url);
        return response;
    } catch (error) {
        unlinkSync(localFilePath); //remove the locally saved temporary file as the upload failed
        console.error(error);
        return null;
    }
};

export { uploadOnCloudinary };
