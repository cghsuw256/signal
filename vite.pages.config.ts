import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "/signal/",
  root: fileURLToPath(new URL("./pages-root", import.meta.url)),
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  envDir: root,
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    "import.meta.env.VITE_PAGES": JSON.stringify("1"),
  },
  build: {
    outDir: fileURLToPath(new URL("./dist-pages", import.meta.url)),
    emptyOutDir: true,
  },
});
