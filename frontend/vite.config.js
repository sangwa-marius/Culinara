import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api":       { target: "http://localhost:5000", changeOrigin: true },
      "/uploads":   { target: "http://localhost:5000", changeOrigin: true },
      "/socket.io": { target: "http://localhost:5000", changeOrigin: true, ws: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-date":  ["date-fns"],
          "vendor-ui":    ["axios", "clsx", "react-hot-toast", "lucide-react"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
});
