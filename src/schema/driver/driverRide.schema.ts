import { Schema, model, Document, Types } from "mongoose";
import { CoordinatesSchema, GeoPointSchema, IGeoPoint, ILocation } from "../common schema/shareSchema.schema";

/* ---------------- TYPES ---------------- */

export interface IGeoLineString {
  type: "LineString";
  coordinates: [number, number][];
}

export interface IDriverRide extends Document {
  driverId: Types.ObjectId;
  phone: string;
  vehicle: {
    rego: string;
  };
  // 🔹 Old structure (keep for UI & compatibility)
  currentLocation: ILocation;
  // 🔥 NEW (for geo queries)
  currentLocationGeo?: IGeoPoint;
  destination?: ILocation;
  destinationLocationGeo: IGeoPoint;
  routeGeo: IGeoLineString;
  isOnline: boolean;
  seatAvailable?: number;
  status: "online" | "on-trip" | "offline";
  socketId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ---------------- DRIVER RIDE SCHEMA ---------------- */

const DriverRideSchema = new Schema<IDriverRide>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    phone: { type: String, index: true },

    vehicle: {
      rego: { type: String, index: true },
    },

    currentLocation: {
      type: CoordinatesSchema,
      required: true,
    },

    currentLocationGeo: {
      type: GeoPointSchema,
      required: true,
      // index: "2dsphere",
    },

    destination: {
      type: CoordinatesSchema,
    },

    destinationLocationGeo: {
      type: GeoPointSchema,
      required: true,
      // index: "2dsphere",
    },

    // ✅ Update routeGeo to be proper LineString GeoJSON
    routeGeo: {
      type: {
        type: String,
        enum: ["LineString"],
        required: true,
        default: "LineString",
      },
      coordinates: {
        type: [[Number]], // Array of [lng, lat]
        required: true,
        default: [],
      },
    },

    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },

    seatAvailable: {
      type: Number,
      default: 4,
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

// ✅ Create 2dsphere indexes for geospatial queries
DriverRideSchema.index({ currentLocationGeo: "2dsphere" });
DriverRideSchema.index({ destinationLocationGeo: "2dsphere" });
DriverRideSchema.index({ routeGeo: "2dsphere" });

export default model<IDriverRide>("Driver", DriverRideSchema);

