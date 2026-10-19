// Compare displayed values, so the difference agrees with the visible numbers.
export function compareCalories(actual: number, predicted: number) {
  if (!Number.isFinite(actual) || actual < 0 || !Number.isFinite(predicted))
    throw new Error("Enter finite, nonnegative actual calories.");
  const rounded = (value: number) =>
    Number(
      value.toLocaleString("en-US", {
        useGrouping: false,
        maximumFractionDigits: 1,
      }),
    );
  const difference = rounded(rounded(actual) - rounded(predicted));
  if (!Number.isFinite(difference))
    throw new Error("These values exceed the comparison’s numerical range.");
  const direction =
    difference < 0 ? "below" : difference > 0 ? "above" : "match";
  const magnitude = Math.abs(difference).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });
  return {
    direction,
    text:
      direction === "match"
        ? "Matches prediction"
        : `${magnitude} kcal ${direction} prediction`,
  };
}
