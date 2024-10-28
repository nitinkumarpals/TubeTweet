import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import {
    getVideoById,
    publishAVideo,
    updateVideo
} from "../controllers/video.controller";
const router: Router = Router();
router.use(verifyJwt);
router.route("/").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
);

router
    .route("/:videoId")
    .get(getVideoById)
    .patch(upload.single("thumbnail"), updateVideo);
export default router;
