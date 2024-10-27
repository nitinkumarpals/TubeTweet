import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import { healthCheck } from "../controllers/healthCheck.controller";

const router: Router = Router();
router.route("/").get(healthCheck);
export default router;
