import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, Package, TrendingUp, Users, Truck } from "lucide-react";
import { analyticsAPI, restaurantAPI, orderAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { joinRestaurantRoom, getSocket } from "../../utils/socket";
import { AnalyticsSkeleton } from "../../components/Skeleton";
import toast from "react-hot-toast";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { isToday } from "date-fns";

const COLORS = ["#B5390D", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function RestaurantAnalytics() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await restaurantAPI.getMyRestaurant();
        if (!data.restaurant) { navigate("/dashboard/setup"); return; }
        const rid = data.restaurant._id;
        joinRestaurantRoom(rid);
        const socket = getSocket();
        if (socket) socket.on("order_update", () => fetchOrders(rid));

        const [analyticsRes, ordersRes] = await Promise.all([
          analyticsAPI.getRestaurant(),
          orderAPI.getRestaurantOrders(rid).catch(() => ({ data: { orders: [] } })),
        ]);
        setAnalytics(analyticsRes.data.analytics);
        setOrders(ordersRes.data.orders || []);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        toast.error("Failed to load analytics");
      } finally { setLoading(false); }
    })();
  }, []);

  const fetchOrders = async (rid) => {
    try {
      const { data } = await orderAPI.getRestaurantOrders(rid);
      setOrders(data.orders || []);
    } catch (err) { console.error("Failed to fetch orders:", err); }
  };

  if (loading) return <AnalyticsSkeleton />;

  const data = analytics || {};
  const totalRevenue = data.totalRevenue || 0;
  const avgOrderValue = data.avgOrderValue || 0;
  const totalOrders = data.totalOrders || 0;
  const weekOrders = data.weekOrders || [];
  const topDishes = data.topDishes || [];
  const ordersByStatus = data.ordersByStatus || [];

  const dineInCount = orders.filter(o => o.orderType === "dine_in").length;
  const deliveryCount = orders.filter(o => o.orderType !== "dine_in").length;
  const orderTypeData = [
    { name: "Dine-in", value: dineInCount },
    { name: "Delivery", value: deliveryCount },
  ];

  const statusData = ordersByStatus.map(item => ({
    name: item._id?.replace(/_/g, " ") || item._id,
    value: item.count,
  }));

  const todayRevenue = orders
    .filter(o => o.paymentStatus === "paid" && isToday(new Date(o.createdAt)))
    .reduce((s, o) => s + o.total, 0);
  const todayOrders = orders.filter(o => isToday(new Date(o.createdAt))).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-stone-400 mt-0.5">Performance insights and trends</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
          { label: "Total Orders", value: totalOrders, icon: Package, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
          { label: "Avg Order Value", value: `$${avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
          { label: "Today's Orders", value: todayOrders, icon: Users, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-bold text-stone-900 dark:text-white mb-4">Weekly Revenue & Orders</h2>
          {weekOrders.length === 0 ? (
            <p className="py-10 text-center text-stone-400 text-sm">No data for this week</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", background: "white" }}
                  formatter={(value, name) => [name === "revenue" ? `$${value.toFixed(2)}` : value, name === "revenue" ? "Revenue" : "Orders"]}
                />
                <Legend />
                <Bar dataKey="orders" name="Orders" fill="#B5390D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-stone-900 dark:text-white mb-4">Orders by Status</h2>
          {statusData.length === 0 ? (
            <p className="py-10 text-center text-stone-400 text-sm">No order data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} orders`, "Count"]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-bold text-stone-900 dark:text-white mb-4">Dine-in vs Delivery</h2>
          {orderTypeData.every(d => d.value === 0) ? (
            <p className="py-10 text-center text-stone-400 text-sm">No order data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip formatter={(value) => [`${value} orders`, "Count"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-stone-900 dark:text-white mb-4">Top 5 Dishes</h2>
          {topDishes.length === 0 ? (
            <p className="py-10 text-center text-stone-400 text-sm">No dish data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDishes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} stroke="#9ca3af" width={100} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", background: "white" }}
                  formatter={(value, name) => [name === "revenue" ? `$${value.toFixed(2)}` : value, name === "revenue" ? "Revenue" : "Qty Sold"]}
                />
                <Legend />
                <Bar dataKey="count" name="Qty Sold" fill="#B5390D" radius={[0, 4, 4, 0]} />
                <Bar dataKey="revenue" name="Revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-stone-900 dark:text-white mb-4">Today's Summary</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-cream-100 dark:bg-stone-800 rounded-xl p-4">
            <p className="text-xs text-stone-400">Today's Revenue</p>
            <p className="font-bold text-stone-900 dark:text-white text-xl mt-1">${todayRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-cream-100 dark:bg-stone-800 rounded-xl p-4">
            <p className="text-xs text-stone-400">Today's Orders</p>
            <p className="font-bold text-stone-900 dark:text-white text-xl mt-1">{todayOrders}</p>
          </div>
          <div className="bg-cream-100 dark:bg-stone-800 rounded-xl p-4">
            <p className="text-xs text-stone-400">Completion Rate</p>
            <p className="font-bold text-stone-900 dark:text-white text-xl mt-1">{totalOrders ? Math.round(orders.filter(o => o.status === "delivered").length / totalOrders * 100) : 0}%</p>
          </div>
          <div className="bg-cream-100 dark:bg-stone-800 rounded-xl p-4">
            <p className="text-xs text-stone-400">Active Now</p>
            <p className="font-bold text-stone-900 dark:text-white text-xl mt-1">{orders.filter(o => ["pending","confirmed","preparing","ready_for_pickup","out_for_delivery"].includes(o.status)).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
