import { Router } from "express";
import { addAddressController, createUserController, loginUser, logoutUser, registerPushNotificationToken } from "../controllers/user.controller";
import { loginValidation, signupValidation } from "../middleware/joi/userValidation";
import { auth, refreshAuth } from "../middleware/auth/auth";

const router = Router();
router.post("/sign-up", signupValidation, createUserController);
router.post("/sign-in", loginValidation, loginUser);
router.get("/get-accessjwt", refreshAuth);
router.post("/push-token", auth, registerPushNotificationToken);
router.get("/logout", logoutUser);
router.post("/add-address", auth, addAddressController);

export default router;