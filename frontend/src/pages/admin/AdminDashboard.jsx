import { useState, useEffect, useCallback } from "react";
import { Clock, Send, X, CheckCheck, LayoutDashboard, Store, Users, Bell, ChefHat, CreditCard, Settings } from "lucide-react";
import { adminAPI, restaurantAPI } from "../../services/api";
import Sidebar from "../../components/Sidebar";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import { StatCardSkeleton, CardSkeleton } from "../../components/Skeleton";
import SafeAvatar from "../../components/SafeImage";
import toast from "react-hot-toast";
import { format } from "date-fns";
import clsx from "clsx";

const SIDEBAR_ITEMS = [
  { to: "/admin",                label: "Dashboard",     icon: LayoutDashboard, exact: true },
  { to: "/admin/restaurants",    label: "Restaurants",   icon: Store },
  { to: "/admin/subscriptions",  label: "Subscriptions", icon: CreditCard },
  { to: "/admin/operations",     label: "Operations",    icon: ChefHat },
  { to: "/admin/settings",       label: "Settings",      icon: Settings },
];
const BOTTOM_ITEMS = [{ to: "/profile", label: "Profile", icon: Users }];

const THIRTY_MIN = 30 * 60 * 1000;

const TARGETS = [
  { value: "all",               label: "Everyone" },
  { value: "customers",         label: "Customers only" },
  { value: "restaurant_owners", label: "Restaurant owners" },
  { value: "delivery_drivers",  label: "Delivery drivers" },
];
const TYPES = [
  { value: "system", label: "📢 System" },
  { value: "promo",  label: "🎉 Promotion" },
  { value: "order",  label: "📦 Order" },
];

export default function AdminDashboard() {
  const [stats,         setStats]         = useState(null);
  const [restaurants,   setRestaurants]   = useState([]);
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("overview");
  const [visibleOrders, setVisibleOrders] = useState([]);
  const [now,           setNow]           = useState(Date.now());
  const [notifForm,     setNotifForm]     = useState({ target: "all", message: "", type: "system" });
  const [sending,       setSending]       = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const cutoff = Date.now() - THIRTY_MIN;
    setVisibleOrders((stats?.recentOrders || []).filter(o => new Date(o.createdAt).getTime() >= cutoff));
  }, [stats, now]);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const { data } = await adminAPI.getStats();
        if (data.success) setStats(data.stats);
      } else if (activeTab === "restaurants") {
        const { data } = await adminAPI.getAllRestaurants?.() || restaurantAPI.getAllAdmin();
        setRestaurants(data.restaurants || []);
      } else if (activeTab === "users") {
        const { data } = await adminAPI.getUsers();
        setUsers(data.users || []);
      }
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const toggleUser = async (id) => {
    try {
      const { data } = await adminAPI.toggleUser(id);
      setUsers(prev => prev.map(u => u._id === id ? data.user : u));
      toast.success("User status updated");
    } catch { toast.error("Failed"); }
  };

  const approveRestaurant = async (id, approved) => {
    try {
      await restaurantAPI.approve(id, { isApproved: approved });
      setRestaurants(prev => prev.map(r => r._id === id ? {...r, isApproved: approved} : r));
      toast.success(approved ? "Restaurant approved" : "Restaurant rejected");
    } catch { toast.error("Failed"); }
  };

  const sendNotif = async (e) => {
    e.preventDefault();
    if (!notifForm.message.trim()) { toast.error("Message required"); return; }
    setSending(true);
    try {
      const { data } = await adminAPI.sendNotification(notifForm);
      toast.success(data.message || "Notification sent");
      setNotifForm({ target: "all", message: "", type: "system" });
    } catch { toast.error("Failed"); }
    finally { setSending(false); }
  };

  const TABS = ["overview","restaurants","users","notifications"];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Sidebar items={SIDEBAR_ITEMS} bottomItems={BOTTOM_ITEMS} title="Admin Portal" subtitle="System Oversight" />

      <main className="flex-1 overflow-y-auto bg-cream-100 dark:bg-stone-950">
        {/* Header */}
        <div className="bg-white dark:bg-stone-900 border-b border-cream-300 dark:border-stone-800 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-bold text-stone-900 dark:text-white text-lg">Admin Dashboard</h1>
              <p className="text-xs text-stone-400">System oversight & management</p>
            </div>
          </div>
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab ? "bg-primary-500 text-white" : "text-stone-500 hover:text-stone-800 hover:bg-cream-200 dark:hover:bg-stone-800"}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
              </div>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="card p-4 sm:p-5 space-y-3">
                  <Skeleton className="h-5 w-40 mb-4" />
                  {Array.from({ length: 4 }).map((_, j) => <CardSkeleton key={j} />)}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Overview */}
              {activeTab === "overview" && stats && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Users",        value: stats.totalUsers,        icon: "👥", trend: "+12%" },
                      { label: "Partner Restaurants", value: stats.totalRestaurants, icon: "🏪", trend: "+5%" },
                      { label: "Total Orders",        value: stats.totalOrders,       icon: "📦", trend: "+18%" },
                      { label: "Revenue",             value: `$${(stats.revenue||0).toFixed(0)}`, icon: "💰", trend: "+22%" },
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

                  {/* Recent orders */}
                  <div className="card overflow-hidden">
                    <div className="px-5 py-4 border-b border-cream-300 dark:border-stone-800 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-stone-900 dark:text-white">Recent Orders</h2>
                        <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5"><Clock size={11} /> Last 30 minutes only</p>
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
                                leftMins <= 5 ? "bg-red-50 dark:bg-red-950/20 text-red-500 border-red-200 dark:border-red-800/30" : "bg-stone-50 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-700")}>
                                <Clock size={9} /> {leftMins}m
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Restaurants */}
              {activeTab === "restaurants" && (
                <div className="card overflow-hidden">
                  <div className="px-5 py-4 border-b border-cream-300 dark:border-stone-800">
                    <h2 className="font-semibold text-stone-900 dark:text-white">Restaurant Applications</h2>
                    <p className="text-xs text-stone-400 mt-0.5">{restaurants.length} total restaurants</p>
                  </div>
                  <div className="divide-y divide-cream-200 dark:divide-stone-800">
                    {restaurants.length === 0 ? <p className="py-8 text-center text-stone-400 text-sm">No restaurants</p>
                    : restaurants.map(r => (
                      <div key={r._id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-cream-50 dark:hover:bg-stone-800/40 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 bg-cream-200 dark:bg-stone-800 rounded-lg overflow-hidden shrink-0">
                            {r.logo ? <img src={r.logo} alt={r.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-sm">🏪</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-stone-900 dark:text-white text-sm truncate">{r.name}</p>
                            <p className="text-xs text-stone-400 truncate">{r.cuisine?.join(", ")} · {r.address?.city || "Unknown"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`badge ${r.isApproved ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"}`}>
                            {r.isApproved ? "Approved" : "Pending"}
                          </span>
                          {!r.isApproved && <button onClick={() => approveRestaurant(r._id, true)} className="text-xs bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded-lg font-semibold transition-colors">Approve</button>}
                          {r.isApproved && <button onClick={() => approveRestaurant(r._id, false)} className="text-xs border border-red-300 text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg font-semibold transition-colors">Revoke</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {activeTab === "users" && (
                <div className="card overflow-hidden">
                  <div className="px-5 py-4 border-b border-cream-300 dark:border-stone-800">
                    <h2 className="font-semibold text-stone-900 dark:text-white">User Management</h2>
                    <p className="text-xs text-stone-400 mt-0.5">{users.length} users</p>
                  </div>
                  <div className="divide-y divide-cream-200 dark:divide-stone-800">
                    {users.map(u => (
                      <div key={u._id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-cream-50 dark:hover:bg-stone-800/40 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                           <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                             <SafeAvatar src={u.avatar} name={u.name} size="w-8 h-8" textSize="text-xs" />
                           </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-stone-900 dark:text-white text-sm truncate">{u.name}</p>
                            <p className="text-xs text-stone-400 truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="badge bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 capitalize">{u.role?.replace(/_/g, " ")}</span>
                          <button onClick={() => toggleUser(u._id)}
                            className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${u.isActive ? "border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" : "bg-green-500 text-white hover:bg-green-600"}`}>
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === "notifications" && (
                <div className="max-w-2xl">
                  <div className="card p-6">
                    <h2 className="font-bold text-stone-900 dark:text-white mb-5 flex items-center gap-2"><Send size={16} className="text-primary-500" /> Send Notification</h2>
                    <form onSubmit={sendNotif} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Send to</label>
                        <div className="grid grid-cols-2 gap-2">
                          {TARGETS.map(t => (
                            <label key={t.value} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${notifForm.target === t.value ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20" : "border-cream-300 dark:border-stone-700 hover:border-cream-400"}`}>
                              <input type="radio" name="target" value={t.value} checked={notifForm.target === t.value} onChange={() => setNotifForm({...notifForm, target: t.value})} className="accent-primary-500 w-3.5 h-3.5" />
                              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{t.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Type</label>
                        <div className="flex gap-2">
                          {TYPES.map(t => (
                            <button key={t.value} type="button" onClick={() => setNotifForm({...notifForm, type: t.value})}
                              className={`px-3.5 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${notifForm.type === t.value ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400" : "border-cream-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-cream-400"}`}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Message</label>
                        <textarea rows={4} value={notifForm.message} onChange={e => setNotifForm({...notifForm, message: e.target.value})}
                          placeholder="Write your notification message…" className="input-field resize-none" required />
                      </div>
                      <button type="submit" disabled={sending} className="btn-primary gap-2">
                        <Send size={14} />{sending ? "Sending…" : "Send Notification"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}