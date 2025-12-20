import { Server } from "socket.io";
import http from "http";
import driverRideSchema from "../schema/driver/driverRide.schema";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on("online-driver", async ({ driverId }) => {
      console.log("🚗 Driver online:", driverId);

      await driverRideSchema.findOneAndUpdate(
        { driverId },
        { socketId: socket.id }
      );
    });

    socket.on("disconnect", async () => {
    await driverRideSchema.findOneAndUpdate(
    { socketId: socket.id },
    { socketId: null }
  );
});
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
