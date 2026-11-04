import "../css/Hero.css";
import { Link } from "react-router-dom";
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

        <Link to="/restaurants" className="hero-button">
          EXPLORE RESTAURANTS
          <span>→</span>
        </Link>
      </div>
      <div className="hero-image">
        <img src={heroImage} alt="A freshly prepared restaurant meal" />
      </div>
    </section>
  );
}

export default Hero;
