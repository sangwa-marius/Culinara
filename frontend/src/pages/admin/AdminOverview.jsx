import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { adminAPI } from "../../services/api";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import clsx from "clsx";

const THIRTY_MIN = 30 * 60 * 1000;

export default function AdminOverview() {
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [visibleOrders, setVisibleOrders] = useState([]);
  const [now,           setNow]           = useState(Date.now());

  useEffect(() => {
    adminAPI.getStats()
      .then(({ data }) => { if (data.success) setStats(data.stats); })
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const cutoff = Date.now() - THIRTY_MIN;
    setVisibleOrders(
      (stats?.recentOrders || []).filter(o => new Date(o.createdAt).getTime() >= cutoff)
    );
  }, [stats, now]);

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users",        value: stats?.totalUsers        ?? 0, icon: "👥", trend: "+12%" },
          { label: "Partner Restaurants",value: stats?.totalRestaurants  ?? 0, icon: "🏪", trend: "+5%" },
          { label: "Total Orders",       value: stats?.totalOrders       ?? 0, icon: "📦", trend: "+18%" },
          { label: "Revenue",            value: `$${(stats?.revenue ?? 0).toFixed(0)}`, icon: "💰", trend: "+22%" },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded">{s.trend}</span>
            </div>
            <p className="text-xs text-stone-400">{s.label}</p>
            <p className="font-bold text-stone-900 dark:text-white text-xl mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent orders — last 30 min */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-cream-300 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-stone-900 dark:text-white">Recent Orders</h2>
            <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
              <Clock size={11} /> Only orders from the last 30 minutes
            </p>
          </div>
          {visibleOrders.length > 0 && (
            <span className="text-xs bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-full font-semibold border border-primary-200 dark:border-primary-800/40">
              {visibleOrders.length} active
            </span>
          )}
        </div>
        <div className="divide-y divide-cream-200 dark:divide-stone-800">
          {visibleOrders.length === 0 ? (
            <div className="py-10 text-center">
              <Clock size={24} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-stone-400 text-sm">No orders in the last 30 minutes</p>
            </div>
          ) : visibleOrders.map(order => {
            const leftMins = Math.max(0, Math.ceil((THIRTY_MIN - (now - new Date(order.createdAt).getTime())) / 60000));
            return (
              <div key={order._id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-cream-50 dark:hover:bg-stone-800/40 transition-colors">
                <div>
                  <p className="font-semibold text-stone-900 dark:text-white text-sm">#{order.orderNumber}</p>
                  <p className="text-xs text-stone-400">{order.customer?.name} · {order.restaurant?.name}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <OrderStatusBadge status={order.status} />
                  <p className="font-bold text-stone-900 dark:text-white text-sm">${order.total?.toFixed(2)}</p>
                  <span className={clsx("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold border",
                    leftMins <= 5
                      ? "bg-red-50 dark:bg-red-950/20 text-red-500 border-red-200 dark:border-red-800/30"
                      : "bg-stone-50 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-700")}>
                    <Clock size={9} /> {leftMins}m
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}