# PlatePredict

PlatePredict is a legacy machine-learning project that was previously deployed on AWS EC2. That deployment is no longer running.

In my original study, I explored predicting fast-food menu calories from
nutritional attributes. I compared linear and polynomial regression, nearest
neighbors, support vector regression, decision trees, and random forests using
1,148 menu records with 14 columns.

## Original work

My notebook, nutrition CSV, and report are preserved unchanged in
[`archive/originals/`](archive/originals/), including the original titles,
attribution, and saved notebook outputs. No license or dataset redistribution
rights are asserted.

## Reproducing the two regressions

I reused my extracted preparation code and kept the notebook’s cleaning rules:
numeric coercion, positive Calories, and complete values for the nine inputs.
I keep restaurant, item, and zero-based source-record metadata separate from the
model values. The originals remain unchanged.

My input order is `Total_Fat_g`, `Saturated_Fat_g`, `Trans_Fat_g`, `Cholesterol_mg`,
`Sodium_mg`, `Carbs_g`, `Fiber_g`, `Sugars_g`, `Protein_g`; `Calories` is the target.
The CSV produces **1,148 raw → 964 cleaned records**. I reserve 15% for testing,
then 15% of the remainder for validation, both with `random_state=42`. This gives
**696 training / 123 validation / 145 test records** with no overlapping rows.

I fit `LinearRegression()` and `PolynomialFeatures(degree=2, include_bias=False)`
followed by `LinearRegression()`, using training data only. Neither model uses
feature scaling. I keep the original training split rather than refitting on
validation or test data.

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
python -m unittest discover -s tests -v
python -m platepredict.regression archive/originals/FastFoodNutritionMenuV2.csv
```

The evaluation command prints fresh metrics, row counts, feature order, library
versions, and my validation-based demo choice as JSON. The reusable functions are
in `platepredict.data` and `platepredict.regression`.

## Fresh results

I recalculated these scores with Python 3.12.5, pandas 2.3.3, and scikit-learn
1.7.2. RMSE is in calories; R² is not a percentage accuracy score.

| Model | Split | RMSE (calories) | R² |
| --- | --- | ---: | ---: |
| Linear | Training | 12.305 | 0.996785 |
| Linear | Validation | 13.793 | 0.996437 |
| Linear | Test | 12.082 | 0.996968 |
| Polynomial, degree 2 | Training | 10.302 | 0.997746 |
| Polynomial, degree 2 | Validation | 11.623 | 0.997470 |
| Polynomial, degree 2 | Test | 10.034 | 0.997909 |

I chose **degree-two polynomial regression** for the demo because its validation
RMSE is about 2.17 calories lower than linear regression. It expands nine inputs
to 54 terms plus an intercept, which still makes browser prediction a small
calculation. Linear regression is simpler, but the polynomial model retains the
original configuration and improves validation performance without a large
implementation cost. I make the choice before calculating test metrics; I use
the test set for reporting, not selection. These results cover only these two
models, not a corrected ranking of all six original models.

During reproduction, I found that scikit-learn 1.9.1 uses a different default
cutoff for dense least-squares fitting. It reduced the polynomial fit’s numerical
rank and changed its scores. I pinned scikit-learn 1.7.2, which reproduces the
saved notebook scores at their reported precision without changing the data,
features, degree, or splits. This is my tested reproduction environment; I have
not established the exact environment used for the original notebook.

The checks cover cleaning, input order, target exclusion, metadata alignment,
exact notebook splits, disjoint partitions, prediction parity with the original
model operations, saved-score reproduction, and selection independent of test
labels. The original random split and missing-value rules still limit how broadly
I can interpret the results; the model is not a nutrition measurement tool.

## Status

I’ve extracted preparation and reproduced the original linear and polynomial
regressions. I plan to present the study and estimator in a polished web app.
Browser model export, frontend work, and deployment are not part of this step.

I previously deployed the project on AWS EC2, but I no longer maintain that
deployment. The new web app has not been built or deployed.
