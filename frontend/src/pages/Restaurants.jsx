import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import RestaurantCard from "../components/RestaurantCard";
import { RestaurantCardSkeleton, Skeleton } from "../components/Skeleton";
import { restaurantAPI } from "../services/api";

const CUISINES = ["Italian","Japanese","Mexican","Vegan","Steakhouse","Bakery","Chinese","Indian","Burgers","Asian","Healthy","Sushi"];
const SORTS = [{ value: "rating", label: "Top Rated" }, { value: "deliveryFee", label: "Lowest Fee" }, { value: "newest", label: "Newest" }];

export default function Restaurants() {
  const [searchParams]                   = useSearchParams();
  const [restaurants, setRestaurants]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [input, setInput]               = useState(searchParams.get("search") || "");
  const [search, setSearch]             = useState(searchParams.get("search") || "");
  const [cuisines, setCuisines]         = useState([]);
  const [sort, setSort]                 = useState("rating");
  const [openOnly, setOpenOnly]         = useState(false);
  const [showFilters, setShowFilters]   = useState(false);

  useEffect(() => { fetch(); }, [page, sort, openOnly, cuisines, search]);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await restaurantAPI.getAll({
        page, limit: 12, sort,
        ...(search && { search }),
        ...(cuisines.length && { cuisine: cuisines.join(",") }),
        ...(openOnly && { isOpen: true }),
      });
      setRestaurants(data.restaurants || []);
      setTotal(data.total || 0);
    } catch { setRestaurants([]); }
    finally { setLoading(false); }
  };

  const toggleCuisine = c => {
    setCuisines(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
    setPage(1);
  };
  const clear = () => { setCuisines([]); setOpenOnly(false); setSort("rating"); setSearch(""); setInput(""); setPage(1); };
  const hasFilters = cuisines.length > 0 || openOnly || sort !== "rating" || search;
  const pages = Math.ceil(total / 12);

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-white">Find your next culinary adventure</h1>
          <p className="text-stone-400 text-sm mt-1">{total} restaurant{total !== 1 ? "s" : ""} available</p>
        </div>

        {/* Search bar + filter toggle */}
        <form onSubmit={e => { e.preventDefault(); setSearch(input.trim()); setPage(1); }} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Search restaurants, cuisines…"
              className="input-field pl-10 pr-9" />
            {input && <button type="button" onClick={() => { setInput(""); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"><X size={14} /></button>}
          </div>
          <button type="submit" className="btn-primary px-5 text-sm">Search</button>
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 px-4 text-sm ${hasFilters ? "border-primary-400 text-primary-600 dark:border-primary-700" : ""}`}>
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && (() => {
              const filterCount = cuisines.length + (openOnly ? 1 : 0) + (sort !== "rating" ? 1 : 0) + (search ? 1 : 0);
              return <span className="bg-primary-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{filterCount > 9 ? "9+" : filterCount}</span>;
            })}
          </button>
        </form>

        {/* Cuisine quick filter bar */}
        <div className="flex gap-2 flex-wrap mb-4">
          {CUISINES.map(c => (
            <button key={c} onClick={() => toggleCuisine(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${cuisines.includes(c) ? "bg-primary-500 text-white border-primary-500" : "bg-white dark:bg-stone-900 border-cream-400 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-primary-300"}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-5 mb-5 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-900 dark:text-white text-sm">Advanced Filters</h3>
              {hasFilters && <button onClick={clear} className="text-xs text-red-500 flex items-center gap-1 hover:text-red-600"><X size={12} /> Clear all</button>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Sort By</p>
                {SORTS.map(o => (
                  <label key={o.value} className="flex items-center gap-2 cursor-pointer py-1">
                    <input type="radio" value={o.value} checked={sort === o.value} onChange={() => setSort(o.value)} className="accent-primary-500 w-3.5 h-3.5" />
                    <span className={`text-sm ${sort === o.value ? "text-primary-600 dark:text-primary-400 font-semibold" : "text-stone-600 dark:text-stone-300"}`}>{o.label}</span>
                  </label>
                ))}
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Status</p>
                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all w-max ${openOnly ? "border-green-400 bg-green-50 dark:bg-green-950/20" : "border-cream-300 dark:border-stone-700"}`}>
                  <input type="checkbox" checked={openOnly} onChange={e => { setOpenOnly(e.target.checked); setPage(1); }} className="accent-green-500 w-4 h-4" />
                  <span className={`text-sm font-medium ${openOnly ? "text-green-700 dark:text-green-400" : "text-stone-700 dark:text-stone-300"}`}>Open now only</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
            {Array.from({ length: 8 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-28">
            <Search size={40} className="mx-auto text-stone-300 dark:text-stone-600 mb-4" />
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-white mb-2">No restaurants found</h3>
            <p className="text-stone-400 text-sm mb-5">Try adjusting your search or filters</p>
            <button onClick={clear} className="btn-primary">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
              {restaurants.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pb-12">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-cream-400 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-center text-stone-400 disabled:opacity-30 hover:border-stone-400 transition-all">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, i, arr) => { if (i > 0 && arr[i-1] !== p-1) acc.push("…"); acc.push(p); return acc; }, [])
                  .map((p, i) => p === "…" ? <span key={`d${i}`} className="w-8 text-center text-stone-400 text-sm">…</span> : (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${page === p ? "bg-primary-500 text-white" : "border border-cream-400 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:border-stone-400"}`}>
                      {p}
                    </button>
                  ))
                }
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="w-8 h-8 rounded-lg border border-cream-400 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-center text-stone-400 disabled:opacity-30 hover:border-stone-400 transition-all">
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
