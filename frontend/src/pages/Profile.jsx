import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { User, Mail, Phone, Lock, Save, Bike, Shield, MapPin } from "lucide-react";
import ImageUploader from "../components/ImageUploader";
import SafeAvatar from "../components/SafeImage";
import toast from "react-hot-toast";
import clsx from "clsx";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", avatar: user?.avatar || "" });
  const [pwd, setPwd] = useState({ current: "", new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const isDriver = user?.role === "delivery_driver";

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
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            isDriver ? "bg-primary-50 dark:bg-primary-950/30 text-primary-600" : "bg-cream-200 dark:bg-stone-800 text-stone-500")}>
            {isDriver ? <Bike size={20} /> : <User size={20} />}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">Profile Settings</h1>
            <p className="text-xs text-stone-400">
              {isDriver ? "Manage your driver profile and account" : "Manage your personal information and security"}
            </p>
          </div>
        </div>

        {/* Avatar & Info */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shrink-0 ring-2 ring-cream-200 dark:ring-stone-700">
              <SafeAvatar src={form.avatar || user?.avatar} name={user?.name} size="w-16 h-16 sm:w-20 sm:h-20" textSize="text-xl sm:text-2xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-stone-900 dark:text-white text-base sm:text-lg truncate">{user?.name}</p>
              <p className="text-xs sm:text-sm text-stone-400 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={clsx("text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full",
                  isDriver ? "bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400" : "bg-cream-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400")}>
                  {user?.role?.replace(/_/g, " ")}
                </span>
                {isDriver && (
                  <span className="text-[10px] sm:text-xs font-medium text-stone-400 flex items-center gap-1">
                    <Shield size={10} /> Verified Driver
                  </span>
                )}
              </div>
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
        <div className="card p-5 sm:p-6">
          <h2 className="font-semibold text-stone-900 dark:text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
            <User size={15} className="text-primary-500 shrink-0" /> Personal Information
          </h2>
          <form onSubmit={handleProfile} className="space-y-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={user?.email} disabled className="input-field opacity-50 cursor-not-allowed" />
              <p className="text-[10px] sm:text-xs text-stone-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+250 700 000 000" className="input-field" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary gap-2 w-full sm:w-auto">
              <Save size={15} />{loading ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Password form */}
        <div className="card p-5 sm:p-6">
          <h2 className="font-semibold text-stone-900 dark:text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Lock size={15} className="text-primary-500 shrink-0" /> Change Password
          </h2>
          <form onSubmit={handlePassword} className="space-y-4">
            {[
              { key: "current", label: "Current Password",placeholder:"Enter the current password" },
              { key: "new",     label: "New Password", placeholder: "Enter new password" },
              { key: "confirm", label: "Confirm New Password", placeholder: "Confirm your new password" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[10px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">{label}</label>
                <input type="password" value={pwd[key]} onChange={e => setPwd({...pwd, [key]: e.target.value})} className="input-field"placeholder={placeholder} />
              </div>
            ))}
            <button type="submit" disabled={pwdLoading} className="btn-primary gap-2 w-full sm:w-auto">
              <Lock size={15} />{pwdLoading ? "Changing…" : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}