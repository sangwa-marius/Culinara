import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, QrCode, Users, X, Armchair, CheckCircle } from "lucide-react";
import { restaurantAPI } from "../../services/api";
import api from "../../services/api";
import { getSocket, joinRestaurantRoom } from "../../utils/socket";
import ConfirmDialog from "../../components/ConfirmDialog";
import toast from "react-hot-toast";
import { TableCardSkeleton, Skeleton } from "../../components/Skeleton";
import clsx from "clsx";

const STATUS_CFG = {
  available: { label: "Available", card: "bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700",       text: "text-stone-500",                               dot: "bg-stone-400" },
  occupied:  { label: "Occupied",  card: "bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800/40", text: "text-primary-600 dark:text-primary-400",  dot: "bg-primary-500" },
  reserved:  { label: "Reserved",  card: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30",     text: "text-amber-600 dark:text-amber-400",            dot: "bg-amber-500" },
  cleaning:  { label: "Cleaning",  card: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30",         text: "text-blue-600 dark:text-blue-400",              dot: "bg-blue-500" },
};

export default function Tables() {
  const [tables,        setTables]       = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [modal,         setModal]        = useState(false);
  const [editing,       setEditing]      = useState(null);
  const [form,          setForm]         = useState({ number: "", capacity: 4, location: "Main Floor" });
  const [rid,           setRid]          = useState(null);
  const [deleteTarget,  setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading]= useState(false);
  const [qrTable,       setQrTable]      = useState(null);
  const [qrImage,       setQrImage]       = useState(null);
  const [qrLoading,     setQrLoading]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await restaurantAPI.getMyRestaurant();
        if (data.restaurant) {
          const restaurantId = data.restaurant._id;
          setRid(restaurantId);
          joinRestaurantRoom(restaurantId);
          const res = await api.get(`/tables/${restaurantId}`);
          setTables(res.data.tables || []);
        }
      } catch { toast.error("Failed to load tables"); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !rid) return;
    const handler = (table) => {
      setTables(prev => {
        const exists = prev.find(t => t._id === table._id);
        if (exists) return prev.map(t => t._id === table._id ? table : t);
        return [...prev, table];
      });
    };
    const removeHandler = (tableId) => {
      setTables(prev => prev.filter(t => t._id !== tableId));
    };
    socket.on("table_update", handler);
    socket.on("table_removed", removeHandler);
    return () => {
      socket.off("table_update", handler);
      socket.off("table_removed", removeHandler);
    };
  }, [rid]);

  const openAdd  = () => { setEditing(null); setForm({ number: "", capacity: 4, location: "Main Floor" }); setModal(true); };
  const openEdit = (t) => { setEditing(t); setForm({ number: t.number, capacity: t.capacity, location: t.location }); setModal(true); };

  const handleSave = async () => {
    if (!form.number) { toast.error("Table number is required"); return; }
    try {
      if (editing) {
        const { data } = await api.put(`/tables/${editing._id}`, form);
        setTables(p => p.map(t => t._id === editing._id ? data.table : t));
        toast.success("Table updated");
      } else {
        const { data } = await api.post(`/tables/${rid}`, form);
        setTables(p => [...p, data.table]);
        toast.success("Table added");
      }
      setModal(false);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/tables/${deleteTarget}`);
      setTables(p => p.filter(t => t._id !== deleteTarget));
      toast.success("Table deleted");
      setDeleteTarget(null);
    } catch { toast.error("Failed to delete table"); }
    finally { setDeleteLoading(false); }
  };

  const openQr = async (t) => {
    setQrTable(t);
    setQrLoading(true);
    setQrImage(null);
    try {
      const { data } = await api.get(`/tables/${rid}/qr/${t._id}`);
      setQrImage(data.qrImage);
    } catch {
      toast.error("Failed to generate QR code");
      setQrTable(null);
    } finally {
      setQrLoading(false);
    }
  };

  const stats = {
    total:     tables.length,
    available: tables.filter(t => t.status === "available").length,
    occupied:  tables.filter(t => t.status === "occupied").length,
    capacity:  tables.reduce((s, t) => s + t.capacity, 0),
    remaining: tables.reduce((s, t) => s + (t.remainingSeats || 0), 0),
  };

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40 sm:h-7 sm:w-44" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <Skeleton className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-8" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
        {Array.from({ length: 6 }).map((_, i) => <TableCardSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-stone-900 dark:text-white text-lg sm:text-xl">Table Management</h1>
          <p className="text-xs text-stone-400 mt-0.5">Monitor status and manage your dining layout</p>
        </div>
        <button onClick={openAdd} className="btn-primary gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4"><Plus size={13} className="sm:hidden" /><Plus size={15} className="hidden sm:block" /> Add Table</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { label: "Total Tables",  value: stats.total,     icon: Armchair },
          { label: "Available",     value: stats.available, icon: CheckCircle },
          { label: "Occupied",      value: stats.occupied,  icon: Users },
          { label: "Remaining Seats", value: stats.remaining, icon: Users },
        ].map(s => (
          <div key={s.label} className="card p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 bg-cream-200 dark:bg-stone-800 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
              <s.icon size={14} className="sm:hidden text-stone-500 dark:text-stone-400" />
              <s.icon size={18} className="hidden sm:block text-stone-500 dark:text-stone-400" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-stone-400">{s.label}</p>
              <p className="font-bold text-stone-900 dark:text-white text-base sm:text-xl">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table grid */}
      {tables.length === 0 ? (
        <div className="card p-8 sm:p-16 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cream-200 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Armchair size={20} className="sm:hidden text-stone-400" />
            <Armchair size={26} className="hidden sm:block text-stone-400" />
          </div>
          <h3 className="font-bold text-stone-900 dark:text-white mb-2 text-sm sm:text-base">No tables yet</h3>
          <p className="text-stone-400 text-xs sm:text-sm mb-4 sm:mb-5">Add your first table to start managing your dining area</p>
          <button onClick={openAdd} className="btn-primary gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4"><Plus size={13} className="sm:hidden" /><Plus size={15} className="hidden sm:block" /> Add First Table</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
          {tables.map(t => {
            const cfg = STATUS_CFG[t.status] || STATUS_CFG.available;
            return (
              <div key={t._id} className={`relative border-2 rounded-xl p-3 sm:p-4 transition-all hover:shadow-md ${cfg.card}`}>
                {/* Actions */}
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <span className={clsx("text-[9px] sm:text-[10px] font-bold flex items-center gap-1", cfg.text)}>
                    <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  <div className="flex gap-0.5 sm:gap-1">
                    <button onClick={() => openEdit(t)} className="p-1 rounded hover:bg-white/60 dark:hover:bg-black/20 transition-colors">
                      <Pencil size={10} className="sm:hidden text-stone-400" />
                      <Pencil size={11} className="hidden sm:block text-stone-400" />
                    </button>
                    <button onClick={() => setDeleteTarget(t._id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                      <Trash2 size={10} className="sm:hidden text-red-400" />
                      <Trash2 size={11} className="hidden sm:block text-red-400" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className={clsx("font-black text-xl sm:text-2xl", cfg.text)}>T-{String(t.number).padStart(2, "0")}</p>
                  <div className="flex items-center gap-1 sm:gap-2 mt-1">
                    <Users size={10} className="text-stone-400" />
                    <span className="text-[10px] sm:text-xs text-stone-500">{t.capacity} seats</span>
                  </div>
                  {t.location && <p className="text-[9px] sm:text-[10px] text-stone-400 mt-0.5 truncate">{t.location}</p>}
                  <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2">
                    <div className="flex-1 bg-cream-200 dark:bg-stone-700 rounded-full h-1 sm:h-1.5 overflow-hidden">
                      <div
                        className={clsx("h-full rounded-full transition-all duration-500",
                          t.remainingSeats === 0 ? "bg-red-500" :
                          t.remainingSeats <= Math.ceil((t.capacity || 1) / 2) ? "bg-amber-500" : "bg-green-500")}
                        style={{ width: `${((t.capacity - (t.remainingSeats || 0)) / (t.capacity || 1)) * 100}%` }}
                      />
                    </div>
                    <span className={clsx("text-[9px] sm:text-[10px] font-bold min-w-[2.5rem] sm:min-w-[3rem] text-right",
                      t.remainingSeats === 0 ? "text-red-500" : "text-stone-500")}>
                      {t.remainingSeats !== undefined ? `${t.remainingSeats} left` : ""}
                    </span>
                  </div>
                </div>

                <button onClick={() => openQr(t)} className="mt-2 sm:mt-3 w-full flex items-center justify-center gap-1 py-1.5 sm:py-2 rounded-lg bg-white/50 dark:bg-black/20 hover:bg-white/70 transition-colors">
                  <QrCode size={10} className="sm:hidden text-stone-400" />
                  <QrCode size={11} className="hidden sm:block text-stone-400" />
                  <span className="text-[9px] sm:text-[10px] text-stone-500 font-medium">QR</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-2xl shadow-2xl p-6 animate-slide-up mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-stone-900 dark:text-white">{editing ? "Edit Table" : "Add Table"}</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                <X size={17} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Table Number</label>
                <input type="number" min="1" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })}
                  placeholder="e.g. 5" className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Capacity</label>
                <select value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} className="input-field">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => <option key={n} value={n}>{n} seats</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Location / Zone</label>
                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Main Floor, Terrace, VIP" className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1">{editing ? "Save Changes" : "Add Table"}</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrTable && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setQrTable(null)} />
           <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-2xl shadow-2xl p-6 animate-slide-up text-center mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 dark:text-white">Table {qrTable.number} QR Code</h3>
              <button onClick={() => setQrTable(null)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                <X size={17} />
              </button>
            </div>
            <p className="text-xs text-stone-400 mb-4">Scan to view table {qrTable.number} details</p>
            <div className="bg-white rounded-xl p-4 flex items-center justify-center">
              {qrLoading ? (
                <div className="py-8"><Skeleton className="h-8 w-8 rounded-full mx-auto" /></div>
              ) : qrImage ? (
                <img src={qrImage} alt={`Table ${qrTable.number} QR`} className="w-full max-w-[240px] h-auto" />
              ) : (
                <p className="text-sm text-stone-400 py-8">Failed to load QR code</p>
              )}
            </div>
            <button onClick={() => setQrTable(null)} className="btn-secondary w-full mt-4">Close</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this table?"
        message="The table will be removed from your dining layout. This cannot be undone."
        confirmLabel="Delete Table"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
