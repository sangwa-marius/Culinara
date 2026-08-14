import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Clock, ArrowRight } from "lucide-react";
import { orderAPI, authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { StatCardSkeleton, OrderRowSkeleton, Skeleton } from "../../components/Skeleton";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function CustomerDashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let ordersFailed = false;
      let profileFailed = false;

      try {
        const orderRes = await orderAPI.getMyOrders();
        setOrders(orderRes.data.orders || []);
      } catch {
        ordersFailed = true;
      }

      try {
        const userRes = await authAPI.getMe();
        updateUser(userRes.data.user);
      } catch {
        profileFailed = true;
      }

      if (ordersFailed && profileFailed) {
        toast.error("Failed to load dashboard");
      }

      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-cream-300 dark:border-stone-800">
          <Skeleton className="h-5 w-40" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => <OrderRowSkeleton key={i} />)}
      </div>
    </div>
  );

  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => ["pending", "confirmed", "preparing", "out_for_delivery"].includes(o.status)).length;
  const completedOrders = orders.filter(o => o.status === "delivered").length;
  const recentOrders = orders.slice(0, 6);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">Dashboard</h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! Here&apos;s your activity.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Orders", value: totalOrders, icon: Package, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
          { label: "Active Orders", value: activeOrders, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
          { label: "Completed", value: completedOrders, icon: ShoppingBag, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
          { label: "Member Since", value: (() => { const d = user?.createdAt || user?.updatedAt; return d ? format(new Date(d), "MMM yyyy") : "—"; })(), icon: LayoutDashboard, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
        ].map(stat => (
          <div key={stat.label} className="card p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon size={16} className="sm:hidden" />
                <stat.icon size={20} className="hidden sm:block" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-stone-400">{stat.label}</p>
                <p className="font-bold text-stone-900 dark:text-white text-base sm:text-lg mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-cream-300 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-stone-900 dark:text-white text-sm sm:text-base">Recent Orders</h2>
            <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5">Your latest activity</p>
          </div>
          <button onClick={() => navigate("/orders")} className="text-[10px] sm:text-xs text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1">
            View all <ArrowRight size={10} className="sm:hidden" /><ArrowRight size={12} className="hidden sm:block" />
          </button>
        </div>
        <div className="divide-y divide-cream-200 dark:divide-stone-800">
          {recentOrders.length === 0 ? (
            <div className="py-10 text-center">
              <Package size={28} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-stone-400 text-sm">No orders yet</p>
              <button onClick={() => navigate("/restaurants")} className="btn-primary mt-4 text-xs py-2 px-4">Browse Restaurants</button>
            </div>
          ) : recentOrders.map(order => (
            <div key={order._id} className="px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-cream-50 dark:hover:bg-stone-800/40 transition-colors">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 shrink-0 overflow-hidden">
                  {order.restaurant?.logo ? (
                    <img src={order.restaurant.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-white truncate">{order.restaurant?.name}</p>
                  <p className="text-[10px] sm:text-xs text-stone-400">#{order.orderNumber} · {order.items?.length || 0} items</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">${order.total?.toFixed(2)}</p>
                <p className="text-[10px] text-stone-400">{format(new Date(order.createdAt), "MMM d, HH:mm")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
