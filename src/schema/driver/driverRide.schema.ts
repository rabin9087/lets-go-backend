import { Schema, model, Document, Types } from "mongoose";
import { boolean } from "zod";

export interface ICoordinates {
  latitude: number;
  longitude: number;
}

export interface IDriverRide extends Document {
  driverId: Types.ObjectId;
  phone: string;
  vehicle: {
    rego: string;
  };
  currentLocation: ICoordinates;
  destination?: ICoordinates;
  polyline: ICoordinates[];
  isOnline: boolean;
  status: "online" | "on-trip" | "offline";
  socketId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CoordinatesSchema = new Schema<ICoordinates>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const DriverRideSchema = new Schema<IDriverRide>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: "User", required: true, indexes: 1 },
    phone: {type: String, indexes: 1},
    vehicle: {
        rego: { type: String, indexes: 1},
    },

    currentLocation: {
      type: CoordinatesSchema,
      required: true,
    },

    destination: {
      type: CoordinatesSchema,
      required: false,
    },

    polyline: {
      type: [CoordinatesSchema],
      default: [],
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["online", "on-trip", "offline"],
      default: "offline",
    },
    socketId: { type: String },

  },
  { timestamps: true }
);

export default model<IDriverRide>("Driver", DriverRideSchema);
