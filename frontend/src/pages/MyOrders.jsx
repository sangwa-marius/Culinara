import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, Trash2, X } from "lucide-react";
import { orderAPI } from "../services/api";
import OrderStatusBadge from "../components/OrderStatusBadge";
import SafeImage from "../components/SafeImage";
import Logo from "../components/Logo";
import { OrderRowSkeleton, CardSkeleton, Skeleton } from "../components/Skeleton";
import { format } from "date-fns";
import toast from "react-hot-toast";

const STATUS_TABS = ["all", "pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

/* ── Confirm dialog ── */
function DeleteConfirmDialog({ order, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-slide-up mx-4">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
        >
          <X size={18} />
        </button>
        <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-stone-900 dark:text-white text-center mb-1">Remove this order?</h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center mb-1">
          Order <strong className="text-stone-700 dark:text-stone-200">#{order.orderNumber}</strong> from{" "}
          <strong className="text-stone-700 dark:text-stone-200">{order.restaurant?.name}</strong>
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500 text-center mb-6">
          This only removes it from your view. The restaurant is unaffected.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-secondary py-2.5">
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Trash2 size={15} />
            }
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("all");
  const [deletingId,    setDeletingId]    = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchOrders(); }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = activeTab !== "all" ? { status: activeTab } : {};
      const { data } = await orderAPI.getMyOrders(params);
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await orderAPI.hide(deletingId);
      setOrders((prev) => prev.filter((o) => o._id !== deletingId));
      toast.success("Order removed from your history");
    } catch {
      toast.error("Failed to remove order");
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  const orderBeingDeleted = orders.find((o) => o._id === deletingId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Confirm dialog */}
      {deletingId && orderBeingDeleted && (
        <DeleteConfirmDialog
          order={orderBeingDeleted}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
          loading={deleteLoading}
        />
      )}

      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">My Orders</h1>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap font-medium transition-all ${
                activeTab === tab
                  ? "bg-primary-500 text-white shadow-sm"
                  : "bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 text-gray-600 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-500"
              }`}
            >
              {tab === "all"
                ? "All Orders"
                : tab.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <OrderRowSkeleton key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24">
            <Package size={64} className="mx-auto text-gray-300 dark:text-stone-800 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No orders yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start exploring restaurants and place your first order!
            </p>
            <Link to="/restaurants" className="btn-primary">Browse Restaurants</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order._id}
                className="card p-5 flex items-center gap-4 hover:shadow-md dark:hover:shadow-gray-900/50 transition-all group"
              >
                {/* Restaurant logo */}
                <div className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/20 shrink-0 overflow-hidden">
                  <SafeImage
                    src={order.restaurant?.logo}
                    alt={order.restaurant?.name}
                    className="w-14 h-14 rounded-xl"
                    imgClass="object-cover"
                    fallback={<Logo className="w-8 h-8 opacity-50" iconOnly />}
                  />
                </div>

                {/* Order info */}
                <Link to={`/orders/${order._id}`} className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {order.restaurant?.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        #{order.orderNumber}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}{" "}
                      • {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      ${order.total?.toFixed(2)}
                    </p>
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    to={`/orders/${order._id}`}
                    className="p-2 text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </Link>
                  {["delivered", "cancelled"].includes(order.status) && (
                    <button
                      onClick={() => setDeletingId(order._id)}
                      title="Remove from history"
                      className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}