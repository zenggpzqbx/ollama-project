import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import { babel } from "@rollup/plugin-babel";
import * as path from "node:path";

// https://vite.dev/config/
function resolvePath(dir) {
  return path.resolve(__dirname, dir);
}

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:11434",
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      "@": resolvePath("src"),
      "@assets": resolvePath("src/assets"),
      "@utils": resolvePath("src/utils"),
      "@components": resolvePath("src/components"),
      "@views": resolvePath("src/views")
    }
  },
  build: {
    target: "es2015"
  },
  plugins: [vue(), AutoImport({ imports: ["vue", "vue-router"] })],
  rollupOptions: {
    plugins: [
      babel({
        babelHelpers: "bundled"
      })
    ]
  }
});
