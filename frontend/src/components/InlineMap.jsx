import { useMemo } from "react";
import clsx from "clsx";

function buildMapSrc(origin, destination) {
  const o = encodeURIComponent(origin);
  const d = encodeURIComponent(destination);
  return `https://maps.google.com/maps?q=${o}+to+${d}&output=embed`;
}

function buildDirectionsUrl(origin, destination) {
  const o = encodeURIComponent(origin);
  const d = encodeURIComponent(destination);
  return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=driving`;
}

export default function InlineMap({ origin, destination, className }) {
  const src = useMemo(
    () => buildMapSrc(origin, destination),
    [origin, destination],
  );
  const directionsUrl = useMemo(
    () => buildDirectionsUrl(origin, destination),
    [origin, destination],
  );

  return (
    <div className={clsx("space-y-2", className)}>
      <div className="rounded-xl overflow-hidden border border-cream-300 dark:border-stone-700 bg-cream-100 dark:bg-stone-800">
        <iframe
          title="Route map"
          width="100%"
          height="220"
          style={{ border: 0, display: "block" }}
          loading="lazy"
          allowFullScreen
          src={src}
        />
      </div>
      <a
        href={directionsUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs sm:text-sm font-semibold transition-colors"
      >
        🗺️ Open Navigation
      </a>
    </div>
  );
}
