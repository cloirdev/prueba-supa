import { defineConfig } from "astro/config";

import node from "@astrojs/node";

import react from "@astrojs/react";

export default defineConfig({
  typescript: {
    check: false,
  },

  adapter: node({
    mode: "standalone",
  }),

  integrations: [react()],
});