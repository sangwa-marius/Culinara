import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const redirect = (u) => {
    if (u.role === "restaurant_owner") navigate("/dashboard");
    else if (u.role === "admin") navigate("/admin");
    else if (u.role === "delivery_driver") navigate("/driver");
    else navigate(from);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { redirect(await login(form.email, form.password)); }
    catch (err) { toast.error(err.response?.data?.message || "Login failed"); }
    finally { setLoading(false); }
  };

  const handleGoogle = async (res) => {
    setGLoading(true);
    try { redirect(await loginWithGoogle(res.credential)); }
    catch (err) { toast.error(err.response?.data?.message || "Google sign-in failed"); }
    finally { setGLoading(false); }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning!" : h < 17 ? "Good Afternoon!" : "Good Evening!";
  };

  return (
    <div className="min-h-screen pt-16 grid md:grid-cols-2">
      {/* Left form */}
      <div className="flex items-center justify-center px-6 py-16 bg-cream-100 dark:bg-stone-950">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-xl mx-auto mb-4">🍽️</div>
            <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-white">{getGreeting()}</h1>
            <p className="text-stone-400 text-sm mt-1">
              Already have an account?{" "}
              <Link to="/login" className="text-primary-500 font-semibold hover:text-primary-600">Sign In</Link>
            </p>
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

            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`flex-1 h-0.5 rounded-full ${form.password.length > i * 3 ? "bg-primary-500" : "bg-cream-400 dark:bg-stone-700"}`} />
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-cream-400 dark:bg-stone-700" />
            <span className="text-xs text-stone-400">or</span>
            <div className="flex-1 h-px bg-cream-400 dark:bg-stone-700" />
          </div>

          <div className={`flex justify-center ${gLoading ? "opacity-50 pointer-events-none" : ""}`}>
            <GoogleLogin onSuccess={handleGoogle} onError={() => toast.error("Google sign-in failed")}
              theme="outline" size="large" width="340" text="continue_with" shape="rectangular" />
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-stone-400">
            <Link to="/forgot-password" className="hover:text-primary-500 transition-colors">Forgot password?</Link>
            <Link to="/register" className="hover:text-primary-500 transition-colors">Create account</Link>
          </div>
        </div>
      </div>

      {/* Right image */}
      <div className="hidden md:block relative">
        <img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&q=85&auto=format&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/20" />
      </div>
    </div>
  );
}
