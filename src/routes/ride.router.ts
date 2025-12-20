import { Router } from 'express';
import { createNewRideByPickupAnddrpoffLocationController, createNewRideByPickupLocationController, getDriverByRegoPhoneController, rideResponseController } from '../controllers/ride.controller';
import { riderAccess } from '../middleware/auth/auth';
import { rideByRegoRequestValidation, rideRequestValidation } from '../middleware/joi/riderValidation';

const router = Router();
router.post("/pickup-dropoff/ride-request", createNewRideByPickupAnddrpoffLocationController)
router.post("/pickup/ride-request", createNewRideByPickupLocationController)
router.get("/rego", riderAccess, rideByRegoRequestValidation, getDriverByRegoPhoneController)
router.get("/:riderId")
router.post("/ride-response", rideResponseController)


export default router