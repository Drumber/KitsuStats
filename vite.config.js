import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "tailwind.config.js": path.resolve(__dirname, "tailwind.config.js"),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['tailwind.config.js']
  },
  build: {
    commonjsOptions: {
      include: ["tailwind.config.js", "node_modules/**"],
    },
  },
});
