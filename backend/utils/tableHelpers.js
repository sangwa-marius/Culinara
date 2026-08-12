const Table = require("../models/Table");
const Order = require("../models/Order");

const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery"];

const enrichTable = async (table) => {
  if (!table) return null;
  const activeCount = await Order.countDocuments({ tableId: table._id, status: { $in: ACTIVE_STATUSES } });
  const remaining = Math.max(0, (table.capacity || 0) - activeCount);
  const isFull = remaining === 0 && activeCount > 0;
  return {
    ...table,
    remainingSeats: remaining,
    activeOrders: activeCount,
    status: isFull ? "occupied" : "available",
  };
};

module.exports = { enrichTable, ACTIVE_STATUSES };
