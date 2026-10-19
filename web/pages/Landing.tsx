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
        src={`${import.meta.env.BASE_URL}images/menu-meal.jpg`}
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
        <span className="entry-descriptor">Nutrition / Regression</span>
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
          <p className="entry-kicker">From the nutrition label to the model</p>
          <h1>
            <span>Nutrition in.</span>
            <span>Calories in</span>
            <em>perspective.</em>
          </h1>
          <p className="entry-summary">
            Estimate calories from nine nutrition values.
            <br />
            Explore what the original regression models found.
          </p>
          <div className="entry-actions">
            <EntryAction href="estimator.html">Get Started</EntryAction>
            <EntryAction href="findings.html" secondary>
              Explore the findings
            </EntryAction>
          </div>
          <p className="entry-status">
            Estimator introduction available · Interactive form in development
          </p>
        </div>
        <aside className="entry-panel" aria-labelledby="panel-title">
          <p className="panel-kicker">
            Inside PlatePredict <span aria-hidden="true">↗</span>
          </p>
          <h2 id="panel-title">
            A closer look at
            <br />a calorie estimate.
          </h2>
          <dl>
            <div>
              <dt>
                <span>01</span> Nutrition inputs
              </dt>
              <dd>Nine values, including fat, carbohydrates, and protein.</dd>
            </div>
            <div>
              <dt>
                <span>02</span> Calorie estimate
              </dt>
              <dd>
                Degree-2 polynomial regression, selected using validation
                results.
              </dd>
            </div>
            <div>
              <dt>
                <span>03</span> Model comparison
              </dt>
              <dd>
                Six original models. Clearly separated validation and test
                results.
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
        <a href="https://www.pexels.com/photo/burger-and-fries-on-white-plate-2271101/">
          Photo: Engin Akyurt / Pexels
        </a>
      </div>
    </div>
  );
}
