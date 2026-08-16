import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Package, DollarSign, Star, Clock, ArrowRight, Power } from "lucide-react";
import { restaurantAPI, orderAPI, analyticsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { joinRestaurantRoom, getSocket } from "../../utils/socket";
import { StatCardSkeleton, CardSkeleton, OrderRowSkeleton, Skeleton } from "../../components/Skeleton";
import SafeAvatar from "../../components/SafeImage";
import { format } from "date-fns";
import clsx from "clsx";

const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function isEffectivelyOpen(restaurant, now) {
  if (!restaurant) return false;
  if (restaurant.isOpen === false) return false;
  const hours = restaurant.openingHours || {};
  const today = DAYS[now.getDay()];
  const todayHours = hours[today];
  if (!todayHours || todayHours.isClosed) return false;
  const [openH, openM] = (todayHours.open || "00:00").split(":").map(Number);
  const [closeH, closeM] = (todayHours.close || "23:59").split(":").map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  const open = openH * 60 + openM;
  const close = closeH * 60 + closeM;
  return current >= open && current < close;
}

function canManuallyToggle(restaurant, now) {
  if (!restaurant) return false;
  const hours = restaurant.openingHours || {};
  const today = DAYS[now.getDay()];
  const todayHours = hours[today];
  if (!todayHours || todayHours.isClosed) return false;
  const [openH, openM] = (todayHours.open || "00:00").split(":").map(Number);
  const [closeH, closeM] = (todayHours.close || "23:59").split(":").map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  const open = openH * 60 + openM;
  const close = closeH * 60 + closeM;
  return current >= open && current < close;
}

export default function RestaurantDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [orders,     setOrders]     = useState([]);
  const [analytics, setAnalytics]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [toggling,   setToggling]   = useState(false);
  const [now, setNow] = useState(new Date());

  const toggleOpen = async () => {
    if (!restaurant || toggling) return;
    setToggling(true);
    try {
      const next = !restaurant.isOpen;
      const { data } = await restaurantAPI.update(restaurant._id, { isOpen: next });
      setRestaurant(data.restaurant);
      toast.success(next ? "Restaurant is now open" : "Restaurant is now closed");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [{ data: restData }, { data: analyticsData }] = await Promise.all([
          restaurantAPI.getMyRestaurant(),
          analyticsAPI.getRestaurant(),
        ]);
        if (!restData.restaurant) { navigate("/dashboard/setup"); return; }
        setRestaurant(restData.restaurant);
        setAnalytics(analyticsData.analytics || null);
        const rid = restData.restaurant._id;
        joinRestaurantRoom(rid);
        const socket = getSocket();
        if (socket) socket.on("order_update", () => fetchOrders(rid));
        await fetchOrders(rid);
      } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const fetchOrders = async (rid) => {
    try {
      const { data } = await orderAPI.getRestaurantOrders(rid);
      setOrders(data.orders || []);
    } catch (err) { console.error("Failed to fetch orders:", err); }
  };

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 space-y-3">
          <Skeleton className="h-5 w-40 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => <OrderRowSkeleton key={i} />)}
        </div>
        <div className="card p-4 sm:p-5 space-y-3">
          <Skeleton className="h-5 w-32 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-2.5 h-2.5 rounded-full shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const paidOrders = orders.filter(o => o.paymentStatus === "paid");
  const avgOrder = paidOrders.length ? paidOrders.reduce((s, o) => s + o.total, 0) / paidOrders.length : 0;
  const pending = orders.filter(o => ["pending","confirmed","preparing"].includes(o.status)).length;
  const recentOrders = orders.slice(0, 8);

  const totalRevenue = analytics?.totalRevenue ?? paidOrders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">Dashboard</h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-0.5">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        {restaurant && (
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${isEffectivelyOpen(restaurant, now) ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"}`}>
              <Power size={14} />
              <span className="hidden sm:inline">{isEffectivelyOpen(restaurant, now) ? "Open" : "Closed"}</span>
              <button
                onClick={toggleOpen}
                disabled={toggling || !canManuallyToggle(restaurant, now)}
                className={clsx("relative w-8 h-5 rounded-full transition-colors", restaurant.isOpen ? "bg-green-500" : "bg-stone-300", toggling && "opacity-70")}
              >
                <span className={clsx("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", restaurant.isOpen ? "translate-x-3" : "translate-x-0")} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
          { label: "Total Orders", value: analytics?.totalOrders ?? orders.length, icon: Package, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
          { label: "Avg Order Value", value: `$${avgOrder.toFixed(2)}`, icon: TrendingUp, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
          { label: "Active Orders", value: pending, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-cream-300 dark:border-stone-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-stone-900 dark:text-white text-sm sm:text-base">Recent Orders</h2>
              <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5">Latest activity across all orders</p>
            </div>
            <button onClick={() => navigate("/dashboard/orders")} className="text-[10px] sm:text-xs text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1">
              View all <ArrowRight size={10} className="sm:hidden" /><ArrowRight size={12} className="hidden sm:block" />
            </button>
          </div>
          <div className="divide-y divide-cream-200 dark:divide-stone-800">
            {recentOrders.length === 0 ? (
              <p className="py-8 sm:py-10 text-center text-stone-400 text-xs sm:text-sm">No orders yet</p>
            ) : recentOrders.map(order => (
              <div key={order._id} className="px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between hover:bg-cream-50 dark:hover:bg-stone-800/40 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden shrink-0">
                    <SafeAvatar src={order.customer?.avatar} name={order.customer?.name} size="w-7 h-7 sm:w-9 sm:h-9" textSize="text-xs sm:text-sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-white truncate">#{order.orderNumber}</p>
                    <p className="text-[10px] sm:text-xs text-stone-400 truncate">{order.customer?.name} · {order.items?.length || 0} items</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">${order.total?.toFixed(2)}</p>
                  <p className="text-[10px] text-stone-400">{order.createdAt ? format(new Date(order.createdAt), "MMM d, HH:mm") : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h2 className="font-bold text-stone-900 dark:text-white text-sm sm:text-base mb-3 sm:mb-4">Order Breakdown</h2>
          <div className="space-y-2 sm:space-y-3">
            {[
              { label: "Dine-in", count: orders.filter(o => o.orderType === "dine_in").length, color: "bg-blue-500" },
              { label: "Delivery", count: orders.filter(o => o.orderType !== "dine_in").length, color: "bg-green-500" },
              { label: "Pending", count: orders.filter(o => o.status === "pending").length, color: "bg-amber-500" },
              { label: "Completed", count: orders.filter(o => o.status === "delivered").length, color: "bg-emerald-500" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 sm:gap-3">
                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${item.color}`} />
                <span className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 flex-1">{item.label}</span>
                <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-cream-300 dark:border-stone-800">
            <div className="flex justify-between text-xs sm:text-sm mb-1">
              <span className="text-stone-400">Completion rate</span>
              <span className="font-bold text-stone-900 dark:text-white">{orders.length ? Math.round(orders.filter(o => o.status === "delivered").length / orders.length * 100) : 0}%</span>
            </div>
            <div className="w-full bg-cream-200 dark:bg-stone-800 rounded-full h-1.5 sm:h-2">
              <div className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all" style={{ width: `${orders.length ? Math.round(orders.filter(o => o.status === "delivered").length / orders.length * 100) : 0}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
