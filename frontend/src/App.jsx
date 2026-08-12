import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider }         from "./context/AuthContext";
import { CartProvider }         from "./context/CartContext";
import { ThemeProvider }        from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import Navbar            from "./components/Navbar";
import Footer            from "./components/Footer";
import RestaurantLayout  from "./components/RestaurantLayout";
import DriverLayout      from "./components/DriverLayout";
import CustomerLayout    from "./components/CustomerLayout";
import AdminLayout       from "./components/AdminLayout";
import ProtectedRoute    from "./components/ProtectedRoute";
import Spinner           from "./components/Spinner";

// ── Eagerly loaded ────────────────────────────────────────────────────────────
import Home        from "./pages/Home";
import Login       from "./pages/Login";
import Register    from "./pages/Register";
import Restaurants from "./pages/Restaurants";

// ── Public lazy ───────────────────────────────────────────────────────────────
const RestaurantDetail = lazy(() => import("./pages/RestaurantDetail"));
const TablePublic      = lazy(() => import("./pages/TablePublic"));
const Cart             = lazy(() => import("./pages/Cart"));
const Checkout         = lazy(() => import("./pages/Checkout"));
const ForgotPassword   = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword    = lazy(() => import("./pages/ResetPassword"));
const Subscriptions    = lazy(() => import("./pages/Subscriptions"));
const TermsOfService   = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy    = lazy(() => import("./pages/PrivacyPolicy"));

// ── Customer portal (nested under CustomerLayout) ─────────────────────────────
const MyOrders         = lazy(() => import("./pages/MyOrders"));
const OrderTracking    = lazy(() => import("./pages/OrderTracking"));
const Notifications    = lazy(() => import("./pages/Notifications"));
const Profile          = lazy(() => import("./pages/Profile"));

// ── Owner portal (nested under RestaurantLayout) ──────────────────────────────
const RestaurantDashboard = lazy(() => import("./pages/dashboard/RestaurantDashboard"));
const RestaurantOrders    = lazy(() => import("./pages/dashboard/RestaurantOrders"));
const RestaurantAnalytics = lazy(() => import("./pages/dashboard/RestaurantAnalytics"));
const MenuManager         = lazy(() => import("./pages/dashboard/MenuManager"));
const MenuCollections     = lazy(() => import("./pages/dashboard/MenuCollections"));
const RestaurantSetup     = lazy(() => import("./pages/dashboard/RestaurantSetup"));
const KitchenDisplay      = lazy(() => import("./pages/dashboard/KitchenDisplay"));
const Tables              = lazy(() => import("./pages/dashboard/Tables"));

// ── Driver portal (nested under DriverLayout) ────────────────────────────────
const DriverDashboard  = lazy(() => import("./pages/dashboard/DriverDashboard"));

// ── Admin portal (nested under AdminLayout) ──────────────────────────────────
const AdminOverview       = lazy(() => import("./pages/admin/AdminOverview"));
const AdminRestaurants    = lazy(() => import("./pages/admin/AdminRestaurants"));
const AdminUsers          = lazy(() => import("./pages/admin/AdminUsers"));
const AdminNotifications  = lazy(() => import("./pages/admin/AdminNotifications"));

// ── Loaders & wrappers ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-200 dark:bg-stone-950">
      <Spinner size="lg" />
    </div>
  );
}

function PublicLayout({ children, noFooter }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      {!noFooter && <Footer />}
    </>
  );
}

/**
 * Each portal layout now uses <Outlet /> internally.
 * Wrapping in ProtectedRoute + Layout here means the layout element
 * stays mounted across child route navigation → sidebar never re-renders.
 */
function OwnerLayout() {
  return (
    <ProtectedRoute roles={["restaurant_owner"]}>
      <RestaurantLayout />   {/* contains <Outlet /> */}
    </ProtectedRoute>
  );
}

function DriverPortal() {
  return (
    <ProtectedRoute roles={["delivery_driver"]}>
      <DriverLayout />       {/* contains <Outlet /> */}
    </ProtectedRoute>
  );
}

function CustomerPortal() {
  return (
    <ProtectedRoute>
      <CustomerLayout />     {/* contains <Outlet /> */}
    </ProtectedRoute>
  );
}

function AdminPortal() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminLayout />        {/* contains <Outlet /> */}
    </ProtectedRoute>
  );
}

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={clientId}>
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
        <CartProvider>
          <Toaster position="top-right" toastOptions={{
            duration: 3500,
            style: { borderRadius: "10px", background: "#1c1917", color: "#e8e4de", fontSize: "13px", fontFamily: "Plus Jakarta Sans, sans-serif" },
            success: { iconTheme: { primary: "#B5390D", secondary: "#fff" } },
          }} />

          <Suspense fallback={<PageLoader />}>
            <Routes>

              {/* ── Public ── */}
              <Route path="/"                element={<PublicLayout><Home /></PublicLayout>} />
              <Route path="/restaurants"     element={<PublicLayout><Restaurants /></PublicLayout>} />
              <Route path="/restaurants/:id" element={<PublicLayout><RestaurantDetail /></PublicLayout>} />
              <Route path="/t/:restaurantId/:tableNumber" element={<PublicLayout><TablePublic /></PublicLayout>} />
              <Route path="/subscriptions"   element={<PublicLayout><Subscriptions /></PublicLayout>} />
              <Route path="/login"           element={<PublicLayout noFooter><Login /></PublicLayout>} />
              <Route path="/register"        element={<PublicLayout noFooter><Register /></PublicLayout>} />
              <Route path="/forgot-password"       element={<PublicLayout><ForgotPassword /></PublicLayout>} />
              <Route path="/reset-password/:token" element={<PublicLayout><ResetPassword /></PublicLayout>} />
              <Route path="/terms"           element={<PublicLayout><TermsOfService /></PublicLayout>} />
              <Route path="/privacy"         element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />

              {/* ── Shopping (public layout — no sidebar) ── */}
              <Route path="/cart"     element={<PublicLayout><ProtectedRoute><Cart /></ProtectedRoute></PublicLayout>} />
              <Route path="/checkout" element={<PublicLayout><ProtectedRoute><Checkout /></ProtectedRoute></PublicLayout>} />

              {/* ── Customer portal — ONE parent route keeps CustomerLayout mounted ── */}
              <Route element={<CustomerPortal />}>
                <Route path="/orders"         element={<MyOrders />} />
                <Route path="/orders/:id"     element={<OrderTracking />} />
                <Route path="/notifications"  element={<Notifications />} />
                <Route path="/profile"        element={<Profile />} />
              </Route>

              {/* ── Restaurant owner — ONE parent route keeps RestaurantLayout mounted ── */}
              <Route path="/dashboard" element={<OwnerLayout />}>
                <Route index              element={<RestaurantDashboard />} />
                <Route path="orders"      element={<RestaurantOrders />} />
                <Route path="menu"        element={<MenuManager />} />
                <Route path="collections" element={<MenuCollections />} />
                <Route path="tables"      element={<Tables />} />
                <Route path="kitchen"     element={<KitchenDisplay />} />
                <Route path="analytics"   element={<RestaurantAnalytics />} />
                <Route path="profile"     element={<Profile />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="setup"       element={<RestaurantSetup />} />
              </Route>

              {/* ── Driver portal — ONE parent route keeps DriverLayout mounted ── */}
              <Route element={<DriverPortal />}>
                <Route path="/driver"            element={<DriverDashboard />} />
                <Route path="/driver/available"  element={<DriverDashboard />} />
                <Route path="/driver/active"     element={<DriverDashboard />} />
                <Route path="/driver/history"    element={<DriverDashboard />} />
              </Route>

              {/* ── Admin portal — ONE parent route keeps AdminLayout mounted ── */}
              <Route path="/admin" element={<AdminPortal />}>
                <Route index                  element={<AdminOverview />} />
                <Route path="restaurants"     element={<AdminRestaurants />} />
                <Route path="users"           element={<AdminUsers />} />
                <Route path="notifications"   element={<AdminNotifications />} />
                <Route path="subscriptions"   element={<AdminOverview />} />
                <Route path="settings"        element={<AdminOverview />} />
              </Route>

              {/* ── 404 ── */}
              <Route path="*" element={
                <PublicLayout>
                  <div className="min-h-screen pt-32 flex flex-col items-center justify-center text-center px-4">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h1 className="font-display text-4xl font-bold text-stone-900 dark:text-white mb-3">Page Not Found</h1>
                    <p className="text-stone-500 mb-6">This page doesn't exist.</p>
                    <a href="/" className="btn-primary">Return Home</a>
                  </div>
                </PublicLayout>
              } />

            </Routes>
          </Suspense>
        </CartProvider>
        </NotificationProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
  );
}