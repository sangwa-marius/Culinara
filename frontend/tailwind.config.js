/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans:    ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      colors: {
        primary: {
          50:  "#fdf2ee",
          100: "#fbe0d6",
          200: "#f6bfac",
          300: "#f09578",
          400: "#e86a44",
          500: "#B5390D",
          600: "#963008",
          700: "#7a2607",
          800: "#641f08",
          900: "#531b09",
          950: "#2d0d03",
        },
        cream: {
          50:  "#fdfcfb",
          100: "#f9f7f4",
          200: "#f5f3ef",
          300: "#ede9e3",
          400: "#e1dbd2",
          500: "#d4cdc2",
        },
      },
      animation: {
        "fade-in":    "fadeIn 0.35s ease-out",
        "slide-up":   "slideUp 0.4s cubic-bezier(0.16,1,0.3,1)",
        "slide-down": "slideDown 0.3s cubic-bezier(0.16,1,0.3,1)",
        "slide-in-left": "slideInLeft 0.35s cubic-bezier(0.16,1,0.3,1)",
        "scale-in":   "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)",
        "shimmer":    "shimmer 1.8s linear infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:      { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:     { from: { transform: "translateY(20px)", opacity: 0 }, to: { transform: "translateY(0)", opacity: 1 } },
        slideDown:   { from: { transform: "translateY(-10px)", opacity: 0 }, to: { transform: "translateY(0)", opacity: 1 } },
        slideInLeft: { from: { transform: "translateX(-16px)", opacity: 0 }, to: { transform: "translateX(0)", opacity: 1 } },
        scaleIn:     { from: { transform: "scale(0.95)", opacity: 0 }, to: { transform: "scale(1)", opacity: 1 } },
        shimmer:     { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
};
