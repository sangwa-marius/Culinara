import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import { initSocket, disconnectSocket } from "../utils/socket";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token     = localStorage.getItem("fh_token");
    const savedUser = localStorage.getItem("fh_user");
    if (token && savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      initSocket(parsed.id);
    }
    setLoading(false);
  }, []);

  const _persist = (token, userData) => {
    localStorage.setItem("fh_token", token);
    localStorage.setItem("fh_user", JSON.stringify(userData));
    setUser(userData);
    initSocket(userData.id);
  };

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    _persist(data.token, data.user);
    toast.success(`Welcome back, ${data.user.name}! 👋`);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    _persist(data.token, data.user);
    toast.success(`Welcome to Food Hub, ${data.user.name}! 🎉`);
    return data.user;
  };

  // Called after the Google button gives us a credential (ID token)
  const loginWithGoogle = async (credential, role = "customer") => {
    const { data } = await authAPI.googleAuth({ credential, role });
    _persist(data.token, data.user);
    if (data.isNew) {
      toast.success(`Welcome to Food Hub, ${data.user.name}! 🎉`);
    } else {
      toast.success(`Welcome back, ${data.user.name}! 👋`);
    }
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("fh_token");
    localStorage.removeItem("fh_user");
    setUser(null);
    disconnectSocket();
    toast.success("Logged out successfully");
  };

  const updateUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    localStorage.setItem("fh_user", JSON.stringify(merged));
  };

  const loginWithToken = (token, userData) => {
    _persist(token, userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateUser, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
