"""Prepare my corrected model comparison and held-out chart data for the website."""

import argparse
import hashlib
import json
from pathlib import Path
import platform

import numpy as np
import pandas as pd
import scipy
import sklearn

from platepredict.data import FEATURES, load_data, split_data
from platepredict.regression import compare_all_regressions


MODEL_LABELS = {
    "linear": "Linear regression",
    "polynomial_degree_2": "Polynomial regression (degree 2)",
    "knn": "K-nearest neighbors",
    "svr": "Support vector regression",
    "decision_tree": "Decision tree",
    "random_forest": "Random forest",
}


def build_results(csv_path: str | Path) -> tuple[dict, dict]:
    """Recompute labeled results without fitting on validation or test records."""
    csv_path = Path(csv_path)
    data = load_data(csv_path)
    splits = split_data(data)
    results = compare_all_regressions(splits)
    dataset_hash = hashlib.sha256(csv_path.read_bytes()).hexdigest()
    comparison = {
        "schema_version": 1,
        "dataset": {
            "file": csv_path.name,
            "sha256": dataset_hash,
            "provenance": "My supplied historical nutrition CSV; upstream source and license are unverified.",
            "upstream_url": None,
            "redistribution_license": None,
        },
        "versions": {
            "python": platform.python_version(), "numpy": np.__version__,
            "pandas": pd.__version__, "scipy": scipy.__version__,
            "scikit_learn": sklearn.__version__,
        },
        "rows": {
            "raw": data.raw_row_count, "cleaned": len(data.X),
            "train": len(splits.train.X), "validation": len(splits.validation.X),
            "test": len(splits.test.X),
        },
        "features": list(FEATURES),
        "target": "Calories",
        "preparation": {
            "numeric_errors": "coerce_to_missing",
            "keep": "Calories > 0 and all nine inputs present",
            "source_row": "Zero-based original data-record position, excluding the CSV header",
        },
        "split": {
            "test_fraction": 0.15, "validation_fraction_of_remainder": 0.15,
            "random_state": 42, "fit_split": "train",
        },
        "selection": {
            "tuning": "Highest validation R²; exact ties retain the first candidate",
            "demo": "Lowest validation RMSE; exact ties favor linear regression",
            "demo_model": results.demo_model,
        },
        "models": {
            name: {"label": MODEL_LABELS[name], "metrics": results.metrics[name]}
            for name in results.models
        },
        "configurations": {
            "linear": {"estimator": "LinearRegression", "fit_intercept": True},
            "polynomial_degree_2": {
                "estimator": "LinearRegression", "fit_intercept": True,
                "degree": 2, "include_bias": False,
            },
            "knn": {"estimator": "KNeighborsRegressor", "n_neighbors": 5, "scaler": "StandardScaler"},
            "svr": {"estimator": "SVR", "kernel": "rbf", "scaler": "StandardScaler"},
            "decision_tree": {
                "estimator": "DecisionTreeRegressor", "random_state": 42, "max_depth": None,
                "min_samples_leaf": results.tuning["decision_tree"]["selected"],
            },
            "random_forest": {
                "estimator": "RandomForestRegressor", "random_state": 42, "max_depth": None,
                "n_estimators": results.tuning["random_forest"]["selected"],
            },
            "other_settings": "Scikit-learn defaults in the recorded version; scalers fit on train only",
        },
        "tuning": results.tuning,
        "corrections": [
            "I score forest tuning as r2_score(observed, predicted).",
            "I evaluate each model with its own predictions on the named split.",
            "I separate validation results from held-out test results.",
        ],
        "limitations": [
            "The original random split does not establish generalization to unseen restaurants.",
            "Repeated nutritional profiles can appear across splits.",
            "Rows with missing model values or nonpositive calories are excluded.",
            "RMSE is an aggregate error in calories, not an individual uncertainty interval.",
        ],
    }
    test = splits.test
    predicted = results.models[results.demo_model].predict(test.X)
    predictions = {
        "schema_version": 1,
        "dataset_sha256": dataset_hash,
        "model": results.demo_model,
        "split": "test",
        "fit_split": "train",
        "selection_split": "validation",
        "units": "calories",
        "count": len(test.X),
        "columns": ["source_row", "restaurant", "item", "observed_calories", "predicted_calories"],
        "rows": [
            [int(index), str(test.metadata.loc[index, "Company"]),
             str(test.metadata.loc[index, "Item"]), float(test.y.loc[index]), float(value)]
            for index, value in zip(test.X.index, predicted)
        ],
    }
    return comparison, predictions


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", help="Path to my original nutrition CSV")
    parser.add_argument("--output", type=Path, default=Path("results"))
    args = parser.parse_args()
    comparison, predictions = build_results(args.csv)
    args.output.mkdir(parents=True, exist_ok=True)
    for filename, payload in [
        ("model-comparison.json", comparison),
        ("demo-test-predictions.json", predictions),
    ]:
        (args.output / filename).write_text(
            json.dumps(payload, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )
        print(args.output / filename)


if __name__ == "__main__":
    main()
