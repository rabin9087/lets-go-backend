import mongoose from "mongoose";
import riderSchema, { IRide } from "./ride.schema";

export const insertNewRide = (rideObj: Partial<IRide>) => {
  return new riderSchema(rideObj).save();
};

export const getRideByRider = (riderId: mongoose.Types.ObjectId ) => {
      return riderSchema.find({riderId})
}

export const getARideById = (_id: mongoose.Types.ObjectId ) => {
      return riderSchema.findById({_id})
}

export const getRideByDriver = (driverId: mongoose.Types.ObjectId ) => {
      return riderSchema.find({driverId})
}

export const updateRideStatus = (rideId: mongoose.Types.ObjectId, status: string ) => {
      return riderSchema.findByIdAndUpdate({rideId}, {status}, {new: true})
}

export const updateRideAcceptedStatus = ({rideId, driverId}:{rideId: mongoose.Types.ObjectId, driverId: mongoose.Types.ObjectId } ) => {
      return riderSchema.findByIdAndUpdate({rideId}, {status: "ontrip", driverId}, {new: true})
}