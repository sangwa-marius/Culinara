import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "./Skeleton";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const toastShown = useRef(false);

  useEffect(() => {
    if (roles && user && !roles.includes(user.role) && !toastShown.current) {
      toast.error("You don't have permission to access that page");
      toastShown.current = true;
    }
  }, [roles, user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-200 dark:bg-stone-950">
      <div className="w-64 space-y-3">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
