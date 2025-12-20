import mongoose from "mongoose";
import driverRideSchema, { IDriverRide } from "./driverRide.schema"
import { ICoordinates, ILocation } from "../common schema/shareSchema.schema";

// const { lat, lng } = currentLocation;
// const deltaLat = 200 / 111000; 
// const deltaLng = 200 / (111000 * Math.cos(lat * (Math.PI / 180)));

export const createNewDriverRide = (driverRide: IDriverRide) => {
    return new driverRideSchema(driverRide).save()
}

export const getAllDrivers = async ({
  currentLocation,
  destination,
}: {
  currentLocation: ICoordinates;
  destination: ICoordinates;
}) => {
  return await driverRideSchema.find({
    isOnline: true, status: "online"
  });
};


export const getDriversByPickUpAndDropoffLocation = async ({
  pickupLocation,
  dropoffLocation,
 people
}: {
  pickupLocation: ICoordinates;
    dropoffLocation: ICoordinates;
    people: number;

}) => {
  const radiusInMeters = 2000;

  // 1️⃣ Find drivers near pickup location
  const nearbyDrivers = await driverRideSchema.find({
    isOnline: true,
    status: "online",
     seatAvailable: { $gte: people as number },
    currentLocationGeo: {
      $near: {
        $geometry: { type: "Point", coordinates: [pickupLocation.longitude, pickupLocation.latitude] },
        $maxDistance: radiusInMeters,
      },
    },
  });

  // 2️⃣ Filter drivers whose destination is within radius of dropoff
  const filteredDrivers = nearbyDrivers.filter(driver => {
    const [lng, lat] = driver.destinationLocationGeo.coordinates;
    const distance = getDistanceInMeters(lat, lng, dropoffLocation.latitude, dropoffLocation.longitude);
    return distance <= radiusInMeters;
  });

  return filteredDrivers;
};

// Haversine formula
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6378137; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


export const updateOnlineDriverSocketId = ({driverId, socketId}: {driverId: string, socketId: string}) => {
  return driverRideSchema.findOneAndUpdate({driverId, socketId})
}

export const getADriverByRegoPhone = (regoPhone: string) => {
  return driverRideSchema.findOne({$or: [{ "vehicle.rego": regoPhone }, { phone: regoPhone }]})
}

export const getDriversByPickupLocation = async ({
  pickupLocation,
}: {
    pickupLocation: ICoordinates;
}) => {
  return await driverRideSchema.find({
    isOnline: true,
    status: "online",
    currentLocationGeo: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [
            pickupLocation.longitude,
            pickupLocation.latitude,
          ],
        },
        $maxDistance: 2000, // meters
      },
    },

  }).sort({ createdAt: 1 });
};


export const findAndUpdateDriverRideOnlineStatus = async ({
  driverId,
  isOnline,
  status,
  currentLocation,
  destination,
  rego,
  seatAvailable,
  routeGeo,
}: {
  driverId: mongoose.Types.ObjectId;
  isOnline: boolean;
  status: string;
  currentLocation?: ILocation;
  destination?: ILocation;
  rego?: string;
  seatAvailable?: number;
  routeGeo?: ICoordinates[];
}) => {
  const update: any = {
    driverId,
    isOnline,
    status,
    seatAvailable,
    // socketId: driverId.toString()
  };
  if (rego) update.vehicle = { rego };

  if (currentLocation?.coords) {
    update.currentLocation = currentLocation;
    update.currentLocationGeo = {
      type: "Point",
      coordinates: [
        currentLocation.coords.longitude,
        currentLocation.coords.latitude,
      ],
    };
  }

  if (destination?.coords) {
    update.destination = destination;
    update.destinationLocationGeo = {
      type: "Point",
      coordinates: [
        destination.coords.longitude,
        destination.coords.latitude,
      ],
    };
  }

if (routeGeo?.length) {
  update.routeGeo = {
    type: "LineString",
    coordinates: routeGeo.map(p => [
      p.longitude,
      p.latitude,
    ]),
  };
}

  const existing = await driverRideSchema.findOne({ driverId });

  if (!existing) {
    return driverRideSchema.create(update);
  }

  return driverRideSchema.findOneAndUpdate(
    { driverId },
    { $set: update },
    { new: true }
  );
};