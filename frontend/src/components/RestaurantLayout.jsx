import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotificationContext } from "../context/NotificationContext";
import {
  LayoutDashboard, Package, BookOpen, Layers, Armchair,
  ChefHat, BarChart3, Settings, Home, Sun, Moon, Bell,
  LogOut, ChevronDown, User, ShoppingCart, Store,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

const getAvatar = (user) => {
  if (user?.avatar) return user.avatar;
  return "";
};

const getInitial = (user) => user?.name?.charAt(0).toUpperCase() || "?";

const GROUPS = [
  {
    id: "operations",
    label: "Operations",
    items: [
      { to: "/dashboard/orders",      label: "Orders",       icon: Package },
      { to: "/dashboard/menu",        label: "Menu Items",   icon: BookOpen },
      { to: "/dashboard/collections", label: "Collections",  icon: Layers },
      { to: "/dashboard/tables",      label: "Tables",       icon: Armchair },
      { to: "/dashboard/kitchen",     label: "Kitchen",      icon: ChefHat },
      { to: "/dashboard/analytics",   label: "Analytics",    icon: BarChart3 },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { to: "/dashboard/setup",     label: "Settings",      icon: Settings },
      { to: "/dashboard/profile",   label: "Profile",       icon: User },
      { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    id: "shopping",
    label: "Shopping",
    items: [
      { to: "/cart",         label: "My Cart",          icon: ShoppingCart },
      { to: "/restaurants",  label: "Browse Restaurants", icon: Store },
    ],
  },
];

const TOP_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
];

const BOTTOM_ITEMS = [
  { to: "/", label: "Back to Home", icon: Home },
];

export default function RestaurantLayout() {
  const { user, logout }       = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount }        = useNotificationContext();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({ operations: true, account: false, shopping: false });
  const menuRef = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  useEffect(() => setUserMenuOpen(false), [location.pathname]);

  const isActive = ({ to, exact }) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const toggleGroup = (id) => setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));

  const handleLogout = () => { logout(); navigate("/"); };

  const pageLabel = () => {
    const p = location.pathname;
    if (p === "/dashboard")              return "Dashboard";
    if (p.includes("orders"))            return "Orders";
    if (p.includes("collections"))       return "Menu Collections";
    if (p.includes("menu"))              return "Menu Manager";
    if (p.includes("tables"))            return "Tables";
    if (p.includes("kitchen"))           return "Kitchen Display";
    if (p.includes("analytics"))         return "Analytics";
    if (p.includes("setup"))             return "Restaurant Settings";
    return "Dashboard";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-cream-100 dark:bg-stone-950">
      <aside className="w-[200px] shrink-0 bg-white dark:bg-stone-950 border-r border-cream-300 dark:border-stone-800 flex flex-col">
        <div className="px-4 py-4 border-b border-cream-300 dark:border-stone-800">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0">
              <ChefHat size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-stone-800 dark:text-white text-sm leading-tight">Culinara</p>
              <p className="text-[10px] text-stone-400 leading-tight">Store Management</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {TOP_ITEMS.map(({ to, label, icon: Icon, exact }) => (
            <Link key={to} to={to}
              className={clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive({ to, exact })
                  ? "bg-primary-500 text-white"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-cream-200 dark:hover:bg-stone-800")}>
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          ))}

          {GROUPS.map(group => {
            const isOpen = openGroups[group.id];
            return (
              <div key={group.id} className="pt-1">
                <button onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown size={12} className={clsx("transition-transform duration-200", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="space-y-0.5 ml-1">
                    {group.items.map(({ to, label, icon: Icon }) => (
                      <Link key={to} to={to}
                        className={clsx("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                          isActive({ to, exact: false })
                            ? "bg-primary-500 text-white"
                            : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-cream-200 dark:hover:bg-stone-800")}>
                        <Icon size={15} className="shrink-0" />
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-3 py-2 border-t border-cream-300 dark:border-stone-800 space-y-0.5">
          {BOTTOM_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive({ to, exact: true })
                  ? "bg-primary-500 text-white"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-cream-200 dark:hover:bg-stone-800")}>
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        <div className="px-3 py-3 border-t border-cream-300 dark:border-stone-800" ref={menuRef}>
          <button onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-stone-800 transition-colors">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {getAvatar(user) ? (
                <img src={getAvatar(user)} alt={user?.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
              ) : (
                getInitial(user)
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-stone-800 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-stone-400">Restaurant Owner</p>
            </div>
            <ChevronDown size={12} className={clsx("text-stone-400 transition-transform shrink-0", userMenuOpen && "rotate-180")} />
          </button>
          {userMenuOpen && (
            <div className="mt-1 bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-xl shadow-lg overflow-hidden animate-slide-up">
              <Link to="/dashboard/profile" className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-cream-100 dark:hover:bg-stone-800 transition-colors">
                <User size={13} className="text-stone-400" /> Profile Settings
              </Link>
              <Link to="/dashboard/notifications" className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-cream-100 dark:hover:bg-stone-800 transition-colors">
                <Bell size={13} className="text-stone-400" /> Notifications
                {unreadCount > 0 && <span className="ml-auto bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>}
              </Link>
              <div className="border-t border-cream-200 dark:border-stone-700" />
              <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white dark:bg-stone-900 border-b border-cream-300 dark:border-stone-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-stone-900 dark:text-white">{pageLabel()}</span>
            <span className="text-xs text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded font-medium">Store Management</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all">
              {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <Link to="/dashboard/notifications" className="relative p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all">
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] min-w-[15px] h-[15px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
