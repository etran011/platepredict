import { reviewThreshold, reviewReferenceCount } from "../data/reviewRule";

export function ReviewHeuristic() {
  return <p>“Needs review” means an absolute reported-versus-estimated difference greater than {reviewThreshold} kcal, using the displayed one-decimal values. This threshold rounds the largest absolute error among {reviewReferenceCount} held-out demo predictions up to the next whole kcal. It is a review heuristic, not a validated anomaly detector or confidence interval. It does not prove an entry is wrong, and a difference below the threshold does not establish correctness. Check the source, serving size, units, and nutrition inputs before changing a record.</p>;
}
