import { useState, useEffect } from "react";
import { Search, CheckCircle, XCircle, Store, RefreshCw } from "lucide-react";
import { restaurantAPI } from "../../services/api";
import ConfirmDialog from "../../components/ConfirmDialog";
import { RestaurantCardSkeleton, StatCardSkeleton, Skeleton } from "../../components/Skeleton";
import toast from "react-hot-toast";

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterStatus,setFilterStatus]= useState("all"); // all | approved | pending
  const [confirm,     setConfirm]     = useState(null);  // { id, approve }
  const [actionLoad,  setActionLoad]  = useState(false);

  useEffect(() => { fetchRestaurants(); }, []);

  useEffect(() => {
    let list = restaurants;
    if (filterStatus === "approved") list = list.filter(r => r.isApproved);
    if (filterStatus === "pending")  list = list.filter(r => !r.isApproved);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.owner?.name?.toLowerCase().includes(q) ||
        r.address?.city?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [restaurants, search, filterStatus]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data } = await restaurantAPI.getAllAdmin();
      setRestaurants(data.restaurants || []);
    } catch { toast.error("Failed to load restaurants"); }
    finally { setLoading(false); }
  };

  const handleApprove = async () => {
    if (!confirm) return;
    setActionLoad(true);
    try {
      await restaurantAPI.approve(confirm.id, { isApproved: confirm.approve });
      setRestaurants(prev =>
        prev.map(r => r._id === confirm.id ? { ...r, isApproved: confirm.approve } : r)
      );
      toast.success(confirm.approve ? "Restaurant approved" : "Approval revoked");
      setConfirm(null);
    } catch { toast.error("Action failed"); }
    finally { setActionLoad(false); }
  };

  const pending  = restaurants.filter(r => !r.isApproved).length;
  const approved = restaurants.filter(r => r.isApproved).length;

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-bold text-stone-900 dark:text-white text-xl">Restaurant Approvals</h1>
          <p className="text-xs text-stone-400 mt-0.5">{restaurants.length} total · {pending} pending review</p>
        </div>
        <button onClick={fetchRestaurants} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats pills */}
      <div className="flex gap-2">
        {[
          { key: "all",      label: `All (${restaurants.length})` },
          { key: "pending",  label: `Pending (${pending})`,        cls: "border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20" },
          { key: "approved", label: `Approved (${approved})`,      cls: "border-green-400 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilterStatus(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
              filterStatus === f.key
                ? f.cls || "border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400"
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
          placeholder="Search by name, owner or city…"
          className="input-field pl-10 max-w-sm" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-cream-300 dark:border-stone-800 hidden md:grid grid-cols-[1fr_1fr_120px_120px_140px] gap-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
          <span>Restaurant</span>
          <span>Owner</span>
          <span>Subscription</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-cream-200 dark:divide-stone-800">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Store size={26} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-stone-400 text-sm">No restaurants match your filter</p>
            </div>
          ) : filtered.map(r => (
            <div key={r._id} className="px-5 py-4 hover:bg-cream-50 dark:hover:bg-stone-800/40 transition-colors">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Restaurant info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-cream-200 dark:bg-stone-800 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                    {r.logo
                      ? <img src={r.logo} alt={r.name} className="w-full h-full object-cover" />
                      : <Store size={18} className="text-stone-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 dark:text-white text-sm truncate">{r.name}</p>
                    <p className="text-xs text-stone-400 truncate">{r.cuisine?.join(", ")} · {r.address?.city || "—"}</p>
                    <p className="text-xs text-stone-300 dark:text-stone-600 mt-0.5">
                      Added {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>

                {/* Owner */}
                <div className="hidden md:block min-w-0 w-40">
                  <p className="text-sm text-stone-700 dark:text-stone-300 truncate">{r.owner?.name || "—"}</p>
                  <p className="text-xs text-stone-400 truncate">{r.owner?.email || "—"}</p>
                </div>

                {/* Subscription */}
                <div className="hidden md:block w-24">
                  <span className={`badge capitalize ${
                    r.subscription === "enterprise" ? "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400" :
                    r.subscription === "pro"        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" :
                    "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                  }`}>{r.subscription || "basic"}</span>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge ${r.isApproved ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"}`}>
                    {r.isApproved ? "Approved" : "Pending"}
                  </span>
                  {!r.isApproved ? (
                    <button
                      onClick={() => setConfirm({ id: r._id, approve: true, name: r.name })}
                      className="flex items-center gap-1.5 text-xs bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
                      <CheckCircle size={13} /> Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirm({ id: r._id, approve: false, name: r.name })}
                      className="flex items-center gap-1.5 text-xs border border-red-300 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                      <XCircle size={13} /> Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.approve ? "Approve restaurant?" : "Revoke approval?"}
        message={confirm?.approve
          ? `"${confirm?.name}" will go live and be visible to customers.`
          : `"${confirm?.name}" will be hidden from customers until re-approved.`}
        confirmLabel={confirm?.approve ? "Approve" : "Revoke"}
        variant={confirm?.approve ? "info" : "danger"}
        loading={actionLoad}
        onConfirm={handleApprove}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}