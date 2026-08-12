import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Package, DollarSign, Star, Clock, ArrowRight } from "lucide-react";
import { restaurantAPI, orderAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { joinRestaurantRoom, getSocket } from "../../utils/socket";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import { format } from "date-fns";
import clsx from "clsx";

export default function RestaurantDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await restaurantAPI.getMyRestaurant();
        if (!data.restaurant) { navigate("/dashboard/setup"); return; }
        setRestaurant(data.restaurant);
        const rid = data.restaurant._id;
        joinRestaurantRoom(rid);
        const socket = getSocket();
        if (socket) socket.on("order_update", () => fetchOrders(rid));
        await fetchOrders(rid);
      } finally { setLoading(false); }
    })();
  }, []);

  const fetchOrders = async (rid) => {
    try {
      const { data } = await orderAPI.getRestaurantOrders(rid);
      setOrders(data.orders || []);
    } catch (err) { console.error("Failed to fetch orders:", err); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  const paidOrders = orders.filter(o => o.paymentStatus === "paid");
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const avgOrder = paidOrders.length ? revenue / paidOrders.length : 0;
  const pending = orders.filter(o => ["pending","confirmed","preparing"].includes(o.status)).length;
  const recentOrders = orders.slice(0, 8);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-stone-400 mt-0.5">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue", value: `$${revenue.toFixed(2)}`, icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
          { label: "Total Orders", value: orders.length, icon: Package, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
          { label: "Avg Order Value", value: `$${avgOrder.toFixed(2)}`, icon: TrendingUp, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
          { label: "Active Orders", value: pending, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
        ].map(stat => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-stone-400">{stat.label}</p>
                <p className="font-bold text-stone-900 dark:text-white text-lg mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-cream-300 dark:border-stone-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-stone-900 dark:text-white">Recent Orders</h2>
              <p className="text-xs text-stone-400 mt-0.5">Latest activity across all orders</p>
            </div>
            <button onClick={() => navigate("/dashboard/orders")} className="text-xs text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-cream-200 dark:divide-stone-800">
            {recentOrders.length === 0 ? (
              <p className="py-10 text-center text-stone-400 text-sm">No orders yet</p>
            ) : recentOrders.map(order => (
              <div key={order._id} className="px-5 py-3.5 flex items-center justify-between hover:bg-cream-50 dark:hover:bg-stone-800/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-cream-200 dark:bg-stone-800 flex items-center justify-center text-sm font-bold text-stone-600 dark:text-stone-300 shrink-0">
                    {order.customer?.name?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">#{order.orderNumber}</p>
                    <p className="text-xs text-stone-400 truncate">{order.customer?.name} · {order.items?.length || 0} items</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-stone-900 dark:text-white">${order.total?.toFixed(2)}</p>
                  <p className="text-[10px] text-stone-400">{order.createdAt ? format(new Date(order.createdAt), "MMM d, HH:mm") : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-stone-900 dark:text-white mb-4">Order Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Dine-in", count: orders.filter(o => o.orderType === "dine_in").length, color: "bg-blue-500" },
              { label: "Delivery", count: orders.filter(o => o.orderType !== "dine_in").length, color: "bg-green-500" },
              { label: "Pending", count: orders.filter(o => o.status === "pending").length, color: "bg-amber-500" },
              { label: "Completed", count: orders.filter(o => o.status === "delivered").length, color: "bg-emerald-500" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-sm text-stone-600 dark:text-stone-300 flex-1">{item.label}</span>
                <span className="text-sm font-bold text-stone-900 dark:text-white">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-cream-300 dark:border-stone-800">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-stone-400">Completion rate</span>
              <span className="font-bold text-stone-900 dark:text-white">{orders.length ? Math.round(orders.filter(o => o.status === "delivered").length / orders.length * 100) : 0}%</span>
            </div>
            <div className="w-full bg-cream-200 dark:bg-stone-800 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${orders.length ? Math.round(orders.filter(o => o.status === "delivered").length / orders.length * 100) : 0}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
