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

## Reproducing the original regressions

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
python -m platepredict.regression archive/originals/FastFoodNutritionMenuV2.csv --all-models
```

The evaluation command prints fresh metrics, row counts, feature order, library
versions, and my validation-based demo choice as JSON. The reusable functions are
in `platepredict.data` and `platepredict.regression`.

## Fresh results

I recalculated these scores with Python 3.12.5, pandas 2.3.3, and scikit-learn
1.7.2. RMSE is in calories; R² is not a percentage accuracy score.

| Model | Validation RMSE | Validation R² | Test RMSE | Test R² |
| --- | ---: | ---: | ---: | ---: |
| Linear | 13.793 | 0.996437 | 12.082 | 0.996968 |
| Polynomial, degree 2 | 11.623 | 0.997470 | 10.034 | 0.997909 |
| KNN | 58.848 | 0.935146 | 42.015 | 0.963334 |
| SVR | 177.330 | 0.411091 | 171.062 | 0.392205 |
| Decision tree | 42.053 | 0.966882 | 44.116 | 0.959576 |
| Random forest | 29.473 | 0.983732 | 26.769 | 0.985116 |

I chose **degree-two polynomial regression** for the demo because its validation
RMSE is about 2.17 calories lower than linear regression. It expands nine inputs
to 54 terms plus an intercept, which still makes browser prediction a small
calculation. Linear regression is simpler, but the polynomial model retains the
original configuration and improves validation performance without a large
implementation cost. I make the choice before calculating test metrics; I use
the test set for reporting, not selection. After correction, the random forest
ranks third by validation performance, ahead of the decision tree. The selected
settings remain `min_samples_leaf=2` and `n_estimators=100`.

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

## Evaluation corrections

While revisiting the notebook, I corrected three issues in my extracted code:

- I calculate forest-tuning R² as `r2_score(observed, predicted)`; the notebook
  reverses those arguments.
- I generate each model’s own predictions for each split. The notebook’s forest
  metric block reuses the preceding decision-tree predictions.
- I label training, validation, and test metrics separately. The notebook’s
  `test_table_top3` uses validation values, and the report describes that table
  as test performance.

I kept the original tuning candidates: decision-tree `min_samples_leaf` values
`[1, 2, 5, 10, 15, 20, 25, 50, 100]` and forest `n_estimators` values
`[5, 10, 50, 100, 500]`, with unrestricted depth and `random_state=42`.
I choose each tuned setting by validation R², retaining the first candidate on
an exact tie. KNN remains at five neighbors, and SVR keeps the original RBF
configuration. Their standard scalers fit on training data only. My demo choice
uses validation RMSE across the evaluated models, never the test scores.
The archived notebook and report remain unchanged as historical records.

## Website results files

I generate the website’s data with:

```sh
python -m platepredict.results archive/originals/FastFoodNutritionMenuV2.csv --output results
```

- [`results/model-comparison.json`](results/model-comparison.json) contains all six
  models’ training, validation, and test metrics; unchanged tuning candidates and
  their validation scores; selected settings; split counts; software versions;
  and the input CSV’s filename and SHA-256 hash.
- [`results/demo-test-predictions.json`](results/demo-test-predictions.json)
  contains all 145 held-out test observations and predictions from the demo
  model, with source-record, restaurant, and item metadata. The `columns` array
  labels each value in a `rows` entry. Predictions use the training-only fit,
  selected by validation; none of these records were used to fit the model.

I keep these JSON files compact and retain full numeric precision. Their dataset
hashes link the chart data to the evaluated CSV. I have not established an
upstream dataset URL or redistribution license; those fields are explicitly null
rather than guessed. The files are reproducible results, not an exported browser
model or a new website deployment.

## Offline model export

I export the validation-selected polynomial model without refitting it on held-out
records:

```sh
python -m platepredict.export archive/originals/FastFoodNutritionMenuV2.csv
```

[`results/demo-model.v1.json`](results/demo-model.v1.json) uses schema version 1
and model version `1.0.0`. It contains the 54 coefficients, intercept, ordered
feature names and units, exact polynomial powers, training-only feature ranges,
and dataset hash. The model uses raw nutrient values with no scaling; the export
states that explicitly. Fat, carbohydrates, fiber, sugars, and protein use grams;
cholesterol and sodium use milligrams. Predicted Calories are in kcal.

I also generate `tests/fixtures/browser-parity.v1.json` with Python predictions
for all 145 test records and 31 boundary cases: zero, training minima/maxima,
training means, and individual features at or beyond their training bounds.
My numerical agreement rule is
`abs(actual - expected) <= 1e-7 + 1e-10 * abs(expected)` kcal. This is a numerical
comparison tolerance, not an uncertainty interval. I preserve the raw fitted
prediction rather than clamping it.

## Browser inference module

I evaluate the exported polynomial in [`browser/inference.ts`](browser/inference.ts).
It has no runtime dependencies and needs only the static JSON artifact. Python
remains offline; prediction does not call a server or external API.

```sh
npm ci
npm test
```

This type-checks and compiles the module, then runs its parity, input-validation,
model-loading, and range-warning checks. The compiled files in `.build/` are
ignored. I keep the TypeScript compiler as a development-only dependency.

The reusable functions are `parseModel(json)`, `loadModel(url)`, and
`predict(model, inputs)`. I pass the model URL relative to the deployed site so
GitHub Pages’ `/platepredict/` path works. Loading rejects network/HTTP failures,
invalid JSON, incompatible schemas, and malformed models with `ModelLoadError`;
the caller can show that message and offer a retry.

Inputs must contain all nine named features as finite, nonnegative numbers in
the artifact’s units. Blank strings, numeric strings, nulls, and missing values
are rejected rather than silently converted to zero. `InputValidationError`
contains the invalid fields. Extra values such as `Calories` do not enter the
prediction.

`predict` returns `{ calories, warnings }`. Each warning identifies a nutrient
outside its training-only range, with its value, unit, and training bounds.
I still evaluate the supplied value; the warning is not a correction or a
confidence interval. Negative model outputs remain negative. For example, the
all-zero input produces about −0.6445 kcal, which reflects the unconstrained
regression rather than a physically valid energy measurement. Numerical overflow
raises `PredictionError` instead of returning Infinity or clamping the result.

I verified all 176 Python parity cases with an absolute tolerance of `1e-7` kcal
plus a relative tolerance of `1e-10`. The largest observed difference in the
TypeScript checks was approximately `4.55e-13` kcal. The module also runs as a
static browser ES module.

## Status

I’ve extracted preparation and corrected evaluation for my six original
regression models. I plan to present the study and estimator in a polished web app.
The browser artifact and standalone TypeScript inference are ready. The frontend
now includes the overview, interactive estimator, findings, and case study.
Deployment remains a separate step.

I previously deployed the project on AWS EC2, but I no longer maintain that
deployment. The new web presentation has not been deployed.

## Web presentation

I use React, TypeScript, and Vite for the static presentation. The overview, estimator, findings, and case study each have their own HTML entry point, so direct links work on GitHub Pages without a routing fallback.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

The local site is served under `/platepredict/`. The production build goes to `dist/`; publication is a separate step. Shared navigation and charts live in `web/components`, page content in `web/pages`, and the visual system in `web/styles.css`. The findings and scatter plot read the existing results files. Typography uses IBM Plex Sans and Mono with system fallbacks.

I checked all five production pages at phone and desktop widths, keyboard navigation, the skip link, and reduced-motion behavior. The existing browser inference checks still run with `npm test`.

### Landing page imagery

I use [Daniel Torobekov’s toasted sandwich photograph](https://www.pexels.com/photo/a-sandwich-on-a-wooden-board-13689827/) for the landing background. I compared it with a mushroom pasta photograph and an isolated burger image; its golden toast, muted greens, and softly lit background fit the warm palette best. The original source links to the [Pexels License](https://www.pexels.com/license/), which permits free downloading, website use, and modification without attribution. I serve an optimized local WebP with responsive cropping and an overlay, without a visible photo credit.

The interior page headers retain [Engin Akyurt’s burger and fries photograph](https://www.pexels.com/photo/burger-and-fries-on-white-plate-2271101/), also under the Pexels License. Both images are illustrative, not dataset records or predicted meals. Their license does not apply to the historical dataset or other project materials.

The landing page links to the estimator and findings. The study overview remains at `overview.html`. The interface uses warm charcoal and muted olive surfaces, with lighter charts and nutrition panels. The photographic landing style is shared across the existing pages; decorative background guides are omitted. Reduced-motion preferences disable entrance animations and transitions.

### Interactive estimator

I reuse the verified browser inference module with the existing versioned model artifact. All nine inputs are editable, with units and grouped fields. The estimator rejects empty, negative, and nonfinite values, warns about inputs beyond training ranges, and hides outdated predictions after edits. Model loading failures offer a retry; no fallback prediction is substituted.

The three historical presets in `web/data/presets.json` copy complete values from source rows 0, 100, and 700 of the original CSV (zero-based data records, excluding the header). The file records the dataset SHA-256. Recorded calories are displayed separately from model predictions and are never an input. These examples may have appeared in training and are not independent evaluation examples. Editing a preset switches to manual entry. Predictions display one decimal place; validation uses the unrounded values.
