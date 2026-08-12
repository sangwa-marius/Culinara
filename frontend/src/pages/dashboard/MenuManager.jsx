import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, ChefHat, X } from "lucide-react";
import { menuAPI, restaurantAPI } from "../../services/api";
import Spinner from "../../components/Spinner";
import ImageUploader from "../../components/ImageUploader";
import ConfirmDialog from "../../components/ConfirmDialog";
import toast from "react-hot-toast";
import clsx from "clsx";

const EMPTY_ITEM = {
  name: "", description: "", price: "", category: "", image: "",
  isVegetarian: false, isVegan: false, isSpicy: false, isGlutenFree: false,
  isAvailable: true, discount: 0,
};

export default function MenuManager() {
  const [restaurant,      setRestaurant]      = useState(null);
  const [items,           setItems]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [modalOpen,       setModalOpen]       = useState(false);
  const [editingItem,     setEditingItem]     = useState(null);
  const [form,            setForm]            = useState(EMPTY_ITEM);
  const [saving,          setSaving]          = useState(false);
  const [filterCategory,  setFilterCategory]  = useState("all");
  const [deleteId,        setDeleteId]        = useState(null);
  const [deleteLoad,      setDeleteLoad]      = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: rData } = await restaurantAPI.getMyRestaurant();
      setRestaurant(rData.restaurant);
      const { data: mData } = await menuAPI.getItems(rData.restaurant._id);
      setItems(mData.items || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingItem(null);
    setForm(EMPTY_ITEM);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      category: item.category || "",
      image: item.image || "",
      isVegetarian: !!item.isVegetarian,
      isVegan: !!item.isVegan,
      isSpicy: !!item.isSpicy,
      isGlutenFree: !!item.isGlutenFree,
      isAvailable: item.isAvailable !== false,
      discount: item.discount || 0,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setForm(EMPTY_ITEM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        const { data } = await menuAPI.update(editingItem._id, form);
        setItems((prev) => prev.map((i) => (i._id === editingItem._id ? data.item : i)));
        toast.success("Item updated!");
      } else {
        const { data } = await menuAPI.create(restaurant._id, form);
        setItems((prev) => [...prev, data.item]);
        toast.success("Item added!");
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoad(true);
    try {
      await menuAPI.delete(deleteId);
      setItems((prev) => prev.filter((i) => i._id !== deleteId));
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteLoad(false);
      setDeleteId(null);
    }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await menuAPI.toggle(id);
      setItems((prev) => prev.map((i) => (i._id === id ? data.item : i)));
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const categories    = ["all", ...new Set(items.map((i) => i.category).filter(Boolean))];
  const filteredItems = filterCategory === "all" ? items : items.filter((i) => i.category === filterCategory);

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-stone-950 pt-20 px-4 pb-16">
      <div className="max-w-5xl mx-auto py-6 space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Menu Items</h1>
            <p className="text-sm text-stone-400 mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""} · {restaurant?.name}</p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Item
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={clsx(
                "px-4 py-2 rounded-full text-sm whitespace-nowrap capitalize font-medium transition-all",
                filterCategory === cat
                  ? "bg-primary-500 text-white shadow-sm"
                  : "bg-white dark:bg-stone-800 border border-cream-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-primary-300 dark:hover:border-primary-700"
              )}
            >
              {cat === "all" ? "All Items" : cat}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <ChefHat size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">
              {filterCategory === "all" ? "No menu items yet. Add your first item!" : `No items in "${filterCategory}"`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className={clsx("card p-4 flex flex-col transition-opacity", !item.isAvailable && "opacity-50")}
              >
                <div className="h-36 bg-cream-200 dark:bg-stone-800 rounded-xl overflow-hidden mb-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                  )}
                </div>

                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-bold text-stone-900 dark:text-white truncate">{item.name}</h3>
                  <div className="shrink-0 text-right">
                    {item.discount > 0 && (
                      <p className="text-xs text-stone-400 line-through">${item.price?.toFixed(2)}</p>
                    )}
                    <p className="text-primary-500 font-bold">
                      ${item.discount > 0
                        ? (item.price * (1 - item.discount / 100)).toFixed(2)
                        : item.price?.toFixed(2)
                      }
                    </p>
                  </div>
                </div>

                <span className="inline-block text-xs text-stone-500 dark:text-stone-400 bg-cream-200 dark:bg-stone-800 px-2 py-0.5 rounded-md mb-2 w-fit capitalize">
                  {item.category}
                </span>

                {item.description && (
                  <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 flex-1">{item.description}</p>
                )}

                {(item.isVegetarian || item.isVegan || item.isSpicy || item.isGlutenFree) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.isVegetarian && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">🥬</span>}
                    {item.isVegan      && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">🌱</span>}
                    {item.isSpicy      && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded">🌶️</span>}
                    {item.isGlutenFree && <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded">🌾</span>}
                  </div>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t border-cream-300 dark:border-stone-800">
                  <button
                    onClick={() => handleToggle(item._id)}
                    className={clsx("flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all",
                      item.isAvailable
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                        : "bg-cream-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-cream-300 dark:hover:bg-stone-700")}
                  >
                    {item.isAvailable ? <Eye size={12} /> : <EyeOff size={12} />}
                    {item.isAvailable ? "Available" : "Hidden"}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(item._id)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all ml-auto"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-2xl card p-6 animate-scale-in shadow-2xl shadow-black/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required placeholder="e.g. Chicken Burger"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Category *</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required placeholder="e.g. Burgers, Pizza"
                  className="input-field"
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.filter((c) => c !== "all").map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Price ($) *</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required placeholder="9.99"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Discount (%)</label>
                <input
                  type="number" min="0" max="100"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  placeholder="0"
                  className="input-field"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} placeholder="Describe the item..."
                  className="input-field resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <ImageUploader
                  label="Dish Photo"
                  hint="Recommended: square · JPG, PNG, WebP · max 5 MB"
                  aspect="wide"
                  value={form.image}
                  onChange={(url) => setForm({ ...form, image: url })}
                />
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Dietary Tags</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    ["isVegetarian", "🥬 Vegetarian"],
                    ["isVegan",      "🌱 Vegan"],
                    ["isSpicy",      "🌶️ Spicy"],
                    ["isGlutenFree", "🌾 Gluten Free"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        className="rounded accent-primary-500"
                      />
                      <span className="text-sm text-stone-600 dark:text-stone-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : editingItem ? "Save Changes" : "Add Item"}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete menu item?"
        message="This action cannot be undone. The item will be permanently removed from your menu."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoad}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteId(null); }}
      />
    </div>
  );
}
