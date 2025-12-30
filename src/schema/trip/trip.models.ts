import mongoose from "mongoose";
import tripSchema, { ITrip } from "./trip.schema";
import { ILocation } from "../common schema/shareSchema.schema";
import driverRideSchema from "../driver/driverRide.schema";

export const insertNewTrip = (tripObj: Partial<ITrip>) => {
  return new tripSchema(tripObj).save();
};

export const getTripByRider = (riderId: mongoose.Types.ObjectId ) => {
      return tripSchema.find({riderId})
}

export const getATripById = (_id: string) => {
    return tripSchema.findById(_id);
};


export const getTripByDriver = (driverId: mongoose.Types.ObjectId ) => {
      return tripSchema.find({driverId})
}

export const updateTripStatus = ({_id, status}:{_id: mongoose.Types.ObjectId, status: string} ) => {
      return tripSchema.findByIdAndUpdate({_id}, {status}, {new: true})
}

export const updateTripAcceptedStatus = ({_id, driverId}:{_id: mongoose.Types.ObjectId, driverId: mongoose.Types.ObjectId } ) => {
      return tripSchema.findByIdAndUpdate({_id}, {status: "ontrip", driverId}, {new: true})
}

export const findMatchingTripsForDriver = async (
  driverId: mongoose.Types.ObjectId,
) => {

       const maxDistanceMeters = 5000 // 1km buffer

  // 1️⃣ Get driver route
  const driver = await driverRideSchema.findOne({ driverId, isOnline: true }).lean();

  if (!driver || !driver.routeGeo.coordinates.length) {
    return [];
  }

  // 2️⃣ Find trips whose pickup & dropoff are near driver route
const bufferInRadians = maxDistanceMeters / 6378137; // earth radius

  return await tripSchema.findOne({
    status: "requested",

    // Pickup must lie near route
    pickupLocationGeo: {
      $geoWithin: {
        $centerSphere: [
          driver.routeGeo.coordinates[0], // fallback center
          bufferInRadians,
        ],
      },
    },

    // Dropoff must lie near route
    dropoffLocationGeo: {
      $geoWithin: {
        $centerSphere: [
          driver.routeGeo.coordinates[
            driver.routeGeo.coordinates.length - 1
          ],
          bufferInRadians,
        ],
      },
    },
  });
};