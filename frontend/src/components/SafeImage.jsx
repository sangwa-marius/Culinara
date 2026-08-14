import { useState } from "react";

/**
 * Normalise an image URL so it always works regardless of how it was stored.
 *
 * Cases handled:
 *  - Already relative:  "/uploads/abc.jpg"            → unchanged
 *  - Absolute localhost: "http://localhost:5000/uploads/abc.jpg" → "/uploads/abc.jpg"
 *  - Absolute any host:  "http://192.168.1.x:5000/uploads/abc.jpg" → "/uploads/abc.jpg"
 *  - External URL:       "https://cdn.example.com/..."  → unchanged
 *  - Empty / null        → ""  (SafeImage shows fallback)
 */
function normalizeImageUrl(src) {
  if (!src) return "";

  try {
    const url = new URL(src);
    // If it's pointing at any variant of "localhost" or a local IP, strip the origin
    // so the Vite proxy (dev) or same-origin serving (prod) resolves it correctly.
    const isLocal =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      /^192\.168\.\d+\.\d+$/.test(url.hostname) ||
      /^10\.\d+\.\d+\.\d+$/.test(url.hostname);

    if (isLocal) return url.pathname; // e.g. "/uploads/abc.jpg"
  } catch {
    // Not a valid absolute URL — treat as relative, return as-is
  }

  return src;
}

/**
 * SafeImage — <img> with automatic fallback on broken / missing URLs.
 *
 * Props:
 *   src       — image URL (absolute or relative)
 *   alt       — alt text
 *   fallback  — JSX shown when src is empty or fails to load
 *   className — applied to both <img> and the fallback wrapper div
 *   imgClass  — applied only to <img>
 *   style     — inline style for the wrapper div (fallback only)
 */
export default function SafeImage({ src, alt = "", fallback, className = "", imgClass = "", style }) {
  const [failed, setFailed] = useState(false);

  const resolved    = normalizeImageUrl(src);
  const showFallback = !resolved || failed;

  if (showFallback) {
    const content = fallback ?? <span className="text-5xl">🍽️</span>;
    return (
      <div
        className={`flex items-center justify-center bg-cream-900  dark:bg-stone-800 ${className}`}
        style={style}
      >
        {content}
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={`${className} ${imgClass}`.trim()}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * SafeAvatar — circular avatar with letter-initial fallback.
 */
export function SafeAvatar({ src, name = "", size = "w-12 h-12", textSize = "text-lg" }) {
  const [failed, setFailed] = useState(false);
  const resolved = normalizeImageUrl(src);
  const letter   = name.charAt(0).toUpperCase() || "?";

  if (!resolved || failed) {
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center font-bold text-white ${textSize} shrink-0`}>
        {letter}
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={name}
      className={`${size} rounded-full object-cover shrink-0`}
      onError={() => setFailed(true)}
    />
  );
}
