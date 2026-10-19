import { defineConfig } from "vite";

export default defineConfig({
  base: "/platepredict/",
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      input: [
        "index.html",
        "overview.html",
        "estimator.html",
        "findings.html",
        "case-study.html",
      ],
    },
  },
});
