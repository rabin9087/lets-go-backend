import { Schema, model, Document, Types } from "mongoose";
import { boolean, string } from "zod";

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
  currentLocation: {address: string, coords: ICoordinates};
  destination?: {address: string, coords: ICoordinates};
  polyline: ICoordinates[];
  isOnline: boolean;
  seatAvailable?: Number;
  status: "online" | "on-trip" | "offline";
  socketId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CoordsSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false } // disable _id for nested object
);

/* ---------------- COORDINATES SCHEMA ---------------- */
const CoordinatesSchema = new Schema(
  {
    address: { type: String }, // optional
    coords: { type: CoordsSchema, required: true },
  },
  { _id: false } // disable _id for parent embedded document
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
      indexes: true
    },

    destination: {
      type: CoordinatesSchema,
      required: false,
      indexes: true
    },

    polyline: {
      type: [CoordinatesSchema],
      default: [],
    },
    isOnline: {
      type: Boolean,
      default: false,
      indexes: true
    },
    seatAvailable: {
      type: Number,
      required: true,
      default: 4
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
