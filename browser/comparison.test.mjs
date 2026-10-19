import test from "node:test";
import assert from "node:assert/strict";
import { compareCalories } from "../.build/comparison.js";
import { parseModel, predict } from "../.build/inference.js";
import { readFileSync } from "node:fs";

test("comparison direction and matching use displayed precision", () => {
  assert.equal(compareCalories(240, 250).text, "10 kcal below prediction");
  assert.equal(compareCalories(260, 250).text, "10 kcal above prediction");
  assert.equal(compareCalories(250, 250).text, "Matches prediction");
  assert.equal(compareCalories(2.55, 2.6).text, "Matches prediction");
  assert.equal(compareCalories(250, 250.04).text, "Matches prediction");
  assert.equal(compareCalories(250, 250.06).text, "0.1 kcal below prediction");
  assert.equal(compareCalories(0, 10).text, "10 kcal below prediction");
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
