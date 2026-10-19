import "./landing.css";

function EntryAction({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <a
      className={`entry-action${secondary ? " entry-action-secondary" : ""}`}
      href={href}
    >
      <span>{children}</span>
      <span className="entry-arrow" aria-hidden="true">
        ↗
      </span>
    </a>
  );
}

export default function Landing() {
  return (
    <div className="landing">
      <img
        className="landing-photo"
        src={`${import.meta.env.BASE_URL}images/landing-sandwich.webp`}
        alt=""
        fetchPriority="high"
      />
      <div className="landing-shade" aria-hidden="true" />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="entry-header">
        <a
          className="entry-brand"
          href="index.html"
          aria-label="PlatePredict home"
        >
          PlatePredict
        </a>
        <span className="entry-descriptor">Calorie completion / Review</span>
        <nav aria-label="Main navigation">
          <a href="overview.html">The study</a>
          <a href="findings.html">Findings</a>
          <a href="case-study.html">Case study</a>
        </nav>
        <a className="header-start" href="estimator.html">
          Get Started <span aria-hidden="true">↗</span>
        </a>
      </header>
      <main id="main" className="entry-main" tabIndex={-1}>
        <div className="entry-copy">
          <p className="entry-kicker">Complete missing values. Review discrepancies.</p>
          <h1>
            <span>Fill the gaps.</span>
            <span>Check the</span>
            <em>numbers.</em>
          </h1>
          <p className="entry-summary">
            Estimate missing calories from nutrition inputs.
            <br />
            Spot large discrepancies for review, without overwriting reports.
          </p>
          <div className="entry-actions">
            <EntryAction href="estimator.html">Get Started</EntryAction>
            <EntryAction href="findings.html" secondary>
              Explore the findings
            </EntryAction>
          </div>
          <p className="entry-status">
            Historical fast-food model · Performance on other foods is not established
          </p>
        </div>
        <aside className="entry-panel" aria-labelledby="panel-title">
          <p className="panel-kicker">
            Inside PlatePredict <span aria-hidden="true">↗</span>
          </p>
          <h2 id="panel-title">
            Two uses for
            <br />one existing model.
          </h2>
          <dl>
            <div>
              <dt>
                <span>01</span> Complete calories
              </dt>
              <dd>Use nine nutrition values to estimate a missing calorie entry.</dd>
            </div>
            <div>
              <dt>
                <span>02</span> Check consistency
              </dt>
              <dd>
                Compare a reported value with the estimate. Large differences need review, not automatic correction.
              </dd>
            </div>
            <div>
              <dt>
                <span>03</span> Understand the evidence
              </dt>
              <dd>
                Six original regressions. Completion and review are new uses, not validated imputation or anomaly detection.
              </dd>
            </div>
          </dl>
          <a href="overview.html">
            Read the original study’s context <span aria-hidden="true">→</span>
          </a>
        </aside>
      </main>
      <div className="entry-bottom">
        <span>964 complete records / 9 inputs / 6 models</span>
      </div>
    </div>
  );
}
