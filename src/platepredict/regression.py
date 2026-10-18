"""Reproduce my original linear and degree-two polynomial regressions."""

from dataclasses import dataclass
import argparse
import json
import platform

import pandas as pd
import sklearn
from sklearn.linear_model import LinearRegression
from sklearn.metrics import root_mean_squared_error, r2_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures

from platepredict.data import DataSplits, FEATURES, load_data, split_data


@dataclass
class RegressionResults:
    """Fitted models, split-specific scores, and the validation-based demo choice."""

    models: dict
    metrics: dict
    demo_model: str


def compare_regressions(splits: DataSplits) -> RegressionResults:
    """Fit on training only; choose by validation RMSE before scoring the test set."""
    models = {
        "linear": LinearRegression(),
        "polynomial_degree_2": make_pipeline(
            PolynomialFeatures(degree=2, include_bias=False), LinearRegression()
        ),
    }
    metrics = {}

    def score(model, partition):
        predictions = model.predict(partition.X)
        return {
            "rmse_calories": float(root_mean_squared_error(partition.y, predictions)),
            "r2": float(r2_score(partition.y, predictions)),
        }

    for name, model in models.items():
        model.fit(splits.train.X, splits.train.y)
        metrics[name] = {"validation": score(model, splits.validation)}

    # I use validation RMSE; an exact tie favors the simpler linear model.
    demo_model = min(models, key=lambda name: (
        metrics[name]["validation"]["rmse_calories"], name != "linear"
    ))
    for name, model in models.items():
        metrics[name]["train"] = score(model, splits.train)
        metrics[name]["test"] = score(model, splits.test)
    return RegressionResults(models, metrics, demo_model)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", help="Path to the original nutrition CSV")
    args = parser.parse_args()
    data = load_data(args.csv)
    splits = split_data(data)
    results = compare_regressions(splits)
    print(json.dumps({
        "versions": {"python": platform.python_version(), "pandas": pd.__version__,
                     "scikit_learn": sklearn.__version__},
        "rows": {"raw": data.raw_row_count, "cleaned": len(data.X),
                 "train": len(splits.train.X), "validation": len(splits.validation.X),
                 "test": len(splits.test.X)},
        "features": list(FEATURES),
        "metrics": results.metrics,
        "demo_model": results.demo_model,
        "selection_rule": "Lowest validation RMSE; exact ties favor linear regression",
    }, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
