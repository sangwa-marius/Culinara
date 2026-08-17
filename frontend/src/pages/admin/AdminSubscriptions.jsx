import { useState, useEffect } from "react";
import { CreditCard, Check, Zap, Crown, Rocket, TrendingUp } from "lucide-react";
import { restaurantAPI } from "../../services/api";
import toast from "react-hot-toast";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "$0",
    period: "/month",
    icon: Zap,
    accent: "stone",
    features: [
      "Up to 10 menu items",
      "1 restaurant location",
      "Basic analytics",
      "Email support",
      "Standard transaction fees",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "/month",
    icon: Rocket,
    accent: "blue",
    features: [
      "Unlimited menu items",
      "Up to 3 restaurant locations",
      "Advanced analytics & reports",
      "Priority support",
      "Reduced transaction fees",
      "Custom branding",
      "API access",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$199",
    period: "/month",
    icon: Crown,
    accent: "purple",
    features: [
      "Everything in Pro",
      "Unlimited locations",
      "White-label solution",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "Advanced security",
    ],
  },
];

const ACCENT_CLASSES = {
  stone: {
    text: "text-stone-700 dark:text-stone-200",
    bg: "bg-stone-100 dark:bg-stone-800",
    border: "border-stone-200 dark:border-stone-700",
    progress: "bg-stone-500",
  },
  blue: {
    text: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800/60",
    progress: "bg-blue-500",
  },
  purple: {
    text: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-800/60",
    progress: "bg-purple-500",
  },
};

export default function AdminSubscriptions() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data } = await restaurantAPI.getAllAdmin();
      setRestaurants(data.restaurants || []);
    } catch { toast.error("Failed to load restaurants"); }
    finally { setLoading(false); }
  };

  const counts = restaurants.reduce((acc, r) => {
    acc[r.subscription || "basic"] = (acc[r.subscription || "basic"] || 0) + 1;
    return acc;
  }, {});

  const total = restaurants.length || 1;
  const togglePlan = (id) => setExpandedPlan(prev => prev === id ? null : id);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-bold text-stone-900 dark:text-white text-xl">Subscriptions</h1>
          <p className="text-xs text-stone-400 mt-0.5">Manage and monitor restaurant subscription plans</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <CreditCard size={16} />
          <span>{total} total restaurants</span>
        </div>
      </div>

      {/* Distribution cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const count = counts[plan.id] || 0;
          const pct = ((count / total) * 100).toFixed(0);
          const accent = ACCENT_CLASSES[plan.accent];
          return (
            <div key={plan.id} className={`card p-5 border ${accent.border}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent.bg} ${accent.text}`}>
                    <plan.icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">{plan.name} Plan</p>
                    <p className={`text-2xl font-bold ${accent.text}`}>{count}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${accent.bg} ${accent.text}`}>
                  {pct}%
                </span>
              </div>
              <div className="w-full bg-cream-200 dark:bg-stone-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${accent.progress}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-stone-400 mt-2">{count} restaurant{count !== 1 ? "s" : ""} on this plan</p>
            </div>
          );
        })}
      </div>

      {/* Plans overview */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-primary-500" />
          <h2 className="font-semibold text-stone-900 dark:text-white">Available Plans</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const accent = ACCENT_CLASSES[plan.accent];
            return (
              <div key={plan.id} className={`card p-5 border flex flex-col`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent.bg} ${accent.text}`}>
                    <plan.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-stone-400">Subscription plan</p>
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-bold text-stone-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm text-stone-400">{plan.period}</span>
                </div>

                <button onClick={() => togglePlan(plan.id)} className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${accent.border} ${accent.text} hover:bg-cream-100 dark:hover:bg-stone-800`}>
                  {expandedPlan === plan.id ? "Hide Details" : "View Details"}
                </button>
                {expandedPlan === plan.id && (
                  <div className="mt-4 p-4 bg-cream-50 dark:bg-stone-800/60 rounded-xl border border-cream-200 dark:border-stone-700">
                    <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">What's included</p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-200">
                          <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-3 border-t border-cream-200 dark:border-stone-700 flex items-center justify-between">
                      <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">{plan.price}<span className="text-xs font-normal text-stone-400">{plan.period}</span></span>
                      <span className="text-xs text-stone-400">{counts[plan.id] || 0} active subscriptions</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
