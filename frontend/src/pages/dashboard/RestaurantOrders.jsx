import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Users, Truck, Eye, Wifi, WifiOff } from "lucide-react";
import { orderAPI, restaurantAPI, driverAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { joinRestaurantRoom, getSocket } from "../../utils/socket";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import { OrderRowSkeleton, Skeleton } from "../../components/Skeleton";
import SafeAvatar from "../../components/SafeImage";
import toast from "react-hot-toast";
import { format } from "date-fns";
import clsx from "clsx";

const DELIVERY_NEXT = {
  pending: "confirmed", confirmed: "preparing",
  preparing: "ready_for_pickup", ready_for_pickup: "out_for_delivery",
  out_for_delivery: "delivered",
};
const DINE_IN_NEXT = {
  pending: "confirmed", confirmed: "preparing",
  preparing: "ready_for_pickup", ready_for_pickup: "delivered",
};
const getNextStatus = (order) => order.orderType === "dine_in" ? DINE_IN_NEXT[order.status] : DELIVERY_NEXT[order.status];
const getNextLabel = (order) => {
  const next = getNextStatus(order);
  if (!next) return null;
  if (next === "delivered" && order.orderType === "dine_in") return "Mark Served";
  return next.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};
const TABS = ["all","pending","confirmed","preparing","ready_for_pickup","out_for_delivery","delivered","cancelled"];

export default function RestaurantOrders() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("all");
  const [notifyId,   setNotifyId]   = useState(null);
  const [drivers,    setDrivers]    = useState([]);
  const [selDriver,  setSelDriver]  = useState(null);
  const [notifyLoad, setNotifyLoad] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [permRequested, setPermRequested] = useState(false);

  const requestNotificationPermission = useCallback(async () => {
    if (permRequested) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") return;
    try {
      const perm = await Notification.requestPermission();
      setPermRequested(true);
      if (perm === "granted") {
        toast.success("Notifications enabled! You'll receive alerts for new orders.", { duration: 3000 });
      }
    } catch {}
  }, [permRequested]);

  const sendBrowserNotification = useCallback((order) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      const n = new Notification(`New Order #${order.orderNumber}`, {
        body: `${order.customer?.name || "Customer"} · ${order.items?.length || 0} items · $${order.total?.toFixed(2)}`,
        icon: "/favicon.ico",
        tag: `order-${order._id}`,
        renotify: true,
        requireInteraction: true,
      });
      n.onclick = () => { window.focus(); setSelectedOrder(order); n.close(); };
      setTimeout(() => n.close(), 15000);
    } catch (err) { console.error("Browser notification failed:", err); }
  }, []);

  const playNewOrderSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (err) { console.error("Sound play failed:", err); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await restaurantAPI.getMyRestaurant();
        if (!data.restaurant?._id) { navigate("/dashboard/setup"); return; }
        const rid = data.restaurant._id;
        joinRestaurantRoom(rid);
        const socket = getSocket();
        if (socket) {
          socket.on("order_update", () => fetchOrders(rid));
          socket.on("new_order", (order) => {
            try {
              if (!order) return;
              playNewOrderSound();
              sendBrowserNotification(order);
              toast.success(`New order #${order.orderNumber} received!`, { duration: 5000 });
            } catch (err) { console.error("new_order handler error:", err); }
          });
          socket.on("order_status_updated", (payload) => {
            try {
              if (payload && payload.status === "pending") {
                playNewOrderSound();
                toast.success(`New order #${payload.orderNumber} received!`, { duration: 5000 });
              }
            } catch (err) { console.error("order_status_updated handler error:", err); }
          });
        }
        await fetchOrders(rid);
        requestNotificationPermission();
      } finally { setLoading(false); }
    })();
  }, []);

  const fetchOrders = async (rid) => {
    try {
      const { data } = await orderAPI.getRestaurantOrders(rid);
      setOrders(data.orders || []);
    } catch (err) { console.error("Failed to fetch orders:", err); }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      setSelectedOrder(prev => prev && prev._id === orderId ? { ...prev, status } : prev);
      const label = status === "delivered" ? "Served / Delivered" : status.replace(/_/g, " ");
      toast.success(`Order marked as ${label}`);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const openNotify = async (orderId) => {
    setNotifyId(orderId); setNotifyLoad(true);
    try {
      const { data } = await driverAPI.listDrivers();
      setDrivers(data.drivers || []);
    } catch { toast.error("Failed to load drivers"); }
    finally { setNotifyLoad(false); }
  };

  const notifyDriver = async () => {
    if (!selDriver || !notifyId) return;
    try {
      await driverAPI.notifyDriver(notifyId, selDriver);
      toast.success("Driver notified!");
      setNotifyId(null); setSelDriver(null);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const openDetail = (order) => {
    setSelectedOrder(order);
  };

  const filtered = activeTab === "all" ? orders : orders.filter(o => o.status === activeTab);

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-cream-300 dark:border-stone-800 flex gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-lg" />
          ))}
        </div>
        <div className="divide-y divide-cream-200 dark:divide-stone-800">
          {Array.from({ length: 6 }).map((_, i) => <OrderRowSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">Orders</h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-0.5">Manage and track all your restaurant orders</p>
        </div>
        <div className="text-xs sm:text-sm text-stone-500">{orders.length} total</div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-cream-300 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => {
            const count = tab === "all" ? orders.length : orders.filter(o => o.status === tab).length;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={clsx("px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all",
                  activeTab === tab ? "bg-primary-500 text-white" : "text-stone-500 hover:text-stone-800 dark:hover:bg-stone-900 dark:hover:text-stone-300")}>
                {tab === "all" ? `All (${orders.length})` : tab.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                {tab !== "all" && count > 0 && ` (${count})`}
              </button>
            );
          })}
        </div>

        <div className="divide-y divide-cream-200 dark:divide-stone-800">
          {filtered.length === 0 ? (
            <p className="py-8 sm:py-10 text-center text-stone-400 text-xs sm:text-sm">No orders in this category</p>
          ) : filtered.map(order => {
            const isDineIn = order.orderType === "dine_in";
            const next     = getNextStatus(order);
            const nextLabel= getNextLabel(order);

            return (
              <div key={order._id} className="px-4 sm:px-5 py-3 sm:py-4 hover:bg-cream-50 dark:hover:bg-stone-800/40 transition-colors">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                      <span className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm">#{order.orderNumber}</span>
                      <OrderStatusBadge status={order.status} />
                      <span className={clsx("badge text-[9px] sm:text-[10px]",
                        isDineIn
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                          : "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400")}>
                        {isDineIn ? <><Users size={8} className="inline mr-0.5"/>Dine-in</> : <><Truck size={8} className="inline mr-0.5"/>Delivery</>}
                      </span>
                      {isDineIn && order.tableNumber && (
                        <span className="badge bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 text-[9px] sm:text-[10px]">
                          Table {order.tableNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-stone-400">
                      {order.customer?.name}
                      {order.createdAt && ` · ${format(new Date(order.createdAt), "MMM d, HH:mm")}`}
                    </p>
                    <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5">
                      {order.items?.slice(0, 2).map(i => `${i.name} ×${i.quantity}`).join(", ")}
                      {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm">${order.total?.toFixed(2)}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 justify-end flex-wrap">
                      <button onClick={() => openDetail(order)}
                        className="text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors flex items-center gap-1">
                        <Eye size={10} className="sm:hidden" /><Eye size={11} className="hidden sm:block" /> View
                      </button>
                      {next && nextLabel && (
                        <button onClick={() => updateStatus(order._id, next)}
                          className={clsx("text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg font-semibold transition-colors",
                            next === "delivered"
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : "bg-primary-500 hover:bg-primary-600 text-white")}>
                          {nextLabel}
                        </button>
                      )}
                      {!isDineIn && order.status === "ready_for_pickup" && (
                        <button onClick={() => openNotify(order._id)}
                          className="text-[10px] sm:text-xs btn-secondary py-1.5 px-2 sm:px-3">
                          Notify
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-2xl shadow-2xl animate-slide-up mx-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-300 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-stone-900 dark:text-white">Order #{selectedOrder.orderNumber}</h3>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                <X size={17} />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-cream-100 dark:bg-stone-800 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1">Customer</p>
                    <p className="text-sm font-semibold text-stone-900 dark:text-white">{selectedOrder.customer?.name}</p>
                    <p className="text-xs text-stone-400">{selectedOrder.customer?.email}</p>
                  </div>
                  <div className="bg-cream-100 dark:bg-stone-800 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1">Order Type</p>
                    <p className="text-sm font-semibold text-stone-900 dark:text-white capitalize">{selectedOrder.orderType?.replace(/_/g, " ")}</p>
                    {selectedOrder.tableNumber && <p className="text-xs text-stone-400">Table {selectedOrder.tableNumber}</p>}
                  </div>
                </div>

                {selectedOrder.deliveryAddress && (
                  <div className="bg-cream-100 dark:bg-stone-800 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1">Delivery Address</p>
                    <p className="text-sm text-stone-900 dark:text-white">
                      {typeof selectedOrder.deliveryAddress === "string"
                        ? selectedOrder.deliveryAddress
                        : [selectedOrder.deliveryAddress.street, selectedOrder.deliveryAddress.city, selectedOrder.deliveryAddress.state, selectedOrder.deliveryAddress.zipCode].filter(Boolean).join(", ") || "No address provided"}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-2">Items</p>
                  <div className="space-y-2">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-cream-100 dark:bg-stone-800 rounded-xl px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">{item.name}</p>
                          <p className="text-xs text-stone-400">Qty: {item.quantity} · ${(item.price * item.quantity).toFixed(2)}</p>
                          {(item.customizations || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.customizations.map((c, ci) => (
                                <span key={ci} className="text-[10px] bg-cream-200 dark:bg-stone-700 text-stone-500 px-1.5 py-0.5 rounded-full">
                                  +{c.name} {c.price > 0 ? `($${c.price})` : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-bold text-stone-900 dark:text-white ml-3">
                          ${((item.price + (item.customizations || []).reduce((s, c) => s + (c.price || 0), 0)) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-cream-300 dark:border-stone-700 pt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Subtotal</span><span className="font-semibold">${selectedOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Delivery Fee</span><span className="font-semibold">${selectedOrder.deliveryFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Tax</span><span className="font-semibold">${selectedOrder.tax?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-900 dark:text-white pt-1.5">
                    <span>Total</span><span>${selectedOrder.total?.toFixed(2)}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm text-amber-800 dark:text-amber-300">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-cream-300 dark:border-stone-800 shrink-0">
              <button onClick={() => setSelectedOrder(null)} className="btn-secondary flex-1">Close</button>
              {getNextStatus(selectedOrder) && getNextLabel(selectedOrder) && (
                <button onClick={() => updateStatus(selectedOrder._id, getNextStatus(selectedOrder))}
                  className={clsx("flex-1 py-3 rounded-xl font-semibold transition-colors",
                    getNextStatus(selectedOrder) === "delivered"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-primary-500 hover:bg-primary-600 text-white")}>
                  {getNextLabel(selectedOrder)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {notifyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setNotifyId(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-2xl shadow-2xl p-6 animate-slide-up mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 dark:text-white">Assign Driver</h3>
              <button onClick={() => setNotifyId(null)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                <X size={17} />
              </button>
            </div>
             {notifyLoad ? <div className="py-8"><Skeleton className="h-8 w-8 rounded-full mx-auto" /></div> : drivers.length === 0 ? (
               <p className="text-stone-400 text-center py-6 text-sm">No available drivers</p>
             ) : (
               <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                 {drivers.map(d => {
                   const isOnline = !!d.isOnline;
                   return (
                   <label key={d._id}
                     className={clsx("flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                       selDriver === d._id ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20" : "border-cream-300 dark:border-stone-700",
                       !isOnline && "opacity-60")}>
                     <input type="radio" name="driver" value={d._id} checked={selDriver === d._id}
                       onChange={() => isOnline && setSelDriver(d._id)} disabled={!isOnline} className="accent-primary-500" />
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                        <SafeAvatar src={d.avatar} name={d.name} size="w-8 h-8" textSize="text-xs" />
                      </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">{d.name}</p>
                         {isOnline
                           ? <span className="shrink-0 w-2 h-2 rounded-full bg-green-500" title="Online" />
                           : <span className="shrink-0 w-2 h-2 rounded-full bg-stone-400" title="Offline" />}
                       </div>
                       <p className="text-xs text-stone-400">{d.phone || "No phone"}</p>
                       {!isOnline && <p className="text-[10px] text-red-500 font-medium">Offline — cannot notify</p>}
                     </div>
                   </label>
                   );
                 })}
               </div>
             )}
             <div className="flex gap-3">
               <button onClick={() => setNotifyId(null)} className="btn-secondary flex-1">Cancel</button>
               <button onClick={notifyDriver} disabled={!selDriver} className="btn-primary flex-1">Notify Driver</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
