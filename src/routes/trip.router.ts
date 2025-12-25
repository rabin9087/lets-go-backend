import { Router } from 'express';
import { riderAccess } from '../middleware/auth/auth';
import { rideByRegoRequestValidation } from '../middleware/joi/riderValidation';
import { createNewTripByPickupAnddrpoffLocationController, createNewtripByPickupLocationController, getDriverByRegoPhoneController, tripResponseController } from '../controllers/ride.controller';

const router = Router();
router.post("/pickup-dropoff/trip-request", createNewTripByPickupAnddrpoffLocationController)
router.post("/pickup/trip-request", createNewtripByPickupLocationController)
router.get("/rego", riderAccess, rideByRegoRequestValidation, getDriverByRegoPhoneController)
router.get("/:riderId")
router.post("/trip-response", tripResponseController)


export default router 