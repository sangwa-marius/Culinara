import { useState, useEffect } from "react";
import { MapPin, Phone, Package, CheckCircle, Trash2, X,
         Navigation, Star, TrendingUp, DollarSign, Clock,
         Bike, AlertCircle } from "lucide-react";
import { driverAPI, orderAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../utils/socket";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import { StatCardSkeleton, CardSkeleton, OrderRowSkeleton, Skeleton } from "../../components/Skeleton";
import toast from "react-hot-toast";
import { format } from "date-fns";
import clsx from "clsx";

export default function DriverDashboard() {
  const { user }   = useAuth();
  const [tab,          setTab]        = useState("available");
  const [available,    setAvailable]  = useState([]);
  const [deliveries,   setDeliveries] = useState([]);
  const [history,      setHistory]    = useState([]);
  const [loading,      setLoading]    = useState(true);
  const [isOnline,     setIsOnline]   = useState(true);
  const [stats,        setStats]      = useState({ deliveries: 0, earnings: 0, rating: 0 });
  // delivery request popup — holds the full order object
  const [requestOrder, setRequestOrder] = useState(null);
  const [requestLoading,setRequestLoading] = useState(false);
  // delete history confirm
  const [deletingId,   setDeletingId]  = useState(null);
  const [deleteLoad,   setDeleteLoad]  = useState(false);
  const [expanded,     setExpanded]    = useState(null);

  useEffect(() => {
    fetchAll();

    const tryRegister = () => {
      const socket = getSocket();
      if (!socket) return false;

      socket.on("order_status_updated", fetchAll);

      socket.on("new_notification", async (n) => {
        if (n.type !== "delivery_request" || !n.orderId) return;

        // Show a loading state while fetching order details
        setRequestLoading(true);
        setRequestOrder({ _id: n.orderId, _loading: true });

        try {
          const { data } = await orderAPI.getOne(n.orderId);
          if (data.order) {
            setRequestOrder(data.order);
          }
        } catch {
          toast.error("Couldn't load order details");
          setRequestOrder(null);
        } finally {
          setRequestLoading(false);
        }

        // Also refresh the available list
        fetchAll();
        toast("📦 New delivery request!", { duration: 6000 });
      });

      return true;
    };

    if (!tryRegister()) {
      const id = setInterval(() => { if (tryRegister()) clearInterval(id); }, 500);
      return () => clearInterval(id);
    }
  }, []);

  const fetchAll = async () => {
    try {
      const [avail, myDel, hist, st] = await Promise.all([
        driverAPI.getAvailable().catch(() => ({ data: { orders: [] } })),
        driverAPI.getMyDeliveries().catch(() => ({ data: { orders: [] } })),
        driverAPI.getHistory().catch(() => ({ data: { orders: [] } })),
        driverAPI.getStats().catch(() => ({ data: { stats: { deliveries: 0, earnings: 0, rating: 0 } } })),
      ]);
      setAvailable(avail.data.orders || []);
      setDeliveries(myDel.data.orders || []);
      setHistory(hist.data.orders || []);
      setStats(st.data.stats || { deliveries: 0, earnings: 0, rating: 0 });
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  const accept = async (orderId) => {
    try {
      await driverAPI.acceptDelivery(orderId);
      toast.success("Order accepted! Head to the restaurant. 🚗");
      setRequestOrder(null);
      fetchAll();
      setTab("active");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to accept order"); }
  };

  const deliver = async (orderId) => {
    try {
      await driverAPI.markDelivered(orderId);
      toast.success("Order delivered! Great job 🎉");
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to mark delivered"); }
  };

  const hideOrder = async () => {
    if (!deletingId) return;
    setDeleteLoad(true);
    try {
      await driverAPI.hideHistory(deletingId);
      setHistory(p => p.filter(o => o._id !== deletingId));
      toast.success("Removed from history");
      setDeletingId(null);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to remove"); }
    finally { setDeleteLoad(false); }
  };

  const TABS = [
    { key: "available",  label: "Available",     count: available.length },
    { key: "active",     label: "My Deliveries", count: deliveries.length },
    { key: "history",    label: "History",       count: history.length },
  ];

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-cream-300 dark:border-stone-800 flex gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-lg" />)}
        </div>
        <div className="divide-y divide-cream-200 dark:divide-stone-800">
          {Array.from({ length: 4 }).map((_, i) => <OrderRowSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">

      {/* Offline banner */}
      {!isOnline && (
        <div className="card border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">You are offline</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Go online to receive delivery requests</p>
            </div>
          </div>
          <button onClick={() => setIsOnline(true)} className="btn-primary text-xs py-2 px-4">Go Online</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Deliveries",   value: stats.deliveries,                    icon: Bike },
          { label: "Earnings",     value: `$${(stats.earnings || 0).toFixed(2)}`, icon: DollarSign },
          { label: "Rating",       value: stats.rating ? `${stats.rating} ★` : "N/A", icon: Star },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="w-9 h-9 bg-cream-200 dark:bg-stone-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <s.icon size={17} className="text-stone-500 dark:text-stone-400" />
            </div>
            <p className="font-bold text-stone-900 dark:text-white text-xl">{s.value}</p>
            <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="border-b border-cream-300 dark:border-stone-800 flex">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={clsx("flex-1 px-4 py-3 text-sm font-semibold transition-all border-b-2",
                tab === t.key
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-stone-400 hover:text-stone-700 dark:hover:text-stone-200")}>
              {t.label}
              {t.count > 0 && (
                <span className={clsx("ml-2 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold",
                  tab === t.key ? "bg-primary-500 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-500")}>
                  {t.count > 9 ? "9+" : t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="divide-y divide-cream-200 dark:divide-stone-800">
          {tab === "available" && (
            available.length === 0
              ? <EmptyState icon={Package} msg={isOnline ? "No orders available right now" : "Go online to receive requests"} />
              : available.map(order => (
                <OrderCard key={order._id} order={order} expanded={expanded === order._id}
                  onExpand={() => setExpanded(expanded === order._id ? null : order._id)}
                  action={
                    <button onClick={() => accept(order._id)}
                      className="btn-primary text-xs py-1.5 px-4 gap-1.5 whitespace-nowrap">
                      <CheckCircle size={13} /> Accept
                    </button>
                  } />
              ))
          )}

          {tab === "active" && (
            deliveries.length === 0
              ? <EmptyState icon={Bike} msg="No active deliveries right now" />
              : deliveries.map(order => (
                <OrderCard key={order._id} order={order} expanded={expanded === order._id}
                  onExpand={() => setExpanded(expanded === order._id ? null : order._id)}
                  action={
                    order.status === "out_for_delivery"
                      ? <button onClick={() => deliver(order._id)}
                          className="btn-primary text-xs py-1.5 px-4 gap-1.5 whitespace-nowrap">
                          <CheckCircle size={13} /> Delivered
                        </button>
                      : <span className="text-xs text-stone-400 italic">Awaiting restaurant</span>
                  } />
              ))
          )}

          {tab === "history" && (
            history.length === 0
              ? <EmptyState icon={Clock} msg="No delivery history yet" />
              : history.map(order => (
                <OrderCard key={order._id} order={order} expanded={expanded === order._id}
                  onExpand={() => setExpanded(expanded === order._id ? null : order._id)}
                  action={
                    <button onClick={() => setDeletingId(order._id)}
                      className="p-2 text-stone-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all">
                      <Trash2 size={15} />
                    </button>
                  } />
              ))
          )}
        </div>
      </div>

      {/* ── Delivery Request Popup ── */}
      {requestOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRequestOrder(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-2xl shadow-2xl animate-slide-up overflow-hidden mx-4">

            {/* Header */}
            <div className="bg-primary-500 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-white">
                <Package size={18} />
                <span className="font-bold">New Delivery Request</span>
              </div>
              <button onClick={() => setRequestOrder(null)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {requestOrder._loading ? (
              <div className="p-10 flex flex-col items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Order number + value */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-stone-900 dark:text-white">#{requestOrder.orderNumber}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{requestOrder.items?.length || 0} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-2xl text-primary-500">${requestOrder.total?.toFixed(2)}</p>
                    <p className="text-xs text-stone-400">Order total</p>
                  </div>
                </div>

                {/* Route */}
                <div className="bg-cream-100 dark:bg-stone-800 rounded-xl p-4 space-y-3">
                  {/* Pick up */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                      <div className="w-px flex-1 bg-cream-400 dark:bg-stone-600 min-h-[20px]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Pick Up</p>
                        <p className="font-semibold text-stone-900 dark:text-white text-sm">{requestOrder.restaurant?.name || "Restaurant"}</p>
                        {requestOrder.restaurant?.address && (
                          <p className="text-xs text-stone-500">{requestOrder.restaurant.address.street}, {requestOrder.restaurant.address.city}</p>
                        )}
                        {requestOrder.restaurant?.phone && (
                          <a href={`tel:${requestOrder.restaurant.phone}`}
                            className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 mt-0.5">
                            <Phone size={10} />{requestOrder.restaurant.phone}
                          </a>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Drop Off</p>
                        {requestOrder.deliveryAddress ? (
                          <p className="font-semibold text-stone-900 dark:text-white text-sm">
                            {[requestOrder.deliveryAddress.street, requestOrder.deliveryAddress.city].filter(Boolean).join(", ")}
                          </p>
                        ) : (
                          <p className="text-sm text-stone-400 italic">Address on file</p>
                        )}
                        {requestOrder.customer?.phone && (
                          <a href={`tel:${requestOrder.customer.phone}`}
                            className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 mt-0.5">
                            <Phone size={10} />{requestOrder.customer.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items summary */}
                {requestOrder.items?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Items</p>
                    <div className="space-y-1">
                      {requestOrder.items.slice(0, 4).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-stone-600 dark:text-stone-300">{item.quantity}× {item.name}</span>
                          <span className="text-stone-400">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {requestOrder.items.length > 4 && (
                        <p className="text-xs text-stone-400 italic">+{requestOrder.items.length - 4} more items</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setRequestOrder(null)} className="btn-secondary flex-1 py-2.5">
                    Decline
                  </button>
                  <button onClick={() => accept(requestOrder._id)} className="btn-primary flex-1 py-2.5 gap-2">
                    <CheckCircle size={15} /> Accept Delivery
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingId}
        title="Remove from history?"
        message="This only hides it from your view. No data is permanently deleted."
        confirmLabel="Remove"
        variant="warning"
        loading={deleteLoad}
        onConfirm={hideOrder}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, msg }) {
  return (
    <div className="py-16 text-center">
      <div className="w-12 h-12 bg-cream-200 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon size={22} className="text-stone-400" />
      </div>
      <p className="text-stone-400 text-sm">{msg}</p>
    </div>
  );
}

function OrderCard({ order, expanded, onExpand, action }) {
  return (
    <div className="px-5 py-4 hover:bg-cream-50 dark:hover:bg-stone-800/40 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <button onClick={onExpand} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-stone-900 dark:text-white text-sm">#{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-stone-400">{order.restaurant?.name}</p>
          {order.createdAt && (
            <p className="text-xs text-stone-400">{format(new Date(order.createdAt), "MMM d, HH:mm")}</p>
          )}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <p className="font-bold text-stone-900 dark:text-white text-sm">${order.total?.toFixed(2)}</p>
          {action}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-cream-200 dark:border-stone-800 space-y-3 animate-fade-in">
          {/* Route */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
              <div className="w-px flex-1 bg-cream-300 dark:bg-stone-700 min-h-[24px]" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Pick Up</p>
                <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">{order.restaurant?.name}</p>
                {order.restaurant?.address && (
                  <p className="text-xs text-stone-400">{order.restaurant.address.street}, {order.restaurant.address.city}</p>
                )}
                {order.restaurant?.phone && (
                  <a href={`tel:${order.restaurant.phone}`}
                    className="text-xs text-primary-500 flex items-center gap-1 mt-0.5 hover:text-primary-600">
                    <Phone size={10} />{order.restaurant.phone}
                  </a>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Drop Off</p>
                {order.deliveryAddress ? (
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    {[order.deliveryAddress.street, order.deliveryAddress.city].filter(Boolean).join(", ")}
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 italic">No address on file</p>
                )}
                {order.customer?.phone && (
                  <a href={`tel:${order.customer.phone}`}
                    className="text-xs text-primary-500 flex items-center gap-1 mt-0.5 hover:text-primary-600">
                    <Phone size={10} />{order.customer.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-cream-100 dark:bg-stone-800 rounded-xl p-3 space-y-1.5">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-stone-600 dark:text-stone-300">{item.quantity}× {item.name}</span>
                <span className="text-stone-500">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-cream-300 dark:border-stone-700 flex justify-between text-xs font-bold">
              <span className="text-stone-700 dark:text-stone-200">Total</span>
              <span className="text-green-600 dark:text-green-400">${order.total?.toFixed(2)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3 flex gap-2">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">{order.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}