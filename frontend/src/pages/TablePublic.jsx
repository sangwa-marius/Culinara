import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Armchair, Users, MapPin, Clock, Store, QrCode, ArrowLeft } from "lucide-react";
import { Skeleton } from "../components/Skeleton";
import SafeAvatar from "../components/SafeImage";
import toast from "react-hot-toast";
import api from "../services/api";
import clsx from "clsx";

const STATUS_CFG = {
  available: { label: "Available", color: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300" },
  occupied:  { label: "Occupied",  color: "bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400" },
  reserved:  { label: "Reserved",  color: "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" },
  cleaning:  { label: "Cleaning",  color: "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400" },
};

export default function TablePublic() {
  const { restaurantId, tableNumber } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await api.get(`/tables/public/${restaurantId}/${tableNumber}`);
        setData(res);
      } catch {
        toast.error("Table not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId, tableNumber]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 dark:bg-stone-950">
      <div className="space-y-3 w-full max-w-sm px-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="card p-5 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
  if (!data?.table || !data?.restaurant) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 dark:bg-stone-950 px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🍽️</div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Table not found</h1>
        <p className="text-stone-400 mb-6">This table may have been removed or is no longer active.</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    </div>
  );

  const { table, restaurant, customers } = data;
  const statusCfg = STATUS_CFG[table.status] || STATUS_CFG.available;

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-stone-950">
      {/* Cover */}
      <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
        <Link to={`/restaurants/${restaurant._id}`} className="absolute top-4 left-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors">
          <ArrowLeft size={20} />
        </Link>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-10 relative z-10">
        {/* Restaurant card */}
        <div className="card p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-cream-200 dark:bg-stone-800 flex items-center justify-center text-2xl shrink-0">
              {restaurant.logo ? <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover rounded-xl" /> : "🍽️"}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-stone-900 dark:text-white truncate">{restaurant.name}</h1>
              <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> {restaurant.address?.city || "Local restaurant"}
              </p>
            </div>
          </div>

          {/* Table info */}
          <div className="bg-cream-100 dark:bg-stone-800 rounded-2xl p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mx-auto mb-3">
              <Armchair size={28} className="text-primary-500" />
            </div>
            <h2 className="text-3xl font-black text-stone-900 dark:text-white mb-1">Table {table.number}</h2>
            <span className={clsx("inline-block text-xs font-bold px-3 py-1 rounded-full mb-3", statusCfg.color)}>
              {table.status?.replace(/_/g, " ")}
            </span>
            <div className="flex items-center justify-center gap-4 text-sm text-stone-500">
              <span className="flex items-center gap-1"><Users size={14} /> {table.capacity} seats</span>
              {table.location && <span className="flex items-center gap-1"><MapPin size={14} /> {table.location}</span>}
            </div>
          </div>
        </div>

        {/* Table mates */}
        {customers && customers.length > 0 && (
          <div className="card p-5 mb-4">
            <h3 className="font-bold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
              <Users size={16} className="text-primary-500" /> Table Mates
            </h3>
            <div className="space-y-2">
              {customers.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between bg-cream-100 dark:bg-stone-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-full overflow-hidden">
                       <SafeAvatar src={c.avatar} name={c.name} size="w-9 h-9" textSize="text-sm" />
                     </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900 dark:text-white">{c.name}</p>
                      <p className="text-[10px] text-stone-400">{c.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 capitalize">
                    {c.status?.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card p-5 mb-6">
          <h3 className="font-bold text-stone-900 dark:text-white mb-3">Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to={`/restaurants/${restaurant._id}`} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 font-semibold text-sm hover:bg-primary-100 dark:hover:bg-primary-950/30 transition-colors">
              <Store size={16} /> View Menu
            </Link>
            <Link to={`/restaurants/${restaurant._id}`} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 font-semibold text-sm hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors">
              <QrCode size={16} /> Order Here
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-stone-400 mb-6">
          Scanned at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
