import User from "../models/UserModel.js";

// Called once per socket connection from server.js
export const registerLocationHandlers = (io, socket) => {
  // Rider emits their location every few seconds from the app
  socket.on("rider:updateLocation", async ({ riderId, lat, lng }) => {
    try {
      await User.findByIdAndUpdate(riderId, {
        currentLocation: { lat, lng },
      });

      // Broadcast to all managers watching the map
      io.emit("rider:locationUpdated", { riderId, lat, lng });
    } catch (err) {
      console.error("Location update error:", err.message);
    }
  });

  // Rider joins their personal room to receive order notifications
  socket.on("rider:joinRoom", ({ riderId }) => {
    socket.join(`rider:${riderId}`);
    console.log(`Rider ${riderId} joined their room`);
  });

  // Manager joins store room to receive order status updates
  socket.on("manager:joinRoom", ({ storeId }) => {
    socket.join(`store:${storeId}`);
    console.log(`Manager joined store room: ${storeId}`);
  });
};
