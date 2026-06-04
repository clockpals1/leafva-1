import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    {
      name: "treat-js-files-as-jsx",
      enforce: "pre",
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/) || id.includes("node_modules")) return null;
        return transformWithEsbuild(code, id, { loader: "jsx", jsx: "automatic" });
      },
    },
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "build",
  },
});
