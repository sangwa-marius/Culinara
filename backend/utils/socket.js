let io;

const initSocket = (server) => {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      // Allow the Vite dev server AND any production origin.
      // When the frontend proxies /socket.io through Vite, the origin seen by the
      // backend is the Vite dev server URL (e.g. http://localhost:5173).
      origin: (origin, cb) => cb(null, true),   // accept all origins
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Allow both transports so polling fallback works behind the proxy
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on("join_user_room", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`✅ User ${userId} joined room user_${userId}`);
    });

    socket.on("leave_user_room", (userId) => {
      socket.leave(`user_${userId}`);
      console.log(`🚪 User ${userId} left room user_${userId}`);
    });

    socket.on("join_restaurant_room", (restaurantId) => {
      socket.join(`restaurant_${restaurantId}`);
      console.log(`🏪 Joined restaurant room: ${restaurantId}`);
    });

    socket.on("join_order_room", (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`📦 Joined order room: ${orderId}`);
    });

    socket.on("driver_location_update", ({ orderId, location }) => {
      io.to(`order_${orderId}`).emit("location_updated", { location });
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

const emitOrderUpdate = (order, message) => {
  if (!io) return;

  const payload = {
    orderId:     order._id.toString(),
    orderNumber: order.orderNumber,
    status:      order.status,
    message,
    timestamp:   new Date(),
  };

  io.to(`user_${order.customer}`).emit("order_status_updated", payload);
  io.to(`order_${order._id}`).emit("order_status_updated", payload);
  io.to(`restaurant_${order.restaurant}`).emit("order_status_updated", payload);
  io.to(`restaurant_${order.restaurant}`).emit("order_update", payload);

  if (order.driver) {
    io.to(`user_${order.driver}`).emit("order_status_updated", payload);
  }
};

const emitNotification = (userId, notification) => {
  if (!io) return;
  const room = `user_${userId}`;
  const sockets = io.sockets.adapter.rooms.get(room);
  console.log(`📨 Emitting to ${room} — ${sockets?.size ?? 0} socket(s) in room`);
  io.to(room).emit("new_notification", notification);
};

const emitTableUpdate = (table) => {
  if (!io || !table) return;
  try {
    io.to(`restaurant_${table.restaurant}`).emit("table_update", table);
  } catch {}
};

const emitTableRemoved = (restaurantId, tableId) => {
  if (!io) return;
  try {
    io.to(`restaurant_${restaurantId}`).emit("table_removed", tableId);
  } catch {}
};

const emitNewOrder = (order) => {
  if (!io || !order) return;
  try {
    io.to(`restaurant_${order.restaurant}`).emit("new_order", order);
  } catch {}
};

module.exports = { initSocket, getIO, emitOrderUpdate, emitNotification, emitTableUpdate, emitTableRemoved, emitNewOrder };
