import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotificationContext } from "../context/NotificationContext";
import {
  LayoutDashboard, Inbox, Truck, ClipboardList,
  Bell, User, Home, Sun, Moon, LogOut, ChevronDown, Menu,
} from "lucide-react";
import SafeAvatar from "./SafeImage";
import clsx from "clsx";

const NAV = [
  { to: "/driver",           label: "Dashboard",        icon: LayoutDashboard, exact: true },
  { to: "/driver/available", label: "Available Orders", icon: Inbox },
  { to: "/driver/active",    label: "My Deliveries",    icon: Truck },
  { to: "/driver/history",   label: "History",          icon: ClipboardList },
];
const BOTTOM = [
  { to: "/notifications", label: "Notifications", icon: Bell,   badge: true },
  { to: "/profile",       label: "Profile",        icon: User },
  { to: "/",              label: "Back to App",    icon: Home },
];

export default function DriverLayout() {
  const { user, logout }       = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount }        = useNotificationContext();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  useEffect(() => { setMenuOpen(false); setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isActive = ({ to, exact }) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const pageLabel = () => {
    const p = location.pathname;
    if (p === "/driver")              return "Dashboard";
    if (p.includes("available"))      return "Available Orders";
    if (p.includes("active"))         return "My Deliveries";
    if (p.includes("history"))        return "Delivery History";
    return "Dashboard";
  };

  const SidebarContent = () => (
    <>
      <div className="px-4 py-4 border-b border-cream-300 dark:border-stone-800">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0">
            <Truck size={16} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-stone-800 dark:text-white text-sm leading-tight">Culinara</p>
            <p className="text-[10px] text-stone-400 leading-tight">Driver Portal</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border-l-2",
              isActive({ to, exact })
                ? "bg-primary-50 dark:bg-primary-950/20 border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-cream-200 dark:hover:bg-stone-800")}>
            <Icon size={16} className="shrink-0" />{label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-2 border-t border-cream-300 dark:border-stone-800 space-y-0.5">
        {BOTTOM.map(({ to, label, icon: Icon, badge }) => (
          <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all duration-150">
            <Icon size={16} className="shrink-0" />{label}
            {badge && unreadCount > 0 && (
              <span className="ml-auto w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold bg-red-500 text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </Link>
        ))}
      </div>

      <div className="px-3 py-3 border-t border-cream-300 dark:border-stone-800" ref={menuRef}>
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-stone-800 transition-colors">
          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
            <SafeAvatar src={user?.avatar} name={user?.name} size="w-7 h-7" textSize="text-xs" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-stone-800 dark:text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-stone-400">Delivery Driver</p>
          </div>
          <ChevronDown size={12} className={clsx("text-stone-400 transition-transform shrink-0", menuOpen && "rotate-180")} />
        </button>
        {menuOpen && (
          <div className="mt-1 bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-xl shadow-lg overflow-hidden animate-slide-up">
            <Link to="/profile" className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-cream-100 dark:hover:bg-stone-800 transition-colors">
              <User size={13} className="text-stone-400" /> Profile
            </Link>
            <div className="border-t border-cream-200 dark:border-stone-700" />
            <button onClick={() => { logout(); navigate("/"); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-cream-100 dark:bg-stone-950">
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <aside ref={sidebarRef}
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-[200px] shrink-0 bg-white dark:bg-stone-950 border-r border-cream-300 dark:border-stone-800 flex flex-col transform transition-transform duration-300 ease-in-out shadow-lg md:shadow-none",
          "md:relative md:translate-x-0 md:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="p-4 bg-white dark:bg-stone-900 border-b border-cream-300 dark:border-stone-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all">
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-stone-900 dark:text-white">{pageLabel()}</span>
            <span className="hidden sm:inline-block text-xs text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded font-medium">Driver Portal</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all">
              {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <Link to="/notifications" className="relative p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all">
              <Bell size={16} />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </Link>
            <div className="w-7 h-7 rounded-full overflow-hidden ml-1 hidden sm:flex">
              <SafeAvatar src={user?.avatar} name={user?.name} size="w-7 h-7" textSize="text-xs" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
