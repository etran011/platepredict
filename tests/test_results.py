"""Check that my website files preserve metrics, provenance, and held-out alignment."""

import hashlib
import json
from pathlib import Path
import unittest

import numpy as np
from sklearn.metrics import root_mean_squared_error, r2_score

from platepredict.data import load_data, split_data
from platepredict.results import build_results


ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "archive/originals/FastFoodNutritionMenuV2.csv"


class WebsiteResultsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.comparison, cls.predictions = build_results(CSV)

    def test_counts_provenance_and_labeled_metrics(self):
        result = self.comparison
        self.assertEqual(result["rows"], {
            "raw": 1148, "cleaned": 964, "train": 696, "validation": 123, "test": 145
        })
        self.assertEqual(result["dataset"]["sha256"], hashlib.sha256(CSV.read_bytes()).hexdigest())
        self.assertIsNone(result["dataset"]["upstream_url"])
        self.assertIsNone(result["dataset"]["redistribution_license"])
        self.assertEqual(len(result["models"]), 6)
        for model in result["models"].values():
            self.assertEqual(set(model["metrics"]), {"train", "validation", "test"})
            for metric in model["metrics"].values():
                self.assertEqual(set(metric), {"rmse_calories", "r2"})
                self.assertTrue(all(np.isfinite(v) for v in metric.values()))

    def test_held_out_points_match_source_and_test_scores(self):
        points = self.predictions
        splits = split_data(load_data(CSV))
        self.assertEqual(points["split"], "test")
        self.assertEqual(points["selection_split"], "validation")
        self.assertEqual(points["fit_split"], "train")
        self.assertEqual(points["count"], 145)
        self.assertEqual(points["model"], self.comparison["selection"]["demo_model"])
        self.assertEqual(points["dataset_sha256"], self.comparison["dataset"]["sha256"])
        self.assertEqual(points["columns"], [
            "source_row", "restaurant", "item", "observed_calories", "predicted_calories"
        ])
        indices = [row[0] for row in points["rows"]]
        self.assertEqual(indices, splits.test.metadata.source_row.tolist())
        self.assertEqual(len(set(indices)), 145)
        self.assertFalse(set(indices) & set(splits.train.metadata.source_row))
        self.assertFalse(set(indices) & set(splits.validation.metadata.source_row))
        for index, restaurant, item, observed, predicted in points["rows"]:
            self.assertEqual(restaurant, splits.test.metadata.loc[index, "Company"])
            self.assertEqual(item, splits.test.metadata.loc[index, "Item"])
            self.assertEqual(observed, splits.test.y.loc[index])
            self.assertTrue(np.isfinite(predicted))
        observed = [row[3] for row in points["rows"]]
        predicted = [row[4] for row in points["rows"]]
        scores = self.comparison["models"][points["model"]]["metrics"]["test"]
        self.assertAlmostEqual(scores["rmse_calories"], root_mean_squared_error(observed, predicted))
        self.assertAlmostEqual(scores["r2"], r2_score(observed, predicted))

    def test_checked_in_files_match_recalculation(self):
        def compare(stored, fresh):
            if isinstance(fresh, dict):
                self.assertEqual(set(stored), set(fresh))
                for key in fresh:
                    if key != "versions":
                        compare(stored[key], fresh[key])
            elif isinstance(fresh, list):
                self.assertEqual(len(stored), len(fresh))
                for left, right in zip(stored, fresh):
                    compare(left, right)
            elif isinstance(fresh, float):
                np.testing.assert_allclose(stored, fresh, rtol=1e-9, atol=1e-8)
            else:
                self.assertEqual(stored, fresh)

        # I allow floating-point noise and another recorded Python environment.
        for filename, fresh in [
            ("model-comparison.json", self.comparison),
            ("demo-test-predictions.json", self.predictions),
        ]:
            compare(json.loads((ROOT / "results" / filename).read_text()), fresh)


if __name__ == "__main__":
    unittest.main()
