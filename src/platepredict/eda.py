"""Export the notebook's calorie histogram and two nutrient scatter plots."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd

from platepredict.data import normalize_columns


def build_eda(csv_path: str | Path) -> dict:
    path = Path(csv_path)
    frame = normalize_columns(pd.read_csv(path))
    columns = ["Calories", "Total_Fat_g", "Carbs_g"]
    values = frame[columns].apply(pd.to_numeric, errors="coerce")
    # These notebook plots precede model cleaning; zero calories remain included.
    counts, edges = np.histogram(values.Calories.dropna(), bins=30)
    return {
        "schema_version": 1,
        "dataset_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "population": "Original records before model cleaning; numeric values only for each plot",
        "notebook_cells": [6, 7],
        "raw_count": len(frame),
        "histogram": {
            "count": int(values.Calories.notna().sum()),
            "edges": edges.tolist(), "counts": counts.tolist(),
        },
        "columns": ["source_row", *columns],
        "rows": [
            [int(index), *[None if pd.isna(value) else float(value) for value in row]]
            for index, row in values.iterrows()
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", type=Path)
    parser.add_argument("--output", type=Path, default=Path("results/original-eda.json"))
    args = parser.parse_args()
    args.output.write_text(json.dumps(build_eda(args.csv), allow_nan=False, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    main()
