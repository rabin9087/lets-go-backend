// simple in-memory mapping of rideId -> set of sockets (for demo)

import { updateOnlineDriverSocketId } from "../schema/driver/driverRide.models";
import { io, onlineDrivers } from "../server";

// in production use proper rooms (socket.io rooms below handle this)
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  //driver socket
  socket.on('online-driver', ({ driverId }) => {
    onlineDrivers[driverId] = socket.id
    updateOnlineDriverSocketId({driverId, socketId: onlineDrivers[driverId]})
  });

   // Receive driver location Updates
  socket.on("driver-location", ({ driverId, lat, lng }) => {
    console.log("📍 Driver location update:", driverId, lat, lng);

    // Broadcast to everyone or specific rider
    io.emit(`driver:${driverId}:location`, { lat, lng });
  });
 
  // join a ride room (passenger or driver): { rideId }
  socket.on('joinRide', ({ rideId }) => {
    socket.join(rideId);
    console.log(`${socket.id} joined ride ${rideId}`);
  });


  // driver sends location updates: { rideId, lat, lng, bearing, speed }
  socket.on('driverLocation', (payload) => {
    const { rideId } = payload;
    // broadcast to all passengers in ride room (except sender)
    socket.to(rideId).emit('driverLocation', payload);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});