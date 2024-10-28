import { Router } from "express";
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription
} from "../controllers/subscription.controller";
import { verifyJwt } from "../middlewares/auth.middleware";
const router: Router = Router();
router.use(verifyJwt);
router.route("/channel/:channelId").post(toggleSubscription);
router.route("/subscribers/:channelId").get(getUserChannelSubscribers);
router.route("/subscribed-channels").get(getSubscribedChannels);
export default router;
