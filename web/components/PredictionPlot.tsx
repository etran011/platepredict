import results from "../../results/model-comparison.json";
import predictions from "../../results/demo-test-predictions.json";

export function PredictionPlot() {
  const pairs = predictions.rows.map((row) => [Number(row[3]), Number(row[4])]);
  const max = Math.ceil(Math.max(...pairs.flat()) / 200) * 200;
  const ticks = [0, max / 2, max];
  const x = (n: number) => 64 + (n / max) * 340;
  const y = (n: number) => 340 - (n / max) * 270;
  return (
    <figure className="plot-card">
      <div className="figure-heading">
        <span className="eyebrow">Model in focus</span>
        <span className="pill">Held-out test set</span>
      </div>
      <h2>Observed. Predicted.</h2>
      <p>Degree-2 polynomial regression</p>
      <svg
        viewBox="0 0 460 400"
        role="img"
        aria-labelledby="plot-title plot-description"
      >
        <title id="plot-title">Observed versus predicted calories</title>
        <desc id="plot-description">
          {predictions.count} held-out menu items. Points near the diagonal
          indicate predictions close to observed calories. Test RMSE is{" "}
          {results.models.polynomial_degree_2.metrics.test.rmse_calories.toFixed(
            2,
          )}{" "}
          kilocalories.
        </desc>
        {ticks.map((t) => (
          <g key={t}>
            <path
              className="grid-line"
              d={`M64 ${y(t)} H404 M${x(t)} 70 V340`}
            />
            <text x={x(t)} y="363" textAnchor="middle">
              {t}
            </text>
            <text x="53" y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        <path className="ideal-line" d="M64 340 L404 70" />
        {pairs.map(([a, b], i) => (
          <circle key={i} cx={x(a)} cy={y(b)} r="3.6" className="data-point" />
        ))}
        <text x="234" y="392" textAnchor="middle">
          Observed calories (kcal)
        </text>
        <text transform="translate(16 210) rotate(-90)" textAnchor="middle">
          Predicted calories (kcal)
        </text>
      </svg>
      <figcaption>
        <span>
          <i /> {predictions.count} menu items
        </span>
        <span>Dashed line: perfect agreement</span>
      </figcaption>
    </figure>
  );
}
