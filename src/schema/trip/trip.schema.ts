import mongoose, { Document } from "mongoose";
import { CoordinatesSchema, GeoPointSchema, ICoordinates, IGeoPoint, ILocation } from "../common schema/shareSchema.schema";



export interface ITrip extends Document {
  riderId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  pickupLocation: ILocation;
  pickupLocationGeo: IGeoPoint;
  dropoffLocation: ILocation;
  dropoffLocationGeo: IGeoPoint;
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
    type: CoordinatesSchema,
    required: true,
  },
  pickupLocationGeo: {
      type: GeoPointSchema,
      required: true,
},

  dropoffLocation: {
    type: CoordinatesSchema,
    required: true
  },
  dropoffLocationGeo: {
      type: GeoPointSchema,
      required: true,
},
  distance: String,
  duration: String,
  price: Number,
  people: {type: Number},
  status: { type: String, enum:["requested", "ontrip", "cancelled", "completed", "accepted", "pickedup", "rejected"], default: "requested" },
  paymentStatus: { type: String, default: "pending" },
  startedAt: {type: Date, default: new Date},
  completedAt: Date,
}, { timestamps: true });

TripSchema.index({ pickupLocationGeo: "2dsphere" });
TripSchema.index({ dropoffLocationGeo: "2dsphere" });


export default mongoose.model<ITrip>("Trip", TripSchema);
