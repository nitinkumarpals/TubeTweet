import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { promises as fs } from "fs";

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
        await fs.unlink(localFilePath);
        return response;
    } catch (error) {
        // unlinkSync(localFilePath); //remove the locally saved temporary file as the upload failed
        console.error(error);
        return null;
    } finally {
        console.log("UploadOnCloudinary function has completed");
    }
};
const deleteFromCloudinary = async (publicId: string, resourceType: string) => {
    try {
        if (!publicId) return;
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        if (response.result === "ok") {
            console.log(`Deleted file with public ID: ${publicId}`);
        } else {
            console.error(`Failed to delete file with public ID: ${publicId}`);
        }
    } catch (error) {
        console.error(
            `Failed to delete file with public ID: ${publicId}`,
            error
        );
    }
};
export { uploadOnCloudinary, deleteFromCloudinary };
