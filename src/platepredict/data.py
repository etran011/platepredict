"""Prepare nutrition records and reproduce the original notebook's splits."""

from dataclasses import dataclass
from os import PathLike
import re

import pandas as pd
from sklearn.model_selection import train_test_split


FEATURES = (
    "Total_Fat_g",
    "Saturated_Fat_g",
    "Trans_Fat_g",
    "Cholesterol_mg",
    "Sodium_mg",
    "Carbs_g",
    "Fiber_g",
    "Sugars_g",
    "Protein_g",
)
TARGET = "Calories"


@dataclass
class ModelData:
    """Aligned inputs, target, and provenance with original record indices."""

    X: pd.DataFrame
    y: pd.Series
    metadata: pd.DataFrame
    raw_row_count: int


@dataclass
class DataSplits:
    """Training, validation, and test partitions, without feature scaling."""

    train: ModelData
    validation: ModelData
    test: ModelData


def normalize_columns(frame: pd.DataFrame) -> pd.DataFrame:
    """Normalize whitespace and units, without changing the caller's frame."""
    columns = [
        re.sub(r"[^\w]+", "_", str(column).strip()).strip("_")
        for column in frame.columns
    ]
    if len(columns) != len(set(columns)):
        raise ValueError("Column names collide after normalization")
    result = frame.copy()
    result.columns = columns
    return result


def prepare_data(frame: pd.DataFrame) -> ModelData:
    """Coerce nutrients and retain positive-calorie, complete model records.

    source_row is the zero-based CSV data-record position (excluding the header),
    not a physical line number: quoted CSV headers can span multiple lines.
    Company and Item remain unmodified in the separate metadata frame.
    """
    normalized = normalize_columns(frame).reset_index(drop=True)
    required = ["Company", "Item", TARGET, *FEATURES]
    missing = [column for column in required if column not in normalized.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    # Numeric coercion matches the notebook; unused columns cannot drop records.
    numeric = normalized.loc[:, [TARGET, *FEATURES]].apply(
        pd.to_numeric, errors="coerce"
    )
    keep = numeric[TARGET].gt(0) & numeric.notna().all(axis=1)
    metadata = normalized.loc[keep, ["Company", "Item"]].copy()
    metadata.insert(0, "source_row", metadata.index)
    return ModelData(
        X=numeric.loc[keep, list(FEATURES)].copy(),
        y=numeric.loc[keep, TARGET].copy(),
        metadata=metadata,
        raw_row_count=len(frame),
    )


def load_data(path: str | PathLike[str]) -> ModelData:
    """Read a nutrition CSV without modifying it and prepare its model records."""
    return prepare_data(pd.read_csv(path))


def split_data(data: ModelData) -> DataSplits:
    """Reserve 15% test, then 15% of the remainder for validation (seed 42)."""
    remaining, test = train_test_split(
        data.X.index, test_size=0.15, random_state=42
    )
    train, validation = train_test_split(
        remaining, test_size=0.15, random_state=42
    )

    def partition(indices: pd.Index) -> ModelData:
        return ModelData(
            X=data.X.loc[indices].copy(),
            y=data.y.loc[indices].copy(),
            metadata=data.metadata.loc[indices].copy(),
            raw_row_count=data.raw_row_count,
        )

    return DataSplits(
        train=partition(train),
        validation=partition(validation),
        test=partition(test),
    )
