import { Server, Socket } from "socket.io";

interface LocationData {
  userId: string;
  role: "rider" | "driver";
  lat: number;
  lng: number;
  targetId?: string; // optional: send to specific user
}

export const locationSocket = (io: Server) => {
  const users: Record<string, Socket> = {};

  io.on("connection", (socket: Socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join", (data: { userId: string }) => {
      users[data.userId] = socket;
      socket.data.userId = data.userId;
      console.log("User joined:", data.userId);
    });

    socket.on("updateLocation", (payload: LocationData) => {
      // broadcast to everyone or to specific target
      if (payload.targetId && users[payload.targetId]) {
        users[payload.targetId].emit("locationUpdated", payload);
      } else {
        // broadcast to all other clients
        socket.broadcast.emit("locationUpdated", payload);
      }
    });

    socket.on("disconnect", () => {
      const id = socket.data.userId;
      if (id && users[id]) {
        delete users[id];
      }
      console.log("Socket disconnected:", socket.id);
    });
  });
};
