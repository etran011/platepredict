"""Keep the website presets traceable to unchanged source records."""
import csv
import hashlib
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


class PresetTests(unittest.TestCase):
    def test_presets_match_original_records_and_model_dataset(self):
        data = json.loads((ROOT / "web/data/presets.json").read_text())
        model = json.loads((ROOT / "results/demo-model.v1.json").read_text())
        path = ROOT / data["source_path"]
        self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), data["dataset_sha256"])
        self.assertEqual(model["dataset_sha256"], data["dataset_sha256"])
        with path.open() as handle:
            rows = list(csv.DictReader(handle))
        for preset in data["presets"]:
            row = {re.sub(r"[^\w]+", "_", k.strip()).strip("_"): v
                   for k, v in rows[preset["source_row"]].items()}
            self.assertEqual(preset["restaurant"], row["Company"])
            self.assertEqual(preset["item"], row["Item"])
            self.assertEqual(preset["recorded_calories"], float(row["Calories"]))
            self.assertEqual(list(preset["inputs"]), [f["name"] for f in model["features"]])
            for name, value in preset["inputs"].items():
                self.assertEqual(value, float(row[name]))


if __name__ == "__main__":
    unittest.main()
