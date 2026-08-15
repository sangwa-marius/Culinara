import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Image, Layers } from "lucide-react";
import { MenuCardSkeleton, Skeleton } from "../../components/Skeleton";
import ImageUploader from "../../components/ImageUploader";
import ConfirmDialog from "../../components/ConfirmDialog";
import { restaurantAPI, collectionAPI, menuAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import clsx from "clsx";

const SEASONS = ["Spring", "Summer", "Autumn", "Winter", "Custom"];
const SEASON_IMAGES = {
  Spring: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80",
  Summer: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
  Autumn: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80",
  Winter: "https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=600&q=80",
  Custom: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
};

const STATUS_CFG = {
  active:   { label: "Active",   cls: "bg-green-500 text-white" },
  draft:    { label: "Draft",    cls: "bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300" },
  archived: { label: "Archived", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
};

const EMPTY_FORM = { name: "", description: "", season: "Custom", status: "draft", coverImage: "", items: [] };

export default function MenuCollections() {
  const navigate = useNavigate();

  const [rid,          setRid]          = useState(null);
  const [collections,  setCollections]  = useState([]);
  const [menuItems,    setMenuItems]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("All");
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoad,   setDeleteLoad]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await restaurantAPI.getMyRestaurant();
        if (!data.restaurant) { navigate("/dashboard/setup"); return; }
        setRid(data.restaurant._id);
        const [colRes, menuRes] = await Promise.all([
          collectionAPI.getAll(data.restaurant._id),
          menuAPI.getItems(data.restaurant._id),
        ]);
        setCollections(colRes.data.collections || []);
        setMenuItems(menuRes.data.items || []);
      } catch { toast.error("Failed to load collections"); }
      finally { setLoading(false); }
    })();
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit   = (col) => {
    setEditing(col);
    setForm({
      name:        col.name,
      description: col.description || "",
      season:      col.season || "Custom",
      status:      col.status,
      coverImage:  col.coverImage || "",
      items:       col.items?.map(i => i._id || i) || [],
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Collection name is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      // Auto-fill cover image from season if not set
      if (!payload.coverImage && SEASON_IMAGES[payload.season]) {
        payload.coverImage = SEASON_IMAGES[payload.season];
      }
      if (editing) {
        const { data } = await collectionAPI.update(editing._id, payload);
        setCollections(prev => prev.map(c => c._id === editing._id ? data.collection : c));
        toast.success("Collection updated");
      } else {
        const { data } = await collectionAPI.create(rid, payload);
        setCollections(prev => [data.collection, ...prev]);
        toast.success("Collection created");
      }
      setModal(false);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoad(true);
    try {
      await collectionAPI.delete(deleteTarget);
      setCollections(prev => prev.filter(c => c._id !== deleteTarget));
      toast.success("Collection deleted");
      setDeleteTarget(null);
    } catch { toast.error("Failed to delete"); }
    finally { setDeleteLoad(false); }
  };

  const toggleStatus = async (col) => {
    const next = col.status === "active" ? "draft" : "active";
    try {
      const { data } = await collectionAPI.update(col._id, { status: next });
      setCollections(prev => prev.map(c => c._id === col._id ? data.collection : c));
      toast.success(`Collection ${next}`);
    } catch { toast.error("Failed to update status"); }
  };

  const toggleItem = (id) => {
    setForm(f => ({
      ...f,
      items: f.items.includes(id) ? f.items.filter(i => i !== id) : [...f.items, id],
    }));
  };

  const filtered = tab === "All"
    ? collections
    : collections.filter(c => c.status === tab.toLowerCase());

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <div className="flex gap-1 bg-cream-200 dark:bg-stone-800 rounded-xl p-1 w-fit">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-16 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <MenuCardSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-bold text-stone-900 dark:text-white text-xl">Menu Collections</h1>
          <p className="text-xs text-stone-400 mt-0.5">
            {collections.length} collection{collections.length !== 1 ? "s" : ""} · manage your seasonal menus
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus size={15} /> New Collection
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-cream-200 dark:bg-stone-800 rounded-xl p-1 w-fit">
        {["All", "Active", "Draft", "Archived"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx("px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
              tab === t
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200")}>
            {t}
            <span className="ml-1.5 text-stone-400 dark:text-stone-500">
              ({t === "All" ? collections.length : collections.filter(c => c.status === t.toLowerCase()).length})
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 && tab === "All" ? (
        <div className="card p-16 text-center">
          <div className="w-14 h-14 bg-cream-200 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers size={26} className="text-stone-400" />
          </div>
          <h3 className="font-bold text-stone-900 dark:text-white mb-2">No collections yet</h3>
          <p className="text-stone-400 text-sm mb-5">Create your first menu collection to organise your dishes</p>
          <button onClick={openCreate} className="btn-primary gap-2"><Plus size={15}/> Create Collection</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-stone-400 text-sm">No {tab.toLowerCase()} collections</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(col => {
            const cover = col.coverImage || SEASON_IMAGES[col.season] || SEASON_IMAGES.Custom;
            const cfg   = STATUS_CFG[col.status] || STATUS_CFG.draft;
            return (
              <div key={col._id} className="card overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="relative h-40 overflow-hidden">
                  <img src={cover} alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <span className={clsx("absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full", cfg.cls)}>
                    {cfg.label}
                  </span>
                  {/* Action buttons overlay */}
                  <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(col)}
                      className="p-1.5 bg-white/90 dark:bg-stone-900/90 dark:text-white rounded-lg text-stone-600 hover:text-primary-500 transition-colors shadow-sm">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(col._id)}
                      className="p-1.5 bg-white/90 dark:bg-stone-900/90 rounded-lg text-stone-600 text-red-500 dark:text-red-500 transition-colors shadow-sm">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-stone-900 dark:text-white text-sm leading-tight">{col.name}</h3>
                    <span className="text-xs text-stone-400 shrink-0 ml-2">
                      {col.items?.length || 0} items
                    </span>
                  </div>
                  {col.description && (
                    <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed mb-3">{col.description}</p>
                  )}
                  {col.season && col.season !== "Custom" && (
                    <span className="text-[10px] font-semibold text-primary-500 bg-primary-50 dark:bg-primary-950/30 px-2 py-0.5 rounded-full">
                      {col.season} Menu
                    </span>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button onClick={() => toggleStatus(col)}
                      className={clsx("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                        col.status === "active"
                          ? "border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                          : "border-green-200 dark:border-green-800/40 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20")}>
                      {col.status === "active"
                        ? <><EyeOff size={12}/> Deactivate</>
                        : <><Eye size={12}/> Activate</>}
                    </button>
                    <button onClick={() => openEdit(col)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-colors">
                      <Pencil size={12}/> Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Create new card */}
          <button onClick={openCreate}
            className="border-2 border-dashed border-cream-400 dark:border-stone-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary-400 dark:hover:border-primary-700 hover:bg-primary-50/20 dark:hover:bg-primary-950/10 transition-all group min-h-[220px]">
            <div className="w-12 h-12 bg-cream-200 dark:bg-stone-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-100 dark:group-hover:bg-primary-950/30 transition-colors">
              <Plus size={22} className="text-stone-400 group-hover:text-primary-500 transition-colors" />
            </div>
            <h3 className="font-semibold text-stone-700 dark:text-stone-300 mb-1">New Collection</h3>
            <p className="text-xs text-stone-400">Group your dishes into curated menus</p>
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-2xl shadow-2xl animate-slide-up mx-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-300 dark:border-stone-800 shrink-0">
              <h3 className="font-bold text-stone-900 dark:text-white">
                {editing ? "Edit Collection" : "Create Collection"}
              </h3>
              <button onClick={() => setModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                <X size={17} />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Collection Name <span className="text-red-400">*</span>
                </label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="e.g. Spring Seasonal Menu" className="input-field" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder="Describe this collection…" rows={2} className="input-field resize-none" />
              </div>

              {/* Season + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Season</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SEASONS.map(s => (
                      <button key={s} type="button" onClick={() => setForm(f => ({...f, season: s}))}
                        className={clsx("px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-all",
                          form.season === s
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400"
                            : "border-cream-300 dark:border-stone-700 text-stone-500 hover:border-primary-300")}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {["draft","active","archived"].map(s => (
                      <button key={s} type="button" onClick={() => setForm(f => ({...f, status: s}))}
                        className={clsx("px-3 py-1.5 rounded-lg text-xs font-semibold border-2 capitalize transition-all",
                          form.status === s
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400"
                            : "border-cream-300 dark:border-stone-700 text-stone-500 hover:border-primary-300")}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cover image */}
              <div>
                <ImageUploader
                  label="Cover Image"
                  hint="Leave blank to use the season default · max 5 MB"
                  aspect="wide"
                  value={form.coverImage || SEASON_IMAGES[form.season]}
                  onChange={(url) => setForm(f => ({ ...f, coverImage: url }))}
                />
              </div>

              {/* Item picker */}
              {menuItems.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                    Menu Items
                    <span className="ml-2 text-primary-500 font-normal">({form.items.length} selected)</span>
                  </label>
                  <div className="border border-cream-300 dark:border-stone-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {menuItems.map(item => {
                      const selected = form.items.includes(item._id);
                      return (
                        <label key={item._id}
                          className={clsx("flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-cream-200 dark:border-stone-800 last:border-0",
                            selected ? "bg-primary-50/50 dark:bg-primary-950/20" : "hover:bg-cream-100 dark:hover:bg-stone-800/40")}>
                          <input type="checkbox" checked={selected} onChange={() => toggleItem(item._id)}
                            className="accent-primary-500 w-4 h-4 shrink-0" />
                          {item.image && (
                            <img src={item.image} alt={item.name}
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                              onError={e => e.target.style.display="none"} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{item.name}</p>
                            <p className="text-xs text-stone-400">{item.category} · ${item.price?.toFixed(2)}</p>
                          </div>
                          <span className={clsx("badge text-[10px] shrink-0",
                            item.isAvailable ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-stone-100 text-stone-500 dark:bg-stone-800")}>
                            {item.isAvailable ? "Active" : "Inactive"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {menuItems.length === 0 && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                  <Image size={16} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">No menu items yet</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                      Add items in the Menu Manager, then come back to assign them to collections.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-cream-300 dark:border-stone-800 shrink-0">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="btn-primary flex-1 disabled:opacity-60">
                {saving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  : editing ? "Save Changes" : "Create Collection"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete collection?"
        message="This collection will be permanently removed. Menu items will not be deleted."
        confirmLabel="Delete Collection"
        variant="danger"
        loading={deleteLoad}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}