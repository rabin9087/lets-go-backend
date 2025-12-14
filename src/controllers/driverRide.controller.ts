import { Request, Response, NextFunction } from "express";
import { createNewDriverRide, findDriverId, getAllDrivers, getDriversByLocation } from "../schema/driver/driverRide.models";
import { ICoordinates, IDriverRide } from "../schema/driver/driverRide.schema";
import { getUserByPhoneOrEmail, updateDriverOnlineStatus } from "../schema/users/user.model";

export const updateDriverOnlineStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {email_phone, onlineStatus, currentLocation, destination, rego  } = req.body;
    if (onlineStatus === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields ( onlineStatus)",
      });
    }
      
    //   const user = req.userInfo

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
      delete (user.password)
      
    // Step 2: Update status using user._id (email_phone is wrong)
    const updatedRide = await updateDriverOnlineStatus(
      user?.phone,
      onlineStatus
      );
      if (onlineStatus) {  
          await createNewDriverRide({ driverId: user._id, currentLocation, destination, vehicle: { rego }, isOnline: onlineStatus, status: "online" } as IDriverRide)
          return res.status(200).json({
        status: "success",
        message: "Driver is online",
        data: {
            updatedRide,
            onlineStatus: user.driverProfile.isOnline
},
    });
}
    return res.status(200).json({
      status: "success",
      message: "Driver id OffLine",
        data: {
            updatedRide,
            onlineStatus: user.driverProfile.isOnline
        },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDriverCurrentLocationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email_phone, onlineStatus, currentLocation, destination, polyline, rego  } = req.body;

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
 
    const driver =  await findDriverId({driverId: user?._id, isOnline: onlineStatus, status: onlineStatus ? "online" : "offline"})
      if(!driver?._id) await createNewDriverRide({driverId: user?._id, currentLocation, destination, polyline, vehicle:{ rego},  status: "online" } as IDriverRide)

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
