import { Router } from "express";
import {
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetail,
    updateCoverImage,
    updateUserAvatar
} from "../controllers/user.controller.ts";
import { upload } from "../middlewares/multer.middleware.ts";
import { verifyJwt } from "../middlewares/auth.middleware.ts";
const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

router.route("/login").post(loginUser);
//secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/update-account").patch(verifyJwt, updateAccountDetail);
router
    .route("/update-avatar")
    .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);
router
    .route("/update-coverImage")
    .patch(verifyJwt, upload.single("coverImage"), updateCoverImage);

router.route("/channel/:userName").get(verifyJwt, getUserChannelProfile);

router.route("/history").get(verifyJwt, getWatchHistory);
export default router;
