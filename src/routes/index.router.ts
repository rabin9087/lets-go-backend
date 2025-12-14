import { Router } from "express";
import userRouter from './user.router'
import driverRouter from './driver.router'
import rideRouter from './ride.router'

const router = Router();
router.use("/user", userRouter)
router.use("/driver", driverRouter)
router.use("/ride", rideRouter)

export default router