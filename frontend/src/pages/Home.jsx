import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, ChevronRight, Star } from "lucide-react";
import RestaurantCard from "../components/RestaurantCard";
import { RestaurantCardSkeleton, Skeleton } from "../components/Skeleton";
import { restaurantAPI, adminAPI } from "../services/api";

const CUISINES = [
  { emoji: "🍕", label: "Italian" }, { emoji: "🍣", label: "Japanese" },
  { emoji: "🍔", label: "Burgers" }, { emoji: "🌮", label: "Mexican" },
  { emoji: "🥗", label: "Vegan" },   { emoji: "🥩", label: "Steakhouse" },
];

const FEATURES = [
  { icon: "⚡", title: "Predictive Operations", desc: "ML-powered forecasting optimizes labor schedules and prep days in advance." },
  { icon: "🌐", title: "Multinational Reach", desc: "Unify global portfolios with multi-currency support and localized compliance." },
  { icon: "📊", title: "Real-time Data", desc: "Track food waste and inventory levels in real-time across all locations." },
  { icon: "🔒", title: "Enterprise Security", desc: "PCI-DSS compliant payment processing and encrypted customer data." },
];

function useCountUp(target, duration = 1600, start = false) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start || !target) return;
    let t0 = null;
    const step = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setV(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, start]);
  return v;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRestaurants: 0, totalCustomers: 0, totalOrders: 0 });
  const [statsVis, setStatsVis] = useState(false);
  const statsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVis(true); }, { threshold: 0.2 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    Promise.all([
      restaurantAPI.getAll({ sort: "rating", limit: 6 }),
      adminAPI.getPublicStats(),
    ]).then(([r, s]) => {
      setFeatured(r.data.restaurants || []);
      if (s.data.success) setStats(s.data.stats);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cR = useCountUp(stats.totalRestaurants, 1600, statsVis);
  const cC = useCountUp(stats.totalCustomers,   1600, statsVis);
  const cO = useCountUp(stats.totalOrders,       1600, statsVis);
  const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K+` : `${n}+`;

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-stone-950">

      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex items-center">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=1800&q=85&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-32 grid md:grid-cols-2 gap-12 items-center">
          <div>
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white/90 px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              The Platinum Standard in Restaurant Management
            </div>

            <h1 className="font-display font-bold text-white leading-[1.05] mb-5" style={{ fontSize: "clamp(2.4rem,5vw,4.2rem)" }}>
              Orchestrate<br />
              <span className="culinara-text italic">Culinary Excellence</span><br />
              at Scale
            </h1>

            <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
              Culinara is the refined operating system for high-volume restaurant management — marrying precision engineering with culinary intuition.
            </p>

            {/* Search */}
            <form onSubmit={(e) => { e.preventDefault(); navigate(search.trim() ? `/restaurants?search=${encodeURIComponent(search)}` : "/restaurants"); }}
              className="flex gap-2 bg-white/10 backdrop-blur-md border border-white/20 p-1.5 rounded-xl mb-6 max-w-lg">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cuisine, restaurant…"
                  className="w-full pl-9 pr-3 py-2 bg-transparent text-white placeholder-white/50 focus:outline-none text-sm" />
              </div>
              <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap">
                Find Food <ArrowRight size={14} />
              </button>
            </form>

            {/* Cuisine pills */}
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => (
                <button key={c.label} onClick={() => navigate(`/restaurants?search=${c.label}`)}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-3 py-1 rounded-full text-xs font-medium transition-all">
                  <span>{c.emoji}</span><span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats card */}
          <div className="hidden md:block" ref={statsRef}>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-primary-400 font-bold text-sm uppercase tracking-wider">Efficiency Gains</span>
              </div>
              <div className="text-5xl font-display font-bold text-white mb-1">+34%</div>
              <p className="text-white/60 text-sm mb-6">Average growth across partner restaurants</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: statsVis ? fmt(cR) : "—", label: "Restaurants" },
                  { v: statsVis ? fmt(cC) : "—", label: "Customers" },
                  { v: statsVis ? fmt(cO) : "—", label: "Orders" },
                ].map(({ v, label }) => (
                  <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="font-bold text-xl">{v}</p>
                    <p className="text-white/50 text-[11px] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <div className="bg-white dark:bg-stone-900 border-y border-cream-300 dark:border-stone-800 py-5 overflow-hidden">
        <div className="flex items-center gap-12 animate-none opacity-60">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 whitespace-nowrap px-8">Trusted by institutions</p>
          {["Le Bistro Noir","Saffron Grill","Skyline Dining","Oceanic Eatery","The Green Plate","Velvet Kitchen","Aurora Eats"].map(n => (
            <span key={n} className="text-xs font-bold uppercase tracking-widest text-stone-400 whitespace-nowrap">{n}</span>
          ))}
        </div>
      </div>

      {/* ── FEATURED ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-cream-200 dark:bg-stone-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="section-label mb-2">Top Picks</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">Find your next culinary adventure</h2>
            </div>
            <button onClick={() => navigate("/restaurants")} className="self-start sm:self-auto flex items-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-600 border border-primary-200 dark:border-primary-900/50 bg-primary-50 dark:bg-primary-950/20 hover:bg-primary-100 px-4 py-2 rounded-lg transition-all">
              Explore all <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-20">
              <div className="mb-3 flex justify-center">
                <Logo className="w-16 h-16 opacity-40" iconOnly />
              </div>
              <p className="text-stone-500">No restaurants yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white dark:bg-stone-900 border-y border-cream-300 dark:border-stone-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-label mb-2">Product Features</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">Sophisticated Control</h2>
            <div className="w-12 h-0.5 bg-primary-500 mx-auto mt-3" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="p-5 rounded-xl border border-cream-300 dark:border-stone-800 bg-cream-100 dark:bg-stone-950 hover:border-primary-200 dark:hover:border-primary-900/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900/40 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="font-semibold text-stone-900 dark:text-white text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center text-white">
          <p className="section-label text-primary-400 mb-3">Redefine Your Standard</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 leading-tight">Redefine Your Standard of Service</h2>
          <p className="text-white/60 text-base mb-8 leading-relaxed">
            Join the world's most prestigious culinary groups in standardising excellence across every location.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={() => navigate("/register?role=restaurant_owner")}
              className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-all active:scale-95">
              Request Personal Consultation <ArrowRight size={15} />
            </button>
            <button onClick={() => navigate("/subscriptions")}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl border border-white/20 transition-all">
              View Enterprise Pricing
            </button>
          </div>
          <p className="text-white/30 text-xs mt-4 uppercase tracking-widest">No obligation · Custom deployments available</p>
        </div>
      </section>
    </div>
  );
}
