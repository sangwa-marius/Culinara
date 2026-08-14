import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SafeAvatar from "./SafeImage";
import clsx from "clsx";

/**
 * Generic sidebar — used by AdminDashboard.
 * Each item: { to, label, icon: LucideComponent, exact?, badge? }
 */
export default function Sidebar({ items, bottomItems, title, subtitle }) {
  const { user }   = useAuth();
  const location   = useLocation();

  const isActive = (item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  const renderIcon = (IconOrStr) => {
    if (!IconOrStr) return null;
    if (typeof IconOrStr === "string") return <span className="text-base">{IconOrStr}</span>;
    return <IconOrStr size={16} className="shrink-0" />;
  };

  return (
    <aside className="w-[200px] shrink-0 bg-white dark:bg-stone-950 border-r border-cream-300 dark:border-stone-800 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-cream-300 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white text-xs font-bold shrink-0">🍽️</div>
          <div>
            <p className="font-semibold text-stone-800 dark:text-white text-sm leading-tight">{title || "Culinara"}</p>
            <p className="text-[11px] text-stone-400 leading-tight">{subtitle || "Management"}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items?.map((item) => (
          <Link key={item.to} to={item.to}
            className={clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              isActive(item)
                ? "bg-primary-500 text-white"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-cream-200 dark:hover:bg-stone-800")}>
            {renderIcon(item.icon)}
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span className="ml-auto bg-white/25 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{item.badge > 9 ? "9+" : item.badge}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      {bottomItems && (
        <div className="px-3 py-3 border-t border-cream-300 dark:border-stone-800 space-y-0.5">
          {bottomItems.map((item) => (
            <Link key={item.to} to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all duration-150">
              {renderIcon(item.icon)}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* User footer */}
      <div className="px-3 py-3 border-t border-cream-300 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
            <SafeAvatar src={user?.avatar} name={user?.name} size="w-7 h-7" textSize="text-xs" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-stone-800 dark:text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-stone-400 capitalize">{user?.role?.replace(/_/g, " ")}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}