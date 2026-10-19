import { PageIntro } from "../components/Layout";
import results from "../../results/model-comparison.json";
export default function CaseStudy() {
  return (
    <>
      <PageIntro
        number="03"
        eyebrow="Case study"
        title="Methods, corrections & limitations"
      >
        <p>
          I built PlatePredict to explore calorie prediction from menu nutrition
          data. This presentation keeps the original study intact while making
          its methods and results easier to explore.
        </p>
      </PageIntro>
      <div className="study-layout">
        <aside aria-label="Case study contents">
          <a href="#data">01 / The data</a>
          <a href="#method">02 / The method</a>
          <a href="#corrections">03 / Corrections</a>
          <a href="#limits">04 / Limitations</a>
          <a href="#history">05 / Deployment history</a>
        </aside>
        <article className="study-copy">
          <section id="data">
            <p className="eyebrow">01 / The data</p>
            <h2>Preparing the nutrition data</h2>
            <p>
              My historical nutrition CSV contains{" "}
              {results.rows.raw.toLocaleString("en-US")} rows. After converting
              nutrition values to numbers, excluding nonpositive calories, and
              removing rows missing required model values,{" "}
              {results.rows.cleaned} records remain. Restaurant, item, and
              original row identifiers stay separate from model inputs.
            </p>
            <p>
              The upstream dataset source and redistribution license have not
              been verified.
            </p>
          </section>
          <section id="method">
            <p className="eyebrow">02 / The method</p>
            <h2>Training and evaluation</h2>
            <p>
              I kept the original nine nutrition inputs and two random splits
              with random_state=42: 15% for testing, then 15% of the remainder
              for validation.
            </p>
            <div className="split-strip">
              {[
                ["696", "Training"],
                ["123", "Validation"],
                ["145", "Test"],
              ].map(([n, s]) => (
                <div key={s}>
                  <strong>{n}</strong>
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <p>
              The comparison preserves the six original model configurations and
              tuning candidates. Preprocessing is fitted only on training data,
              and selection uses validation results. Python handles offline
              evaluation; browser inference uses the exported polynomial
              coefficients.
            </p>
          </section>
          <section id="corrections">
            <p className="eyebrow">03 / Corrections</p>
            <h2>Correcting the evaluation</h2>
            <p>
              During reproduction, I corrected reversed observed and predicted
              arguments in random-forest R² tuning, replaced reused
              decision-tree predictions in the forest metrics, and separated
              validation results from held-out test results. The original
              notebook and report remain unchanged.
            </p>
          </section>
          <section id="limits">
            <p className="eyebrow">04 / Limitations</p>
            <h2>What these results establish</h2>
            <p>
              Repeated nutrition profiles can appear across the random splits.
              The results do not show how the model generalizes to new
              restaurants. Excluding incomplete records also limits which menu
              items are represented.
            </p>
            <p>
              Nutrition inputs already have a close relationship with calories.
              A high R² here does not establish broader nutritional insight or
              personal dietary suitability.
            </p>
          </section>
          <section id="history">
            <p className="eyebrow">05 / Deployment history</p>
            <h2>Deployment history</h2>
            <p>
              I previously deployed PlatePredict on AWS EC2. I no longer
              maintain that deployment, and it is not running.
            </p>
            <p>
              For this modernization, I am preparing a static web presentation
              for GitHub Pages. The exported model can run in the browser
              without a running Python backend.
            </p>
            <a
              className="text-link"
              href="https://github.com/etran011/platepredict/tree/main/archive/originals"
            >
              View the preserved original materials ↗
            </a>
          </section>
        </article>
      </div>
    </>
  );
}
