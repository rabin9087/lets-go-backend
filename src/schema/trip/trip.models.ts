import mongoose from "mongoose";
import tripSchema, { ITrip } from "./trip.schema";

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