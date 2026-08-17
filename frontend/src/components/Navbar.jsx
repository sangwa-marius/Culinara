import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Bell,
  Menu,
  X,
  LogOut,
  Settings,
  Package,
  LayoutDashboard,
  CheckCheck,
  Sun,
  Moon,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useNotificationContext } from "../context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import SafeAvatar from "./SafeImage";
import ConfirmDialog from "./ConfirmDialog";
import Logo from "./Logo";
import clsx from "clsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markOneRead, markAllRead } =
    useNotificationContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    setNotifOpen(false);
    setDropOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setLogoutConfirm(true);
  };
  const getDashLink = () => {
    if (user?.role === "restaurant_owner") return "/dashboard";
    if (user?.role === "admin") return "/admin";
    if (user?.role === "delivery_driver") return "/driver";
    return "/profile";
  };

  const isLoggedOut = !user;
  const transparent = isHome && !scrolled;

  return (
    <>
      <nav
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isLoggedOut
            ? "bg-white dark:bg-stone-900 backdrop-blur-xl border-b border-white/30 dark:border-stone-700/30"
            : transparent
              ? "bg-transparent"
              : "bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl border-b border-cream-300 dark:border-stone-800 shadow-sm",
        )}
      >
      <div
        className={clsx(
          "mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between",
          isLoggedOut ? "max-w-6xl py-3" : "max-w-7xl h-16",
        )}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <Logo className="h-7 w-auto transition-transform duration-300 group-hover:scale-110 dark:text-white" iconOnly/>
          <span className="dark:text-white text-md font-medium">
            Culinara
          </span>
          </Link>
          

        {/* Desktop nav */}
        {user && (
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: "/restaurants", label: "Explore" },
              { to: "/subscriptions", label: "Pricing" },
              { to: "/orders", label: "Orders" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  location.pathname === to
                    ? "text-primary-500 bg-primary-50 dark:bg-primary-950/30"
                    : transparent
                      ? "text-white/80 hover:text-white hover:bg-white/10"
                      : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-cream-200 dark:hover:bg-stone-800",
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-1" ref={dropRef}>
          <button
            onClick={toggleTheme}
            className={clsx(
              "p-2.5 rounded-lg transition-all",
              isLoggedOut
                ? "text-stone-700 hover:text-stone-900 dark:text-stone-200 dark:hover:text-white hover:bg-white/60 dark:hover:bg-stone-800/60"
                : transparent
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-stone-500 hover:text-stone-900 dark:text-stone-400 hover:bg-cream-200 dark:hover:bg-stone-800",
            )}
          >
            {theme === "dark" ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} />
            )}
          </button>

          {user && (
            <Link
              to="/cart"
              className={clsx(
                "relative p-2.5 rounded-lg transition-all",
                transparent
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-stone-500 hover:text-stone-900 dark:text-stone-400 hover:bg-cream-200 dark:hover:bg-stone-800",
              )}
            >
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[10px] min-w-[17px] h-[17px] px-0.5 rounded-full flex items-center justify-center font-bold">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <>
              {/* Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setDropOpen(false);
                  }}
                  className={clsx(
                    "relative p-2.5 rounded-lg transition-all",
                    unreadCount > 0
                      ? "text-primary-500"
                      : transparent
                        ? "text-white/70 hover:text-white hover:bg-white/10"
                        : "text-stone-500 hover:text-stone-900 dark:text-stone-400 hover:bg-cream-200 dark:hover:bg-stone-800",
                  )}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[17px] h-[17px] px-0.5 rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-80 card animate-slide-down shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-cream-300 dark:border-stone-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 dark:text-white text-sm">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <span className="bg-red-100 text-red-600 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-primary-500 font-semibold flex items-center gap-1 hover:text-primary-600"
                        >
                          <CheckCheck size={12} /> All read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-8 text-center text-stone-400 text-sm">
                          No notifications yet
                        </p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n._id}
                            onClick={() => {
                              if (!n.isRead) markOneRead(n._id);
                              if (n.orderId) {
                                navigate(`/orders/${n.orderId}`);
                                setNotifOpen(false);
                              }
                            }}
                            className={clsx(
                              "px-4 py-3 border-b border-cream-200 dark:border-stone-800 last:border-0 cursor-pointer hover:bg-cream-100 dark:hover:bg-stone-800 transition-colors flex gap-3",
                              !n.isRead &&
                                "bg-primary-50/30 dark:bg-primary-950/20",
                            )}
                          >
                            <span className="text-lg shrink-0">
                              {{
                                order: "📦",
                                promo: "🎉",
                                system: "🔔",
                                delivery_request: "🛵",
                              }[n.type] || "🔔"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p
                                className={clsx(
                                  "text-xs leading-snug",
                                  n.isRead
                                    ? "text-stone-500"
                                    : "text-stone-800 dark:text-stone-100 font-medium",
                                )}
                              >
                                {n.message}
                              </p>
                              <p className="text-[10px] text-stone-400 mt-0.5">
                                {(() => {
                                  try {
                                    return formatDistanceToNow(
                                      new Date(n.createdAt),
                                      { addSuffix: true },
                                    );
                                  } catch {
                                    return "just now";
                                  }
                                })()}
                              </p>
                            </div>
                            {!n.isRead && (
                              <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2.5 border-t border-cream-300 dark:border-stone-700">
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs text-primary-500 font-semibold flex items-center justify-center gap-1 hover:text-primary-600"
                      >
                        View all <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div className="relative ml-1">
                <button
                  onClick={() => {
                    setDropOpen(!dropOpen);
                    setNotifOpen(false);
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all",
                    transparent
                      ? "hover:bg-white/10"
                      : "hover:bg-cream-200 dark:hover:bg-stone-800",
                  )}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-white dark:ring-stone-900">
                    <SafeAvatar
                      src={user?.avatar}
                      name={user?.name}
                      size="w-7 h-7"
                      textSize="text-xs"
                    />
                  </div>
                  <span
                    className={clsx(
                      "hidden md:block text-sm font-medium",
                      transparent
                        ? "text-white/90"
                        : "text-stone-700 dark:text-stone-200",
                    )}
                  >
                    {user.name?.split(" ")[0]}
                  </span>
                  <ChevronDown
                    size={13}
                    className={clsx(
                      dropOpen && "rotate-180",
                      "transition-transform hidden md:block",
                      transparent ? "text-white/60" : "text-stone-400",
                    )}
                  />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-52 card animate-slide-down shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-cream-300 dark:border-stone-700">
                      <p className="font-semibold text-stone-900 dark:text-white text-sm truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-stone-400 capitalize">
                        {user.role?.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="py-1">
                      {[
                        {
                          to: getDashLink(),
                          icon: <LayoutDashboard size={14} />,
                          label: "Dashboard",
                        },
                        {
                          to: "/orders",
                          icon: <Package size={14} />,
                          label: "My Orders",
                        },
                        {
                          to: "/profile",
                          icon: <Settings size={14} />,
                          label: "Profile",
                        },
                      ].map(({ to, icon, label }) => (
                        <Link
                          key={to}
                          to={to}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 dark:text-stone-300 hover:bg-cream-100 dark:hover:bg-stone-800 transition-colors"
                        >
                          <span className="text-stone-400">{icon}</span>
                          {label}
                        </Link>
                      ))}
                      <div className="my-1 border-t border-cream-300 dark:border-stone-700" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full transition-colors"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2 ml-2">
              <Link
                to="/login"
                className={clsx(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  isLoggedOut
                    ? "text-stone-700 hover:bg-white/60 dark:text-stone-100 dark:hover:bg-stone-800/60"
                    : transparent
                      ? "text-white/80 hover:text-white hover:bg-white/10"
                      : "text-stone-600 hover:bg-cream-200 dark:text-stone-300 dark:hover:bg-stone-800",
                )}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className={clsx(
                  "btn-primary text-sm py-2 px-4",
                  isLoggedOut &&
                    "bg-primary-600 hover:bg-primary-700 text-white",
                )}
              >
                Sign Up
              </Link>
            </div>
          )}

          <button
            className={clsx(
              "md:hidden p-2.5 rounded-lg transition-all ml-1",
              isLoggedOut
                ? "text-stone-700 hover:bg-white/60 dark:text-stone-100 dark:hover:bg-stone-800/60"
                : transparent
                  ? "text-white/70 hover:bg-white/10"
                  : "text-stone-600 hover:bg-cream-200 dark:hover:bg-stone-800",
            )}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className={clsx(
            "md:hidden border-t px-4 py-3 space-y-1 animate-slide-down",
            isLoggedOut
              ? "bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-white/30 dark:border-stone-700/30"
              : "bg-white dark:bg-stone-950 border-cream-300 dark:border-stone-800",
          )}
        >
          {user &&
            [
              { to: "/restaurants", label: "Explore" },
              { to: "/subscriptions", label: "Pricing" },
              { to: "/orders", label: "My Orders" },
              { to: getDashLink(), label: "Dashboard" },
              { to: "/profile", label: "Profile" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="block px-3 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                {label}
              </Link>
            ))}
          {!user &&
            [
              { to: "/login", label: "Sign In" },
              { to: "/register", label: "Sign Up" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="block px-3 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-cream-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                {label}
              </Link>
            ))}
          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 w-full rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          )}
          <div className="pt-1 border-t border-cream-300 dark:border-stone-700">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-stone-600 dark:text-stone-300 w-full rounded-lg hover:bg-cream-200 dark:hover:bg-stone-800 transition-colors"
            >
              {theme === "dark" ? (
                <Sun size={14} className="text-amber-400" />
              ) : (
                <Moon size={14} />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>
      )}
    </nav>

    <ConfirmDialog
      open={logoutConfirm}
      title="Sign out?"
      message="You will need to log in again to access your account."
      confirmLabel="Sign Out"
      variant="danger"
      onConfirm={() => { setLogoutConfirm(false); logout(); navigate("/"); }}
      onCancel={() => setLogoutConfirm(false)}
    />
    </>
  );
}
