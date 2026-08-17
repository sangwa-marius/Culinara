export default function Logo({ className = "h-7 w-auto", showWordmark = true, iconOnly = false }) {
  if (iconOnly) {
    return (
      <svg className={className} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="25" cy="25" r="23" fill="url(#cul-g)" />
        <path d="M25 10 C18 10 14 15 14 20 C14 24 17 26 20 27 L20 35 C20 37 22 38 24 38 C26 38 28 37 28 35 L28 27 C31 26 34 24 34 20 C34 15 30 10 25 10 Z" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M25 14 C22 14 20 16 20 19 C20 21 21 22 23 22.5 C23 22.5 24 20 25 20 C26 20 27 22.5 27 22.5 C29 22 30 21 30 19 C30 16 28 14 25 14 Z" fill="white" opacity="0.95" />
        <defs>
          <linearGradient id="cul-g" x1="0" y1="0" x2="50" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#B5390D" />
            <stop offset="1" stopColor="#D4582A" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="cul-g" x1="0" y1="0" x2="200" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B5390D" />
          <stop offset="1" stopColor="#D4582A" />
        </linearGradient>
      </defs>
      <circle cx="25" cy="25" r="23" fill="url(#cul-g)" />
      <path d="M25 10 C18 10 14 15 14 20 C14 24 17 26 20 27 L20 35 C20 37 22 38 24 38 C26 38 28 37 28 35 L28 27 C31 26 34 24 34 20 C34 15 30 10 25 10 Z" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 14 C22 14 20 16 20 19 C20 21 21 22 23 22.5 C23 22.5 24 20 25 20 C26 20 27 22.5 27 22.5 C29 22 30 21 30 19 C30 16 28 14 25 14 Z" fill="white" opacity="0.95" />
      {showWordmark && (
        <text x="58" y="33" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="700" fill="#1c1917" letterSpacing="0.5">
          Culinara
        </text>
      )}
    </svg>
  );
}
