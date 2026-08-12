import { io } from "socket.io-client";
let socket = null;
export const initSocket = (userId) => {
  if (socket?.connected) { socket.emit("join_user_room", userId); return socket; }
  socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
  socket.on("connect", () => { if (userId) socket.emit("join_user_room", userId); });
  return socket;
};
export const getSocket = () => socket;
export const disconnectSocket = () => { if (socket) { socket.disconnect(); socket = null; } };
export const joinRestaurantRoom = (restaurantId) => { socket?.emit("join_restaurant_room", restaurantId); };
