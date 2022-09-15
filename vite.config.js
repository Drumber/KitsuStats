import { fileURLToPath, URL } from "node:url";
import path from "node:path";

import { defineConfig, splitVendorChunkPlugin } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), splitVendorChunkPlugin()],
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
