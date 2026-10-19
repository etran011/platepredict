import test from "node:test";
import assert from "node:assert/strict";
import { compareCalories, parseReportedCalories, deriveReviewThreshold } from "../.build/comparison.js";
import { parseModel, predict } from "../.build/inference.js";
import { readFileSync } from "node:fs";

test("comparison direction and matching use displayed precision", () => {
  assert.equal(compareCalories(240, 250).text, "10 kcal below estimate");
  assert.equal(compareCalories(260, 250).text, "10 kcal above estimate");
  assert.equal(compareCalories(250, 250).text, "Matches estimate");
  assert.equal(compareCalories(2.55, 2.6).text, "Matches estimate");
  assert.equal(compareCalories(250, 250.04).text, "Matches estimate");
  assert.equal(compareCalories(250, 250.06).text, "0.1 kcal below estimate");
  assert.equal(compareCalories(0, 10).text, "10 kcal below estimate");
  for (const actual of [-1, NaN, Infinity])
    assert.throws(() => compareCalories(actual, 250));
  assert.throws(() => compareCalories(1e308, -1e308));
});

test("comparison changes never affect the nutrition prediction", () => {
  const model = parseModel(
    JSON.parse(
      readFileSync(new URL("../results/demo-model.v1.json", import.meta.url)),
    ),
  );
  const { presets } = JSON.parse(
    readFileSync(new URL("../web/data/presets.json", import.meta.url)),
  );
  const before = predict(model, presets[0].inputs);
  compareCalories(100, before.calories);
  compareCalories(1000, before.calories);
  assert.deepEqual(predict(model, presets[0].inputs), before);
  assert.equal(model.features.length, 9);
});


test("reported calories are optional; zero is supplied and invalid values fail", () => {
  for (const blank of ["", "  ", "\t\n"]) assert.equal(parseReportedCalories(blank), null);
  assert.equal(parseReportedCalories("0"), 0);
  assert.equal(parseReportedCalories(" 200.25 "), 200.25);
  for (const invalid of ["-1", "NaN", "Infinity", "1e309", "abc", "200 kcal"])
    assert.throws(() => parseReportedCalories(invalid));
});

test("review rule derives from held-out errors and uses symmetric displayed boundaries", () => {
  const reference = JSON.parse(readFileSync(new URL("../results/demo-test-predictions.json", import.meta.url)));
  const model = JSON.parse(readFileSync(new URL("../results/demo-model.v1.json", import.meta.url)));
  assert.equal(reference.dataset_sha256, model.dataset_sha256);
  assert.equal(reference.count, reference.rows.length);
  assert.equal(reference.split, "test");
  const threshold = deriveReviewThreshold(reference.rows.map(r => r[3]), reference.rows.map(r => r[4]));
  assert.equal(threshold, 56);
  for (const difference of [-56, -55.9, 0, 55.9, 56])
    assert.equal(compareCalories(500 + difference, 500, threshold).needsReview, false);
  for (const difference of [-56.1, 56.1, -300, 300])
    assert.equal(compareCalories(500 + difference, 500, threshold).needsReview, true);
  assert.equal(compareCalories(556.04, 500, threshold).needsReview, false);
  assert.equal(compareCalories(556.06, 500, threshold).needsReview, true);
  assert.equal(compareCalories(200, 500, threshold).text, "300 kcal below estimate");
  assert.equal(compareCalories(0, 500, threshold).needsReview, true);
  assert.equal(compareCalories(200, 500).needsReview, false);
  assert.throws(() => compareCalories(200, 500, NaN));
  assert.throws(() => deriveReviewThreshold([], []));
  assert.throws(() => deriveReviewThreshold([1], []));
  assert.throws(() => deriveReviewThreshold([1], [Infinity]));
});
