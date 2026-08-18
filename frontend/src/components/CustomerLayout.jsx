import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotificationContext } from "../context/NotificationContext";
import { useCart } from "../context/CartContext";
import {
  LayoutDashboard,
  Package,
  Bell,
  User,
  Utensils,
  ShoppingCart,
  Home,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
} from "lucide-react";
import SafeAvatar from "./SafeImage";
import ConfirmDialog from "./ConfirmDialog";
import Logo from "./Logo";
import clsx from "clsx";

const NAV = [
  { to: "/overview", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/orders", label: "My Orders", icon: Package, exact: false },
  {
    to: "/notifications",
    label: "Notifications",
    icon: Bell,
    exact: true,
    badge: true,
  },
  { to: "/profile", label: "Profile", icon: User, exact: true },
];
const BOTTOM = [{ to: "/", label: "Back to Home", icon: Home }];

const GROUPS = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        to: "/overview",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { to: "/orders", label: "My Orders", icon: Package, exact: false },
      {
        to: "/notifications",
        label: "Notifications",
        icon: Bell,
        exact: true,
        badge: true,
      },
      { to: "/profile", label: "Profile", icon: User, exact: true },
    ],
  },
  {
    id: "shopping",
    label: "Shopping",
    items: [
      { to: "/restaurants", label: "Restaurants", icon: Utensils },
      { to: "/cart", label: "My Cart", icon: ShoppingCart, cart: true },
    ],
  },
];

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotificationContext();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    overview: true,
    account: true,
    shopping: true,
  });
  const menuRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const fn = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  useEffect(() => {
    setMenuOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isActive = ({ to, exact }) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const pageLabel = () => {
    if (location.pathname === "/overview") return "Dashboard";
    if (location.pathname.startsWith("/orders/")) return "Order Details";
    if (location.pathname === "/orders") return "My Orders";
    if (location.pathname === "/notifications") return "Notifications";
    if (location.pathname === "/profile") return "Profile";
    if (location.pathname === "/cart") return "My Cart";
    if (location.pathname === "/checkout") return "Checkout";
    if (location.pathname === "/restaurants") return "Browse Restaurants";
    if (location.pathname.startsWith("/restaurants/"))
      return "Restaurant Details";
    return "My Account";
  };

  const SidebarContent = () => (
    <>
      <div className="px-4 py-4 border-b border-cream-300 dark:border-stone-800">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="w-8 h-8 shrink-0">
            <Logo className="w-8 h-8" iconOnly />
          </div>
          <div>
            <p className="font-display font-bold text-stone-800 dark:text-white text-sm leading-tight">
              Culinara
            </p>
            <p className="text-[10px] text-stone-400 leading-tight">
              My Account
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {GROUPS.map((group) => {
          const isOpen = openGroups[group.id];
          return (
            <div key={group.id} className="pt-1">
              <button
                onClick={() =>
                  setOpenGroups((prev) => ({
                    ...prev,
                    [group.id]: !prev[group.id],
                  }))
                }
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                  size={12}
                  className={clsx(
                    "transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && (
                <div className="space-y-0.5 ml-1">
                  {group.items.map(
                    ({ to, label, icon: Icon, exact, badge, cart }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setSidebarOpen(false)}
                        className={clsx(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                          isActive({ to, exact: exact ?? false })
                            ? "bg-primary-500 text-white"
                            : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-cream-200 dark:hover:bg-stone-800",
                        )}
                      >
                        <Icon size={15} className="shrink-0" />
                        {label}
                        {badge && unreadCount > 0 && (
                          <span
                            className={clsx(
                              "ml-auto w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold",
                              isActive({ to, exact: exact ?? false })
                                ? "bg-white/25 text-white"
                                : "bg-red-500 text-white",
                            )}
                          >
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                        {cart && totalItems > 0 && (
                          <span className="ml-auto w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold bg-primary-500 text-white">
                            {totalItems > 9 ? "9+" : totalItems}
                          </span>
                        )}
                      </Link>
                    ),
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div
        className="px-3 py-3 border-t border-cream-300 dark:border-stone-800"
        ref={menuRef}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-stone-800 transition-colors"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
            <SafeAvatar
              src={user?.avatar}
              name={user?.name}
              size="w-7 h-7"
              textSize="text-xs"
            />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-stone-800 dark:text-white truncate">
              {user?.name}
            </p>
            <p className="text-[10px] text-stone-400">Customer</p>
          </div>
          <ChevronDown
            size={12}
            className={clsx(
              "text-stone-400 transition-transform shrink-0",
              menuOpen && "rotate-180",
            )}
          />
        </button>
        {menuOpen && (
          <div className="mt-1 bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-xl shadow-lg overflow-hidden animate-slide-up">
            <div className="border-t border-cream-200 dark:border-stone-700" />
            <button
              onClick={() => setLogoutConfirm(true)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
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
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        ref={sidebarRef}
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-[200px] shrink-0 bg-white dark:bg-stone-950 border-r border-cream-300 dark:border-stone-800 flex flex-col transform transition-transform duration-300 ease-in-out",
          "md:relative md:translate-x-0 md:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="py-4 bg-white dark:bg-stone-950 border-b border-cream-300 dark:border-stone-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-stone-900 dark:text-white">
              {pageLabel()}
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all"
            >
              {theme === "dark" ? (
                <Sun size={16} className="text-amber-400" />
              ) : (
                <Moon size={16} />
              )}
            </button>
            <Link
              to="/cart"
              className="relative p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all"
            >
              <ShoppingCart size={16} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-cream-200 dark:hover:bg-stone-800 transition-all"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <div className="w-7 h-7 rounded-full overflow-hidden ml-1 hidden sm:flex">
              <SafeAvatar
                src={user?.avatar}
                name={user?.name}
                size="w-7 h-7"
                textSize="text-xs"
              />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <ConfirmDialog
        open={logoutConfirm}
        title="Sign out?"
        message="You will need to log in again to access your account."
        confirmLabel="Sign Out"
        variant="danger"
        onConfirm={() => {
          setLogoutConfirm(false);
          logout();
          navigate("/");
        }}
        onCancel={() => setLogoutConfirm(false)}
      />
    </div>
  );
}
