export const FEATURES = [
  { name: "Total_Fat_g", unit: "g" },
  { name: "Saturated_Fat_g", unit: "g" },
  { name: "Trans_Fat_g", unit: "g" },
  { name: "Cholesterol_mg", unit: "mg" },
  { name: "Sodium_mg", unit: "mg" },
  { name: "Carbs_g", unit: "g" },
  { name: "Fiber_g", unit: "g" },
  { name: "Sugars_g", unit: "g" },
  { name: "Protein_g", unit: "g" },
] as const;

export type FeatureName = (typeof FEATURES)[number]["name"];
export type NutritionInput = Record<FeatureName, number>;

interface Feature {
  readonly name: FeatureName;
  readonly unit: "g" | "mg";
  readonly training_min: number;
  readonly training_max: number;
}

export interface Model {
  readonly schema_version: 1;
  readonly model_version: string;
  readonly model: "polynomial_degree_2";
  readonly dataset_sha256: string;
  readonly features: readonly Feature[];
  readonly coefficients: readonly number[];
  readonly intercept: number;
  readonly powers: readonly (readonly number[])[];
}

export interface RangeWarning {
  feature: FeatureName;
  value: number;
  unit: "g" | "mg";
  trainingMin: number;
  trainingMax: number;
  message: string;
}

export interface Prediction {
  calories: number;
  warnings: RangeWarning[];
}

export class ModelLoadError extends Error {
  override name = "ModelLoadError";
}

export class InputValidationError extends Error {
  override name = "InputValidationError";
  constructor(public readonly issues: readonly string[]) {
    super(issues.join(" "));
  }
}

export class PredictionError extends Error {
  override name = "PredictionError";
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function requireModel(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ModelLoadError(`Invalid model: ${message}`);
}

export function parseModel(value: unknown): Model {
  requireModel(record(value), "expected an object.");
  requireModel(value.schema_version === 1, "unsupported schema version.");
  requireModel(value.model === "polynomial_degree_2", "unsupported model.");
  requireModel(typeof value.model_version === "string" && /^\d+\.\d+\.\d+$/.test(value.model_version),
    "missing or invalid model version.");
  requireModel(typeof value.dataset_sha256 === "string" && /^[a-f0-9]{64}$/.test(value.dataset_sha256),
    "missing dataset fingerprint.");
  requireModel(record(value.target) && value.target.name === "Calories" && value.target.unit === "kcal",
    "unexpected prediction target or unit.");
  requireModel(record(value.preprocessing) && value.preprocessing.kind === "none",
    "unsupported preprocessing.");
  const training = value.training;
  requireModel(record(training) && training.split === "train" && training.selection_split === "validation"
    && Number.isInteger(training.rows) && Number(training.rows) > 0 && training.random_state === 42
    && training.test_fraction === 0.15 && training.validation_fraction_of_remainder === 0.15,
    "unexpected training or selection metadata.");
  requireModel(Array.isArray(value.features) && value.features.length === FEATURES.length,
    "expected nine ordered inputs.");
  const features = value.features.map((feature: unknown, i: number): Feature => {
    requireModel(record(feature), "invalid feature.");
    requireModel(feature.name === FEATURES[i].name && feature.unit === FEATURES[i].unit,
      "unexpected feature order or units.");
    requireModel(finite(feature.training_min) && finite(feature.training_max)
      && feature.training_min >= 0 && feature.training_min <= feature.training_max,
      "invalid training range.");
    return Object.freeze({ name: FEATURES[i].name, unit: FEATURES[i].unit,
      training_min: feature.training_min, training_max: feature.training_max });
  });
  const transform = value.transformation;
  requireModel(record(transform) && transform.kind === "polynomial" && transform.degree === 2
    && transform.include_bias === false, "unsupported polynomial transformation.");
  requireModel(Array.isArray(transform.powers) && transform.powers.length === 54,
    "expected 54 polynomial terms.");
  const powers = transform.powers.map((row: unknown) => {
    requireModel(Array.isArray(row) && row.length === 9
      && row.every((p: unknown) => finite(p) && Number.isInteger(p) && p >= 0 && p <= 2),
      "invalid polynomial powers.");
    const degree = row.reduce((sum: number, p: number) => sum + p, 0);
    requireModel(degree === 1 || degree === 2, "invalid term degree.");
    return Object.freeze([...row] as number[]);
  });
  requireModel(new Set(powers.map((row) => row.join(","))).size === 54, "duplicate polynomial terms.");
  requireModel(Array.isArray(value.coefficients) && value.coefficients.length === powers.length
    && value.coefficients.every(finite) && finite(value.intercept), "invalid coefficients or intercept.");
  // I copy and freeze the validated model so later JSON mutations cannot alter predictions.
  return Object.freeze({
    schema_version: 1, model_version: value.model_version, model: "polynomial_degree_2",
    dataset_sha256: value.dataset_sha256, features: Object.freeze(features),
    coefficients: Object.freeze([...value.coefficients] as number[]),
    intercept: value.intercept, powers: Object.freeze(powers),
  });
}

export async function loadModel(url: string | URL, fetcher: typeof fetch = globalThis.fetch): Promise<Model> {
  try {
    const response = await fetcher(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseModel(await response.json());
  } catch (cause) {
    throw new ModelLoadError("The calorie model could not be loaded. Please try again.", { cause });
  }
}

export function predict(model: Model, input: unknown): Prediction {
  if (!record(input)) throw new InputValidationError(["Enter all nine nutrition values as numbers."]);
  const issues: string[] = [];
  const values = model.features.map((feature) => {
    const value = Object.hasOwn(input, feature.name) ? input[feature.name] : undefined;
    if (!finite(value) || value < 0) {
      issues.push(`${feature.name} must be a finite, nonnegative number in ${feature.unit}.`);
      return 0;
    }
    return value;
  });
  if (issues.length) throw new InputValidationError(issues);
  const warnings: RangeWarning[] = [];
  model.features.forEach((feature, i) => {
    if (values[i] < feature.training_min || values[i] > feature.training_max) {
      warnings.push({ feature: feature.name, value: values[i], unit: feature.unit,
        trainingMin: feature.training_min, trainingMax: feature.training_max,
        message: `${feature.name} is outside the training range (${feature.training_min}–${feature.training_max} ${feature.unit}); this estimate extrapolates beyond the observed range.` });
    }
  });
  let calories = model.intercept;
  model.powers.forEach((powers, term) => {
    let transformed = 1;
    powers.forEach((power, feature) => { transformed *= values[feature] ** power; });
    calories += model.coefficients[term] * transformed;
  });
  if (!Number.isFinite(calories)) {
    throw new PredictionError("These inputs exceed the model’s numerical range. Check the nutrition values.");
  }
  return { calories, warnings };
}
