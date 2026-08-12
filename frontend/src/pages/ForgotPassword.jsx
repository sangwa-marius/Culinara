import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email address");

    setLoading(true);
    try {
      await authAPI.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch {
      // Still show success — never reveal if email exists
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-16 bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">

        {/* Back link */}
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="card p-8">
          {sent ? (
            /* ── Success State ── */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your inbox</h1>
              <p className="text-gray-500 leading-relaxed mb-6">
                If an account with <strong className="text-gray-700">{email}</strong> exists, we've sent a password reset link. It expires in <strong>15 minutes</strong>.
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Didn't get it? Check your spam folder, or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-primary-500 hover:underline font-medium"
                >
                  try again
                </button>.
              </p>
              <Link to="/login" className="btn-primary w-full block text-center">
                Back to login
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail size={28} className="text-primary-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot your password?</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  No worries. Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-field pl-10"
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Remembered it?{" "}
                <Link to="/login" className="text-primary-500 hover:underline font-medium">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
