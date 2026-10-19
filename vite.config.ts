import { defineConfig } from "vite";

export default defineConfig({
  base: "/platepredict/",
  build: {
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
