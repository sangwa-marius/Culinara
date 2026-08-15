import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Package, Megaphone, Settings, Trash2, RefreshCw, Bike, Phone, MapPin, X, PackageOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotificationContext } from "../context/NotificationContext";
import { orderAPI } from "../services/api";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import clsx from "clsx";
import toast from "react-hot-toast";

const FILTER_TABS = [
  { key: "all",    label: "All"    },
  { key: "order",  label: "Orders" },
  { key: "promo",  label: "Promos" },
  { key: "system", label: "System" },
];

const NOTIF_CONFIG = {
  order:            { icon: <Package  size={18} />, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400", label: "Order Update" },
  promo:            { icon: <Megaphone size={18} />, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400", label: "Promotion"   },
  system:           { icon: <Settings  size={18} />, color: "bg-blue-100   dark:bg-blue-900/30   text-blue-600   dark:text-blue-400",   label: "System"      },
  delivery_request: { icon: <Bike      size={18} />, color: "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400", label: "Delivery Request" },
};

function getTimeAgo(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "just now";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "just now";
  }
}

function groupByDate(notifications) {
  const groups = {};
  notifications.forEach((n) => {
    let label;
    try {
      const date = new Date(n.createdAt);
      if (isNaN(date.getTime())) { label = "Recent"; }
      else if (isToday(date))     { label = "Today"; }
      else if (isYesterday(date)) { label = "Yesterday"; }
      else                        { label = format(date, "MMMM d, yyyy"); }
    } catch {
      label = "Recent";
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
}

export default function NotificationsPage() {
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markOneRead,
    markAllRead,
    deleteOne,
    deleteAll,
  } = useNotificationContext();

  // ── Derived state ────────────────────────────────────────────────────────────
  const filtered =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const grouped = groupByDate(filtered);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const openDeliveryPopup = async (notif) => {
    if (!notif.isRead) markOneRead(notif._id);
    if (!notif.orderId) return;
    setSelectedNotif(notif);
    setOrderLoading(true);
    setOrderDetails(null);
    try {
      const { data } = await orderAPI.getOne(notif.orderId);
      setOrderDetails(data.order || null);
    } catch {
      toast.error("Failed to load delivery details");
      setSelectedNotif(null);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleClick = (notif) => {
    if (notif.type === "delivery_request" && user?.role === "delivery_driver") {
      openDeliveryPopup(notif);
      return;
    }
    if (!notif.isRead) markOneRead(notif._id);
    if (notif.orderId) {
      if (user?.role === "restaurant_owner") {
        navigate("/dashboard/orders");
      } else {
        navigate(`/orders/${notif.orderId}`);
      }
    }
  };

  const handleDeleteOne = (e, id) => {
    e.stopPropagation();
    deleteOne(id);
    toast.success("Notification removed");
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    toast.success("All notifications marked as read");
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    setConfirmClearAll(true);
  };

  const confirmAndClearAll = () => {
    deleteAll();
    setConfirmClearAll(false);
    toast.success("All notifications cleared");
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 max-w-3xl mx-auto">

      {/* Confirm Clear All Dialog */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmClearAll(false)} />
          <div className="relative bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">
              Clear all notifications?
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center mb-6">
              This will permanently delete all {notifications.length} notification{notifications.length !== 1 ? "s" : ""}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClearAll(false)}
                className="flex-1 btn-secondary py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndClearAll}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={15} /> Clear all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Details Popup */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedNotif(null)} />
          <div className="relative bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-stone-900 border-b border-cream-300 dark:border-stone-800 px-5 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h3 className="font-bold text-stone-900 dark:text-white">Delivery Details</h3>
              <button onClick={() => setSelectedNotif(null)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                <X size={17} />
              </button>
            </div>

            {orderLoading ? (
              <div className="p-10 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Loading delivery details…</p>
              </div>
            ) : orderDetails ? (
              <div className="p-5 space-y-4">
                {/* Order header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-stone-900 dark:text-white text-lg">#{orderDetails.orderNumber}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{orderDetails.items?.length || 0} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl text-primary-500">${orderDetails.total?.toFixed(2)}</p>
                    {orderDetails.deliveryFee && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">+${orderDetails.deliveryFee.toFixed(2)} delivery fee</p>
                    )}
                  </div>
                </div>

                {/* Route */}
                <div className="bg-cream-100 dark:bg-stone-800 rounded-xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                      <div className="w-3 h-3 rounded-full bg-primary-500 ring-4 ring-primary-100 dark:ring-primary-900/30" />
                      <div className="w-0.5 flex-1 bg-cream-400 dark:bg-stone-600 min-h-[20px]" />
                      <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-900/30" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Pick Up</p>
                        <p className="font-semibold text-stone-900 dark:text-white text-sm">{orderDetails.restaurant?.name || "Restaurant"}</p>
                        {orderDetails.restaurant?.address && (
                          <p className="text-xs text-stone-500">{orderDetails.restaurant.address.street}, {orderDetails.restaurant.address.city}</p>
                        )}
                        {orderDetails.restaurant?.phone && (
                          <a href={`tel:${orderDetails.restaurant.phone}`} className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 mt-0.5">
                            <Phone size={10} />{orderDetails.restaurant.phone}
                          </a>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Drop Off</p>
                        {orderDetails.deliveryAddress ? (
                          <p className="font-semibold text-stone-900 dark:text-white text-sm">
                            {[orderDetails.deliveryAddress.street, orderDetails.deliveryAddress.city].filter(Boolean).join(", ")}
                          </p>
                        ) : (
                          <p className="text-sm text-stone-400 italic">Address on file</p>
                        )}
                        {orderDetails.customer?.phone && (
                          <a href={`tel:${orderDetails.customer.phone}`} className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 mt-0.5">
                            <Phone size={10} />{orderDetails.customer.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                {orderDetails.items?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Items</p>
                    <div className="space-y-1.5">
                      {orderDetails.items.slice(0, 4).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-stone-600 dark:text-stone-300">{item.quantity}× {item.name}</span>
                          <span className="text-stone-500 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {orderDetails.items.length > 4 && (
                        <p className="text-xs text-stone-400 italic">+{orderDetails.items.length - 4} more items</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setSelectedNotif(null)} className="btn-secondary flex-1 py-2.5">Close</button>
                  <button
                    onClick={() => {
                      setSelectedNotif(null);
                      if (orderDetails?.status === "ready_for_pickup") navigate("/driver/available");
                      else if (orderDetails?.status === "delivered") navigate("/driver/history");
                      else navigate("/driver/active");
                    }}
                    className="btn-primary flex-1 py-2.5 gap-2"
                  >
                    <PackageOpen size={15} />{" "}
                    {orderDetails?.status === "ready_for_pickup"
                      ? "View in Available"
                      : orderDetails?.status === "delivered"
                        ? "View in History"
                        : "View in My Deliveries"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center">
                <p className="text-sm text-stone-400">No details available</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            {unreadCount > 0 ? (
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                You have{" "}
                <span className="text-primary-500 font-semibold">{unreadCount} unread</span>{" "}
                notification{unreadCount !== 1 ? "s" : ""}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 mt-1 text-sm">
                {notifications.length > 0 ? "All caught up!" : "No notifications yet"}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchNotifications}
              disabled={loading}
              title="Refresh"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-stone-800 rounded-xl transition-all disabled:opacity-40"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-600 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 px-3 py-2 rounded-xl transition-all"
              >
                <CheckCheck size={16} /> Mark all read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 px-3 py-2 rounded-xl transition-all"
              >
                <Trash2 size={16} /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? notifications.filter((n) => !n.isRead).length
                : notifications.filter((n) => n.type === tab.key && !n.isRead).length;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                  activeFilter === tab.key
                    ? "bg-primary-500 text-white shadow-sm"
                    : "bg-white dark:bg-stone-800 border border-cream-300 dark:border-stone-700 text-gray-600 dark:text-gray-300 hover:border-umber-300 dark:hover:border-primary-500"
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={clsx(
                    "w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold",
                    activeFilter === tab.key
                      ? "bg-white/25 text-white"
                      : "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400"
                  )}>
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="mb-4">< Bell size={40} className="m-auto text-gray-500 dark:text-stone-500"/></div>
            <h3 className="text-xl font-bold text-gray-500 dark:text-white mb-2">
              {activeFilter === "all" ? "No notifications yet" : `No ${activeFilter} notifications`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {activeFilter === "all"
                ? (user?.role === "delivery_driver"
                  ? "New delivery requests and updates will appear here."
                  : "When you place orders or receive updates, they'll appear here.")
                : (
                  <button
                    onClick={() => setActiveFilter("all")}
                    className=" hover:underline"
                  >
                    Switch to "All" to see everything
                  </button>
                )}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                {/* Date divider */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Notification cards */}
                <div className="card divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
                  {items.map((notif) => {
                    const config  = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.system;
                    const timeAgo = getTimeAgo(notif.createdAt);

                    return (
                      <div
                        key={notif._id}
                        onClick={() => handleClick(notif)}
                        className={clsx(
                          "flex items-start gap-4 p-4 transition-colors group",
                          notif.orderId
                            ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            : "cursor-default",
                          !notif.isRead && "bg-primary-50/50 dark:bg-primary-900/10"
                        )}
                      >
                        {/* Type icon */}
                        <div className={clsx("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0", config.color)}>
                          {config.icon}
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className={clsx(
                                "text-xs font-semibold uppercase tracking-wide",
                                notif.type === "order"            ? "text-orange-600 dark:text-orange-400" :
                                notif.type === "promo"            ? "text-purple-600 dark:text-purple-400" :
                                notif.type === "delivery_request" ? "text-primary-600 dark:text-primary-400" :
                                                                    "text-blue-600   dark:text-blue-400"
                              )}>
                                {config.label}
                              </span>
                              <p className={clsx(
                                "text-sm mt-0.5 leading-snug break-words",
                                notif.isRead
                                  ? "text-gray-500 dark:text-gray-400"
                                  : "text-gray-900 dark:text-white font-medium"
                              )}>
                                {notif.message}
                              </p>
                            </div>

                            {/* Action buttons — visible on hover */}
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {!notif.isRead && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); markOneRead(notif._id); }}
                                  title="Mark as read"
                                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                                >
                                  <CheckCheck size={14} />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteOne(e, notif._id)}
                                title="Delete"
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                              {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1" />
                              )}
                            </div>
                          </div>

                          {/* Footer row */}
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo}</p>
                            {notif.orderId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (user?.role === "delivery_driver" && notif.type === "delivery_request") {
                                    openDeliveryPopup(notif);
                                  } else {
                                    handleClick(notif);
                                  }
                                }}
                                className="text-xs text-primary-500 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                              >
                                {user?.role === "delivery_driver" ? "View delivery →" : "View order →"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}