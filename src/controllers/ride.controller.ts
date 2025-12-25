import { Request, Response, NextFunction } from "express";
import { getADriverByRegoPhone, getDriversByPickUpAndDropoffLocation, getDriversByPickupLocation, updateDriverTripStatus } from "../schema/driver/driverRide.models";
import { getIO } from "../utils/socket.io";
import { ITrip } from "../schema/trip/trip.schema";
import { getATripById, insertNewTrip, updateTripAcceptedStatus, updateTripStatus } from "../schema/trip/trip.models";
import { addNewTripToUser } from "../schema/users/user.model";
import mongoose from "mongoose";

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
    } = req.body;


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
      dropoffLocation: {
        address: dropoffLocation.address || "",
        coords: {
          latitude: dropoffLocation.coords.latitude,
          longitude: dropoffLocation.coords.longitude
        },
      },
      people,
      price,
      distance,
      duration
      // paymentStatus,
    };


    // 3. create new trip
    const newTrip = await insertNewTrip(payload);

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
        data: { drivers: [] }
      });
    }

    const bestDriver = availableDrivers[0];

    if (newTrip?._id && bestDriver?.socketId) {
      const io = getIO();

      io.to(bestDriver.socketId).emit("trip:incoming", {
        newTrip,
        expiresIn: 45,
      });
    }

    // socket.to(bestDriver._id.toString()).emit("incoming-trip-request", newtrip);

    return res.status(200).json({
      status: "success",
      message: "Trip request sent to best driver",
      data: {newTrip},
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
    const { _id, status, driverId } = req.body; // include driverId if needed
    if (!_id || !status) {
      return res.status(400).json({ status: "error", message: "_id and status are required" });
    }

    const trip = await getATripById(_id);

    if (!trip) {
      return res.status(404).json({ status: "error", message: "Ride not found" });
    }

    const io = getIO();
    if (driverId) {
      if (status === "accepted") {
        // Update ride status in DB
        await addNewTripToUser({ _id: driverId, currentTrip: _id }) // Insert trip to Driver
        await addNewTripToUser({ _id: trip.riderId, currentTrip: _id }) // Insert Trip to rider
        const updatedTrip = await updateTripAcceptedStatus({ _id, driverId }); // create this function in your model
        await updateDriverTripStatus({ driverId, status: "ontrip", seats: updatedTrip?._id ? updatedTrip.people as number : 0 })

        // Notify rider
        io.to(`user_${trip.riderId}`).emit("trip:accepted", {
          tripId: _id,
          driverId,
        });

        // Notify driver
        io.to(`user_${driverId}`).emit("trip:accepted", {
          tripId: _id,
          riderId: trip.riderId,
        });

        return res.status(200).json({
          status: "success",
          message: "Ride accepted",
          data: updatedTrip,
        });
      }

      if (status === "rejected") {
        // Update ride status in DB
        const updatedTrip = await updateTripStatus({ _id, status: "rejected" });

        // Optionally, notify rider that the ride was rejected
        io.to(trip._id.toString()).emit("trip-rejected", updatedTrip);

        // Optionally, find another available driver
        const availableDrivers = await getDriversByPickUpAndDropoffLocation({
          pickupLocation: trip.pickupLocation.coords,
          dropoffLocation: trip.dropoffLocation.coords,
          people: trip.people as number
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


      if (status! == "accepted" || status !== "rejected") {

        if (status === "completed") {
          await addNewTripToUser({ _id: driverId, currentTrip: null })
          await addNewTripToUser({ _id: trip?.riderId, currentTrip: null })
        }

        await updateDriverTripStatus({ driverId, status: status === "completed" ? "online" : status, seats: 0 });
        const updatedTrip = await updateTripStatus({ _id, status });
        if (updatedTrip?._id) {
          return res.status(200).json({
            status: "success",
            message: "Ride rejected",
            data: updatedTrip,
          });
        }
      }
    }


    return res.status(400).json({
      status: "error",
      message: "Invalid status",
    });
  } catch (error) {
    next(error);
  }
};
