import { Server } from "socket.io";
import http from "http";
import driverRideSchema from "../schema/driver/driverRide.schema";
import tripSchema from "../schema/trip/trip.schema";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    const { userId, role } = socket.handshake.auth;

    if (!userId || !role) {
      console.log("❌ Missing auth data, disconnecting");
      socket.disconnect();
      return;
    }

    // ✅ Join personal room
    socket.join(`user_${userId}`);

    // Store user info on socket
    socket.data.userId = userId;
    socket.data.role = role;


    /* DRIVER ONLINE */
    socket.on("driver:online", async ({ driverId }) => {
      socket.join(`user_${driverId}`);
      console.log("🚗 Driver joined:", `user_${driverId}`);
    });

    socket.on('rider:request', ({ riderId }) => {
      socket.join(`user_${riderId}`);
      console.log("🚗 Rider joined:", `user_${riderId}`);
    })

      //JOIN TRIP ROOM
    //  ========================= * /
    socket.on("trip:join", async ({ tripId }) => {
      if (!tripId) return;

      const trip = await tripSchema.findById(tripId);
      if (!trip) return;

      // ✅ Security check
      if (
        trip.driverId?.toString() !== userId &&
        trip.riderId?.toString() !== userId
      ) {
        console.log("❌ Unauthorized trip join attempt");
        return;
      }

      socket.join(`trip_${tripId}`);
      console.log(`🧩 ${role} joined trip_${tripId}`);
    });

    /* =========================
       LOCATION UPDATE
    ========================= */
    socket.on("trip:location", ({ tripId, from, coords }) => {
      if (!tripId || !coords) return;

      socket.to(`trip_${tripId}`).emit("trip:location:update", {
        from,
        coords,
      });
    });

    /* =========================
        DISCONNECT
     ========================= */

    socket.on("disconnect", async () => {
      console.log(`🔴 ${role} disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIO = () => io;
