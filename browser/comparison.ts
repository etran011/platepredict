// Compare displayed values, so the difference agrees with the visible numbers.
export function compareCalories(reported: number, predicted: number, reviewThreshold?: number) {
  if (!Number.isFinite(reported) || reported < 0 || !Number.isFinite(predicted))
    throw new Error("Enter finite, nonnegative reported calories.");
  if (reviewThreshold !== undefined && (!Number.isFinite(reviewThreshold) || reviewThreshold < 0))
    throw new Error("The review threshold must be finite and nonnegative.");
  const rounded = (value: number) =>
    Number(
      value.toLocaleString("en-US", {
        useGrouping: false,
        maximumFractionDigits: 1,
      }),
    );
  const difference = rounded(rounded(reported) - rounded(predicted));
  if (!Number.isFinite(difference))
    throw new Error("These values exceed the comparison’s numerical range.");
  const direction =
    difference < 0 ? "below" : difference > 0 ? "above" : "match";
  const magnitude = Math.abs(difference).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });
  return {
    direction,
    difference,
    needsReview: reviewThreshold !== undefined && Math.abs(difference) > reviewThreshold,
    text:
      direction === "match"
        ? "Matches estimate"
        : `${magnitude} kcal ${direction} estimate`,
  };
}

// A blank reported value is missing, not a zero-calorie report.
export function parseReportedCalories(raw: string): number | null {
  if (!raw.trim()) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0)
    throw new Error("Enter reported calories as a finite number, zero or greater, or leave blank.");
  return value;
}

// Conservative empirical reference, not a calibrated anomaly detector.
export function deriveReviewThreshold(observed: number[], predicted: number[]): number {
  if (!observed.length || observed.length !== predicted.length)
    throw new Error("Held-out reference pairs are required.");
  const errors = observed.map((value, i) => Math.abs(value - predicted[i]));
  if (![...observed, ...predicted, ...errors].every(Number.isFinite))
    throw new Error("Held-out reference values must be finite.");
  return Math.ceil(Math.max(...errors));
}
