import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock, Phone, CheckCircle, XCircle } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ROLES = [
  { value: "customer",         emoji: "🍽️", label: "Customer",         desc: "Order food for delivery" },
  { value: "restaurant_owner", emoji: "🏪", label: "Restaurant Owner", desc: "Manage your restaurant" },
  { value: "delivery_driver",  emoji: "🚗", label: "Delivery Driver",  desc: "Deliver orders and earn" },
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get("role") || "customer");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const match = confirm.length > 0 && form.password === confirm;
  const diff  = confirm.length > 0 && form.password !== confirm;

  const redirect = (u) => {
    if (u.role === "restaurant_owner") navigate("/dashboard/setup");
    else if (u.role === "delivery_driver") navigate("/driver");
    else navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (diff) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try { redirect(await register({ ...form, role })); }
    catch (err) { toast.error(err.response?.data?.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  const handleGoogle = async (res) => {
    setGLoading(true);
    try { redirect(await loginWithGoogle(res.credential, role)); }
    catch (err) { toast.error(err.response?.data?.message || "Google sign-up failed"); }
    finally { setGLoading(false); }
  };

  return (
    <div className="min-h-screen pt-16 grid md:grid-cols-2">
      {/* Left form */}
      <div className="flex items-center justify-center px-6 py-12 bg-cream-100 dark:bg-stone-950">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-xl mx-auto mb-3">🍽️</div>
            <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-white">Create Account</h1>
            <p className="text-stone-400 text-sm mt-1">Already have an account? <Link to="/login" className="text-primary-500 font-semibold">Sign In</Link></p>
          </div>

          {/* Role picker */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {ROLES.map(r => (
              <button key={r.value} type="button" onClick={() => setRole(r.value)}
                className={`p-2.5 rounded-xl border-2 text-center transition-all ${role === r.value ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30" : "border-cream-400 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-cream-500"}`}>
                <div className="text-lg mb-0.5">{r.emoji}</div>
                <p className={`text-[10px] font-semibold leading-tight ${role === r.value ? "text-primary-700 dark:text-primary-400" : "text-stone-600 dark:text-stone-400"}`}>{r.label}</p>
              </button>
            ))}
          </div>

          <div className={`flex justify-center mb-4 ${gLoading ? "opacity-50 pointer-events-none" : ""}`}>
            <GoogleLogin onSuccess={handleGoogle} onError={() => toast.error("Google sign-up failed")}
              theme="outline" size="large" width="340" text="signup_with" shape="rectangular" />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-cream-400 dark:bg-stone-700" />
            <span className="text-xs text-stone-400">or</span>
            <div className="flex-1 h-px bg-cream-400 dark:bg-stone-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { key: "name",  label: "Full Name",  type: "text",  icon: User,  ph: "Type your full name" },
              { key: "email", label: "Email",      type: "email", icon: Mail,  ph: "Type your email address" },
              { key: "phone", label: "Phone",      type: "tel",   icon: Phone, ph: "+250 700 000 000", req: false },
            ].map(({ key, label, type, icon: Icon, ph, req = true }) => (
              <div key={key}>
                <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 mb-1 uppercase tracking-wider">{label}</label>
                <div className="relative">
                  <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input type={type} required={req} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                    placeholder={ph} className="input-field pl-10 py-2 text-sm" />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 mb-1 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input type={show ? "text" : "password"} required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="At least 6 characters" className="input-field pl-10 pr-10 py-2 text-sm" autoComplete="new-password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 mb-1 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className={`input-field pl-10 py-2 text-sm ${diff ? "border-red-400" : match ? "border-green-400" : ""}`}
                  autoComplete="new-password" />
              </div>
              {diff  && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><XCircle size={11} /> Passwords don't match</p>}
              {match && <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={11} /> Passwords match</p>}
            </div>
            <button type="submit" disabled={loading || diff || form.password.length < 6} className="btn-primary w-full py-2.5">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Sign Up"}
            </button>
          </form>

          <p className="text-[10px] text-center text-stone-400 mt-3">
            By signing up, you agree to Culinara's{" "}
            <Link to="/terms" className="underline hover:text-primary-500">Terms of Service</Link>
          </p>
        </div>
      </div>

      {/* Right image */}
      <div className="hidden md:block relative">
        <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=85&auto=format&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/20" />
      </div>
    </div>
  );
}
