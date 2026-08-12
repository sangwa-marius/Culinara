import { useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";
import { getSocket } from "../utils/socket";

export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await authAPI.getNotifications();
      const notifs = data.notifications || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    } catch (err) {
      console.error("Notification operation failed:", err);
    }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Real-time via socket
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;
    const handler = (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    socket.on("new_notification", handler);
    return () => socket.off("new_notification", handler);
  }, [user]);

  const markOneRead = useCallback(async (id) => {
    try {
      await authAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Notification operation failed:", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await authAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Notification operation failed:", err);
    }
  }, []);

  const deleteOne = useCallback(async (id) => {
    try {
      await authAPI.deleteNotification(id);
      setNotifications(prev => {
        const notif = prev.find(n => n._id === id);
        if (notif && !notif.isRead) setUnreadCount(c => Math.max(0, c - 1));
        return prev.filter(n => n._id !== id);
      });
    } catch (err) {
      console.error("Notification operation failed:", err);
    }
  }, []);

  const deleteAll = useCallback(async () => {
    try {
      await authAPI.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Notification operation failed:", err);
    }
  }, []);

  return { notifications, loading, unreadCount, fetchNotifications, markOneRead, markAllRead, deleteOne, deleteAll };
};