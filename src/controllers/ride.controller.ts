import { Request, Response, NextFunction } from "express";
import { getADriverByRegoPhone, getDriversByPickUpAndDropoffLocation, getDriversByPickupLocation } from "../schema/driver/driverRide.models";
import { getARideById, insertNewRide, updateRideAcceptedStatus, updateRideStatus } from "../schema/rider/ride.models";
import { IRide } from "../schema/rider/ride.schema";
import { getIO } from "../utils/socket.io";

export const createNewRideByPickupAnddrpoffLocationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      riderId,
      pickupLocation,
      dropoffLocation,
      people,
        price,
      distance, 
      duration,
    } = req.body;

      // 1. get nearby drivers (200m radius)
      const availableDrivers = await getDriversByPickUpAndDropoffLocation({
        pickupLocation: pickupLocation.coords,
        dropoffLocation: dropoffLocation.coords,
        people,
       
    //   polyline,
    });


    if (!availableDrivers.length) {
      return res.status(404).json({
        status: "error",
          message: "No drivers available within 200m radius.",
        data: {drivers: []}
      });
    }

    // 2. select the best first driver
    const bestDriver = availableDrivers[0];

    if (bestDriver.socketId) {
       const io = getIO();
      io.to(bestDriver.socketId).emit("ride-request", {
      _id: bestDriver?._id,
      riderId,
      pickupLocation,
      dropoffLocation,
        people,
        price,
        distance, 
        duration
    });
}
      
const payload: Partial<IRide> = {
    riderId,
    driverId: bestDriver._id,
    pickupLocation: {
        address: pickupLocation.address || "",
        coords: 
             { 
                latitude: pickupLocation.coords.latitude, 
                longitude: pickupLocation.coords.longitude 
              },
    },
    dropoffLocation: {
        address: dropoffLocation.address || "",
        coords:  { 
                latitude: pickupLocation.coords.latitude, 
                longitude: pickupLocation.coords.longitude 
              },
    },
        price,
        distance, 
        duration
    // paymentStatus,
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

export const createNewRideByPickupLocationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      riderId,
    //   distance,
    //   price,
    //     status,
    //   paymentStatus,
    } = req.body;

    console.log(req.body)
      // 1. get nearby drivers (200m radius)
      const availableDrivers = await getDriversByPickupLocation({
        pickupLocation: pickupLocation.coords,
    //   polyline,
    });


    if (!availableDrivers.length) {
      return res.status(404).json({
        status: "error",
          message: "No drivers available within 200m radius.",
        data: {drivers: []}
      });
    }

    console.log("availableDrivers", availableDrivers)
    // 2. select the best first driver
      const bestDriver = availableDrivers[0];
      
const payload: Partial<IRide> = {
    riderId,
    driverId: bestDriver._id,
    pickupLocation: {
        address: pickupLocation.address || "",
        coords: 
             { 
                latitude: pickupLocation.coords.latitude, 
                longitude: pickupLocation.coords.longitude 
              },
    },
    dropoffLocation: {
        address: dropoffLocation.address || "",
        coords:  { 
                latitude: dropoffLocation.coords.latitude, 
                longitude: dropoffLocation.coords.longitude 
              },
    },
    // distance,
    // price,
    // status,
    // paymentStatus,
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

export const rideResponseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rideId, status, driverId } = req.body; // include driverId if needed

    if (!rideId || !status) {
      return res.status(400).json({ status: "error", message: "rideId and status are required" });
    }

    const ride = await getARideById(rideId);

    if (!ride) {
      return res.status(404).json({ status: "error", message: "Ride not found" });
    }

    const io = getIO(); // get your socket.io instance

    if (status === "accepted") {
      // Update ride status in DB
      const updatedRide = await updateRideAcceptedStatus({rideId, driverId}); // create this function in your model

      // Notify rider in real-time
      io.to(ride.riderId.toString()).emit("ride-accepted", updatedRide);

      return res.status(200).json({
        status: "success",
        message: "Ride accepted",
        data: updatedRide,
      });
    }

    if (status === "rejected") {
      // Update ride status in DB
      const updatedRide = await updateRideStatus(rideId, "rejected");

      // Optionally, notify rider that the ride was rejected
      io.to(ride.riderId.toString()).emit("ride-rejected", updatedRide);

      // Optionally, find another available driver
      const availableDrivers = await getDriversByPickUpAndDropoffLocation({
        pickupLocation: ride.pickupLocation.coords,
        dropoffLocation: ride.dropoffLocation.coords,
        people: ride.people as number
      });

      if (availableDrivers.length) {
        const nextDriver = availableDrivers[0];
        if (nextDriver.socketId) {
          io.to(nextDriver.socketId).emit("ride-request", {
            _id: nextDriver._id,
            riderId: ride.riderId,
            pickupLocation: ride.pickupLocation,
            dropoffLocation: ride.dropoffLocation,
            people: ride.people,
          });
        }
      }

      return res.status(200).json({
        status: "success",
        message: "Ride rejected",
        data: updatedRide,
      });
    }

    return res.status(400).json({
      status: "error",
      message: "Invalid status",
    });
  } catch (error) {
    next(error);
  }
};
