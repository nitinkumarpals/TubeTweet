import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweets
} from "../controllers/tweet.controller";
const router: Router = Router();
router.use(verifyJwt);
router.route("/create").post(createTweet);
router.route("/get-tweets").get(getUserTweets);
router.patch("/update-tweets/:tweetId", updateTweets);
router.delete("/delete-tweet/:tweetId", deleteTweet);
export default router;
