import { PredictionPlot } from "../components/PredictionPlot";
import results from "../../results/model-comparison.json";
export default function Overview() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> Nutrition meets regression
          </p>
          <h1>
            There’s a story
            <br />
            on every <em>label.</em>
          </h1>
          <p className="lede">
            I explored how nine nutrition values can help predict the calories
            in a menu item. PlatePredict brings that work into focus.
          </p>
          <div className="actions">
            <a className="button" href="findings.html">
              Explore the findings <span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="case-study.html">
              Read my case study <span aria-hidden="true">→</span>
            </a>
          </div>
          <p className="hero-footnote">
            An existing study, revisited for the browser.
          </p>
        </div>
        <div className="hero-visual">
          <span className="orbit-label" aria-hidden="true">
            NUTRITION / PATTERNS / PREDICTION
          </span>
          <PredictionPlot />
        </div>
      </section>
      <section className="stats" aria-label="Study at a glance">
        <div>
          <strong>{results.rows.cleaned}</strong>
          <span>complete nutrition records</span>
        </div>
        <div>
          <strong>9</strong>
          <span>nutrition inputs</span>
        </div>
        <div>
          <strong>6</strong>
          <span>original regression models</span>
        </div>
        <p>
          One question.
          <br />
          <em>How closely can nutrition predict calories?</em>
        </p>
      </section>
      <section className="explore-section">
        <div className="section-heading">
          <p className="eyebrow">Inside PlatePredict</p>
          <h2>
            From the label
            <br />
            to the larger picture.
          </h2>
        </div>
        <div className="chapter-list">
          {[
            [
              "01",
              "Estimator",
              "Nine inputs. One calorie estimate. A preview of the browser prediction experience.",
              "estimator.html",
            ],
            [
              "02",
              "Findings",
              "Compare the original models and look closely at the held-out results.",
              "findings.html",
            ],
            [
              "03",
              "Case study",
              "My methods, the evaluation corrections, and what the results can—and can’t—tell us.",
              "case-study.html",
            ],
          ].map(([n, t, d, h]) => (
            <a className="chapter" href={h} key={n}>
              <span className="chapter-number">{n}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
