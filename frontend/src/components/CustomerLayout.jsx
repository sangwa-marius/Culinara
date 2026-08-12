import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotificationContext } from "../context/NotificationContext";
import { useCart } from "../context/CartContext";
import {
  Package, Bell, User, Utensils, ShoppingCart,
  Home, Sun, Moon, LogOut, ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

const NAV = [
  { to: "/orders",        label: "My Orders",     icon: Package, exact: false },
  { to: "/notifications", label: "Notifications", icon: Bell,    exact: true,  badge: true },
  { to: "/profile",       label: "Profile",       icon: User,    exact: true },
];
const BOTTOM = [
  { to: "/restaurants", label: "Browse Restaurants", icon: Utensils },
  { to: "/cart",        label: "My Cart",            icon: ShoppingCart, cart: true },
  { to: "/",            label: "Back to Home",       icon: Home },
];

export default function CustomerLayout() {
  const { user, logout }       = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount }        = useNotificationContext();
  const { totalItems }         = useCart();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const isActive = ({ to, exact }) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const pageLabel = () => {
    if (location.pathname.startsWith("/orders/")) return "Order Details";
    if (location.pathname === "/orders")           return "My Orders";
    if (location.pathname === "/notifications")    return "Notifications";
    if (location.pathname === "/profile")          return "Profile";
    return "Account";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-cream-100 dark:bg-stone-950">
      <aside className="w-[200px] shrink-0 bg-white dark:bg-stone-950 border-r border-cream-300 dark:border-stone-800 flex flex-col">
        <div className="px-4 py-4 border-b border-cream-300 dark:border-stone-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0">
              <Utensils size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-stone-800 dark:text-white text-sm leading-tight">Culinara</p>
              <p className="text-[10px] text-stone-400 leading-tight">My Account</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, exact, badge }) => (
            <Link key={to} to={to}
              className={clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive({ to, exact })
                  ? "bg-primary-500 text-white"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-cream-200 dark:hover:bg-stone-800")}>
              <Icon size={16} className="shrink-0" />
              {label}
              {badge && unreadCount > 0 && (
                <span className={clsx("ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                  isActive({ to, exact }) ? "bg-white/25 text-white" : "bg-red-500 text-white")}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-2 border-t border-cream-300 dark:border-stone-800 space-y-0.5">
          {BOTTOM.map(({ to, label, icon: Icon, cart }) => (
            <Link key={to} to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all duration-150">
              <Icon size={16} className="shrink-0" />
              {label}
              {cart && totalItems > 0 && (
                <span className="ml-auto bg-primary-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{totalItems}</span>
              )}
            </Link>
          ))}
        </div>

        <div className="px-3 py-3 border-t border-cream-300 dark:border-stone-800" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-stone-800 transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-stone-800 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-stone-400">Customer</p>
            </div>
            <ChevronDown size={12} className={clsx("text-stone-400 transition-transform shrink-0", menuOpen && "rotate-180")} />
          </button>
          {menuOpen && (
            <div className="mt-1 bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-xl shadow-lg overflow-hidden animate-slide-up">
              <div className="border-t border-cream-200 dark:border-stone-700" />
              <button onClick={() => { logout(); navigate("/"); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white dark:bg-stone-900 border-b border-cream-300 dark:border-stone-800 flex items-center justify-between px-6 shrink-0">
          <span className="text-sm font-semibold text-stone-900 dark:text-white">{pageLabel()}</span>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all">
              {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <Link to="/cart" className="relative p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all">
              <ShoppingCart size={16} />
              {totalItems > 0 && <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[9px] min-w-[15px] h-[15px] rounded-full flex items-center justify-center font-bold">{totalItems}</span>}
            </Link>
            <Link to="/notifications" className="relative p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all">
              <Bell size={16} />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] min-w-[15px] h-[15px] rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </Link>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs ml-1">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}