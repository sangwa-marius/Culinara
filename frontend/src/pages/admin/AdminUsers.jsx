import { useState, useEffect } from "react";
import { Search, Users, RefreshCw, ShieldOff, ShieldCheck } from "lucide-react";
import { adminAPI } from "../../services/api";
import ConfirmDialog from "../../components/ConfirmDialog";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";

const ROLE_COLORS = {
  admin:            "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  restaurant_owner: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  delivery_driver:  "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  customer:         "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
};

export default function AdminUsers() {
  const [users,       setUsers]       = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [roleFilter,  setRoleFilter]  = useState("all");
  const [confirm,     setConfirm]     = useState(null); // { id, name, currentlyActive }
  const [actionLoad,  setActionLoad]  = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let list = users;
    if (roleFilter !== "all") list = list.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [users, search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers();
      setUsers(data.users || []);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  const handleToggle = async () => {
    if (!confirm) return;
    setActionLoad(true);
    try {
      const { data } = await adminAPI.toggleUser(confirm.id);
      setUsers(prev => prev.map(u => u._id === confirm.id ? { ...u, isActive: data.user.isActive } : u));
      toast.success(confirm.currentlyActive ? "User deactivated" : "User activated");
      setConfirm(null);
    } catch { toast.error("Action failed"); }
    finally { setActionLoad(false); }
  };

  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-bold text-stone-900 dark:text-white text-xl">User Management</h1>
          <p className="text-xs text-stone-400 mt-0.5">{users.length} registered users</p>
        </div>
        <button onClick={fetchUsers} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Role filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all",            label: `All (${users.length})` },
          { key: "customer",       label: `Customers (${roleCounts.customer || 0})` },
          { key: "restaurant_owner",label:`Owners (${roleCounts.restaurant_owner || 0})` },
          { key: "delivery_driver",label: `Drivers (${roleCounts.delivery_driver || 0})` },
          { key: "admin",          label: `Admins (${roleCounts.admin || 0})` },
        ].map(f => (
          <button key={f.key} onClick={() => setRoleFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
              roleFilter === f.key
                ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400"
                : "border-cream-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-400"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="input-field pl-10 max-w-sm" />
      </div>

      {/* Users list */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-cream-200 dark:divide-stone-800">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users size={26} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-stone-400 text-sm">No users match your filter</p>
            </div>
          ) : filtered.map(u => (
            <div key={u._id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-cream-50 dark:hover:bg-stone-800/40 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-stone-900 dark:text-white text-sm truncate">{u.name}</p>
                    {!u.isActive && (
                      <span className="badge bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 text-[10px]">Inactive</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`badge capitalize text-xs ${ROLE_COLORS[u.role] || ROLE_COLORS.customer}`}>
                  {u.role?.replace(/_/g, " ")}
                </span>
                {u.role !== "admin" && (
                  <button
                    onClick={() => setConfirm({ id: u._id, name: u.name, currentlyActive: u.isActive })}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      u.isActive
                        ? "border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}>
                    {u.isActive ? <><ShieldOff size={12} /> Deactivate</> : <><ShieldCheck size={12} /> Activate</>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.currentlyActive ? "Deactivate user?" : "Activate user?"}
        message={confirm?.currentlyActive
          ? `"${confirm?.name}" will lose access to the platform immediately.`
          : `"${confirm?.name}" will regain access to the platform.`}
        confirmLabel={confirm?.currentlyActive ? "Deactivate" : "Activate"}
        variant={confirm?.currentlyActive ? "danger" : "info"}
        loading={actionLoad}
        onConfirm={handleToggle}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}