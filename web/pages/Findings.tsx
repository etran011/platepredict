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
        title="Comparing six regression models"
      >
        <p>
          Polynomial and linear regression had the lowest validation errors
          among the six original models. These are the corrected, reproduced
          results from my existing study.
        </p>
      </PageIntro>
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
            Read the methodology →
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
