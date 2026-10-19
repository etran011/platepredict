"""Check displayed EDA values against the notebook's original CSV population."""

import hashlib
import json
from pathlib import Path
import unittest

import numpy as np
import pandas as pd

from platepredict.eda import build_eda

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "archive/originals/FastFoodNutritionMenuV2.csv"


class EDATests(unittest.TestCase):
    def test_notebook_population_and_bins(self):
        result = build_eda(CSV)
        raw = pd.read_csv(CSV)
        calories = pd.to_numeric(raw["Calories"], errors="coerce")
        counts, edges = np.histogram(calories.dropna(), bins=30)
        self.assertEqual(result["histogram"]["counts"], counts.tolist())
        self.assertEqual(result["histogram"]["edges"], edges.tolist())
        self.assertEqual(sum(counts), result["histogram"]["count"])
        self.assertEqual(result["raw_count"], 1148)
        self.assertEqual(result["dataset_sha256"], hashlib.sha256(CSV.read_bytes()).hexdigest())
        for column, position in [("Total Fat\n(g)", 2), ("Carbs\n(g)", 3)]:
            nutrient = pd.to_numeric(raw[column], errors="coerce")
            expected = calories.notna() & nutrient.notna()
            points = [row for row in result["rows"] if row[1] is not None and row[position] is not None]
            self.assertEqual([row[0] for row in points], raw.index[expected].tolist())
            np.testing.assert_array_equal([row[position] for row in points], nutrient[expected])
            np.testing.assert_array_equal([row[1] for row in points], calories[expected])
        self.assertTrue(any(row[1] == 0 for row in result["rows"]))
        self.assertEqual(result, json.loads((ROOT / "results/original-eda.json").read_text()))


if __name__ == "__main__":
    unittest.main()
