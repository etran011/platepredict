"""Check my extracted regressions against the notebook's model operations."""

from pathlib import Path
import unittest

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import root_mean_squared_error, r2_score
from sklearn.preprocessing import PolynomialFeatures

from platepredict.data import DataSplits, ModelData, load_data, split_data
from platepredict.regression import compare_regressions


CSV = Path(__file__).resolve().parents[1] / "archive/originals/FastFoodNutritionMenuV2.csv"


class RegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.splits = split_data(load_data(CSV))
        cls.results = compare_regressions(cls.splits)

    def test_matches_original_model_operations(self):
        train, validation, test = self.splits.train, self.splits.validation, self.splits.test
        poly = PolynomialFeatures(degree=2, include_bias=False)
        linear = LinearRegression().fit(train.X, train.y)
        polynomial = LinearRegression().fit(poly.fit_transform(train.X), train.y)
        self.assertEqual(poly.n_output_features_, 54)
        for name, model in [("linear", linear), ("polynomial_degree_2", polynomial)]:
            for label, part in [("train", train), ("validation", validation), ("test", test)]:
                inputs = poly.transform(part.X) if name == "polynomial_degree_2" else part.X
                expected = model.predict(inputs)
                actual = self.results.models[name].predict(part.X)
                np.testing.assert_allclose(actual, expected, rtol=1e-10, atol=1e-8)
                metrics = self.results.metrics[name][label]
                self.assertAlmostEqual(metrics["rmse_calories"], root_mean_squared_error(part.y, expected))
                self.assertAlmostEqual(metrics["r2"], r2_score(part.y, expected))

    def test_reproduces_saved_notebook_rmse(self):
        expected = {
            "linear": {"train": 12.305, "validation": 13.793, "test": 12.082},
            "polynomial_degree_2": {"train": 10.302, "validation": 11.623, "test": 10.034},
        }
        for model, splits in expected.items():
            for split, rmse in splits.items():
                self.assertAlmostEqual(
                    self.results.metrics[model][split]["rmse_calories"], rmse, places=3
                )

    def test_selection_uses_validation_not_test(self):
        selected = min(self.results.metrics, key=lambda name: (
            self.results.metrics[name]["validation"]["rmse_calories"], name != "linear"
        ))
        self.assertEqual(self.results.demo_model, selected)
        test = self.splits.test
        changed_test = ModelData(test.X, test.y + 10000, test.metadata, test.raw_row_count)
        changed = compare_regressions(DataSplits(
            self.splits.train, self.splits.validation, changed_test
        ))
        self.assertEqual(changed.demo_model, self.results.demo_model)
        for name in self.results.models:
            self.assertEqual(changed.metrics[name]["validation"], self.results.metrics[name]["validation"])
            self.assertNotEqual(changed.metrics[name]["test"], self.results.metrics[name]["test"])
            np.testing.assert_array_equal(
                changed.models[name].predict(test.X), self.results.models[name].predict(test.X)
            )


if __name__ == "__main__":
    unittest.main()
