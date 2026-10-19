import { PredictionPlot } from "../components/PredictionPlot";
import results from "../../results/model-comparison.json";

export default function Overview() {
  return (
    <>
      <section className="study-opening">
        <div className="opening-index">
          <p className="eyebrow">PlatePredict / Project overview</p>
          <span>
            Nutrition data
            <br />
            Regression analysis
            <br />
            Browser inference
          </span>
        </div>
        <div className="opening-copy">
          <h1>
            Predicting calories
            <br />
            from nutrition data
          </h1>
          <p>
            I compared six regression models using nine nutrition values from
            menu items. This is a closer look at the data, the corrected
            evaluation, and the model selected for the browser.
          </p>
          <a className="text-link" href="case-study.html">
            Read the study <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
      <section className="data-band" aria-label="Dataset preparation summary">
        <p className="eyebrow">The dataset</p>
        <div>
          <strong>{results.rows.raw.toLocaleString("en-US")}</strong>
          <span>original rows</span>
        </div>
        <span className="data-arrow" aria-hidden="true">
          →
        </span>
        <div>
          <strong>{results.rows.cleaned}</strong>
          <span>complete records</span>
        </div>
        <p className="data-band-note">
          Positive calories.
          <br />
          All nine model inputs present.
        </p>
      </section>
      <section className="evidence-layout">
        <div className="evidence-margin">
          <p className="eyebrow">Selected model</p>
          <h2>
            Polynomial
            <br />
            regression
          </h2>
          <p className="model-degree">Degree 2</p>
          <dl className="evidence-metrics">
            <div>
              <dt>Validation RMSE</dt>
              <dd>
                {results.models.polynomial_degree_2.metrics.validation.rmse_calories.toFixed(
                  2,
                )}{" "}
                <span>kcal</span>
              </dd>
            </div>
            <div>
              <dt>Held-out test RMSE</dt>
              <dd>
                {results.models.polynomial_degree_2.metrics.test.rmse_calories.toFixed(
                  2,
                )}{" "}
                <span>kcal</span>
              </dd>
            </div>
          </dl>
          <p className="margin-note">
            I selected the model using validation results. The test set was held
            out from fitting and selection.
          </p>
          <a className="text-link" href="findings.html">
            Compare all six models ↗
          </a>
        </div>
        <PredictionPlot />
      </section>
      <section className="input-index">
        <div>
          <p className="eyebrow">Model inputs / 09</p>
          <h2>
            What goes into
            <br />
            the prediction?
          </h2>
          <p>
            Nutrition values for one menu item.
            <br />
            Calories are the target, not an input.
          </p>
          <a className="text-link" href="estimator.html">
            View the estimator introduction ↗
          </a>
        </div>
        <ol>
          {[
            ["Total fat", "g"],
            ["Saturated fat", "g"],
            ["Trans fat", "g"],
            ["Cholesterol", "mg"],
            ["Sodium", "mg"],
            ["Carbohydrates", "g"],
            ["Fiber", "g"],
            ["Sugars", "g"],
            ["Protein", "g"],
          ].map(([name, unit]) => (
            <li key={name}>
              <span>{name}</span>
              <span>{unit}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="editorial-note">
        <p className="eyebrow">Reading the results</p>
        <div>
          <h2>A strong fit within this dataset</h2>
          <p>
            Nutrition inputs already have a close relationship with calories.
            Repeated nutrition profiles can appear across the random splits, and
            these results do not establish performance on unseen restaurants.
          </p>
          <a className="text-link" href="case-study.html#limits">
            Methods and limitations ↗
          </a>
        </div>
      </section>
    </>
  );
}
