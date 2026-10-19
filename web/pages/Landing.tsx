import results from "../../results/model-comparison.json";
import { PredictionPlot } from "../components/PredictionPlot";

export default function Landing() {
  return (
    <>
      <section className="home-intro">
        <div>
          <p className="eyebrow">Nutrition data · Regression analysis</p>
          <h1>
            Calorie prediction,
            <br />
            with the work behind it.
          </h1>
          <p className="home-description">
            Estimate calories from nine nutrition values and explore the
            original six-model comparison. My methods, corrected results, and
            limitations are all here.
          </p>
          <div className="home-actions">
            <a className="primary-button" href="estimator.html">
              Get Started <span aria-hidden="true">→</span>
            </a>
            <a className="secondary-button" href="findings.html">
              Explore the findings
            </a>
          </div>
          <p className="availability">
            Estimator introduction available. Interactive form in development.
          </p>
        </div>
        <aside className="model-summary">
          <div className="panel-title">Selected regression model</div>
          <div className="model-summary-body">
            <code>polynomial_degree_2</code>
            <p>Nine nutrition inputs → Calories (kcal)</p>
            <dl>
              <div>
                <dt>Validation RMSE</dt>
                <dd>
                  {results.models.polynomial_degree_2.metrics.validation.rmse_calories.toFixed(
                    2,
                  )}{" "}
                  <small>kcal</small>
                </dd>
              </div>
              <div>
                <dt>Held-out test RMSE</dt>
                <dd>
                  {results.models.polynomial_degree_2.metrics.test.rmse_calories.toFixed(
                    2,
                  )}{" "}
                  <small>kcal</small>
                </dd>
              </div>
            </dl>
            <p className="small-note">
              Selected using validation results. Test data were held out from
              fitting and selection.
            </p>
          </div>
        </aside>
      </section>
      <div className="home-counts">
        <span>
          <strong>964</strong> cleaned records
        </span>
        <span>
          <strong>9</strong> nutrition inputs
        </span>
        <span>
          <strong>6</strong> regression models
        </span>
        <span>
          <strong>145</strong> held-out test items
        </span>
      </div>
      <section className="home-evidence">
        <div>
          <p className="eyebrow">Evaluate the evidence</p>
          <h2>Predictions against observed calories</h2>
          <p>
            The exported polynomial model reproduces the Python calculation in
            the browser. The study compares it with the other original
            regression models.
          </p>
          <p>
            These results describe this dataset. They do not establish
            performance on unseen restaurants or provide an uncertainty interval
            for a meal.
          </p>
          <a className="text-link" href="case-study.html">
            Read the methodology <span aria-hidden="true">→</span>
          </a>
        </div>
        <PredictionPlot />
      </section>
    </>
  );
}
