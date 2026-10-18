"""Reproduce my original regressions with corrected, split-specific evaluation."""

from dataclasses import dataclass, field
import argparse
import json
import platform

import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.neighbors import KNeighborsRegressor
from sklearn.metrics import root_mean_squared_error, r2_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor

from platepredict.data import DataSplits, FEATURES, load_data, split_data


@dataclass
class RegressionResults:
    """Fitted models, split-specific scores, and the validation-based demo choice."""

    models: dict
    metrics: dict
    demo_model: str
    tuning: dict = field(default_factory=dict)


TREE_LEAF_CANDIDATES = (1, 2, 5, 10, 15, 20, 25, 50, 100)
FOREST_ESTIMATOR_CANDIDATES = (5, 10, 50, 100, 500)


def _base_models():
    return {
        "linear": LinearRegression(),
        "polynomial_degree_2": make_pipeline(
            PolynomialFeatures(degree=2, include_bias=False), LinearRegression()
        ),
    }


def _score(model, partition):
    predictions = model.predict(partition.X)
    return {
        "rmse_calories": float(root_mean_squared_error(partition.y, predictions)),
        "r2": float(r2_score(partition.y, predictions)),
    }


def _evaluate(models, splits):
    metrics = {}
    for name, model in models.items():
        model.fit(splits.train.X, splits.train.y)
        metrics[name] = {"validation": _score(model, splits.validation)}

    # I use validation RMSE; an exact tie favors the simpler linear model.
    demo_model = min(models, key=lambda name: (
        metrics[name]["validation"]["rmse_calories"], name != "linear"
    ))
    for name, model in models.items():
        metrics[name]["train"] = _score(model, splits.train)
        metrics[name]["test"] = _score(model, splits.test)
    return RegressionResults(models, metrics, demo_model)


def compare_regressions(splits: DataSplits) -> RegressionResults:
    """Reproduce my two regressions using validation-only demo selection."""
    return _evaluate(_base_models(), splits)


def _tune(factory, parameter, candidates, splits):
    scores = []
    for value in candidates:
        model = factory(**{parameter: value}, random_state=42)
        model.fit(splits.train.X, splits.train.y)
        scores.append({
            parameter: value,
            "validation_r2": float(r2_score(
                splits.validation.y, model.predict(splits.validation.X)
            )),
        })
    # I retain the notebook's first-candidate tie behavior and training-only refit.
    best = max(scores, key=lambda row: row["validation_r2"])[parameter]
    return factory(**{parameter: best}, random_state=42), {
        "parameter": parameter,
        "selection_metric": "validation_r2",
        "candidates": scores,
        "selected": best,
    }


def compare_all_regressions(splits: DataSplits) -> RegressionResults:
    """Evaluate my six original model families and unchanged tuning candidates."""
    tree, tree_tuning = _tune(
        DecisionTreeRegressor, "min_samples_leaf", TREE_LEAF_CANDIDATES, splits
    )
    forest, forest_tuning = _tune(
        RandomForestRegressor, "n_estimators", FOREST_ESTIMATOR_CANDIDATES, splits
    )
    models = _base_models()
    models.update({
        "knn": make_pipeline(StandardScaler(), KNeighborsRegressor(n_neighbors=5)),
        "svr": make_pipeline(StandardScaler(), SVR(kernel="rbf")),
        "decision_tree": tree,
        "random_forest": forest,
    })
    results = _evaluate(models, splits)
    results.tuning = {"decision_tree": tree_tuning, "random_forest": forest_tuning}
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", help="Path to the original nutrition CSV")
    parser.add_argument("--all-models", action="store_true", help="Evaluate all six original models")
    args = parser.parse_args()
    data = load_data(args.csv)
    splits = split_data(data)
    results = (compare_all_regressions if args.all_models else compare_regressions)(splits)
    print(json.dumps({
        "versions": {"python": platform.python_version(), "pandas": pd.__version__,
                     "scikit_learn": sklearn.__version__},
        "rows": {"raw": data.raw_row_count, "cleaned": len(data.X),
                 "train": len(splits.train.X), "validation": len(splits.validation.X),
                 "test": len(splits.test.X)},
        "features": list(FEATURES),
        "metrics": results.metrics,
        "tuning": results.tuning,
        "demo_model": results.demo_model,
        "selection_rule": "Lowest validation RMSE; exact ties favor linear regression",
    }, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
