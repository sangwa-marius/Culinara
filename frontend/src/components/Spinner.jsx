export default function Spinner({ size = "md", center = false }) {
  const s = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" }[size];
  const el = <div className={`spinner ${s}`} />;
  return center ? <div className="flex items-center justify-center py-12">{el}</div> : el;
}
