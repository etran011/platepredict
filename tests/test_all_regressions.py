"""Check my corrected six-model evaluation without expanding the original study."""

from pathlib import Path
import unittest

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import root_mean_squared_error, r2_score
from sklearn.tree import DecisionTreeRegressor

from platepredict.data import DataSplits, ModelData, load_data, split_data
from platepredict.regression import compare_all_regressions


CSV = Path(__file__).resolve().parents[1] / "archive/originals/FastFoodNutritionMenuV2.csv"


class AllRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.splits = split_data(load_data(CSV))
        cls.results = compare_all_regressions(cls.splits)

    def test_every_metric_uses_its_own_model_and_split(self):
        self.assertEqual(set(self.results.models), {
            "linear", "polynomial_degree_2", "knn", "svr", "decision_tree", "random_forest"
        })
        for name, model in self.results.models.items():
            self.assertEqual(set(self.results.metrics[name]), {"train", "validation", "test"})
            for label in ["train", "validation", "test"]:
                part = getattr(self.splits, label)
                predicted = model.predict(part.X)
                scores = self.results.metrics[name][label]
                self.assertAlmostEqual(scores["r2"], r2_score(part.y, predicted))
                self.assertAlmostEqual(scores["rmse_calories"], root_mean_squared_error(part.y, predicted))
        forest = self.results.models["random_forest"].predict(self.splits.test.X)
        tree = self.results.models["decision_tree"].predict(self.splits.test.X)
        self.assertFalse(np.array_equal(forest, tree))

    def test_original_candidates_and_correct_validation_r2(self):
        cases = [
            ("decision_tree", DecisionTreeRegressor, "min_samples_leaf", [1, 2, 5, 10, 15, 20, 25, 50, 100]),
            ("random_forest", RandomForestRegressor, "n_estimators", [5, 10, 50, 100, 500]),
        ]
        for name, factory, parameter, candidates in cases:
            tuning = self.results.tuning[name]
            self.assertEqual([row[parameter] for row in tuning["candidates"]], candidates)
            for row in tuning["candidates"]:
                model = factory(**{parameter: row[parameter]}, random_state=42)
                model.fit(self.splits.train.X, self.splits.train.y)
                predicted = model.predict(self.splits.validation.X)
                self.assertAlmostEqual(row["validation_r2"], r2_score(self.splits.validation.y, predicted))
            expected = max(tuning["candidates"], key=lambda row: row["validation_r2"])[parameter]
            self.assertEqual(tuning["selected"], expected)
            selected = self.results.models[name]
            self.assertEqual(selected.get_params()[parameter], expected)
            self.assertEqual(selected.random_state, 42)
            self.assertIsNone(selected.max_depth)

    def test_preprocessing_is_fitted_on_training_only(self):
        for name in ["knn", "svr"]:
            model = self.results.models[name]
            scaler = model[0]
            np.testing.assert_allclose(scaler.mean_, self.splits.train.X.mean(axis=0))
            np.testing.assert_allclose(scaler.var_, self.splits.train.X.var(axis=0, ddof=0))
            self.assertEqual(scaler.n_samples_seen_, 696)
        self.assertEqual(self.results.models["knn"][-1].n_neighbors, 5)
        self.assertEqual(self.results.models["svr"][-1].kernel, "rbf")
        self.assertEqual(self.results.models["svr"][-1].C, 1.0)
        self.assertEqual(self.results.models["svr"][-1].epsilon, 0.1)

    def test_test_labels_do_not_affect_tuning_or_demo_selection(self):
        test = self.splits.test
        changed = compare_all_regressions(DataSplits(
            self.splits.train, self.splits.validation,
            ModelData(test.X, test.y + 10000, test.metadata, test.raw_row_count),
        ))
        self.assertEqual(changed.tuning, self.results.tuning)
        self.assertEqual(changed.demo_model, self.results.demo_model)
        for name in self.results.models:
            self.assertEqual(changed.metrics[name]["validation"], self.results.metrics[name]["validation"])
            np.testing.assert_array_equal(
                changed.models[name].predict(test.X), self.results.models[name].predict(test.X)
            )


if __name__ == "__main__":
    unittest.main()
