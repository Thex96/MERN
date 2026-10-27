import "../css/HowItWorks.css";

const steps = [
  {
    number: "01",
    title: "DISCOVER",
    description:
      "Explore exceptional restaurants and discover dishes that match your taste.",
  },
  {
    number: "02",
    title: "ORDER",
    description:
      "Customize your meal, choose your delivery details, and place your order.",
  },
  {
    number: "03",
    title: "ENJOY",
    description:
      "Track your order in real time and enjoy your food when it arrives.",
  },
];

function HowItWorks() {
  return (
    <section className="how-it-works">
      <div className="how-header">
        <p className="section-label">THE FOODEASE EXPERIENCE</p>

        <h2>
          From discovery
          <br />
          to your door.
        </h2>
      </div>

      <div className="steps">
        {steps.map((step) => (
          <article className="step" key={step.number}>
            <div className="step-number">{step.number}</div>

            <div className="step-content">
              <h3>{step.title}</h3>

              <p>{step.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;