import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock, Phone, CheckCircle, XCircle, ChevronRight, ChevronLeft, UtensilsCrossed, Store, Truck } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import Logo from "../components/Logo";

const ROLES = [
  { value: "customer",         icon: UtensilsCrossed, label: "Customer",         desc: "Order food for delivery" },
  { value: "restaurant_owner", icon: Store,           label: "Restaurant Owner", desc: "Manage your restaurant" },
  { value: "delivery_driver",  icon: Truck,           label: "Delivery Driver",  desc: "Deliver orders and earn" },
];

const STEPS = [
  { key: "account", label: "Account" },
  { key: "details", label: "Details" },
  { key: "security", label: "Security" },
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get("role") || "customer");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const { register, loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const googleTheme = theme === "dark" ? "filled_black" : "outline";

  const redirect = (u) => {
    if (u.role === "restaurant_owner") navigate("/dashboard/setup");
    else if (u.role === "delivery_driver") navigate("/driver");
    else navigate("/");
  };

  const handleGoogle = async (res) => {
    setGLoading(true); setError("");
    try { redirect(await loginWithGoogle(res.credential, role)); }
    catch (err) {
      const msg = err.response?.data?.message || "Google sign-up failed";
      setError(msg);
      toast.error(msg);
    }
    finally { setGLoading(false); }
  };

  const match = confirm.length > 0 && form.password === confirm;
  const diff  = confirm.length > 0 && form.password !== confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (diff) { toast.error("Passwords do not match"); return; }
    setLoading(true); setError("");
    try { redirect(await register({ ...form, role })); }
    catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
      toast.error(msg);
    }
    finally { setLoading(false); }
  };

  const next = () => {
    if (step === 0) {
      if (!role) { toast.error("Please select an account type"); return; }
    }
    if (step === 1) {
      if (!form.name.trim()) { toast.error("Please enter your full name"); return; }
      if (!form.email.trim()) { toast.error("Please enter your email"); return; }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return form.name.trim() && form.email.trim();
    return true;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left form - aligned with navbar content */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-cream-100 dark:bg-stone-950">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
              <Logo className="w-9 h-9" iconOnly />
            </div>
            <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-white">Create Account</h1>
            <p className="text-stone-500 dark:text-stone-400 text-base mt-2">Already have an account? <Link to="/login" className="text-primary-500 font-semibold">Sign In</Link></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Progress steps */}
            <div className="flex items-center justify-between mb-8">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${i <= step ? "border-primary-500 bg-primary-500 text-white" : "border-cream-400 text-stone-400 dark:border-stone-700"}`}>
                      {i + 1}
                    </div>
                    <span className={`text-[10px] font-semibold mt-1.5 ${i <= step ? "text-primary-600 dark:text-primary-400" : "text-stone-400"}`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 transition-all duration-300 bg-cream-400 dark:bg-stone-700" style={{ backgroundColor: i < step ? "#B5390D" : undefined }} />
                  )}
                </div>
              ))}
            </div>

            {step === 0 && (
              <div className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-3 gap-3">
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    return (
                      <button key={r.value} type="button" onClick={() => setRole(r.value)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${role === r.value ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 shadow-sm" : "border-cream-400 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-cream-500"}`}>
                        <div className="flex justify-center mb-2"><Icon size={22} className={role === r.value ? "text-primary-600 dark:text-primary-400" : "text-stone-500 dark:text-stone-400"} /></div>
                        <p className={`text-[10px] font-semibold leading-tight ${role === r.value ? "text-primary-700 dark:text-primary-400" : "text-stone-600 dark:text-stone-400"}`}>{r.label}</p>
                      </button>
                    );
                  })}
                </div>

                <div className={`rounded-2xl border border-white/40 dark:border-stone-700/60 bg-white/60 dark:bg-stone-900/60 backdrop-blur-xl p-1.5 ${gLoading ? "opacity-50 pointer-events-none" : ""}`}>
                  <GoogleLogin key={googleTheme} onSuccess={handleGoogle} onError={() => toast.error("Google sign-up failed")}
                    theme={googleTheme} size="large" width="100%" text="signup_with" shape="rectangular" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-cream-400 dark:bg-stone-700" />
                  <span className="text-xs text-stone-400 uppercase tracking-wider">or continue with email</span>
                  <div className="flex-1 h-px bg-cream-400 dark:bg-stone-700" />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                {[
                  { key: "name",  label: "Full Name",  type: "text",  icon: User,  ph: "Type your full name" },
                  { key: "email", label: "Email",      type: "email", icon: Mail,  ph: "Type your email address" },
                  { key: "phone", label: "Phone",      type: "tel",   icon: Phone, ph: "+250 700 000 000", req: false },
                ].map(({ key, label, type, icon: Icon, ph, req = true }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-2 uppercase tracking-wide">{label}</label>
                    <div className="relative">
                      <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input type={type} required={req} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                        placeholder={ph} className="input-field pl-11 py-3.5 text-sm bg-transparent dark:bg-transparent" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-2 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input type={show ? "text" : "password"} required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                      placeholder="At least 6 characters" className="input-field pl-11 pr-11 py-3.5 text-sm bg-transparent dark:bg-transparent" autoComplete="new-password" />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-2 uppercase tracking-wide">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      className={`input-field pl-11 py-3.5 text-sm bg-transparent dark:bg-transparent ${diff ? "border-red-400" : match ? "border-green-400" : ""}`}
                      autoComplete="new-password" />
                  </div>
                  {diff  && <p className="text-sm text-red-500 mt-1.5 flex items-center gap-1.5"><XCircle size={13} /> Passwords don't match</p>}
                  {match && <p className="text-sm text-green-600 mt-1.5 flex items-center gap-1.5"><CheckCircle size={13} /> Passwords match</p>}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              {step > 0 && (
                <button type="button" onClick={back} className="btn-secondary flex-1 py-3 text-sm">
                  <ChevronLeft size={14} className="mr-1" /> Back
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button type="button" onClick={next} disabled={!canNext()} className="btn-primary flex-1 py-3 text-sm">
                  Next <ChevronRight size={14} className="ml-1" />
                </button>
              )}
              {step === STEPS.length - 1 && (
                <button type="submit" disabled={loading || diff || form.password.length < 6} className="btn-primary w-full py-3.5 text-base">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Create Account"}
                </button>
              )}
            </div>
          </form>

          <p className="text-xs text-center text-stone-400 mt-6">
            By signing up, you agree to Culinara's{" "}
            <Link to="/terms" className="underline hover:text-primary-500">Terms of Service</Link>
          </p>
        </div>
      </div>

      {/* Right visual - aligned with navbar content */}
      <div className="w-full lg:w-1/2 relative flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-transparent" />
        <div className="relative w-full max-w-xl animate-float z-10">
          <div className="relative h-[560px]">
            <div className="absolute top-4 left-4 w-72 h-90 rounded-[40px_30px_35px_45px]/[35px_40px_30px_40px] overflow-hidden shadow-2xl transform -rotate-6 hover:rotate-0 transition-all duration-700 border-4 border-white/60 dark:border-stone-700/60 z-10">
              <img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=85&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="absolute top-20 left-48 w-72 h-90 rounded-[35px_45px_40px_30px]/[40px_35px_45px_30px] overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-700 border-4 border-white/60 dark:border-stone-700/60 z-20">
              <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=85&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="absolute top-28 left-88 w-72 h-90 rounded-[45px_35px_30px_40px]/[30px_45px_35px_40px] overflow-hidden shadow-2xl transform -rotate-2 hover:rotate-0 transition-all duration-700 border-4 border-white/60 dark:border-stone-700/60 z-30">
              <img src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=85&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
            </div>

            <div className="absolute -bottom-4 left-12 right-12 z-40 animate-slide-up">
              <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-2xl p-5 border border-white/60 dark:border-stone-700/60 shadow-xl">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white drop-shadow-sm">Taste the moment</h2>
                <p className="text-stone-600 dark:text-stone-300 text-sm mt-1.5">Fresh meals delivered to your door</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile form */}
      <div className="lg:hidden w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-cream-100 dark:bg-stone-950">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-xl mx-auto mb-3">
              <Logo className="w-8 h-8" iconOnly />
            </div>
            <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-white">Create Account</h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Already have an account? <Link to="/login" className="text-primary-500 font-semibold">Sign In</Link></p>
          </div>

          <div className="flex items-center justify-between mb-6">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${i <= step ? "border-primary-500 bg-primary-500 text-white" : "border-cream-400 text-stone-400 dark:border-stone-700"}`}>
                    {i + 1}
                  </div>
                  <span className={`text-[10px] font-semibold mt-1 ${i <= step ? "text-primary-600 dark:text-primary-400" : "text-stone-400"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 transition-all duration-300 bg-cream-400 dark:bg-stone-700" style={{ backgroundColor: i < step ? "#B5390D" : undefined }} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 0 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    return (
                      <button key={r.value} type="button" onClick={() => setRole(r.value)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${role === r.value ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 shadow-sm" : "border-cream-400 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-cream-500"}`}>
                        <div className="flex justify-center mb-1"><Icon size={20} className={role === r.value ? "text-primary-600 dark:text-primary-400" : "text-stone-500 dark:text-stone-400"} /></div>
                        <p className={`text-[10px] font-semibold leading-tight ${role === r.value ? "text-primary-700 dark:text-primary-400" : "text-stone-600 dark:text-stone-400"}`}>{r.label}</p>
                      </button>
                    );
                  })}
                </div>

                <div className={`rounded-2xl border border-white/40 dark:border-stone-700/60 bg-white/60 dark:bg-stone-900/60 backdrop-blur-xl p-1.5 ${gLoading ? "opacity-50 pointer-events-none" : ""}`}>
                  <GoogleLogin key={googleTheme} onSuccess={handleGoogle} onError={() => toast.error("Google sign-up failed")}
                    theme={googleTheme} size="large" width="100%" text="signup_with" shape="rectangular" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-cream-400 dark:bg-stone-700" />
                  <span className="text-xs text-stone-400">or continue with email</span>
                  <div className="flex-1 h-px bg-cream-400 dark:bg-stone-700" />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3 animate-fade-in">
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
                        placeholder={ph} className="input-field pl-10 py-3 text-sm bg-transparent dark:bg-transparent" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 mb-1 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input type={show ? "text" : "password"} required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                      placeholder="At least 6 characters" className="input-field pl-10 pr-10 py-3 text-sm bg-transparent dark:bg-transparent" autoComplete="new-password" />
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
                      className={`input-field pl-10 py-3 text-sm bg-transparent dark:bg-transparent ${diff ? "border-red-400" : match ? "border-green-400" : ""}`}
                      autoComplete="new-password" />
                  </div>
                  {diff  && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><XCircle size={11} /> Passwords don't match</p>}
                  {match && <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={11} /> Passwords match</p>}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {step > 0 && (
                <button type="button" onClick={back} className="btn-secondary flex-1 py-2.5 text-sm">
                  <ChevronLeft size={14} className="mr-1" /> Back
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button type="button" onClick={next} disabled={!canNext()} className="btn-primary flex-1 py-2.5 text-sm">
                  Next <ChevronRight size={14} className="ml-1" />
                </button>
              )}
              {step === STEPS.length - 1 && (
                <button type="submit" disabled={loading || diff || form.password.length < 6} className="btn-primary w-full py-2.5">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Create Account"}
                </button>
              )}
            </div>
          </form>

          <p className="text-[10px] text-center text-stone-400 mt-4">
            By signing up, you agree to Culinara's{" "}
            <Link to="/terms" className="underline hover:text-primary-500">Terms of Service</Link>
          </p>
        </div>
      </div>
    </div>
  );
}