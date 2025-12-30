import { Router } from 'express';
import { getALlOnlineDriversController, updateDriverCurrentLocationController, updateDriverOnlineStatusController } from '../controllers/driverRide.controller';
import { driverAccess } from '../middleware/auth/auth';
import { driverOnlineStatusValidation } from '../middleware/joi/driverValidation';

const router = Router();
// router.post("/onlineDrivers", getALlOnlineDriversController)
router.put("/online", updateDriverOnlineStatusController)
router.put("/location-update", driverAccess, updateDriverCurrentLocationController)

export default router