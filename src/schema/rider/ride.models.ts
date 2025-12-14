import mongoose from "mongoose";
import riderSchema, { IRide } from "./ride.schema";

export const insertNewRide = (rideObj: Partial<IRide>) => {
  return new riderSchema(rideObj).save();
};

export const getRideByRider = (riderId: mongoose.Types.ObjectId ) => {
      return riderSchema.find({riderId})
}

export const getRideByDriver = (driverId: mongoose.Types.ObjectId ) => {
      return riderSchema.find({driverId})
}