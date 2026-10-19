import { PageIntro } from "../components/Layout";
import { PredictionPlot } from "../components/PredictionPlot";
import results from "../../results/model-comparison.json";
const selected = results.models.polynomial_degree_2;
const models = Object.entries(results.models).sort(
  (a, b) =>
    a[1].metrics.validation.rmse_calories -
    b[1].metrics.validation.rmse_calories,
);
export default function Findings() {
  return (
    <>
      <PageIntro
        number="02"
        eyebrow="Findings"
        title="Comparing six regression"
        accent="models"
      >
        <p>
          Polynomial and linear regression had the lowest validation errors
          among the six original models. These are the corrected, reproduced
          results from my existing study.
        </p>
      </PageIntro>
      <section
        className="comparison-context"
        aria-labelledby="comparison-context-title"
      >
        <p className="eyebrow">What the comparison means</p>
        <h2 id="comparison-context-title">
          Reported calories, model perspective.
        </h2>
        <p>
          I use the original fast-food-trained model to compare a food’s
          reported calories with a prediction from its nine nutrition values.
          Actual calories are a comparison value, never a prediction input. Use
          the same serving for every value.
        </p>
        <p>
          A below-prediction result means “Lower in calories than the model
          predicts for these nutrition inputs.” It does not measure overall
          nutritional quality or establish that a food is healthier. Calories
          are already closely related to the supplied macronutrients; small
          differences may reflect label rounding or model error.
        </p>
        <p>
          The results below evaluate prediction accuracy on the original
          dataset, not the nutritional quality of a new food. The random split
          does not establish accuracy for foods outside that dataset. Historical
          presets may have appeared in training and are not independent
          evaluation examples.
        </p>
        <a className="text-link" href="estimator.html">
          <span className="action-label">Compare reported calories</span>
          <span className="action-arrow" aria-hidden="true">
            ↗
          </span>
        </a>
      </section>
      <section className="findings-grid">
        <div>
          <p className="eyebrow">Selected model / Degree 2</p>
          <h2>Held-out prediction error</h2>
          <div className="metric">
            <strong>
              {selected.metrics.test.rmse_calories.toFixed(2)}
              <small> kcal</small>
            </strong>
            <span>Held-out test RMSE · {results.rows.test} items</span>
          </div>
          <p className="bounded">
            RMSE summarizes prediction error across this test set. It is not a
            margin of error for an individual item, and the random split does
            not establish performance on unseen restaurants.
          </p>
          <a className="text-link" href="case-study.html">
            <span className="action-label">Read the methodology</span>
            <span className="action-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </div>
        <PredictionPlot />
      </section>
      <section className="comparison">
        <div className="section-heading">
          <p className="eyebrow">Six models, one comparison</p>
          <h2>Validation and test results</h2>
          <p>
            Lower RMSE is better. Model selection used the{" "}
            {results.rows.validation}-item validation set, before inspecting
            held-out test performance.
          </p>
        </div>
        <div
          className="table-scroll"
          role="region"
          aria-label="Model comparison"
          tabIndex={0}
        >
          <table>
            <caption>
              Corrected regression results · error in kcal · scroll for all
              columns
            </caption>
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">Validation RMSE</th>
                <th scope="col">Test RMSE</th>
                <th scope="col">Test R²</th>
              </tr>
            </thead>
            <tbody>
              {models.map(([key, m]) => (
                <tr
                  key={key}
                  className={
                    key === results.selection.demo_model ? "selected-row" : ""
                  }
                >
                  <th scope="row">
                    {m.label}
                    {key === results.selection.demo_model && (
                      <span className="selected-label">Selected</span>
                    )}
                  </th>
                  <td>{m.metrics.validation.rmse_calories.toFixed(2)}</td>
                  <td>{m.metrics.test.rmse_calories.toFixed(2)}</td>
                  <td>{m.metrics.test.r2.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
