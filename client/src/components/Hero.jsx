import "../css/Hero.css";

import heroImage from "../assets/images/hero.jpg";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <p className="hero-label">FOOD DELIVERY, REDEFINED</p>

        <h1>
          Food worth
          <br />
          remembering.
        </h1>

        <p className="hero-description">
          Discover exceptional restaurants, order what you love,
          and experience food differently.
        </p>

        <button className="hero-button">
          EXPLORE RESTAURANTS
          <span>→</span>
        </button>
      </div>

      <div className="hero-image-container">
        <div className="hero-image-overlay"></div>

        <img
          src={heroImage}
          alt="Beautifully presented food"
          className="hero-image"
        />
      </div>
    </section>
  );
}

export default Hero;