import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowRight,
  ChevronRight,
  Star,
  MapPin,
  Clock,
  Zap,
  Globe,
  Activity,
  Shield,
  Utensils,
  Building2,
  Users,
  Receipt,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import RestaurantCard from "../components/RestaurantCard";
import { RestaurantCardSkeleton } from "../components/Skeleton";
import { restaurantAPI, adminAPI } from "../services/api";
import Logo from "../components/Logo";

const CUISINES = [
  { icon: Utensils, label: "All Cuisines" },
  { icon: Utensils, label: "Italian" },
  { icon: Utensils, label: "Japanese" },
  { icon: Utensils, label: "Burgers" },
  { icon: Utensils, label: "Mexican" },
  { icon: Utensils, label: "Vegan" },
  { icon: Utensils, label: "Steakhouse" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Predictive Operations",
    desc: "ML-powered forecasting optimizes labor schedules and prep days in advance.",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: Globe,
    title: "Multinational Reach",
    desc: "Unify global portfolios with multi-currency support and localized compliance.",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: Activity,
    title: "Real-time Analytics",
    desc: "Track food waste, inventory levels, and performance in real-time across all locations.",
    color: "text-green-500 bg-green-500/10",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "PCI-DSS compliant payment processing and encrypted customer data.",
    color: "text-purple-500 bg-purple-500/10",
  },
];

const STATS = [
  { icon: Building2, label: "Restaurants", key: "totalRestaurants", suffix: "K+" },
  { icon: Users, label: "Customers", key: "totalCustomers", suffix: "K+" },
  { icon: Receipt, label: "Orders", key: "totalOrders", suffix: "K+" },
];

const TRUST_INDICATORS = [
  { label: "SOC 2 Type II Certified", icon: Shield },
  { label: "PCI-DSS Compliant", icon: CheckCircle },
  { label: "99.9% Uptime SLA", icon: Activity },
  { label: "GDPR Ready", icon: Award },
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

function formatNumber(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
  return `${n}+`;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalCustomers: 0,
    totalOrders: 0,
  });
  const [statsVis, setStatsVis] = useState(false);
  const statsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setStatsVis(true);
      },
      { threshold: 0.2 },
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    Promise.all([
      restaurantAPI.getAll({ sort: "rating", limit: 6 }),
      adminAPI.getPublicStats(),
    ])
      .then(([r, s]) => {
        setFeatured(r.data.restaurants || []);
        if (s.data.success) setStats(s.data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cR = useCountUp(stats.totalRestaurants, 1600, statsVis);
  const cC = useCountUp(stats.totalCustomers, 1600, statsVis);
  const cO = useCountUp(stats.totalOrders, 1600, statsVis);

  const statValues = {
    totalRestaurants: statsVis ? formatNumber(cR) : "—",
    totalCustomers: statsVis ? formatNumber(cC) : "—",
    totalOrders: statsVis ? formatNumber(cO) : "—",
  };

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-stone-950">
      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=1800&q=85&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white/90 px-4 py-2 rounded-full text-xs font-semibold mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="uppercase tracking-wide">The Platinum Standard in Restaurant Management</span>
            </div>

            <h1
              className="font-display font-bold text-white leading-[1.05] mb-6"
              style={{ fontSize: "clamp(2.4rem,5vw,4.2rem)" }}
            >
              Orchestrate
              <br />
              <span className="culinara-text italic">Culinary Excellence</span>
              <br />
              at Scale
            </h1>

            <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-10 max-w-xl">
              Culinara is the refined operating system for high-volume
              restaurant management — marrying precision engineering with
              culinary intuition.
            </p>

            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate(
                  search.trim()
                    ? `/restaurants?search=${encodeURIComponent(search)}`
                    : "/restaurants",
                );
              }}
              className="flex gap-2 bg-white/10 backdrop-blur-md border border-white/20 p-1.5 rounded-xl mb-10 max-w-lg"
            >
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cuisine, restaurant, location…"
                  className="w-full pl-11 pr-4 py-3 bg-transparent text-white placeholder-white/50 focus:outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap active:scale-95"
              >
                Find Restaurants
                <ArrowRight size={15} />
              </button>
            </form>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              {TRUST_INDICATORS.map((t, i) => (
                <div
                  key={t.label}
                  className="flex items-center gap-1.5 text-white/70 text-xs font-medium transition-colors hover:text-white/90 group"
                >
                  <t.icon size={13} className="text-primary-400 group-hover:text-primary-300 transition-colors" />
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Card */}
          <div className="hidden lg:block" ref={statsRef}>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-white animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                  <TrendingUp size={24} className="text-primary-400" />
                </div>
                <div>
                  <p className="text-primary-400 font-bold text-sm uppercase tracking-wider">Efficiency Gains</p>
                  <p className="text-white/60 text-sm">Average across partners</p>
                </div>
              </div>
              <div className="text-6xl font-display font-bold text-white mb-2">+34%</div>
              <p className="text-white/60 text-sm mb-8">Revenue growth within 12 months</p>
              
              <div className="grid grid-cols-3 gap-4">
                {STATS.map(({ icon: Icon, label, key, suffix }) => (
                  <div key={key} className="bg-white/10 rounded-2xl p-5 text-center border border-white/10 hover:border-primary-500/30 transition-all duration-300 group">
                    <Icon size={20} className="mx-auto text-primary-400 mb-3 group-hover:scale-110 transition-transform" />
                    <p className="font-display font-bold text-3xl sm:text-4xl">{statValues[key]}</p>
                    <p className="text-white/50 text-[11px] uppercase tracking-wider mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <MouseScroll />
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <div className="bg-white dark:bg-stone-900 border-y border-cream-300 dark:border-stone-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 text-center mb-6">Trusted by Leading Culinary Groups</p>
          <div className="flex items-center justify-center gap-8 sm:gap-12 lg:gap-16 flex-wrap opacity-50 hover:opacity-70 transition-opacity">
            {[
              "Le Bistro Noir",
              "Saffron Grill",
              "Skyline Dining",
              "Oceanic Eatery",
              "The Green Plate",
              "Velvet Kitchen",
              "Aurora Eats",
            ].map((n) => (
              <span key={n} className="text-xs font-bold uppercase tracking-widest text-stone-400 whitespace-nowrap">
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURED ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-cream-200 dark:bg-stone-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div className="animate-slide-up">
              <p className="section-label mb-2">Top Picks</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                Find Your Next Culinary Adventure
              </h2>
            </div>
            <button
              onClick={() => navigate("/restaurants")}
              className="self-start sm:self-auto flex items-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-600 border border-primary-200 dark:border-primary-900/50 bg-primary-50 dark:bg-primary-950/20 hover:bg-primary-100 px-5 py-2.5 rounded-xl transition-all"
            >
              Explore All
              <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="mb-4 flex justify-center">
                <Logo className="w-20 h-20 opacity-40" iconOnly />
              </div>
              <h3 className="font-display text-xl font-semibold text-stone-900 dark:text-white mb-2">
                No Restaurants Yet
              </h3>
              <p className="text-stone-500 dark:text-stone-400">
                Be the first to list your restaurant on Culinara.
              </p>
              <button
                onClick={() => navigate("/register?role=restaurant_owner")}
                className="mt-6 btn-primary"
              >
                List Your Restaurant
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((r, i) => (
                <div key={r._id} style={{ animationDelay: `${i * 100}ms` }} className="animate-slide-up">
                  <RestaurantCard restaurant={r} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white dark:bg-stone-900 border-y border-cream-300 dark:border-stone-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-slide-up">
            <p className="section-label mb-2">Product Features</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white mb-4">
              Sophisticated Control for Modern Operations
            </h2>
            <p className="text-stone-500 dark:text-stone-400 max-w-2xl mx-auto text-base leading-relaxed">
              Every feature is engineered to reduce complexity, not add to it.
              From predictive prep to global compliance — Culinara handles the
              operations so you can focus on the cuisine.
            </p>
            <div className="w-16 h-0.5 bg-primary-500 mx-auto mt-6" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-cream-300 dark:border-stone-800 bg-cream-100 dark:bg-stone-950 hover:border-primary-200 dark:hover:border-primary-900/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 ${f.color} group-hover:scale-110 transition-transform duration-500`}>
                  <f.icon size={26} />
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-white text-base mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Feature highlight */}
          <div className="mt-16 animate-fade-in">
            <div className="bg-stone-900 dark:bg-stone-50 rounded-3xl p-8 sm:p-12 text-center">
              <Sparkles size={32} className="mx-auto text-primary-500 mb-4" />
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white dark:text-stone-900 mb-3">
                Built for Scale, Designed for Precision
              </h3>
              <p className="text-stone-300 dark:text-stone-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                Join 500+ restaurants across 12 countries that trust Culinara
                to power their daily operations with enterprise-grade reliability.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => navigate("/register?role=restaurant_owner")}
                  className="btn-primary text-base px-8 py-3.5"
                >
                  Start Free Trial
                  <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => navigate("/subscriptions")}
                  className="btn-secondary text-base px-8 py-3.5"
                >
                  View Pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-cream-200 dark:bg-stone-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-slide-up">
            <p className="section-label mb-2">How It Works</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white mb-4">
              From Setup to Scale in Days, Not Months
            </h2>
            <p className="text-stone-500 dark:text-stone-400 max-w-2xl mx-auto text-base leading-relaxed">
              Our white-glove onboarding gets you operational fast, with dedicated
              support at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Discovery & Strategy",
                desc: "We audit your operations, identify bottlenecks, and design a tailored implementation roadmap.",
                icon: MapPin,
              },
              {
                step: "02",
                title: "Rapid Deployment",
                desc: "Pre-configured templates, data migration, and staff training — live in 2-4 weeks.",
                icon: Zap,
              },
              {
                step: "03",
                title: "Continuous Optimization",
                desc: "Dedicated success manager, quarterly reviews, and ML-driven insights for ongoing growth.",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="relative group animate-slide-up"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="absolute -top-4 left-0 w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center font-bold text-xl">
                  {item.step}
                </div>
                <div className="pt-10 pb-6 px-6 bg-white dark:bg-stone-900 rounded-2xl border border-cream-300 dark:border-stone-800 hover:border-primary-200 dark:hover:border-primary-900/50 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary-500/20 transition-all duration-300">
                    <item.icon size={24} className="text-primary-500" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-stone-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-24 sm:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/60 to-black/75" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-slide-up">
            <Sparkles size={14} className="text-primary-400" />
            Redefine Your Standard of Service
          </div>
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-slide-up" style={{ animationDelay: "100ms" }}>
            Redefine Your Standard of Service
          </h2>
          <p className="text-white/60 text-base sm:text-lg mb-10 leading-relaxed max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "200ms" }}>
            Join the world's most prestigious culinary groups in standardising
            excellence across every location. No obligation — just results.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <button
              onClick={() => navigate("/register?role=restaurant_owner")}
              className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary-500/25"
            >
              Request Personal Consultation
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/subscriptions")}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl border border-white/20 transition-all"
            >
              View Enterprise Pricing
              <ExternalLink size={16} />
            </button>
          </div>
          <p className="text-white/30 text-xs mt-6 uppercase tracking-widest animate-fade-in" style={{ animationDelay: "400ms" }}>
            No obligation · Custom deployments available · 24/7 dedicated support
          </p>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="bg-stone-900 dark:bg-stone-950 border-t border-stone-800 py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Logo className="mx-auto mb-6" />
          <p className="text-stone-300 dark:text-stone-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Ready to transform your restaurant operations? Let's build something
            exceptional together.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => navigate("/register?role=restaurant_owner")}
              className="btn-primary text-base px-8 py-3.5"
            >
              Get Started Free
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="btn-secondary text-base px-8 py-3.5"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MouseScroll() {
  return (
    <svg
      width="24"
      height="40"
      viewBox="0 0 24 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-white/50"
    >
      <rect x="0.5" y="0.5" width="23" height="39" rx="11.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor">
        <animate
          attributeName="cy"
          values="12;24;12"
          dur="1.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="1;0.2;1"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}