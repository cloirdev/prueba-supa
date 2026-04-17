import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  output: "static",
  typescript: {
    check: false,
  },
  adapter: node({
    mode: "standalone",
  }),
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  },
});
