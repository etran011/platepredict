import React from "react";
import { createRoot } from "react-dom/client";
import { Layout } from "./components/Layout";
import Landing from "./pages/Landing";
import Overview from "./pages/Overview";
import Estimator from "./pages/Estimator";
import Findings from "./pages/Findings";
import CaseStudy from "./pages/CaseStudy";
import "./styles.css";

const page = window.location.pathname.split("/").pop() || "index.html";
const pages: Record<string, React.ComponentType> = {
  "index.html": Landing,
  "overview.html": Overview,
  "estimator.html": Estimator,
  "findings.html": Findings,
  "case-study.html": CaseStudy,
};
const Page = pages[page] ?? Overview;
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Layout page={page}>
      <Page />
    </Layout>
  </React.StrictMode>,
);
