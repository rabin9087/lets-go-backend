import mongoose from "mongoose";
import driverRideSchema, { ICoordinates, IDriverRide } from "./driverRide.schema"

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


export const getDriversByLocation = async ({
  currentLocation,
  destination,
  // polyline,
}: {
  currentLocation: ICoordinates;
  destination: ICoordinates;
  // polyline: ICoordinates[];
  }) => {
  console.log(destination)
    const { latitude, longitude } = currentLocation;
    const distance = 500 // distance in meter
    const deltaLat = distance / 111000; 
  const deltaLng = distance / (111000 * Math.cos(latitude * (Math.PI / 180)));
  
  return await driverRideSchema.find({
  isOnline: true,
  "currentLocation.latitude": { $gte: latitude - deltaLat, $lte: latitude + deltaLat },
  "destination.longitude": { $gte: longitude - deltaLng, $lte: longitude + deltaLng },
})
    .sort({ "driverProfile.rating": -1 }); // Highest-rated drivers first
  
};

export const updateOnlineDriverSocketId = ({driverId, socketId}: {driverId: string, socketId: string}) => {
  return driverRideSchema.findOneAndUpdate({driverId, socketId})
}

export const getADriverByRegoPhone = (regoPhone: string) => {
  return driverRideSchema.findOne({$or: [{ "vehicle.rego": regoPhone }, { phone: regoPhone }]})
}

export const findAndUpdateDriverRideOnlineStatus = ({
  driverId,
  isOnline,
  status,
  currentLocation,
  destination,
  rego,
  seatAvailable
}: {
  driverId: mongoose.Types.ObjectId;
  isOnline: boolean;
  status: string;
  currentLocation?: any;
  destination?: any;
    rego?: string;
    seatAvailable: Number;
}) => {
  return driverRideSchema.findOneAndUpdate(
    { driverId },                // find by driverId
    {
      isOnline, status, currentLocation, destination, vehicle: rego ? { rego } : undefined, seatAvailable },        // update fields
    { new: true, upsert: true }  // create if not exists
  );
};

