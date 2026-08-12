import { useState } from "react";
import { Send, Users, Store, Truck, Globe, Bell } from "lucide-react";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";

const TARGETS = [
  { value: "all",               label: "Everyone",            icon: Globe,  desc: "All registered users" },
  { value: "customers",         label: "Customers",           icon: Users,  desc: "Users who place orders" },
  { value: "restaurant_owners", label: "Restaurant Owners",   icon: Store,  desc: "Users who manage restaurants" },
  { value: "delivery_drivers",  label: "Delivery Drivers",    icon: Truck,  desc: "Users who deliver orders" },
];

const TYPES = [
  { value: "system", label: "System",    emoji: "📢", desc: "Platform-wide announcement" },
  { value: "promo",  label: "Promotion", emoji: "🎉", desc: "Deals and discounts" },
  { value: "order",  label: "Order",     emoji: "📦", desc: "Order-related update" },
];

export default function AdminNotifications() {
  const [form,    setForm]    = useState({ target: "all", message: "", type: "system" });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) { toast.error("Message is required"); return; }
    setSending(true);
    try {
      const { data } = await adminAPI.sendNotification(form);
      toast.success(data.message || "Notification sent successfully");
      setHistory(prev => [{
        ...form,
        sentAt: new Date().toISOString(),
        count: data.count || 0,
      }, ...prev.slice(0, 9)]);
      setForm(f => ({ ...f, message: "" }));
    } catch (err) { toast.error(err.response?.data?.message || "Failed to send"); }
    finally { setSending(false); }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl space-y-5">
        <div>
          <h1 className="font-bold text-stone-900 dark:text-white text-xl">Send Notifications</h1>
          <p className="text-xs text-stone-400 mt-0.5">Broadcast messages to users in real-time</p>
        </div>

        <div className="card p-6 space-y-5">
          <form onSubmit={handleSend} className="space-y-5">
            {/* Target */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Send To
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TARGETS.map(t => (
                  <label key={t.value}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      form.target === t.value
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20"
                        : "border-cream-300 dark:border-stone-700 hover:border-cream-400"
                    }`}>
                    <input type="radio" name="target" value={t.value} checked={form.target === t.value}
                      onChange={() => setForm(f => ({ ...f, target: t.value }))}
                      className="accent-primary-500 w-3.5 h-3.5 shrink-0" />
                    <t.icon size={15} className={form.target === t.value ? "text-primary-500" : "text-stone-400"} />
                    <div>
                      <p className={`text-sm font-semibold leading-tight ${form.target === t.value ? "text-primary-700 dark:text-primary-300" : "text-stone-700 dark:text-stone-200"}`}>
                        {t.label}
                      </p>
                      <p className="text-[10px] text-stone-400">{t.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Notification Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      form.type === t.value
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300"
                        : "border-cream-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-cream-400"
                    }`}>
                    <span>{t.emoji}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write your notification message here…"
                className="input-field resize-none" required />
              <p className="text-xs text-stone-400 mt-1">{form.message.length}/280 characters</p>
            </div>

            <button type="submit" disabled={sending || !form.message.trim()}
              className="btn-primary w-full py-3 gap-2 disabled:opacity-50">
              {sending
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</>
                : <><Send size={15} /> Send Notification</>
              }
            </button>
          </form>
        </div>

        {/* Sent history */}
        {history.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-cream-300 dark:border-stone-800">
              <h2 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                <Bell size={15} className="text-primary-500" /> Recently Sent
              </h2>
            </div>
            <div className="divide-y divide-cream-200 dark:divide-stone-800">
              {history.map((h, i) => (
                <div key={i} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-800 dark:text-stone-200 leading-snug">{h.message}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                        <span className="capitalize">{h.target.replace(/_/g, " ")}</span>
                        <span>·</span>
                        <span className="capitalize">{h.type}</span>
                        {h.count > 0 && <><span>·</span><span>{h.count} recipients</span></>}
                      </div>
                    </div>
                    <span className="text-xs text-stone-300 dark:text-stone-600 shrink-0">
                      {new Date(h.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}