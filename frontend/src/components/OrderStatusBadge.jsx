const CONFIG = {
  pending:          { label: "Pending",       class: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed:        { label: "Confirmed",     class: "bg-blue-50 text-blue-700 border-blue-200" },
  preparing:        { label: "Preparing",     class: "bg-orange-50 text-orange-700 border-orange-200" },
  ready_for_pickup: { label: "Ready",         class: "bg-purple-50 text-purple-700 border-purple-200" },
  out_for_delivery: { label: "On the way",    class: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  delivered:        { label: "Delivered",     class: "bg-green-50 text-green-700 border-green-200" },
  cancelled:        { label: "Cancelled",     class: "bg-red-50 text-red-600 border-red-200" },
};
export default function OrderStatusBadge({ status }) {
  const cfg = CONFIG[status] || { label: status, class: "bg-stone-50 text-stone-600 border-stone-200" };
  return (
    <span className={`badge border ${cfg.class} capitalize`}>{cfg.label}</span>
  );
}
