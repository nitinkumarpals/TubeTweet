import { Router } from "express";
import { registerUser } from "../controllers/user.controller.ts";

const router = Router();

router.route("/register").post(registerUser);

export default router;
