"""Focused cleaning and split regression checks against the supplied originals."""

from pathlib import Path
import unittest

import pandas as pd
from pandas.testing import assert_frame_equal, assert_series_equal
from sklearn.model_selection import train_test_split

from platepredict.data import FEATURES, load_data, normalize_columns, prepare_data, split_data


CSV = Path(__file__).resolve().parents[1] / "archive/originals/FastFoodNutritionMenuV2.csv"
EXPECTED_FEATURES = [
    "Total_Fat_g", "Saturated_Fat_g", "Trans_Fat_g", "Cholesterol_mg",
    "Sodium_mg", "Carbs_g", "Fiber_g", "Sugars_g", "Protein_g",
]


class CleaningTests(unittest.TestCase):
    def test_normalization_and_collision(self):
        frame = pd.DataFrame(columns=[" Total Fat\n(g) ", "Sodium \n(mg)"])
        self.assertEqual(list(normalize_columns(frame)), ["Total_Fat_g", "Sodium_mg"])
        self.assertEqual(list(frame), [" Total Fat\n(g) ", "Sodium \n(mg)"])
        with self.assertRaisesRegex(ValueError, "collide"):
            normalize_columns(pd.DataFrame(columns=["Total Fat (g)", "Total_Fat_g"]))

    def test_cleaning_and_provenance(self):
        frame = pd.DataFrame({
            "Company": ["Restaurant"] * 8,
            "Item": [f"Item {i}" for i in range(8)],
            "Calories": ["250", "0", "-1", "unknown", "300", "400", None, "150"],
            **{feature: ["1.5"] * 8 for feature in FEATURES},
            "Calories from Fat": [None] * 8,
            "Weight Watchers Pnts": [None] * 8,
        }, index=[9] * 8)
        frame.iloc[4, frame.columns.get_loc("Protein_g")] = "unknown"
        frame.iloc[5, frame.columns.get_loc("Sodium_mg")] = None
        original = frame.copy(deep=True)
        data = prepare_data(frame)
        assert_frame_equal(frame, original)
        self.assertEqual(data.raw_row_count, 8)
        self.assertEqual(data.metadata.source_row.tolist(), [0, 7])
        self.assertEqual(data.metadata.Item.tolist(), ["Item 0", "Item 7"])
        self.assertEqual(data.metadata.Company.tolist(), ["Restaurant"] * 2)
        self.assertEqual(data.y.tolist(), [250.0, 150.0])
        self.assertEqual(list(data.X), EXPECTED_FEATURES)
        self.assertNotIn("Calories", data.X)
        self.assertEqual(data.y.name, "Calories")
        self.assertTrue(all(pd.api.types.is_numeric_dtype(t) for t in data.X.dtypes))
        self.assertFalse(data.X.isna().any().any())
        self.assertTrue(data.X.index.equals(data.y.index))
        self.assertTrue(data.X.index.equals(data.metadata.index))

    def test_missing_required_column_is_explicit(self):
        with self.assertRaisesRegex(ValueError, "Missing required columns"):
            prepare_data(pd.DataFrame({"Calories": [100]}))


class OriginalDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_data(CSV)

    def test_original_counts_and_model_schema(self):
        self.assertEqual(self.data.raw_row_count, 1148)
        self.assertEqual(len(self.data.X), 964)
        self.assertEqual(list(self.data.X), EXPECTED_FEATURES)
        self.assertEqual(list(self.data.metadata), ["source_row", "Company", "Item"])
        self.assertTrue(self.data.y.gt(0).all())
        self.assertFalse(self.data.X.isna().any().any())
        self.assertNotIn("Calories", self.data.X)

    def test_exact_notebook_splits_and_alignment(self):
        splits = split_data(self.data)
        X_remaining, X_test, y_remaining, y_test = train_test_split(
            self.data.X, self.data.y, test_size=0.15, random_state=42
        )
        X_train, X_val, y_train, y_val = train_test_split(
            X_remaining, y_remaining, test_size=0.15, random_state=42
        )
        for part, X, y, count in [
            (splits.train, X_train, y_train, 696),
            (splits.validation, X_val, y_val, 123),
            (splits.test, X_test, y_test, 145),
        ]:
            self.assertEqual(len(part.X), count)
            assert_frame_equal(part.X, X)
            assert_series_equal(part.y, y)
            assert_frame_equal(part.metadata, self.data.metadata.loc[X.index])
            self.assertEqual(part.metadata.source_row.tolist(), X.index.tolist())
            self.assertEqual(list(part.X), EXPECTED_FEATURES)
        sets = [set(p.metadata.source_row) for p in (splits.train, splits.validation, splits.test)]
        self.assertFalse(sets[0] & sets[1])
        self.assertFalse(sets[0] & sets[2])
        self.assertFalse(sets[1] & sets[2])
        self.assertEqual(set.union(*sets), set(self.data.metadata.source_row))
        repeated = split_data(self.data)
        assert_frame_equal(repeated.train.X, splits.train.X)
        assert_frame_equal(repeated.validation.X, splits.validation.X)
        assert_frame_equal(repeated.test.X, splits.test.X)


if __name__ == "__main__":
    unittest.main()
