import reference from "../../results/demo-test-predictions.json";
import { deriveReviewThreshold } from "../../browser/comparison";

export const reviewThreshold = deriveReviewThreshold(
  reference.rows.map(row => Number(row[3])),
  reference.rows.map(row => Number(row[4])),
);
export const reviewReferenceCount = reference.count;
