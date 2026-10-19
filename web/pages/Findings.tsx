import { PageIntro } from "../components/Layout";
import { PredictionPlot } from "../components/PredictionPlot";
import { ModelComparison } from "../components/ModelComparison";
import { OriginalEDA } from "../components/OriginalEDA";
import "./findings.css";
import results from "../../results/model-comparison.json";
const selected = results.models[results.selection.demo_model as keyof typeof results.models];
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
      <nav className="findings-index" aria-label="On this page">
        <a href="#model-comparison">01 / Compare models</a>
        <a href="#held-out">02 / Held-out predictions</a>
        <a href="#original-eda">03 / Explore the data</a>
        <a href="#interpretation">04 / Interpretation</a>
      </nav>
      <div className="evaluation-strip" aria-label="Dataset partitions">
        <p><strong>{results.rows.train}</strong> Training <span>Fit models and preprocessing</span></p>
        <p><strong>{results.rows.validation}</strong> Validation <span>Select settings and demo</span></p>
        <p><strong>{results.rows.test}</strong> Test <span>Evaluate held-out predictions</span></p>
      </div>
      <ModelComparison />
      <section className="findings-grid findings-section" id="held-out" aria-labelledby="held-out-title">
        <div>
          <p className="eyebrow">02 / Demo model · Degree 2</p>
          <h2 id="held-out-title">Close to the diagonal.</h2>
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
        <PredictionPlot interactive />
      </section>
      <OriginalEDA />
      <section className="findings-section interpretation" id="interpretation" aria-labelledby="interpretation-title">
        <p className="eyebrow">04 / Reading the results</p>
        <h2 id="interpretation-title">High accuracy needs context.</h2>
        <div className="interpretation-columns">
          <div><h3>Nutrition already explains much of the target.</h3><p>Fat, carbohydrates, and protein are closely related to calories. A high R² here means the model closely reproduces recorded calorie values from related nutrition inputs on this split. It does not establish a broader understanding of food or nutritional quality.</p></div>
          <div><h3>A random split has limits.</h3><p>The {results.rows.cleaned} complete, positive-calorie records were randomly split with seed {results.split.random_state}. Repeated nutritional profiles can cross partitions. These results do not establish performance on unseen restaurants or foods outside the original dataset.</p></div>
        </div>
        <details className="data-disclosure"><summary>What I corrected in the original evaluation</summary><ul>
          <li>I corrected the reversed observed/predicted arguments in random-forest tuning’s R² calculation.</li>
          <li>I use the forest’s own predictions for its metrics, rather than reusing decision-tree predictions.</li>
          <li>I label validation and test results separately. Preprocessing is fitted on training data, and selection uses validation results.</li>
        </ul><p>The original source files remain unchanged. The models and original tuning candidates are preserved.</p></details>
      </section>
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
          These results evaluate prediction accuracy on the original
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
    </>
  );
}
