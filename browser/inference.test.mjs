import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { FEATURES, InputValidationError, ModelLoadError, PredictionError, loadModel, parseModel, predict } from "../.build/inference.js";

const artifact = JSON.parse(readFileSync(new URL("../results/demo-model.v1.json", import.meta.url), "utf8"));
const fixture = JSON.parse(readFileSync(new URL("../tests/fixtures/browser-parity.v1.json", import.meta.url), "utf8"));
const model = parseModel(artifact);
const inputs = (values) => Object.fromEntries(FEATURES.map((f, i) => [f.name, values[i]]));
const mean = fixture.cases.find((c) => c.label === "training_mean");
const valid = () => inputs(mean.inputs);

// I compare raw predictions with the offline Python fit, before display rounding.
test("matches Python for all 145 held-out records and 31 boundary cases", (t) => {
  assert.equal(fixture.model_version, model.model_version);
  assert.equal(fixture.dataset_sha256, model.dataset_sha256);
  assert.equal(fixture.cases.filter((c) => c.split === "test").length, 145);
  assert.equal(fixture.cases.filter((c) => c.split === "boundary").length, 31);
  assert.deepEqual(fixture.tolerance, { absolute: 1e-7, relative: 1e-10, unit: "kcal" });
  let maxError = 0;
  for (const example of fixture.cases) {
    const result = predict(model, inputs(example.inputs));
    const error = Math.abs(result.calories - example.expected_prediction);
    const tolerance = fixture.tolerance.absolute + fixture.tolerance.relative * Math.abs(example.expected_prediction);
    assert.ok(error <= tolerance, `${example.label}: error ${error} > ${tolerance}`);
    assert.deepEqual(result.warnings.map((w) => w.feature), example.expected_out_of_range);
    maxError = Math.max(maxError, error);
  }
  t.diagnostic(`Maximum absolute Python/TypeScript difference: ${maxError} kcal`);
});

for (const { name, unit } of FEATURES) {
  test(`rejects missing, invalid, negative, and nonfinite ${name} (${unit})`, () => {
    const missing = valid();
    delete missing[name];
    assert.throws(() => predict(model, missing), InputValidationError);
    for (const value of [undefined, null, "", "10", NaN, Infinity, -Infinity, -1, true, [], {}]) {
      assert.throws(() => predict(model, { ...valid(), [name]: value }), (error) => {
        assert.ok(error instanceof InputValidationError);
        assert.ok(error.issues.some((issue) => issue.includes(name) && issue.includes(unit)));
        return true;
      });
    }
  });
}

test("rejects non-object inputs and inherited values", () => {
  for (const value of [undefined, null, [], 0, "", false]) assert.throws(() => predict(model, value), InputValidationError);
  assert.throws(() => predict(model, Object.create(valid())), InputValidationError);
});

test("keeps the nine units and ignores any supplied target", () => {
  assert.deepEqual(FEATURES.map((f) => f.unit), ["g", "g", "g", "mg", "mg", "g", "g", "g", "g"]);
  assert.deepEqual(predict(model, valid()), predict(model, { ...valid(), Calories: 999999 }));
  assert.deepEqual(predict(model, valid()).warnings, []);
});

test("warns about all out-of-range inputs without replacing them", () => {
  const values = Object.fromEntries(model.features.map((f) => [f.name, f.training_max + 1]));
  const result = predict(model, values);
  assert.equal(result.warnings.length, 9);
  for (const warning of result.warnings) {
    const feature = model.features.find((f) => f.name === warning.feature);
    assert.equal(warning.value, values[warning.feature]);
    assert.equal(warning.trainingMin, feature.training_min);
    assert.equal(warning.trainingMax, feature.training_max);
    assert.equal(warning.unit, feature.unit);
    assert.match(warning.message, /outside the training range/);
  }
  assert.deepEqual(Object.keys(result).sort(), ["calories", "warnings"]);
});

test("preserves negative predictions and rejects numerical overflow", () => {
  const zero = Object.fromEntries(FEATURES.map((f) => [f.name, 0]));
  assert.equal(predict(model, zero).calories, artifact.intercept);
  assert.ok(predict(model, zero).calories < 0);
  const huge = Object.fromEntries(FEATURES.map((f) => [f.name, Number.MAX_VALUE]));
  assert.throws(() => predict(model, huge), PredictionError);
});

test("rejects malformed or incompatible model artifacts", () => {
  const mutations = [
    (a) => { a.schema_version = 2; }, (a) => { a.model_version = ""; },
    (a) => { a.model = "unknown"; }, (a) => { a.dataset_sha256 = "invalid"; },
    (a) => { a.target.unit = "g"; }, (a) => { a.preprocessing.kind = "standard_scaler"; },
    (a) => { a.training.split = "test"; }, (a) => { a.training.selection_split = "test"; },
    (a) => { a.features.pop(); }, (a) => { a.features.reverse(); },
    (a) => { a.features[3].unit = "g"; }, (a) => { a.features[0].training_max = -1; },
    (a) => { a.features[0].training_min = NaN; }, (a) => { a.transformation.degree = 3; },
    (a) => { a.transformation.include_bias = true; }, (a) => { a.transformation.powers.pop(); },
    (a) => { a.transformation.powers[0] = a.transformation.powers[1]; },
    (a) => { a.transformation.powers[0][0] = 0.5; },
    (a) => { a.transformation.powers[0][0] = 2; a.transformation.powers[0][1] = 2; },
    (a) => { a.coefficients.pop(); }, (a) => { a.coefficients[0] = NaN; },
    (a) => { a.intercept = Infinity; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(artifact);
    mutate(copy);
    assert.throws(() => parseModel(copy), ModelLoadError);
  }
  for (const value of [null, [], 1, "{}", {}]) assert.throws(() => parseModel(value), ModelLoadError);
});

test("validated models are insulated from source JSON mutation", () => {
  const copy = structuredClone(artifact);
  const loaded = parseModel(copy);
  const expected = predict(loaded, valid());
  copy.intercept = 999; copy.coefficients[0] = 999;
  copy.transformation.powers[0][0] = 2; copy.features[0].training_max = 0;
  assert.deepEqual(predict(loaded, valid()), expected);
  assert.throws(() => { loaded.coefficients[0] = 999; }, TypeError);
  assert.throws(() => { loaded.powers[0][0] = 2; }, TypeError);
});

test("loads a static artifact at the caller's repository-relative URL", async () => {
  const requested = [];
  const loaded = await loadModel("/platepredict/results/demo-model.v1.json", async (url) => {
    requested.push(url);
    return new Response(JSON.stringify(artifact), { status: 200 });
  });
  assert.deepEqual(requested, ["/platepredict/results/demo-model.v1.json"]);
  assert.deepEqual(predict(loaded, valid()), predict(model, valid()));
});

test("handles load failures and permits a later retry", async () => {
  const failures = [
    async () => { throw new Error("offline"); },
    async () => new Response("missing", { status: 404 }),
    async () => new Response("unavailable", { status: 503 }),
    async () => new Response("not json"),
    async () => new Response(JSON.stringify({ schema_version: 99 })),
  ];
  for (const fetcher of failures) {
    await assert.rejects(loadModel("results/demo-model.v1.json", fetcher), (error) => {
      assert.ok(error instanceof ModelLoadError);
      assert.match(error.message, /could not be loaded/);
      assert.ok(error.cause);
      return true;
    });
  }
  const loaded = await loadModel("results/demo-model.v1.json", async () => new Response(JSON.stringify(artifact)));
  assert.ok(Number.isFinite(predict(loaded, valid()).calories));
});
