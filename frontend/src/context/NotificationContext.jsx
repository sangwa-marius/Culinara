import { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";
import { useNotifications } from "../hooks/UseNotifications";
import toast from "react-hot-toast";
import { useRef, useEffect } from "react";

const NotificationContext = createContext(null);

const TYPE_ICONS = { order: "📦", promo: "🎉", system: "🔔", delivery_request: "🚗" };

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const notif = useNotifications(user);

  // Track the count so we can fire toasts only for NEW ones (not on initial load)
  const prevCountRef = useRef(notif.notifications.length);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (!initialLoadDoneRef.current) {
      // First render after load — set baseline, don't toast
      if (!notif.loading) {
        prevCountRef.current = notif.notifications.length;
        initialLoadDoneRef.current = true;
      }
      return;
    }

    const newCount = notif.notifications.length;
    if (newCount > prevCountRef.current) {
      // A new notification was prepended (they come in at index 0)
      const latest = notif.notifications[0];
      if (latest && !latest.isRead) {
        const icon = TYPE_ICONS[latest.type] || "🔔";
        toast(`${icon} ${latest.message}`, {
          duration: 5000,
          style: {
            borderRadius: "12px",
            background: "#1f2937",
            color: "#fff",
            fontSize: "14px",
            maxWidth: "380px",
          },
        });
      }
    }
    prevCountRef.current = newCount;
  }, [notif.notifications, notif.loading]);

  return (
    <NotificationContext.Provider value={notif}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotificationContext must be used inside NotificationProvider");
  return ctx;
}
