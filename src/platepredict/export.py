"""Export my selected training-only model and Python/browser parity examples."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd

from platepredict.data import FEATURES, load_data, split_data
from platepredict.regression import compare_all_regressions


MODEL_VERSION = "1.0.0"
UNITS = ("g", "g", "g", "mg", "mg", "g", "g", "g", "g")
ABSOLUTE_TOLERANCE = 1e-7
RELATIVE_TOLERANCE = 1e-10


def build_artifacts(csv_path: str | Path) -> tuple[dict, dict]:
    """Export the existing fit, preserving its raw prediction and term ordering."""
    csv_path = Path(csv_path)
    splits = split_data(load_data(csv_path))
    results = compare_all_regressions(splits)
    if results.demo_model != "polynomial_degree_2":
        raise ValueError("The selected model is not supported by this polynomial export")
    model = results.models[results.demo_model]
    poly, regression = model.steps[0][1], model.steps[1][1]
    minimum = splits.train.X.min().to_numpy()
    maximum = splits.train.X.max().to_numpy()
    artifact = {
        "schema_version": 1,
        "model_version": MODEL_VERSION,
        "model": results.demo_model,
        "dataset_sha256": hashlib.sha256(csv_path.read_bytes()).hexdigest(),
        "target": {"name": "Calories", "unit": "kcal"},
        "features": [
            {"name": name, "unit": unit, "training_min": float(low), "training_max": float(high)}
            for name, unit, low, high in zip(FEATURES, UNITS, minimum, maximum)
        ],
        "training": {
            "split": "train", "rows": len(splits.train.X), "random_state": 42,
            "test_fraction": 0.15, "validation_fraction_of_remainder": 0.15,
            "selection_split": "validation",
        },
        "preprocessing": {"kind": "none"},
        "transformation": {
            "kind": "polynomial", "degree": 2, "include_bias": False,
            "powers": poly.powers_.tolist(),
        },
        "coefficients": regression.coef_.tolist(),
        "intercept": float(regression.intercept_),
    }
    cases = []
    for source_row, row in splits.test.X.iterrows():
        cases.append({"label": f"held_out_{source_row}", "split": "test",
                      "source_row": int(source_row), "inputs": row.tolist()})
    mean = splits.train.X.mean().to_numpy()
    for label, values in [("zero", np.zeros(9)), ("training_minima", minimum),
                          ("training_maxima", maximum), ("training_mean", mean)]:
        cases.append({"label": label, "split": "boundary", "inputs": values.tolist()})
    for i, name in enumerate(FEATURES):
        for label, value in [("minimum", minimum[i]), ("maximum", maximum[i]),
                             ("above_maximum", maximum[i] + max(1.0, maximum[i] * 0.1))]:
            values = mean.copy()
            values[i] = value
            cases.append({"label": f"{name}_{label}", "split": "boundary", "inputs": values.tolist()})
    inputs = pd.DataFrame([case["inputs"] for case in cases], columns=list(FEATURES))
    predictions = model.predict(inputs)
    for case, prediction in zip(cases, predictions):
        case["expected_prediction"] = float(prediction)
        case["expected_out_of_range"] = [
            name for name, value, low, high in zip(FEATURES, case["inputs"], minimum, maximum)
            if value < low or value > high
        ]
    fixture = {
        "schema_version": 1, "model_version": MODEL_VERSION,
        "dataset_sha256": artifact["dataset_sha256"],
        "tolerance": {"absolute": ABSOLUTE_TOLERANCE, "relative": RELATIVE_TOLERANCE, "unit": "kcal"},
        "cases": cases,
    }
    return artifact, fixture


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", help="Path to my original nutrition CSV")
    parser.add_argument("--output", type=Path, default=Path("results/demo-model.v1.json"))
    parser.add_argument("--fixtures", type=Path, default=Path("tests/fixtures/browser-parity.v1.json"))
    args = parser.parse_args()
    artifact, fixture = build_artifacts(args.csv)
    for path, payload in [(args.output, artifact), (args.fixtures, fixture)]:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, allow_nan=False, separators=(",", ":")) + "\n", encoding="utf-8")
        print(path)


if __name__ == "__main__":
    main()
