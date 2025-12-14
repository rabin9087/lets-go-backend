import { Router } from 'express';
import { createNewRideController, getDriverByRegoPhoneController } from '../controllers/ride.controller';
import { riderAccess } from '../middleware/auth/auth';
import { rideByRegoRequestValidation, rideRequestValidation } from '../middleware/joi/riderValidation';

const router = Router();
router.post("/ride-request", riderAccess, rideRequestValidation, createNewRideController)
router.get("/rego", riderAccess, rideByRegoRequestValidation, getDriverByRegoPhoneController)
router.get("/:riderId")


export default router