import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { User, Mail, Phone, Lock, Save } from "lucide-react";
import ImageUploader from "../components/ImageUploader";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", avatar: user?.avatar || "" });
  const [pwd, setPwd] = useState({ current: "", new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      updateUser(data.user);
      toast.success("Profile updated");
    } catch (err) { toast.error(err.response?.data?.message || "Update failed"); }
    finally { setLoading(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwd.new !== pwd.confirm) { toast.error("Passwords don't match"); return; }
    setPwdLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: pwd.current, newPassword: pwd.new });
      toast.success("Password changed");
      setPwd({ current: "", new: "", confirm: "" });
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setPwdLoading(false); }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-white mb-6">Profile Settings</h1>

        {/* Avatar */}
        <div className="card p-6 mb-5">
          <div className="flex items-center gap-5">
            {/* Live avatar preview — shows uploaded photo or initials fallback */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {form.avatar
                ? <img src={form.avatar} alt={user?.name} className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                : user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-900 dark:text-white">{user?.name}</p>
              <p className="text-stone-400 text-sm">{user?.email}</p>
              <p className="text-xs text-primary-500 font-medium capitalize mt-0.5">{user?.role?.replace(/_/g, " ")}</p>
              <div className="mt-3 max-w-xs">
                <ImageUploader
                  label="Profile Photo"
                  hint="Square · JPG, PNG, WebP · max 5 MB"
                  aspect="square"
                  value={form.avatar}
                  onChange={(url) => setForm(f => ({ ...f, avatar: url }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <div className="card p-6 mb-5">
          <h2 className="font-semibold text-stone-900 dark:text-white mb-4 flex items-center gap-2"><User size={16} className="text-primary-500" /> Personal Information</h2>
          <form onSubmit={handleProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={user?.email} disabled className="input-field opacity-50 cursor-not-allowed" />
              <p className="text-xs text-stone-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+250 700 000 000" className="input-field" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary gap-2">
              <Save size={15} />{loading ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Password form */}
        <div className="card p-6">
          <h2 className="font-semibold text-stone-900 dark:text-white mb-4 flex items-center gap-2"><Lock size={16} className="text-primary-500" /> Change Password</h2>
          <form onSubmit={handlePassword} className="space-y-4">
            {[
              { key: "current", label: "Current Password" },
              { key: "new",     label: "New Password" },
              { key: "confirm", label: "Confirm New Password" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">{label}</label>
                <input type="password" value={pwd[key]} onChange={e => setPwd({...pwd, [key]: e.target.value})} className="input-field" />
              </div>
            ))}
            <button type="submit" disabled={pwdLoading} className="btn-primary gap-2">
              <Lock size={15} />{pwdLoading ? "Changing…" : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}