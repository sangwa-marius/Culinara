import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

/* ── Password strength indicator ── */
function PasswordStrength({ password }) {
  const checks = [
    { label: "At least 6 characters", pass: password.length >= 6 },
    { label: "Contains a number",     pass: /\d/.test(password) },
    { label: "Contains a letter",     pass: /[a-zA-Z]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const barColor = ["bg-gray-200", "bg-red-400", "bg-amber-400", "bg-green-500"][score];
  const label    = ["", "Weak", "Fair", "Strong"][score];
  const labelColor = ["", "text-red-500", "text-amber-500", "text-green-600"][score];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? barColor : "bg-gray-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${labelColor}`}>{label}</p>
      <div className="space-y-1">
        {checks.map((c) => (
          <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.pass ? "text-green-600" : "text-gray-400"}`}>
            {c.pass ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Expired / Invalid view ── */
function ExpiredView() {
  return (
    <div className="min-h-screen pt-20 px-4 pb-16 bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Link expired</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            This password reset link is invalid or has expired.<br />
            Reset links are only valid for <strong>15 minutes</strong>.
          </p>
          <Link to="/forgot-password" className="btn-primary w-full block text-center">
            Request a new link
          </Link>
          <Link to="/login" className="block text-sm text-gray-400 hover:text-gray-600 mt-4">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function ResetPassword() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const { loginWithToken } = useAuth();

  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [expired,     setExpired]     = useState(false);
  const [formError,   setFormError]   = useState("");
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  /* Validate token looks like a valid hex string (64 chars) */
  useEffect(() => {
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      setExpired(true);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (password.length < 6)   return setFormError("Password must be at least 6 characters.");
    if (password !== confirm)   return setFormError("Passwords do not match.");

    setLoading(true);
    try {
      const { data } = await authAPI.resetPassword(token, { password });

      // Auto-login if backend returned a token (best-effort — don't let this break the success flow)
      if (data.token && data.user) {
        try {
          loginWithToken(data.token, data.user);
        } catch (authErr) {
          console.error("Auto-login failed:", authErr.message);
          // Not fatal — user can log in manually
        }
      }

      setDone(true);
      toast.success("Password updated! Redirecting…");
      setTimeout(() => { if (mountedRef.current) navigate(data.token ? "/" : "/login"); }, 1800);

    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
        setExpired(true);
      } else {
        setFormError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (expired) return <ExpiredView />;

  return (
    <div className="min-h-screen pt-20 px-4 pb-16 bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card p-8">

          {done ? (
            /* ── Success ── */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Password updated!</h1>
              <p className="text-gray-500 text-sm mb-4">You're being logged in now…</p>
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            /* ── Form ── */
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock size={28} className="text-primary-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Set a new password</h1>
                <p className="text-gray-500 text-sm">Choose something strong that you haven't used before.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* New password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="input-field pl-10 pr-10"
                      autoFocus
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your new password"
                      className={`input-field pl-10 pr-10 ${confirm && confirm !== password ? "border-red-400" : ""}`}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <XCircle size={12} /> Passwords don't match
                    </p>
                  )}
                  {confirm && confirm === password && password.length >= 6 && (
                    <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                      <CheckCircle size={12} /> Passwords match ✓
                    </p>
                  )}
                </div>

                {/* Form-level error */}
                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 flex items-start gap-2">
                    <XCircle size={16} className="shrink-0 mt-0.5" />
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !password || !confirm || password !== confirm || password.length < 6}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating…
                    </>
                  ) : "Reset password"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                <Link to="/login" className="text-primary-500 hover:underline font-medium">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
