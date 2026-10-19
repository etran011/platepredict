import { useState } from "react";
import results from "../../results/model-comparison.json";

const models = Object.entries(results.models).sort((a, b) =>
  a[1].metrics.validation.rmse_calories - b[1].metrics.validation.rmse_calories);
const scale = Math.ceil(Math.max(...models.flatMap(([, m]) =>
  [m.metrics.validation.rmse_calories, m.metrics.test.rmse_calories])) / 50) * 50;

export function ModelComparison() {
  const [split, setSplit] = useState<"validation" | "test">("validation");
  const [active, setActive] = useState<string>(results.selection.demo_model);
  const model = models.find(([key]) => key === active)![1];
  return <section className="findings-section" id="model-comparison" aria-labelledby="models-title">
    <div className="findings-heading"><div><p className="eyebrow">01 / Model comparison</p>
      <h2 id="models-title">Six models. The same split.</h2></div>
      <p>I selected the demo using validation results. Test metrics describe its performance on records held back from fitting and selection.</p>
    </div>
    <div className="comparison-workspace">
      <div className="model-bars">
        <div className="chart-toolbar"><div><strong>Root mean squared error</strong><p>kcal · lower is better</p></div>
          <div className="split-controls" role="group" aria-label="Comparison split">
            {(["validation", "test"] as const).map(value => <button key={value} type="button" aria-pressed={split === value} onClick={() => setSplit(value)}>{value === "validation" ? "Validation" : "Test"}</button>)}
          </div>
        </div>
        <p className="split-explanation" aria-live="polite">{split === "validation" ? `Validation · ${results.rows.validation} items · used for selection` : `Held-out test · ${results.rows.test} items · evaluation only`}</p>
        <div className="bar-scale" aria-hidden="true"><span>0</span><span>{scale / 2}</span><span>{scale} kcal</span></div>
        <div className="bar-list">
          {models.map(([key, m]) => <button type="button" key={key} className="model-bar" aria-pressed={active === key} onClick={() => setActive(key)}>
            <span className="bar-label">{m.label}{key === results.selection.demo_model && <small>Demo model</small>}</span>
            <span className="bar-track" aria-hidden="true"><span style={{ width: `${m.metrics[split].rmse_calories / scale * 100}%` }} /></span>
            <span className="bar-value">{m.metrics[split].rmse_calories.toFixed(2)}<span className="sr-only"> kcal {split} RMSE</span></span>
          </button>)}
        </div>
        <p className="chart-note">Select a model to inspect both splits. Order and scale stay fixed when switching views; models are ordered by validation RMSE.</p>
      </div>
      <aside className="model-inspector" aria-live="polite" aria-atomic="true">
        <p className="eyebrow">Model in focus</p><h3>{model.label}</h3>
        {active === results.selection.demo_model && <p>My browser demo: the lower validation RMSE of the two original regression models, with a compact coefficient-based implementation.</p>}
        <dl>{(["validation", "test"] as const).map(value => <div key={value}>
          <dt>{value === "validation" ? "Validation" : "Held-out test"} · {results.rows[value]} items</dt>
          <dd><strong>{model.metrics[value].rmse_calories.toFixed(2)}</strong> kcal RMSE</dd>
          <dd>R² <strong>{model.metrics[value].r2.toFixed(4)}</strong></dd>
        </div>)}</dl>
        <p className="chart-note">RMSE is aggregate error, not a prediction interval. R² compares squared error with a mean-only baseline on the named split; it is not a percentage of correct predictions.</p>
      </aside>
    </div>
    <details className="data-disclosure"><summary>Read all six models’ validation and test metrics</summary>
      <div className="table-scroll" role="region" aria-label="Complete model metrics" tabIndex={0}>
        <table><caption>Corrected results · RMSE in kcal · R² is unitless</caption>
          <thead><tr><th scope="col">Model</th><th scope="col">Validation RMSE</th><th scope="col">Validation R²</th><th scope="col">Test RMSE</th><th scope="col">Test R²</th></tr></thead>
          <tbody>{models.map(([key, m]) => <tr key={key} className={key === results.selection.demo_model ? "selected-row" : ""}>
            <th scope="row">{m.label}{key === results.selection.demo_model && <span className="selected-label">Demo model</span>}</th>
            <td>{m.metrics.validation.rmse_calories.toFixed(2)}</td><td>{m.metrics.validation.r2.toFixed(4)}</td><td>{m.metrics.test.rmse_calories.toFixed(2)}</td><td>{m.metrics.test.r2.toFixed(4)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </details>
  </section>;
}
