import { useState } from "react";
import eda from "../../results/original-eda.json";

const histogram = eda.histogram;
const maxCount = Math.ceil(Math.max(...histogram.counts) / 20) * 20;
const minCalories = histogram.edges[0];
const maxCalories = histogram.edges.at(-1)!;
const calorieX = (value: number) => 82 + (value - minCalories) / (maxCalories - minCalories) * 420;
const countY = (value: number) => 280 - value / maxCount * 230;
const label = (value: number) => Number(value.toFixed(1)).toLocaleString("en-US");

export function OriginalEDA() {
  const [nutrient, setNutrient] = useState<2 | 3>(2);
  const [bin, setBin] = useState(0);
  const points = eda.rows.filter(row => row[1] !== null && row[nutrient] !== null);
  const nutrientName = nutrient === 2 ? "Total fat" : "Carbohydrates";
  const xMax = Math.ceil(Math.max(...points.map(row => row[nutrient]!)) / 20) * 20;
  const yMax = Math.ceil(maxCalories / 500) * 500;
  const x = (value: number) => 82 + value / xMax * 420;
  const y = (value: number) => 280 - value / yMax * 230;
  return <section className="findings-section" id="original-eda" aria-labelledby="eda-title">
    <div className="findings-heading"><div><p className="eyebrow">03 / Original exploration</p><h2 id="eda-title">The nutrition behind the numbers.</h2></div>
      <p>These recreate the notebook’s calorie distribution and nutrient scatter plots. They describe the original data before model cleaning, including zero-calorie records, rather than an evaluation split.</p></div>
    <div className="eda-grid">
      <figure className="eda-figure">
        <p className="eyebrow">Calorie distribution</p><h3>Where menu items fall</h3>
        <p>{histogram.count.toLocaleString("en-US")} numeric calorie records · {histogram.counts.length} equal-width bins</p>
        <svg viewBox="0 0 540 340" role="img" aria-labelledby="hist-title hist-desc">
          <title id="hist-title">Distribution of recorded calories</title>
          <desc id="hist-desc">A histogram of {histogram.count} original records with numeric calories, from {minCalories} to {maxCalories} kcal. Exact bin counts are available in the selector and table below.</desc>
          {[0, maxCount / 2, maxCount].map(t => <g key={t}><path className="grid-line" d={`M82 ${countY(t)} H502`} /><text x="72" y={countY(t) + 4} textAnchor="end">{t}</text></g>)}
          {histogram.counts.map((count, i) => <rect key={i} className={bin === i ? "hist-bar active" : "hist-bar"} x={calorieX(histogram.edges[i]) + 1} y={countY(count)} width={420 / histogram.counts.length - 2} height={280 - countY(count)} onPointerEnter={() => setBin(i)}><title>{label(histogram.edges[i])}–{label(histogram.edges[i + 1])} kcal: {count} records</title></rect>)}
          {[minCalories, (minCalories + maxCalories) / 2, maxCalories].map(t => <text key={t} x={calorieX(t)} y="301" textAnchor="middle">{label(t)}</text>)}
          <text x="292" y="332" textAnchor="middle">Recorded calories (kcal)</text><text transform="translate(17 165) rotate(-90)" textAnchor="middle">Menu items</text>
        </svg>
        <label className="chart-select">Inspect calorie range<select value={bin} onChange={e => setBin(Number(e.target.value))}>{histogram.counts.map((_, i) => <option key={i} value={i}>{label(histogram.edges[i])}–{label(histogram.edges[i + 1])} kcal</option>)}</select></label>
        <p className="chart-readout"><strong>{histogram.counts[bin]} menu items</strong> in this range. Lower edge included; upper edge excluded except in the last bin. Labels rounded to one decimal.</p>
        <details className="data-disclosure"><summary>Read histogram counts</summary><div className="table-scroll" role="region" aria-label="Calorie distribution values" tabIndex={0}><table><caption>Original calorie distribution</caption><thead><tr><th scope="col">Range (kcal)</th><th scope="col">Items</th></tr></thead><tbody>{histogram.counts.map((count, i) => <tr key={i}><th scope="row">{label(histogram.edges[i])}–{label(histogram.edges[i + 1])}</th><td>{count}</td></tr>)}</tbody></table></div></details>
      </figure>
      <figure className="eda-figure">
        <p className="eyebrow">Nutrient relationships</p><h3>Calories and macronutrients</h3>
        <p>{points.length.toLocaleString("en-US")} records with both plotted values · before model cleaning</p>
        <svg viewBox="0 0 540 340" role="img" aria-labelledby="nutrient-title nutrient-desc">
          <title id="nutrient-title">Calories versus {nutrientName.toLowerCase()}</title>
          <desc id="nutrient-desc">Each point is one original record with numeric calories and {nutrientName.toLowerCase()}. This descriptive relationship is not evidence of independent prediction accuracy or causation.</desc>
          {[0, yMax / 2, yMax].map(t => <g key={t}><path className="grid-line" d={`M82 ${y(t)} H502`} /><text x="72" y={y(t) + 4} textAnchor="end">{t}</text></g>)}
          {points.map(row => <circle key={row[0]} className="eda-point" cx={x(row[nutrient]!)} cy={y(row[1]!)} r="2.5"><title>Source row {row[0]}: {row[nutrient]} g, {row[1]} kcal</title></circle>)}
          {[0, xMax / 2, xMax].map(t => <text key={t} x={x(t)} y="301" textAnchor="middle">{t}</text>)}
          <text x="292" y="332" textAnchor="middle">{nutrientName} (g)</text><text transform="translate(17 165) rotate(-90)" textAnchor="middle">Recorded calories (kcal)</text>
        </svg>
        <label className="chart-select">Nutrition value<select value={nutrient} onChange={e => setNutrient(Number(e.target.value) as 2 | 3)}><option value={2}>Total fat (g)</option><option value={3}>Carbohydrates (g)</option></select></label>
        <p className="chart-readout">Calories tend to rise with these nutrients, with variation at the same nutrient value. Neither scatter plot accounts for the other inputs. Missing values are omitted only for the plotted pair.</p>
        <details className="data-disclosure"><summary>Read nutrient plot values</summary><div className="table-scroll" role="region" aria-label="Nutrient relationship values" tabIndex={0}><table><caption>Source row = zero-based original CSV record</caption><thead><tr><th scope="col">Source row</th><th scope="col">{nutrientName} (g)</th><th scope="col">Calories (kcal)</th></tr></thead><tbody>{points.map(row => <tr key={row[0]}><th scope="row">{row[0]}</th><td>{row[nutrient]}</td><td>{row[1]}</td></tr>)}</tbody></table></div></details>
      </figure>
    </div>
    <p className="chart-note">EDA uses {eda.raw_count.toLocaleString("en-US")} original rows before complete-case filtering. It is descriptive, not held-out evidence, and was not used to change the model or tuning candidates.</p>
  </section>;
}
