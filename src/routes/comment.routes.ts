import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment
} from "../controllers/comment.controller";
const router: Router = Router();
router.use(verifyJwt);

router.route("/:videoId").get(getVideoComments).post(addComment as any);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);
export default router;
