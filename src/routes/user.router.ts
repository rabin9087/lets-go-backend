import { Router } from "express";
import { createUserController, loginUser, logoutUser } from "../controllers/user.controller";
import { loginValidation, signupValidation } from "../middleware/joi/userValidation";
import { refreshAuth } from "../middleware/auth/auth";

const router = Router();
router.post("/sign-up", signupValidation, createUserController);
router.post("/sign-in", loginValidation, loginUser);
router.get("/get-accessjwt", refreshAuth);
router.get("/logout", logoutUser);

export default router;