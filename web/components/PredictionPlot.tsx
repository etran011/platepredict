import { useId, useState } from "react";
import results from "../../results/model-comparison.json";
import predictions from "../../results/demo-test-predictions.json";

export function PredictionPlot({ interactive = false }: { interactive?: boolean }) {
  const id = useId();
  const [active, setActive] = useState(0);
  const record = predictions.rows[active];
  const pairs = predictions.rows.map((row) => [Number(row[3]), Number(row[4])]);
  const max = Math.ceil(Math.max(...pairs.flat()) / 200) * 200;
  const ticks = [0, max / 2, max];
  const x = (n: number) => 84 + (n / max) * 320;
  const y = (n: number) => 340 - (n / max) * 270;
  return (
    <figure className="prediction-figure">
      <div className="figure-heading">
        <span className="eyebrow">Figure 01 / Polynomial regression</span>
        <span className="figure-meta">Held-out test set</span>
      </div>
      <h2>Observed vs. predicted calories</h2>
      <p>Each point represents one held-out menu item.</p>
      <svg
        viewBox="0 0 460 400"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
      >
        <title id={`${id}-title`}>Observed versus predicted calories</title>
        <desc id={`${id}-description`}>
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
              d={`M84 ${y(t)} H404 M${x(t)} 70 V340`}
            />
            <text x={x(t)} y="363" textAnchor="middle">
              {t}
            </text>
            <text x="73" y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        <path className="ideal-line" d="M84 340 L404 70" />
        {pairs.map(([a, b], i) => (
          <circle key={i} cx={x(a)} cy={y(b)} r="3.6" className="data-point"
            onPointerEnter={interactive ? () => setActive(i) : undefined}
            onClick={interactive ? () => setActive(i) : undefined}>
            <title>{predictions.rows[i][1]} · {predictions.rows[i][2]}: observed {a} kcal, predicted {b.toFixed(2)} kcal</title>
          </circle>
        ))}
        {interactive && <circle className="selected-point" cx={x(Number(record[3]))} cy={y(Number(record[4]))} r="7" />}
        <text x="244" y="392" textAnchor="middle">
          Observed calories (kcal)
        </text>
        <text transform="translate(16 210) rotate(-90)" textAnchor="middle">
          Predicted calories (kcal)
        </text>
      </svg>
      {interactive && <div className="point-inspector">
        <label className="chart-select">Inspect a held-out item<select value={active} onChange={e => setActive(Number(e.target.value))}>
          {predictions.rows.map((row, i) => <option key={Number(row[0])} value={i}>{row[1]} · {row[2]} (row {row[0]})</option>)}
        </select></label>
        <p className="selected-item">{record[1]} · {record[2]}</p>
        <dl className="point-values"><div><dt>Observed</dt><dd>{Number(record[3]).toFixed(2)} kcal</dd></div><div><dt>Predicted</dt><dd>{Number(record[4]).toFixed(2)} kcal</dd></div></dl>
        <p>Source row {record[0]} · original CSV record, zero-based. Use the selector with a keyboard or touch, or hover a point. Overlapping records share a position.</p>
      </div>}
      <figcaption>
        <span>
          <i /> {predictions.count} menu items
        </span>
        <span>Dashed line: perfect agreement</span>
      </figcaption>
    </figure>
  );
}
