import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const googleTheme = theme === "dark" ? "filled_black" : "outline";

  const redirect = (u) => {
    if (u.role === "restaurant_owner") navigate("/dashboard");
    else if (u.role === "admin") navigate("/admin");
    else if (u.role === "delivery_driver") navigate("/driver");
    else navigate(from);
  };

  const handleGoogle = async (res) => {
    setGLoading(true); setError("");
    try { redirect(await loginWithGoogle(res.credential)); }
    catch (err) {
      const msg = err.response?.data?.message || "Google sign-in failed";
      setError(msg);
      toast.error(msg);
    }
    finally { setGLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError("");
    try {
      await redirect(await login(form.email, form.password));
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning!" : h < 17 ? "Good Afternoon!" : "Good Evening!";
  };

  return (
    <div className="min-h-screen pt-20 grid md:grid-cols-5">
      {/* Left form */}
      <div className="flex items-center justify-center px-6 py-16 md:col-span-3">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-xl mx-auto mb-4">🍽️</div>
            <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-white">{getGreeting()}</h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Sign in to your account</p>
          </div>

          <div className={`rounded-2xl border border-white/40 dark:border-stone-700/60 bg-white/60 dark:bg-stone-900/60 backdrop-blur-xl p-1.5 ${gLoading ? "opacity-50 pointer-events-none" : ""}`}>
            <GoogleLogin key={googleTheme} onSuccess={handleGoogle} onError={() => toast.error("Google sign-in failed")}
              theme={googleTheme} size="large" width="100%" text="continue_with" shape="rectangular" />
          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-cream-400 dark:bg-stone-700" />
            <span className="text-xs text-stone-400">or</span>
            <div className="flex-1 h-px bg-cream-400 dark:bg-stone-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="Type your email address" className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input type={show ? "text" : "password"} required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="Type your password" className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-stone-500 hover:text-primary-500 transition-colors">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-stone-500 dark:text-stone-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary-500 font-semibold hover:text-primary-600">Sign up</Link>
          </div>
        </div>
      </div>

      {/* Right visual */}
      <div className="hidden md:flex md:col-span-2 items-center justify-center p-8 relative overflow-hidden">
        <div className="relative w-full max-w-xl animate-float">
          <div className="relative h-[520px]">
            <div className="absolute top-4 left-4 w-64 h-80 rounded-[40px_30px_35px_45px]/[35px_40px_30px_40px] overflow-hidden shadow-xl transform -rotate-6 hover:rotate-0 transition-all duration-700 border-4 border-white/60 dark:border-stone-700/60 z-10">
              <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=85&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="absolute top-16 left-40 w-64 h-80 rounded-[35px_45px_40px_30px]/[40px_35px_45px_30px] overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-700 border-4 border-white/60 dark:border-stone-700/60 z-20">
              <img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=85&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="absolute top-24 left-72 w-64 h-80 rounded-[45px_35px_30px_40px]/[30px_45px_35px_40px] overflow-hidden shadow-2xl transform -rotate-2 hover:rotate-0 transition-all duration-700 border-4 border-white/60 dark:border-stone-700/60 z-30">
              <img src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=85&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="absolute -bottom-2 left-8 right-8 z-40 animate-slide-up">
              <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-2xl p-4 border border-white/60 dark:border-stone-700/60 shadow-lg">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white drop-shadow-sm">Flavors await</h2>
                <p className="text-stone-600 dark:text-stone-300 text-sm mt-1">Discover the best restaurants around you</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
