import { Request, Response, NextFunction } from "express";
import { createNewDriverRide, findAndUpdateDriverRideOnlineStatus, getAllDrivers } from "../schema/driver/driverRide.models";
import { getUserByPhoneOrEmail, updateDriverOnlineStatus } from "../schema/users/user.model";
import { findMatchingTripsForDriver } from "../schema/trip/trip.models";
import { getIO } from "../utils/socket.io";

export const updateDriverOnlineStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email_phone, onlineStatus, currentLocation, destination, rego, seatAvailable, routeGeo } = req.body;
    if (onlineStatus === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Missing required field (onlineStatus)",
      });
    }

    const user = await getUserByPhoneOrEmail(email_phone);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (user.role !== "driver") {
      return res.status(403).json({
        status: "error",
        message: "You are not allowed to go online",
      });
    }

    if (!user.driverProfile?.isApproved) {
      await updateDriverOnlineStatus(user.phone, false);
      return res.status(403).json({
        status: "error",
        message: "Driver is not approved, please contact admin",
      });
    }

    // ✅ Update driver profile online status on user schema
    await updateDriverOnlineStatus(user.phone, onlineStatus);

    // ✅ Update or create driver ride
      const updateDriver = await findAndUpdateDriverRideOnlineStatus({
      driverId: user._id,
      isOnline: onlineStatus,
      status: onlineStatus ? "online" : "offline",
      currentLocation,
      destination,
      rego,
      seatAvailable,
      routeGeo,
      phone: user?.phone
      });
    
    const newTrip = await findMatchingTripsForDriver(user?._id)
    console.log("New Trip", newTrip)
    
    if (newTrip) {
      getIO().to(`user_${user?._id}`).emit("trip:incoming", {
            newTrip,
            expiresIn: 45,
          });
        }
   
    return res.status(200).json({
      status: "success",
      message: `Driver is ${onlineStatus ? "Online" : "Offline"}`,
      data: {
        onlineStatus,
        updateDriver,
      },
    });
  } catch (error) {
    next(error);
  }
}

export const updateDriverCurrentLocationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email_phone, onlineStatus, currentLocation, destination, routeGeo, rego, seatAvailable, regoPhone  } = req.body;

    if (!email_phone || onlineStatus === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields (email_phone or onlineStatus)",
      });
    }

    // Step 1: Find user once (no duplicate DB calls)
    const user = await getUserByPhoneOrEmail(email_phone);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }
       if (user?.role !== "driver") {
      return res.status(404).json({
        status: "error",
        message: "You are not Allowed to go Online",
      });
    }

      if (!user.driverProfile?.isApproved) {
        await updateDriverOnlineStatus(
      user?.phone,
      false
    );
      return res.status(403).json({
        status: "error",
        message: "Driver is not approved, please contact admin",
      });
    }

    // Step 2: Update status using user._id (email_phone is wrong)
    const updatedDriver = await updateDriverOnlineStatus(
      user?.phone,
      onlineStatus
      );
 
    const driver =  await findAndUpdateDriverRideOnlineStatus({driverId: user?._id, isOnline: onlineStatus, status: onlineStatus ? "online" : "offline", seatAvailable, routeGeo, phone: regoPhone})

    return res.status(200).json({
      status: "success",
      message: "Driver online status updated",
      data: updatedDriver,
    });
  } catch (error) {
    next(error);
  }
};

export const getALlOnlineDriversController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      currentLocation,
      destination,
    } = req.body;

    if (!currentLocation || !destination ) {
      return res.status(400).json({
        status: "error",
        message: "Missing coordinates",
      });
    }

    const allDrivers = await getAllDrivers({
      currentLocation,
      destination,
    });
    return res.status(200).json({
      status: "success",
      message: "All Drivers",
      data: {drivers:allDrivers}
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
