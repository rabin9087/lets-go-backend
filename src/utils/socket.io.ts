import { Server } from "socket.io";
import http from "http";
import driverRideSchema from "../schema/driver/driverRide.schema";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    const { userId, role } = socket.handshake.auth;
    console.log('this is all the rooms', Array.from(io.sockets.adapter.rooms))
    socket.join(`user_${userId}`);
    socket.data = { userId, role };
    socket.except('room5').emit('asdasdas')

    console.log(`🟢 ${role} connected:`, userId);

    /* DRIVER ONLINE */
    socket.on("driver:online", async ({ driverId }) => {


      await driverRideSchema.findOneAndUpdate(
        { driverId },
        { socketId: socket.id }
      );

      socket.join(`user_${driverId}`);
      console.log("🚗 Driver joined:", `user_${driverId}`);
    });

    socket.on("trip:request", ({ riderId, data }) => {
      socket.join(`user_${riderId}`);
      console.log("Rider joined room:", `user_${riderId}`);
      console.log('this is data', data)

    });

    /* JOIN TRIP ROOM */
    socket.on("trip:join", ({ tripId }, str, callback) => {
      socket.join(`trip_${tripId}`);
      console.log(`Joined trip_${tripId}`);
      console.log('this is string', str)
      socket.to(tripId).emit('driver assigned')
    });

    /* LOCATION UPDATE */
    socket.on("trip:location", ({ tripId, from, coords }) => {
      console.log(`trip_${tripId}`, "Locations:", from, coords,)
      socket.to(`trip_${tripId}`).emit("trip:location:update", {
        from,
        coords,
      });
    });

    socket.on("trip:location:update", ({ tripId, from, coords }) => {

      socket.to(`trip_${tripId}`).emit("trip:location:update", {
        from,
        coords
      });
    });



    socket.on("disconnect", async () => {
      // socket?.auth = { userId, role };
      await driverRideSchema.findOneAndUpdate(
        { socketId: socket.id },
        { socketId: null }
      );
    });
  });

  return io;
};

export const getIO = () => io;
