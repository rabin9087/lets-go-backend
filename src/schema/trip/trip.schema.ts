import mongoose, { Document } from "mongoose";
import { ICoordinates, IGeoPoint, ILocation } from "../common schema/shareSchema.schema";



export interface ITrip extends Document {
  riderId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  pickupLocation: ILocation;
  pickupLocationGeo: IGeoPoint;
  dropoffLocation: ILocation;
  dropupLocationGeo: IGeoPoint;
  distance?: string;
  duration: string;
  people?: number;
  price?: number;
  status: string;
  paymentStatus: string;
  startedAt?: Date;
  completedAt?: Date;
}

const TripSchema = new mongoose.Schema<ITrip>({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, indexes: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", indexes: true },
  pickupLocation: {
    coords: {
      latitude: { type: Number },
      longitude: {type: Number}},
      address: String
  },
  dropoffLocation: { coords: {
      latitude: { type: Number },
      longitude: {type: Number}},
      address: String },
  distance: String,
  duration: String,
  price: Number,
  people: {type: Number},
  status: { type: String, enum:["requested", "ontrip", "cancelled", "completed", "accepted", "pickedup", "rejected"], default: "requested" },
  paymentStatus: { type: String, default: "pending" },
  startedAt: {type: Date, default: new Date},
  completedAt: Date,
}, { timestamps: true });

export default mongoose.model<ITrip>("Trip", TripSchema);
