import { Request, Response, NextFunction } from "express";
import { getADriverByRegoPhone, getDriversByPickUpAndDropoffLocation, getDriversByPickupLocation, updateDriverTripStatus } from "../schema/driver/driverRide.models";
import { getIO } from "../utils/socket.io";
import { ITrip } from "../schema/trip/trip.schema";
import { getATripById, insertNewTrip, updateTripAcceptedStatus, updateTripStatus } from "../schema/trip/trip.models";
import { addNewTripToUser } from "../schema/users/user.model";
import driverRideSchema from "../schema/driver/driverRide.schema";
import userSchema from "../schema/users/user.schema";
import { sendPushNotification } from "../utils/expo";

export const createNewTripByPickupAnddrpoffLocationController = async (
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
      regoPhone
    } = req.body;
    console.log("req.body: ", regoPhone)
    
    

    const payload: Partial<ITrip> = {
      riderId,
      pickupLocation: {
        address: pickupLocation.address || "",
        coords:
        {
          latitude: pickupLocation.coords.latitude,
          longitude: pickupLocation.coords.longitude
        },
      },
      pickupLocationGeo: {
        type: "Point",
        coordinates: [
          pickupLocation.coords.longitude,
          pickupLocation.coords.latitude,
        ]
      },
      dropoffLocation: {
        address: dropoffLocation.address || "",
        coords: {
          latitude: dropoffLocation.coords.latitude,
          longitude: dropoffLocation.coords.longitude
        },
      },
      dropoffLocationGeo: {
        type: "Point",
        coordinates: [
          dropoffLocation.coords.longitude,
          dropoffLocation.coords.latitude,
        ]
      },
      people,
      price,
      distance,
      duration
      // paymentStatus,
    };

    const rider = await userSchema.findById(riderId)
    // 3. create new trip
    const newTrip = await insertNewTrip(payload);

    if (regoPhone) {
       console.log("regoPhone", regoPhone)
      const driver = await getADriverByRegoPhone(regoPhone.trim().toUpperCase())
        // 🟢 SOCKET (app open)
      if (driver?.driverId) {
    const io = getIO();
        io.to(`user_${driver?.driverId}`).emit("trip:incoming", {
        newTrip,
        expiresIn: 45,
        rider: rider?.name
        });
        console.log("📡 Sent via socket");
  }

      const driverToken = await userSchema.findById(driver?.driverId)
      
       if (driverToken?.pushToken) {
        //  const pushToken =
           await sendPushNotification(
                    driverToken.pushToken,
                    newTrip, rider?.name as string)
  }
       return res.status(200).json({
      status: "success",
      message: "Trip request sent to best driver",
      data: { newTrip },
    });
    }

    // 1. get nearby drivers (200m radius)
    const availableDrivers = await getDriversByPickUpAndDropoffLocation({
      pickupLocation: pickupLocation.coords,
      dropoffLocation: dropoffLocation.coords,
      people,
      //   polyline,
    });

    console.log("availableDrivers:", availableDrivers)
    if (!availableDrivers.length) {
      return res.status(404).json({
        status: "error",
        message: "No drivers available within 200m radius.",
        data: { drivers: [] }
      });
    }

    const bestDriver = availableDrivers[0];
    console.log("best Driver", bestDriver?.driverId)
    if (newTrip?._id) {
      const io = getIO();
      io.to(`user_${bestDriver?.driverId}`).emit("trip:incoming", {
        newTrip,
        expiresIn: 45,
      });
    }

    // socket.to(bestDriver._id.toString()).emit("incoming-trip-request", newtrip);

    return res.status(200).json({
      status: "success",
      message: "Trip request sent to best driver",
      data: { newTrip },
    });

  } catch (error) {
    next(error);
  }
};

export const createNewtripByPickupLocationController = async (
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
        data: { drivers: [] }
      });
    }

    console.log("availableDrivers", availableDrivers)
    // 2. select the best first driver
    const bestDriver = availableDrivers[0];

    const payload: Partial<ITrip> = {
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
        coords: {
          latitude: dropoffLocation.coords.latitude,
          longitude: dropoffLocation.coords.longitude
        },
      },
      // distance,
      // price,
      // status,
      // paymentStatus,
    };

    // 3. create new trip
    const newtrip = await insertNewTrip(payload);

    // 4. send realtime request to driver (socket push)
    // socket.to(bestDriver._id.toString()).emit("incoming-trip-request", newtrip);

    return res.status(201).json({
      status: "success",
      message: "trip request sent to best driver",
      data: newtrip,
    });

  } catch (error) {
    next(error);
  }
};

export const getDriverByRegoPhoneController = async (req: Request,
  res: Response,
  next: NextFunction) => {
  try {
    const { regoPhone } = req.body
    const driver = await getADriverByRegoPhone(regoPhone)
    if (driver?.isOnline) {
      //send a tripr request notification to the driver 

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

export const tripResponseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { _id, status, driverId } = req.body;

    if (!_id || !status) {
      return res.status(400).json({ status: "error", message: "_id and status are required" });
    }

    const trip = await getATripById(_id);

    if (!trip) {
      return res.status(404).json({ status: "error", message: "Ride not found" });
    }

    const io = getIO();

    switch (status) {
      case "accepted": {
        if (!driverId) return res.status(400).json({ status: "error", message: "Driver ID required" });

        // Update trip for driver and rider
        await addNewTripToUser({ _id: driverId, currentTrip: _id });
        await addNewTripToUser({ _id: trip.riderId, currentTrip: _id });

        const newTrip = await updateTripAcceptedStatus({ _id, driverId });
         await updateDriverTripStatus({
          driverId,
          status: "ontrip",
          seats: newTrip?.people || 0,
        });

        // Notify rider and driver
        io.to(`user_${trip.riderId}`).emit("trip:accepted", { trip: newTrip });
        io.to(`user_${driverId}`).emit("trip:accepted", { trip: newTrip });

        return res.status(200).json({
          status: "success",
          message: "Ride accepted",
          data: {newTrip},
        });
      }

      case "rejected": {
        if (!driverId) return res.status(400).json({ status: "error", message: "Driver ID required" });

        const updatedTrip = await updateTripStatus({ _id, status: "rejected" });

        // Notify rider
        io.to(`user_${trip.riderId}`).emit("trip:rejected", updatedTrip);

        // Notify next available driver
        const availableDrivers = await getDriversByPickUpAndDropoffLocation({
          pickupLocation: trip.pickupLocation.coords,
          dropoffLocation: trip.dropoffLocation.coords,
          people: trip.people as number,
        });

        if (availableDrivers.length) {
          const nextDriver = availableDrivers[0];
          if (nextDriver.socketId) {
            io.to(nextDriver.socketId).emit("trip-request", {
              _id: nextDriver._id,
              riderId: trip.riderId,
              pickupLocation: trip.pickupLocation,
              dropoffLocation: trip.dropoffLocation,
              people: trip.people,
            });
          }
        }

        return res.status(200).json({
          status: "success",
          message: "Ride rejected",
          data: updatedTrip,
        });
      }

      case "pickedup": {
        if (!driverId) return res.status(400).json({ status: "error", message: "Driver ID required" });

        const updatedTrip = await updateTripStatus({ _id, status });
        await updateDriverTripStatus({ driverId, status: "ontrip", seats: 0 });
          console.log("This is picked Updated Trip",updatedTrip)
        io.to(`trip_${trip?._id}`).emit("trip:pickedup", { trip: updatedTrip });
        // io.to(`user_${trip.riderId}`).emit("trip:pickedup", { tripId: updatedTrip });
        // io.to(`user_${trip.driverId}`).emit("trip:pickedup", { tripId: updatedTrip });

        return res.status(200).json({
          status: "success",
          message: "Ride picked up",
          data: updatedTrip,
        });
      }

      case "completed": {
        if (!driverId) return res.status(400).json({ status: "error", message: "Driver ID required" });

        const updatedTrip = await updateTripStatus({ _id, status });
        await addNewTripToUser({ _id: driverId, currentTrip: null });
        await addNewTripToUser({ _id: trip.riderId, currentTrip: null });
        await updateDriverTripStatus({ driverId, status: "online", seats: 0 });

        io.to(`trip_${trip?._id}`).emit("trip:completed", { tripId: _id });
        // io.to(`user_${trip.driverId}`).emit("trip:completed", { tripId: _id });
        const dri = await driverRideSchema.findOneAndUpdate({ driverId }, { seatAvailable: 4 })
        console.log("Seats available",dri?.seatAvailable)
        return res.status(200).json({
          status: "success",
          message: "Ride completed",
          data: updatedTrip,
        });
      }

      default: {
        return res.status(400).json({
          status: "error",
          message: "Invalid status",
        });
      }
    }
  } catch (error) {
    next(error);
  }
};