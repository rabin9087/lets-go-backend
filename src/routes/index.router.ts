import { Router } from "express";
import userRouter from './user.router'
import driverRouter from './driver.router'
import tripRouter from './trip.router'

const router = Router();
router.use("/user", userRouter)
router.use("/driver", driverRouter)
router.use("/trip", tripRouter)

export default router