import { Link } from "react-router-dom";

const LINKS = {
  Product: [
    { label: "Features", to: "#" },
    { label: "Pricing", to: "/subscriptions" },
    { label: "Integrations", to: "#" },
    { label: "Security", to: "#" },
  ],
  Company: [
    { label: "About Us", to: "#" },
    { label: "Careers", to: "#" },
    { label: "Press Kit", to: "#" },
    { label: "Contact", to: "#" },
  ],
  Support: [
    { label: "Partner Support", to: "#" },
    { label: "Documentation", to: "#" },
    { label: "Contact Us", to: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
    { label: "Compliance", to: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-cream-900 dark:bg-stone-950 text-stone-400 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12 border-b border-stone-800">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4 w-fit">
              <span className="text-xl">🍽️</span>
              <span className="font-display font-bold text-lg text-black dark:text-white">
                Culinara
              </span>
            </Link>
            <p className="text-sm text-stone-500 leading-relaxed max-w-xs mb-4">
              Precision management for the future of fine dining and casual
              eateries alike. Elevating restaurant operations with data-driven
              intelligence.
            </p>
            <div className="flex items-center gap-3 text-stone-500 text-sm">
              <span>🇷🇼 Kigali, Rwanda</span>
            </div>
          </div>
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-black dark:text-white font-semibold text-xs uppercase tracking-widest mb-4">
                {group}
              </h4>
              <ul className="space-y-2.5">
                {items.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm text-stone-500 hover:text-stone-300 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5 text-xs text-stone-600">
          <p>
            © {new Date().getFullYear()} Culinara Management Systems. All rights
            reserved.
          </p>
          <p className="text-stone-700 uppercase tracking-widest text-[10px]">
            Designed for Excellence
          </p>
        </div>
      </div>
    </footer>
  );
}
