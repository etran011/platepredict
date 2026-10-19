import { useEffect, useRef, useState } from "react";
import { PageIntro } from "../components/Layout";
import {
  FEATURES,
  loadModel,
  predict,
  type Model,
  type Prediction,
  type FeatureName,
} from "../../browser/inference";
import modelUrl from "../../results/demo-model.v1.json?url";
import source from "../data/presets.json";
import "./estimator.css";

const labels = [
  "Total fat",
  "Saturated fat",
  "Trans fat",
  "Cholesterol",
  "Sodium",
  "Carbohydrates",
  "Fiber",
  "Sugars",
  "Protein",
];
const groups = [
  { title: "Fats", indices: [0, 1, 2] },
  { title: "Carbohydrates & protein", indices: [5, 6, 7, 8] },
  { title: "Cholesterol & sodium", indices: [3, 4] },
];
const empty = () =>
  Object.fromEntries(FEATURES.map((f) => [f.name, ""])) as Record<
    FeatureName,
    string
  >;
const format = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 1 });

export default function Estimator() {
  const [values, setValues] = useState(empty);
  const [model, setModel] = useState<Model | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<FeatureName, string>>>(
    {},
  );
  const [failure, setFailure] = useState("");
  const [result, setResult] = useState<Prediction | null>(null);
  const [stale, setStale] = useState(false);
  const [presetId, setPresetId] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const preset = source.presets.find((p) => String(p.source_row) === presetId);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    loadModel(modelUrl)
      .then((m) => {
        if (m.dataset_sha256 !== source.dataset_sha256)
          throw new Error("Preset dataset mismatch");
        if (active) setModel(m);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  function invalidate() {
    setStale(Boolean(result));
    setErrors({});
    setFailure("");
  }
  function selectPreset(id: string) {
    invalidate();
    setPresetId(id);
    const selected = source.presets.find((p) => String(p.source_row) === id);
    setValues(
      selected
        ? (Object.fromEntries(
            FEATURES.map((f) => [f.name, String(selected.inputs[f.name])]),
          ) as Record<FeatureName, string>)
        : empty(),
    );
  }
  function reset() {
    setValues(empty());
    setPresetId("");
    setResult(null);
    setStale(false);
    setErrors({});
    setFailure("");
    form.current?.querySelector<HTMLInputElement>("input")?.focus();
  }
  function calculate(event: React.FormEvent) {
    event.preventDefault();
    if (!model) return;
    const issues: Partial<Record<FeatureName, string>> = {};
    const input = Object.fromEntries(
      FEATURES.map((f) => {
        const raw = values[f.name].trim();
        const value = Number(raw);
        if (!raw || !Number.isFinite(value) || value < 0)
          issues[f.name] =
            `Enter a finite number of ${f.unit}, zero or greater.`;
        return [f.name, value];
      }),
    );
    setErrors(issues);
    setFailure("");
    if (Object.keys(issues).length) {
      setStale(Boolean(result));
      form.current
        ?.querySelector<HTMLInputElement>(`[name="${Object.keys(issues)[0]}"]`)
        ?.focus();
      return;
    }
    try {
      setResult(predict(model, input));
      setStale(false);
    } catch (error) {
      setResult(null);
      setStale(false);
      setFailure(
        error instanceof Error
          ? error.message
          : "The estimate could not be calculated. Check the inputs and try again.",
      );
    }
  }

  return (
    <>
      <PageIntro
        number="01"
        eyebrow="Estimator"
        title="Nutrition in."
        accent="An estimate out."
      >
        <p>
          Enter nine nutrition values for one menu item. My existing regression
          model calculates an estimate directly in your browser.
        </p>
      </PageIntro>
      <section className="estimator-workspace" aria-label="Calorie estimator">
        <form
          ref={form}
          className="estimator-form"
          onSubmit={calculate}
          noValidate
        >
          <div className="estimator-form-heading">
            <p className="eyebrow">01 / Nutrition label</p>
            <h2>Build your estimate</h2>
            <p>
              All nine values are required. Use grams (g) or milligrams (mg) as
              labeled; enter 0 only when the value is zero.
            </p>
          </div>
          <label className="preset-label" htmlFor="preset">
            Start with a historical menu item
          </label>
          <select
            id="preset"
            value={presetId}
            onChange={(e) => selectPreset(e.target.value)}
          >
            <option value="">Manual entry</option>
            {source.presets.map((p) => (
              <option key={p.source_row} value={p.source_row}>
                {p.restaurant} · {p.item}
              </option>
            ))}
          </select>
          <p className="preset-note">
            Presets come from the original dataset, not current menus. They may
            have appeared in training and are not independent evaluation
            examples.
          </p>
          {preset && (
            <div className="preset-source">
              <strong>
                {preset.restaurant} · {preset.item}
              </strong>
              <p>
                Recorded dataset calories:{" "}
                <b>{format(preset.recorded_calories)} kcal</b>. This is the
                source value, not a prediction.
              </p>
              <a
                href={`https://github.com/etran011/platepredict/blob/main/${source.source_path}`}
              >
                Original CSV ↗
              </a>
              <span>
                {" "}
                · source row {preset.source_row} (zero-based data record,
                excluding the header)
              </span>
            </div>
          )}
          {groups.map((group) => (
            <fieldset key={group.title}>
              <legend>{group.title}</legend>
              <div className="nutrition-fields">
                {group.indices.map((i) => {
                  const f = FEATURES[i];
                  return (
                    <div className="nutrition-field" key={f.name}>
                      <label htmlFor={f.name}>
                        {labels[i]} <span>({f.unit})</span>
                      </label>
                      <input
                        id={f.name}
                        name={f.name}
                        type="text"
                        inputMode="decimal"
                        required
                        autoComplete="off"
                        value={values[f.name]}
                        aria-invalid={Boolean(errors[f.name])}
                        aria-describedby={
                          errors[f.name] ? `${f.name}-error` : undefined
                        }
                        onChange={(e) => {
                          invalidate();
                          setPresetId("");
                          setValues((previous) => ({
                            ...previous,
                            [f.name]: e.target.value,
                          }));
                        }}
                      />
                      {errors[f.name] && (
                        <p className="input-error" id={`${f.name}-error`}>
                          {errors[f.name]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ))}
          {Object.keys(errors).length > 0 && (
            <p className="input-error" role="alert">
              Check the highlighted inputs before calculating.
            </p>
          )}
          <div className="estimator-actions">
            <button className="calculate" type="submit" disabled={!model}>
              Estimate calories <span aria-hidden="true">↗</span>
            </button>
            <button type="button" onClick={reset}>
              Reset inputs
            </button>
          </div>
        </form>
        <aside
          className="estimator-output"
          aria-label="Prediction and model information"
        >
          <p className="eyebrow">02 / Model output</p>
          <h2>Calories in perspective.</h2>
          <div
            className="estimate-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {!model && !loadError && <p>Loading the verified model…</p>}
            {loadError && (
              <p>
                The calorie model could not be loaded. No prediction is
                available.
              </p>
            )}
            {model && !result && !failure && (
              <p>
                Ready when you are. Enter the nutrition values, then select
                Estimate calories.
              </p>
            )}
            {stale && (
              <p className="estimate-warning">
                Inputs changed. The previous estimate is out of date. Calculate
                again to see a result for these values.
              </p>
            )}
            {result && !stale && (
              <>
                <p className="estimate-label">Predicted calories</p>
                <p className="estimate-value">
                  {format(result.calories)} <span>kcal</span>
                </p>
                <p>
                  Model estimate for the entered nutrition values, rounded to
                  one decimal place.
                </p>
                {result.calories < 0 && (
                  <p className="estimate-warning">
                    The model returned a negative estimate. This is not a
                    physically meaningful calorie value; the raw prediction has
                    not been clamped.
                  </p>
                )}
                {result.warnings.length > 0 && (
                  <div className="estimate-warning">
                    <strong>Outside the training range</strong>
                    <p>
                      This estimate extrapolates beyond observed values and may
                      be unreliable.
                    </p>
                    <ul>
                      {result.warnings.map((w) => (
                        <li key={w.feature}>
                          {
                            labels[
                              FEATURES.findIndex((f) => f.name === w.feature)
                            ]
                          }
                          : {format(w.value)} {w.unit}; training range{" "}
                          {w.trainingMin}–{w.trainingMax} {w.unit}.
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            {failure && (
              <p className="estimate-warning">
                {failure} No prediction is shown.
              </p>
            )}
          </div>
          {loadError && (
            <button type="button" onClick={() => setAttempt((n) => n + 1)}>
              Retry model loading
            </button>
          )}
          <div className="estimator-method">
            <p className="eyebrow">Behind the estimate</p>
            <h3>Degree-2 polynomial regression</h3>
            <p>
              I selected this model using validation results. The same exported
              coefficients run here without a Python server.
            </p>
            <p>
              This estimates calories from a nutrition label. It does not
              measure a meal, recommend a diet, or provide an individual
              confidence interval.
            </p>
            {model && (
              <p className="model-version">
                Model v{model.model_version} · 9 inputs · kcal
              </p>
            )}
            <a className="text-link" href="findings.html">
              <span className="action-label">Explore held-out results</span>
              <span className="action-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
        </aside>
      </section>
    </>
  );
}
