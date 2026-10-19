import type { ReactNode } from "react";

export const destinations = [
  ["overview.html", "Overview"],
  ["estimator.html", "Estimator"],
  ["findings.html", "Findings"],
  ["case-study.html", "Case study"],
] as const;

export function Layout({
  page,
  children,
}: {
  page: string;
  children: ReactNode;
}) {
  return (
    <div className="app-shell" data-page={page}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="index.html" aria-label="PlatePredict home">
          PlatePredict
        </a>
        <nav aria-label="Main navigation">
          {destinations.map(([href, label]) => (
            <a
              key={href}
              href={href}
              aria-current={page === href ? "page" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>
      <main className="app-main" id="main" tabIndex={-1}>
        {children}
      </main>
      <footer>
        <p className="footer-heading">
          Nutrition in.
          <br />
          <em>Calories in perspective.</em>
        </p>
        <a className="brand" href="index.html">
          PlatePredict
        </a>
        <p>Nutrition data / Regression study</p>
        <a href="https://github.com/etran011/platepredict">
          Source & original materials <span aria-hidden="true">↗</span>
        </a>
        <span className="footer-note">
          Previously deployed on AWS EC2 · No longer running
        </span>
      </footer>
    </div>
  );
}

export function PageIntro({
  number,
  eyebrow,
  title,
  accent,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section className="page-intro">
      <p className="eyebrow">
        {number} / {eyebrow}
      </p>
      <h1>
        {title} <em>{accent}</em>
      </h1>
      <div className="intro-copy">{children}</div>
    </section>
  );
}
