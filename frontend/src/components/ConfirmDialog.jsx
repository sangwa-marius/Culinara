import { useEffect } from "react";
import { AlertTriangle, Trash2, Info, X } from "lucide-react";
import clsx from "clsx";

/**
 * Reusable confirmation dialog — replaces browser confirm().
 *
 * Usage:
 *   const [dialog, setDialog] = useState(null);
 *
 *   <ConfirmDialog
 *     open={!!dialog}
 *     title="Delete table?"
 *     message="This cannot be undone."
 *     variant="danger"           // "danger" | "warning" | "info"
 *     confirmLabel="Delete"
 *     onConfirm={() => { doDelete(); setDialog(null); }}
 *     onCancel={() => setDialog(null)}
 *   />
 */
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // "danger" | "warning" | "info"
  loading = false,
  onConfirm,
  onCancel,
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  const CONFIG = {
    danger: {
      icon: Trash2,
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-500",
      btn: "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-500",
      btn: "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white",
    },
    info: {
      icon: Info,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-500",
      btn: "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white",
    },
  };

  const {
    icon: Icon,
    iconBg,
    iconColor,
    btn,
  } = CONFIG[variant] || CONFIG.danger;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-slide-up mx-4">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div
          className={clsx(
            "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4",
            iconBg,
          )}
        >
          <Icon size={22} className={iconColor} />
        </div>

        {/* Text */}
        <h3
          id="confirm-title"
          className="font-bold text-stone-900 dark:text-white text-center text-base mb-2"
        >
          {title}
        </h3>
        {message && (
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center leading-relaxed mb-6">
            {message}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary flex-1 py-2.5 text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60",
              btn,
            )}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
