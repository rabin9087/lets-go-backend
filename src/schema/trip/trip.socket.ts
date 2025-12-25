import { getIO } from "../../utils/socket.io";
import tripSchema from "./trip.schema";


export const registerTripEvents = (socket: any) => {
  const io = getIO();
  const { userId } = socket.handshake.auth;

  socket.on("trip:accept", async ({ _id }: {_id: string}) => {
    const trip = await tripSchema.findById(_id);

    if (!trip || trip.status !== "pending") return;

    // update trip
    trip.status = "accepted";
    trip.driverId = userId;
    await trip.save();

    // 🔥 JOIN TRIP ROOM
    socket.join(`trip:${_id}`);

    const riderId = trip.riderId.toString();
    const driverId = userId;

    // notify rider
    io.to(riderId).emit("trip:accepted", {
      _id,
      driverId,
    });

    // notify driver
    io.to(driverId).emit("trip:confirmed", {
      _id,
      riderId,
    });
  });
    
    socket.on("trip:join", ({ tripId }: {tripId: string}) => {
  socket.join(`trip:${tripId}`);
  console.log("Joined trip room", tripId);
});
};
