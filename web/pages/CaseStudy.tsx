import { PageIntro } from "../components/Layout";
import results from "../../results/model-comparison.json";
import "./case-study.css";

const sourceRoot = "https://github.com/etran011/platepredict/blob/main/";
const selected = results.models[results.selection.demo_model as keyof typeof results.models];
const models = Object.entries(results.models).sort((a, b) =>
  a[1].metrics.validation.rmse_calories - b[1].metrics.validation.rmse_calories);
const nutrients: Record<string, [string, string]> = {
  Total_Fat_g: ["Total fat", "g"], Saturated_Fat_g: ["Saturated fat", "g"],
  Trans_Fat_g: ["Trans fat", "g"], Cholesterol_mg: ["Cholesterol", "mg"],
  Sodium_mg: ["Sodium", "mg"], Carbs_g: ["Carbohydrates", "g"],
  Fiber_g: ["Fiber", "g"], Sugars_g: ["Sugars", "g"], Protein_g: ["Protein", "g"],
};
const chapters = [
  ["approach", "The question"], ["data", "Data & inputs"], ["method", "Preparation & splits"],
  ["models", "Models & selection"], ["corrections", "Evaluation corrections"],
  ["limits", "Reading the evidence"], ["history", "Then & now"], ["sources", "Original materials"],
];

function StudyLink({ href, children }: { href: string; children: string }) {
  return <a className="text-link" href={href}><span className="action-label">{children}</span><span className="action-arrow" aria-hidden="true">↗</span></a>;
}

export default function CaseStudy() {
  return <>
    <PageIntro number="03" eyebrow="Case study" title="From nutrition labels to" accent="a model estimate">
      <p>How I brought an existing calorie-prediction study into the browser: the original approach, a corrected evaluation, and the limits that matter when reading the result.</p>
    </PageIntro>
    <div className="study-editions" aria-label="Original work and modernization">
      <div><p className="eyebrow">Original work</p><p>Nutrition exploration and six regression models in Python.</p></div>
      <div><p className="eyebrow">Modernization</p><p>Reproducible results, browser inference, and an interactive presentation.</p></div>
    </div>
    <div className="study-layout case-narrative">
      <aside><nav aria-label="Case study contents"><p className="eyebrow">Inside the study</p>
        {chapters.map(([id, label], i) => <a key={id} href={`#${id}`}><span>{String(i + 1).padStart(2, "0")}</span>{label}</a>)}
      </nav><p className="study-aside-note">Original materials preserved.<br />Displayed metrics reproduced and corrected.</p></aside>
      <article className="study-copy">
        <section id="approach" aria-labelledby="approach-title">
          <p className="eyebrow">01 / The original question</p>
          <h2 id="approach-title">What can nutrition values tell us about calories?</h2>
          <p className="study-lead">In the original study, we treated each menu item as a regression example: nutrition values in, recorded calories as the target.</p>
          <p>We explored the calorie distribution and nutrient relationships, then compared six regression approaches. Linear regression provided a simple baseline; degree-2 polynomial regression allowed curved relationships and interactions. Neighbor, support-vector, tree, and forest models offered other ways to fit the same data.</p>
          <p>The report’s motivation was to understand the relationship between nutrition information and calorie content. The evaluation measures prediction accuracy on these records; it does not establish health outcomes or dietary suitability.</p>
          <StudyLink href="findings.html#original-eda">Explore the original data visuals</StudyLink>
        </section>
        <section id="data" aria-labelledby="data-title">
          <p className="eyebrow">02 / Data & inputs</p><h2 id="data-title">One menu item. Nine nutrition values.</h2>
          <p>The historical CSV contains {results.rows.raw.toLocaleString("en-US")} rows from McDonald’s, Burger King, Wendy’s, KFC, Taco Bell, and Pizza Hut. Each record pairs menu-item nutrition values with recorded calories. The upstream dataset source and redistribution license remain unverified.</p>
          <div className="study-inputs"><div className="study-input-heading"><h3>Ordered prediction inputs</h3><span>Per menu-item serving</span></div>
            <ol>{results.features.map(feature => <li key={feature}><span>{nutrients[feature][0]}</span><span className="study-unit">{nutrients[feature][1]}</span></li>)}</ol>
            <p><strong>Target: Calories (kcal).</strong> Calories are never one of the nine prediction inputs.</p>
          </div>
          <p>The original preparation excluded restaurant, item name, Weight Watchers points, and calories from fat from the model. In the reusable implementation, I keep restaurant, item, and source-row metadata separately so results remain traceable.</p>
        </section>
        <section id="method" aria-labelledby="method-title">
          <p className="eyebrow">03 / Preparation & evaluation</p><h2 id="method-title">Keep the split boundaries clear.</h2>
          <ol className="study-process">
            <li><h3>Normalize and convert</h3><p>I preserve the notebook’s preparation: normalize column names and convert nutrition values to numbers. Unparseable values become missing.</p></li>
            <li><h3>Keep complete, positive-calorie records</h3><p>Exclude nonpositive calories and rows missing the target or any required input. From {results.rows.raw.toLocaleString("en-US")} raw rows, {results.rows.cleaned} remain; {results.rows.raw - results.rows.cleaned} are excluded.</p></li>
            <li><h3>Split before fitting</h3><p>Reserve {results.split.test_fraction * 100}% for test, then {results.split.validation_fraction_of_remainder * 100}% of the remainder for validation. Both random splits use <code>random_state={results.split.random_state}</code>.</p></li>
          </ol>
          <div className="study-partitions">{([
            ["train", "Training", "Fit models and preprocessing"],
            ["validation", "Validation", "Select settings and demo model"],
            ["test", "Held-out test", "Evaluate after selection"],
          ] as const).map(([key, title, detail]) => <div key={key}><strong>{results.rows[key]}</strong><h3>{title}</h3><p>{detail}</p></div>)}</div>
          <p>StandardScaler is fitted on training data for KNN and SVR. Polynomial features are fitted on training data too. Validation and test records are transformed with that fitted preprocessing; they do not participate in fitting.</p>
        </section>
        <section id="models" aria-labelledby="models-title">
          <p className="eyebrow">04 / Corrected results</p><h2 id="models-title">A compact regression for the browser.</h2>
          <p>In the reproduced comparison, polynomial and linear regression have the lowest validation errors among the original six models. I selected {selected.label.toLowerCase()} for the demo using validation RMSE. Its coefficients and polynomial transformation can be exported directly for browser prediction.</p>
          <div className="study-result"><p className="eyebrow">{selected.label}</p><dl>
            <div><dt>Validation RMSE · {results.rows.validation} items</dt><dd>{selected.metrics.validation.rmse_calories.toFixed(2)} <span>kcal</span></dd></div>
            <div><dt>Held-out test RMSE · {results.rows.test} items</dt><dd>{selected.metrics.test.rmse_calories.toFixed(2)} <span>kcal</span></dd></div>
          </dl><p>Validation determines selection. Test performance is reported afterward, not used to choose the model.</p></div>
          <div className="table-scroll" role="region" aria-label="Case study model comparison" tabIndex={0}><table>
            <caption>Corrected RMSE in kcal · lower is better · scroll for all columns</caption>
            <thead><tr><th scope="col">Original model</th><th scope="col">Validation</th><th scope="col">Held-out test</th></tr></thead>
            <tbody>{models.map(([key, model]) => <tr key={key} className={key === results.selection.demo_model ? "selected-row" : ""}><th scope="row">{model.label}{key === results.selection.demo_model && <span className="selected-label">Browser demo</span>}</th><td>{model.metrics.validation.rmse_calories.toFixed(2)}</td><td>{model.metrics.test.rmse_calories.toFixed(2)}</td></tr>)}</tbody>
          </table></div>
          <details className="study-details"><summary>Original configurations and tuning candidates</summary>
            <p>LinearRegression uses an intercept. PolynomialFeatures uses degree {results.configurations.polynomial_degree_2.degree} with <code>include_bias=False</code>, followed by LinearRegression. KNN uses {results.configurations.knn.n_neighbors} neighbors; SVR keeps its RBF kernel.</p>
            <p>Decision-tree minimum leaf candidates: {results.tuning.decision_tree.candidates.map(c => c.min_samples_leaf).join(", ")}. Random-forest tree-count candidates: {results.tuning.random_forest.candidates.map(c => c.n_estimators).join(", ")}.</p>
            <p>Both searches select the highest validation R², retaining the first candidate on an exact tie. The corrected choices are {results.tuning.decision_tree.selected} samples per leaf and {results.tuning.random_forest.selected} trees. The original candidate lists and random seed are unchanged.</p>
          </details>
          <StudyLink href="findings.html#model-comparison">Inspect RMSE, R², and held-out predictions</StudyLink>
        </section>
        <section id="corrections" aria-labelledby="corrections-title">
          <p className="eyebrow">05 / Modernization corrections</p><h2 id="corrections-title">Reproduce the work. Correct the evaluation.</h2>
          <p>I preserved the historical notebook and report unchanged. The displayed results come from the corrected evaluation, so they intentionally differ from affected figures in the original report.</p>
          <dl className="study-corrections">
            <div><dt>Random-forest tuning</dt><dd>The notebook passed predicted values before observed values to R². I now use <code>r2_score(observed, predicted)</code>, with the same candidate counts.</dd></div>
            <div><dt>Random-forest metrics</dt><dd>The notebook reused decision-tree predictions for the forest’s reported scores. I now evaluate each fitted model with its own predictions on each split.</dd></div>
            <div><dt>Validation versus test</dt><dd>I separate mislabeled validation results from held-out test results. Every displayed metric names its actual split, and model selection stays on validation data.</dd></div>
          </dl>
          <p>These changes repair evaluation and presentation. I did not add model families, new datasets, or a broader tuning search.</p>
        </section>
        <section id="limits" aria-labelledby="limits-title">
          <p className="eyebrow">06 / Reading the evidence</p><h2 id="limits-title">A close fit is not a health verdict.</h2>
          <div className="study-evidence"><div><h3>What the results establish</h3><p>The selected model closely reproduces recorded calories from nutrition values on this dataset’s held-out split. Calories are already closely related to fat, carbohydrates, and protein, so high R² needs that context.</p></div><div><h3>What they do not establish</h3><p>The random split does not test generalization to unseen restaurants. Repeated nutrition profiles can appear across partitions, and excluding incomplete or nonpositive-calorie records narrows the evaluated population.</p></div></div>
          <p>RMSE summarizes error across items; it is not a confidence interval for an individual prediction. High R² is not a percentage of correct predictions. Neither metric establishes overall nutritional quality, dietary suitability, or performance on foods outside the original data.</p>
          <p>In the modern estimator, “Actual calories” is a separate comparison value, never a model input. A lower reported value means lower calories than the model predicts for those inputs, not a healthier food. Small differences may reflect label rounding or model error. Historical presets may have appeared in training and are not independent evaluation examples.</p>
        </section>
        <section id="history" aria-labelledby="history-title">
          <p className="eyebrow">07 / Deployment & modernization</p><h2 id="history-title">An existing study, a new way to explore it.</h2>
          <div className="study-history"><div><p className="eyebrow">Original deployment · offline</p><h3>AWS EC2</h3><p>I previously deployed PlatePredict on AWS EC2. I no longer maintain that deployment, and it is now offline.</p></div><div><p className="eyebrow">Current modernization</p><h3>Python offline. Predictions in the browser.</h3><p>I extracted reusable preparation and evaluation, exported the existing regression to a versioned JSON artifact, and verified the TypeScript predictions against Python references. The frontend adds manual entry, traceable presets, calorie comparison, and interactive findings.</p><p>The static site is prepared for GitHub Pages without a running Python backend. Publication remains a separate step.</p></div></div>
          <StudyLink href="estimator.html">Try the calorie comparison</StudyLink>
        </section>
        <section id="sources" aria-labelledby="sources-title">
          <p className="eyebrow">08 / Source material</p><h2 id="sources-title">The original work stays intact.</h2>
          <p>My preserved report, <cite>Predicting Calories in Fast Food Items from Macronutrients</cite>, carries the original byline “Erik Tran.” The notebook, CSV, and report retain their original contents and attribution.</p>
          <ul className="study-sources">
            <li><a href={`${sourceRoot}archive/originals/project_implementation.ipynb`}>Original notebook <span>Exploration, preparation, and six-model analysis ↗</span></a></li>
            <li><a href={`${sourceRoot}archive/originals/platepredict_study_writeup.pdf`}>Original report (PDF) <span>Original reasoning, figures, and attribution ↗</span></a></li>
            <li><a href={`${sourceRoot}archive/originals/FastFoodNutritionMenuV2.csv`}>Original nutrition CSV <span>Historical source records ↗</span></a></li>
            <li><a href={`${sourceRoot}results/model-comparison.json`}>Corrected results artifact (JSON) <span>Metrics, counts, configurations, and dataset fingerprint ↗</span></a></li>
            <li><a href={`${sourceRoot}src/platepredict/regression.py`}>Reproduced evaluation <span>Training, validation selection, and split-specific scoring ↗</span></a></li>
          </ul>
        </section>
      </article>
    </div>
  </>;
}
