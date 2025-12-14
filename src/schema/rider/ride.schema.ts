import mongoose, { Document } from "mongoose";

export interface IRide extends Document {
  riderId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  pickupLocation: { lat: number; lng: number; address?: string };
  dropoffLocation: { lat: number; lng: number; address?: string };
  distance?: number;
  price?: number;
  status: string;
  paymentStatus: string;
  startedAt?: Date;
  completedAt?: Date;
}

const RideSchema = new mongoose.Schema<IRide>({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, indexes: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", indexes: true },
  pickupLocation: { lat: Number, lng: Number, address: String },
  dropoffLocation: { lat: Number, lng: Number, address: String },
  distance: Number,
  price: Number,
  status: { type: String, enum:["requested", "ontrip", "cancelled", "completed"], default: "requested" },
  paymentStatus: { type: String, default: "pending" },
  startedAt: Date,
  completedAt: Date,
}, { timestamps: true });

export default mongoose.model<IRide>("Ride", RideSchema);
