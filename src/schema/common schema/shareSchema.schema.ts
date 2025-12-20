import { Schema } from "mongoose";


export interface ICoordinates {
  latitude: number;
  longitude: number;
}

export interface IGeoPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ILocation {
  address: string;
  coords: ICoordinates
}

// simple lat/lng
export const CoordsSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

// address + coords
export const CoordinatesSchema = new Schema(
  {
    address: { type: String },
    coords: { type: CoordsSchema, required: true },
  },
  { _id: false }
);

export const GeoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  { _id: false }
);