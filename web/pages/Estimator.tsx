import { PageIntro } from "../components/Layout";
export default function Estimator() {
  return (
    <>
      <PageIntro number="01" eyebrow="Estimator" title="Start with the label.">
        <p>
          Nine nutrition values are the inputs to my calorie prediction model.
          The browser model is ready; the interactive form is the next part of
          this experience.
        </p>
      </PageIntro>
      <section className="two-column">
        <div className="nutrition-panel">
          <div className="figure-heading">
            <h2>Nutrition inputs</h2>
            <span className="pill">Preview</span>
          </div>
          <p>All nine values will be required for one menu item.</p>
          <ul>
            {[
              ["Total fat", "g"],
              ["Saturated fat", "g"],
              ["Trans fat", "g"],
              ["Cholesterol", "mg"],
              ["Sodium", "mg"],
              ["Carbohydrates", "g"],
              ["Fiber", "g"],
              ["Sugars", "g"],
              ["Protein", "g"],
            ].map(([name, unit]) => (
              <li key={name}>
                <span>{name}</span>
                <span>{unit}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="reading-column">
          <p className="eyebrow">Behind the estimate</p>
          <h2>
            A small model.
            <br />A clear purpose.
          </h2>
          <p>
            I selected degree-2 polynomial regression using validation results.
            Its exported coefficients let the same calculation run directly in a
            browser.
          </p>
          <p>
            Predictions estimate calories from nutrition values already on a
            label. They don’t measure a meal, recommend a diet, or provide an
            individual confidence interval.
          </p>
          <div className="note">
            <strong>Interface coming in a later phase</strong>
            <p>
              This foundation introduces the inputs and model. No nutrition
              values are collected on this page.
            </p>
          </div>
          <a className="text-link" href="findings.html">
            See how the model performed →
          </a>
        </div>
      </section>
    </>
  );
}
