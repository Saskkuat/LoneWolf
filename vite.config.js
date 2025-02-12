import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
  },
  server: {
    fs: {
      allow: ["."], // Allows serving files from project root
    },
    publicDir: "public",
    middlewareMode: false, // Ensures proper static file handling
  },
  preview: {
    headers: {
      "Cache-Control": "no-store", // Prevents caching issues
    },
  },
});
