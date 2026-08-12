import { useState, useEffect } from "react";
import { CheckCircle, ChefHat, Zap, Users, Truck } from "lucide-react";
import { restaurantAPI, orderAPI } from "../../services/api";
import { getSocket, joinRestaurantRoom } from "../../utils/socket";
import toast from "react-hot-toast";
import clsx from "clsx";

function ElapsedTimer({ createdAt }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);
  const m = Math.floor(elapsed / 60), s = elapsed % 60;
  return (
    <span className={clsx("font-mono text-sm font-bold", m >= 20 ? "text-red-500" : "text-stone-600 dark:text-stone-300")}>
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

const COLS = [
  { key: "pending",           label: "New Orders",     dot: "bg-red-500",   border: "border-red-200 dark:border-red-900/40"   },
  { key: "preparing",         label: "In Progress",    dot: "bg-amber-500", border: "border-amber-200 dark:border-amber-900/40" },
  { key: "ready_for_pickup",  label: "Ready to Serve", dot: "bg-green-500", border: "border-green-200 dark:border-green-900/40" },
];

export default function KitchenDisplay() {
  const [orders,  setOrders]  = useState([]);
  const [rid,     setRid]     = useState(null);
  const [queue,   setQueue]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await restaurantAPI.getMyRestaurant();
        if (!data.restaurant) return;
        const r = data.restaurant._id;
        setRid(r);
        joinRestaurantRoom(r);
        await fetchOrders(r);
      } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !rid) return;
    const h = () => fetchOrders(rid);
    socket.on("order_update", h);
    return () => socket.off("order_update", h);
  }, [rid]);

  const fetchOrders = async (r) => {
    try {
      const { data } = await orderAPI.getRestaurantOrders(r);
      const active = (data.orders || []).filter(o =>
        ["pending", "confirmed", "preparing", "ready_for_pickup"].includes(o.status)
      );
      setOrders(active);
      setQueue((data.orders || []).filter(o => o.status === "pending"));
    } catch (err) { console.error("Failed to fetch kitchen orders:", err); toast.error("Failed to load orders"); }
  };

  const advance = async (orderId, nextStatus, isDineIn) => {
    try {
      await orderAPI.updateStatus(orderId, { status: nextStatus });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: nextStatus } : o));
      const msg = nextStatus === "ready_for_pickup"
        ? isDineIn ? "Ready to serve! 🍽️" : "Ready for pickup! 📦"
        : "Order started!";
      toast.success(msg);
    } catch { toast.error("Failed to update"); }
  };

  const markServed = async (orderId) => {
    try {
      await orderAPI.updateStatus(orderId, { status: "delivered" });
      setOrders(prev => prev.filter(o => o._id !== orderId));
      toast.success("Order served! ✅");
    } catch { toast.error("Failed"); }
  };

  const getCol = (key) => {
    if (key === "pending") return orders.filter(o => ["pending", "confirmed"].includes(o.status));
    return orders.filter(o => o.status === key);
  };

  const loadStr   = orders.length < 5 ? "LOW" : orders.length < 10 ? "MEDIUM" : "HIGH";
  const loadColor = { LOW: "text-green-600", MEDIUM: "text-amber-600", HIGH: "text-red-500" }[loadStr];

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-stone-400">Loading kitchen…</div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Sub-header */}
      <div className="bg-white dark:bg-stone-900 border-b border-cream-300 dark:border-stone-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <ChefHat size={17} className="text-primary-500" />
          <span className="font-bold text-stone-900 dark:text-white text-sm">Kitchen Display System</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-cream-200 dark:bg-stone-800 px-3 py-1.5 rounded-lg">
            <Zap size={12} className="text-amber-500" />
            <span className="text-stone-400">AVG PREP</span>
            <span className="font-bold text-stone-900 dark:text-white">14:20 min</span>
          </div>
          <div className="flex items-center gap-2 bg-cream-200 dark:bg-stone-800 px-3 py-1.5 rounded-lg">
            <span className="text-stone-400">LOAD</span>
            <span className={clsx("font-black", loadColor)}>{loadStr}</span>
          </div>
          <span className="font-bold text-stone-400 font-mono">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* KDS columns */}
        <div className="flex-1 grid grid-cols-3 divide-x divide-cream-300 dark:divide-stone-800 overflow-hidden">
          {COLS.map(col => {
            const colOrders = getCol(col.key);
            return (
              <div key={col.key} className="flex flex-col overflow-hidden">
                {/* Column header */}
                <div className="px-4 py-3 border-b border-cream-300 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="font-semibold text-stone-900 dark:text-white text-sm">{col.label}</span>
                  <span className="ml-auto bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold px-2 py-0.5 rounded-full">
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {colOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-stone-300 dark:text-stone-600">
                      <CheckCircle size={26} className="mb-2" />
                      <p className="text-xs font-medium">All clear</p>
                    </div>
                  ) : colOrders.map(order => {
                    const isDineIn = order.orderType === "dine_in";
                    return (
                      <div key={order._id}
                        className={`bg-white dark:bg-stone-900 rounded-xl border-2 ${col.border} p-4 hover:shadow-md transition-all`}>

                        {/* Card header */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-stone-900 dark:text-white text-sm">
                                #{order.orderNumber?.split("-").pop()}
                              </span>
                              {/* Order type badge — prominent */}
                              {isDineIn ? (
                                <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  <Users size={9} />
                                  {order.tableNumber ? `Table ${order.tableNumber}` : "Dine-in"}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  <Truck size={9} /> Delivery
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 mt-0.5">
                              {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <ElapsedTimer createdAt={order.createdAt} />
                        </div>

                        {/* Items */}
                        <div className="space-y-1.5 mb-3">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex items-start gap-2">
                              {col.key === "ready_for_pickup" && (
                                <CheckCircle size={13} className="text-green-500 shrink-0 mt-0.5" />
                              )}
                              <span className="text-xs font-medium text-stone-800 dark:text-stone-200">
                                {item.quantity}× {item.name}
                              </span>
                              {item.customizations?.filter(c => c.selected).map((c, ci) => (
                                <span key={ci} className="text-[10px] text-amber-600 dark:text-amber-400">{c.selected}</span>
                              ))}
                            </div>
                          ))}
                        </div>

                        {order.notes && (
                          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg px-2.5 py-1.5 mb-3">
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">📝 {order.notes}</p>
                          </div>
                        )}

                        {/* Action buttons */}
                        {col.key === "pending" && (
                          <button onClick={() => advance(order._id, "preparing", isDineIn)}
                            className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-lg transition-colors">
                            Start Order
                          </button>
                        )}
                        {col.key === "preparing" && (
                          <button onClick={() => advance(order._id, "ready_for_pickup", isDineIn)}
                            className="w-full py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors">
                            {isDineIn ? "Ready to Serve" : "Ready for Pickup"}
                          </button>
                        )}
                        {col.key === "ready_for_pickup" && (
                          <button onClick={() => markServed(order._id)}
                            className="w-full py-2 bg-stone-800 hover:bg-stone-900 dark:bg-stone-200 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                            <CheckCircle size={12} />
                            {isDineIn ? "Mark Served" : "Mark Delivered"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Queue sidebar */}
        <div className="w-52 shrink-0 border-l border-cream-300 dark:border-stone-800 flex flex-col bg-white dark:bg-stone-900">
          <div className="px-4 py-3 border-b border-cream-300 dark:border-stone-800">
            <p className="font-bold text-stone-900 dark:text-white text-sm">Incoming Queue</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {queue.slice(0, 10).map(o => {
              const isDineIn = o.orderType === "dine_in";
              return (
                <div key={o._id} className="bg-cream-100 dark:bg-stone-800 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {isDineIn
                        ? <Users size={11} className="text-blue-500" />
                        : <Truck size={11} className="text-green-500" />}
                      <span className="font-bold text-stone-900 dark:text-white text-xs">
                        {isDineIn && o.tableNumber ? `T-${o.tableNumber}` : `#${o.orderNumber?.split("-").pop()}`}
                      </span>
                    </div>
                    <span className={clsx(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                      o.status === "pending"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                        : "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                    )}>
                      {o.status === "pending" ? "New" : "Confirmed"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {o.items?.slice(0, 2).map((item, i) => (
                      <span key={i} className="text-[9px] bg-white dark:bg-stone-700 border border-cream-300 dark:border-stone-600 text-stone-500 dark:text-stone-300 px-1.5 py-0.5 rounded font-medium">
                        {item.name?.split(" ").slice(0, 2).join(" ")}
                      </span>
                    ))}
                    {o.items?.length > 2 && <span className="text-[9px] text-stone-400">+{o.items.length - 2}</span>}
                  </div>
                </div>
              );
            })}
            {queue.length === 0 && (
              <p className="text-center text-stone-300 dark:text-stone-600 text-xs py-6">Queue empty</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}