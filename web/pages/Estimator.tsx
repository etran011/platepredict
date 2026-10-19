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
import { compareCalories, parseReportedCalories } from "../../browser/comparison";
import { ReviewHeuristic } from "../components/ReviewHeuristic";
import { reviewThreshold } from "../data/reviewRule";
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
  const [reported, setReported] = useState("");
  const [reportedError, setReportedError] = useState("");
  const [comparison, setComparison] = useState<ReturnType<
    typeof compareCalories
  > | null>(null);
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
    setReportedError("");
  }
  function selectPreset(id: string) {
    invalidate();
    setPresetId(id);
    const selected = source.presets.find((p) => String(p.source_row) === id);
    setReported(selected ? String(selected.recorded_calories) : "");
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
    setReported("");
    setComparison(null);
    setPresetId("");
    setResult(null);
    setStale(false);
    setErrors({});
    setFailure("");
    setReportedError("");
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
    setReportedError("");
    let parsedReported: number | null = null;
    let invalidReported = false;
    try {
      parsedReported = parseReportedCalories(reported);
    } catch (error) {
      invalidReported = true;
      setReportedError((error as Error).message);
    }
    if (Object.keys(issues).length || invalidReported) {
      setStale(Boolean(result));
      form.current
        ?.querySelector<HTMLInputElement>(
          `[name="${Object.keys(issues)[0] ?? "reported-calories"}"]`,
        )
        ?.focus();
      return;
    }
    try {
      // Reported calories stay separate from the nine-feature prediction input.
      const prediction = predict(model, input);
      setComparison(parsedReported === null ? null : compareCalories(parsedReported, prediction.calories, reviewThreshold));
      setResult(prediction);
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
        title="Complete calories."
        accent="Check consistency."
      >
        <p>
          Estimate a missing calorie value or check a reported value against the
          existing regression model. Enter nutrition values for the same serving.
          The model was trained on historical fast-food data; performance on other foods is not established.
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
            <h2>Complete or check an entry</h2>
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
          <fieldset>
            <legend>Optional comparison</legend>
            <div className="nutrition-field">
              <label htmlFor="reported-calories">
                Reported calories <span>(kcal, optional)</span>
              </label>
              <input
                id="reported-calories"
                name="reported-calories"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={reported}
                aria-invalid={Boolean(reportedError)}
                aria-describedby={`reported-help${reportedError ? " reported-error" : ""}`}
                onChange={(e) => {
                  invalidate();
                  setReported(e.target.value);
                }}
              />
              <p id="reported-help" className="preset-note">
                Leave blank to estimate a missing calorie value. If available, enter
                the reported calories for the same serving, including zero.
                This value is only for comparison, never a prediction input.
                Presets fill it from the original dataset; it is never replaced by the estimate.
              </p>
              {reportedError && (
                <p id="reported-error" className="input-error">
                  {reportedError}
                </p>
              )}
            </div>
          </fieldset>
          {(Object.keys(errors).length > 0 || reportedError) && (
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
          <h2>An estimate, not an overwrite.</h2>
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
                Enter all nine nutrition values, optionally add reported calories,
                then select Estimate calories.
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
                <p className="estimate-label">Estimated calories</p>
                <p className="estimate-value">
                  {format(result.calories)} <span>kcal</span>
                </p>
                <p>
                  Model estimate for the entered nutrition values, rounded to
                  one decimal place.
                </p>
                {comparison ? <div className="calorie-comparison">
                  <p className="estimate-label">
                    Reported calories · entered for comparison
                  </p>
                  <p className="reported-value">
                    {format(Number(reported))} <span>kcal</span>
                  </p>
                  <p className="comparison-difference">{comparison?.text}</p>
                  {comparison.needsReview ? (
                    <p className="estimate-warning"><strong>Needs review</strong><br />
                      The difference exceeds the {reviewThreshold} kcal review threshold.
                      This is not proof that the reported value is wrong.
                    </p>
                  ) : <p>The difference does not exceed the review threshold. This does not verify the entry.</p>}
                  <p>Difference uses displayed values rounded to one decimal place.
                    “Matches estimate” means agreement at that precision. Your reported value is preserved.</p>
                </div> : <p className="completion-note">
                  {result.calories < 0
                    ? "This negative estimate is not suitable for completing a missing calorie value. Review the inputs."
                    : "This estimate can help fill a missing calorie value in a food dataset. Verify it before storing it, and keep it labeled as estimated. No source record is changed."}
                </p>}
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
              I use this historical fast-food-trained model for calorie completion and
              consistency checking. Performance on other foods is not established.
              Small differences may reflect nutrition-label rounding or model error;
              calories are already closely related to the supplied macronutrients.
              These uses were not evaluated as imputation or anomaly detection in the original study.
            </p>
            <ReviewHeuristic />
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
