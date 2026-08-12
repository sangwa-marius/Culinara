import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";

const PLANS = [
  {
    tier: "ENTRY LEVEL",
    name: "Basic",
    price: 49,
    features: ["Up to 250 orders / month","Basic Inventory Management","Digital Menu Builder","Email Support","QR Code Ordering"],
    cta: "Select Plan",
    highlight: false,
  },
  {
    tier: "GROWTH FOCUS",
    name: "Pro",
    price: 129,
    features: ["Unlimited Monthly Orders","Advanced Analytics Dashboard","Automated Restock Alerts","Loyalty Program Integration","24/7 Priority Support","Kitchen Display System","Staff Management"],
    cta: "Select Plan",
    highlight: true,
    badge: "Most Popular",
  },
  {
    tier: "MULTI-LOCATION",
    name: "Enterprise",
    price: 349,
    features: ["Multi-Outlet Management","Custom API Integrations","White-labelled Guest Apps","Dedicated Success Manager","Custom Compliance Engine","Multi-currency Support","SLA Guarantee"],
    cta: "Contact Sales",
    highlight: false,
  },
];

const WHY = [
  { icon: "⚡", title: "Operational Speed",   desc: "Reduce order latency by 35% with our optimized kitchen display systems." },
  { icon: "📊", title: "Real-time Data",      desc: "Track food waste and inventory levels in real-time across all locations." },
  { icon: "🔒", title: "Enterprise Security", desc: "PCI-DSS compliant payment processing and encrypted customer data." },
  { icon: "👥", title: "Team Synergy",        desc: "Role-based permissions for front-of-house, kitchen, and management." },
];

export default function Subscriptions() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-cream-200 dark:bg-stone-950 pt-16">
      {/* Hero */}
      <div className="relative py-20 text-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4">
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">Elevate Your Operations</h1>
          <p className="text-white/60 text-base leading-relaxed">
            Choose a subscription plan that scales with your restaurant's growth, from local bistros to global franchises.
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {PLANS.map(plan => (
            <div key={plan.name} className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all ${
              plan.highlight
                ? "border-primary-500 bg-white dark:bg-stone-900 shadow-xl shadow-primary-500/10"
                : "border-cream-400 dark:border-stone-800 bg-white dark:bg-stone-900"
            }`}>
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                  {plan.badge}
                </div>
              )}
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-500 mb-1">{plan.tier}</p>
                <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-white">{plan.name}</h2>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold text-stone-900 dark:text-white">${plan.price}</span>
                  <span className="text-stone-400 text-sm">/month</span>
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle size={15} className="text-primary-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-stone-600 dark:text-stone-300">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate(plan.name === "Enterprise" ? "#" : "/register?role=restaurant_owner")}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                  plan.highlight
                    ? "bg-primary-500 hover:bg-primary-600 text-white"
                    : "border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Why */}
      <section className="bg-white dark:bg-stone-900 border-t border-cream-300 dark:border-stone-800 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-white text-center mb-10">Why Restaurants Trust Culinara</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {WHY.map(w => (
              <div key={w.title} className="flex gap-4">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/40 rounded-xl flex items-center justify-center text-lg shrink-0">{w.icon}</div>
                <div>
                  <h3 className="font-semibold text-stone-900 dark:text-white text-sm mb-1">{w.title}</h3>
                  <p className="text-stone-500 text-xs leading-relaxed">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
