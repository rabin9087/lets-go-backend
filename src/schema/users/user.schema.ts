import mongoose, { Document } from "mongoose";
import { ICoordinates } from "../common schema/shareSchema.schema";

export interface IUser extends Document {
  name: string;
  email?: string;
  phone: string;
  password?: string;
  role: "rider" | "driver" | "admin" | "superadmin";
  profileImage?: string;
  status?: "active" | "suspended";
  refreshJWT?: string;
  riderProfile?: {
    rating?: number;
    totalTrips?: number;
    savedLocations?: { label: string; coordinates: ICoordinates }[];
  };
  driverProfile?: {
    isOnline?: boolean;
    isApproved?: boolean;
    rating?: number;
    totalTrips?: number;
    vehicle?: any;
    coordinate?: ICoordinates;
    bankDetails?: any;
    identityDocs?: any;
  };
  savedLocations?: { label: string; coordinates: ICoordinates }[];
  currentTrip: mongoose.Types.ObjectId | null;
  trips: mongoose.Types.ObjectId[];
  pushToken: string
}

const UserSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true, indexes: 1 },
  phone: { type: String, required: true, unique: true, indexes: 1 },
  password: { type: String },
  role: { type: String, enum: ["rider", "driver", "admin"], required: true },
  profileImage: String,
  status: { type: String, default: "active" },
  refreshJWT: {type: String, default: ""},
  riderProfile: {
    rating: { type: Number, default: 5 },
    totalTrips: { type: Number, default: 0 },
    savedLocations: [{ label: String, coordinates: {latitude: Number, longitude: Number}, address: String }],
  },
  driverProfile: {
    isOnline: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    rating: { type: Number, default: 5 },
    totalTrips: { type: Number, default: 0 },
    vehicle: {
      model: { type: String },
      year: { type: Number },
      color: { type: String },
      rego: { type: String },
      photos: {
            type: [String], default: [] 
        
      },
  },
    coordinate:  {latitude: Number, longitude: Number},
    identityDocs: { licenseFront: String, licenseBack: String, insurance: String },
    bankDetails: { bankName: String, accountNumber: String, holderName: String },
  },
  currentTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trip",
    default: null,
  },
  savedLocations: [
    {
      label: { type: String, },
      coordinates: {
        latitude: { type: Number,  },
        longitude: { type: Number, },
      },
      address: { type: String, },
    },
  ],

  trips: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Trip",
      }
  ],
  pushToken: {type: String, index: true}
}, { timestamps: true });

export default mongoose.model<IUser>("User", UserSchema);
