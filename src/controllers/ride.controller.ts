import { Request, Response, NextFunction } from "express";
import { getADriverByRegoPhone, getDriversByLocation } from "../schema/driver/driverRide.models";
import { insertNewRide } from "../schema/rider/ride.models";
import { IRide } from "../schema/rider/ride.schema";

export const createNewRideController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      polyline,
      riderId,
      distance,
      price,
        status,
      paymentStatus,
    } = req.body;

    // 1. get nearby drivers (200m radius)
    const availableDrivers = await getDriversByLocation({
      currentLocation: pickupLocation,
      destination: dropoffLocation,
    //   polyline,
    });

    if (!availableDrivers.length) {
      return res.status(404).json({
        status: "error",
        message: "No drivers available within 200m radius.",
      });
    }

    // 2. select the best first driver
      const bestDriver = availableDrivers[0];
      
      const payload: Partial<IRide> = {
        riderId,
        driverId: bestDriver._id,
        pickupLocation,
        dropoffLocation,
        distance,
        price,
        status,
        paymentStatus,
        };


    // 3. create new ride
    const newRide = await insertNewRide(payload);

    // 4. send realtime request to driver (socket push)
    // socket.to(bestDriver._id.toString()).emit("incoming-ride-request", newRide);

    return res.status(201).json({
      status: "success",
      message: "Ride request sent to best driver",
      data: newRide,
    });

  } catch (error) {
    next(error);
  }
};

export const getDriverByRegoPhoneController = async(req: Request,
  res: Response,
  next: NextFunction) => {
    try {
        const {regoPhone} = req.body 
        const driver = await getADriverByRegoPhone(regoPhone)
        if (driver?.isOnline) {
            //send a rider request notification to the driver 

            return res.status(200).json({
            status: "success",
            message: "Your requested driver found",
            data: driver
            
        })
        } else {
            // send notification to the driver to go online, request 

        }

        return res.status(200).json({
            status: "error",
            message: "Your requested driver is Offline",
            
        })
    } catch (error) {
        next(error)
    }
}
