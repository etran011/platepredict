"""Check my exported polynomial terms, training ranges, and parity examples."""

import json
from pathlib import Path
import unittest

import numpy as np

from platepredict.data import FEATURES, load_data, split_data
from platepredict.export import ABSOLUTE_TOLERANCE, RELATIVE_TOLERANCE, UNITS, build_artifacts


ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "archive/originals/FastFoodNutritionMenuV2.csv"


class ExportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.artifact, cls.fixture = build_artifacts(CSV)

    def test_schema_feature_order_units_and_training_ranges(self):
        a = self.artifact
        self.assertEqual(a["schema_version"], 1)
        self.assertEqual(a["model_version"], "1.0.0")
        self.assertEqual([f["name"] for f in a["features"]], list(FEATURES))
        self.assertEqual([f["unit"] for f in a["features"]], list(UNITS))
        self.assertEqual(a["preprocessing"], {"kind": "none"})
        self.assertEqual(a["target"], {"name": "Calories", "unit": "kcal"})
        train = split_data(load_data(CSV)).train.X
        self.assertEqual(a["training"]["rows"], 696)
        self.assertEqual([f["training_min"] for f in a["features"]], train.min().tolist())
        self.assertEqual([f["training_max"] for f in a["features"]], train.max().tolist())
        powers = np.array(a["transformation"]["powers"])
        self.assertEqual(powers.shape, (54, 9))
        self.assertEqual(len(a["coefficients"]), 54)
        self.assertTrue(np.isin(powers.sum(axis=1), [1, 2]).all())
        self.assertEqual(len(set(map(tuple, powers))), 54)

    def test_artifact_math_matches_python_on_test_and_boundary_cases(self):
        a = self.artifact
        test = [case for case in self.fixture["cases"] if case["split"] == "test"]
        splits = split_data(load_data(CSV))
        self.assertEqual([c["source_row"] for c in test], splits.test.metadata.source_row.tolist())
        self.assertEqual(len(test), 145)
        self.assertEqual(len(self.fixture["cases"]), 176)
        for case in self.fixture["cases"]:
            values = np.asarray(case["inputs"])
            terms = np.prod(values ** np.asarray(a["transformation"]["powers"]), axis=1)
            actual = a["intercept"] + sum(terms * np.asarray(a["coefficients"]))
            error = abs(actual - case["expected_prediction"])
            self.assertLessEqual(error, ABSOLUTE_TOLERANCE + RELATIVE_TOLERANCE * abs(case["expected_prediction"]))
        prior = json.loads((ROOT / "results/demo-test-predictions.json").read_text())
        np.testing.assert_allclose([c["expected_prediction"] for c in test],
                                   [row[4] for row in prior["rows"]],
                                   atol=ABSOLUTE_TOLERANCE, rtol=RELATIVE_TOLERANCE)

    def test_checked_in_artifact_matches_fitted_export(self):
        saved = json.loads((ROOT / "results/demo-model.v1.json").read_text())
        for key in self.artifact.keys() - {"coefficients", "intercept"}:
            self.assertEqual(saved[key], self.artifact[key])
        np.testing.assert_allclose(saved["coefficients"], self.artifact["coefficients"], rtol=1e-9, atol=1e-8)
        self.assertAlmostEqual(saved["intercept"], self.artifact["intercept"], places=7)
        stored = json.loads((ROOT / "tests/fixtures/browser-parity.v1.json").read_text())
        self.assertEqual(stored["dataset_sha256"], self.fixture["dataset_sha256"])
        self.assertEqual(len(stored["cases"]), len(self.fixture["cases"]))
        for left, right in zip(stored["cases"], self.fixture["cases"]):
            self.assertEqual({k: v for k, v in left.items() if k != "expected_prediction"},
                             {k: v for k, v in right.items() if k != "expected_prediction"})
            np.testing.assert_allclose(left["expected_prediction"], right["expected_prediction"],
                                       atol=ABSOLUTE_TOLERANCE, rtol=RELATIVE_TOLERANCE)


if __name__ == "__main__":
    unittest.main()
