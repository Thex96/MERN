import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../css/Offers.css";

import offerImage from "../assets/images/offer.jpg";

const offers = [
  {
    number: "01",
    category: "FIRST ORDER",
    title: "WELCOME TO THE TABLE",
    description:
      "Your first FoodEase order comes with a little something extra.",
    discount: "20%",
    detail: "OFF YOUR FIRST ORDER",
  },
  {
    number: "02",
    category: "WEEKEND",
    title: "WEEKEND FEAST",
    description:
      "Selected restaurants are serving something special this weekend.",
    discount: "30%",
    detail: "SELECTED RESTAURANTS",
  },
  {
    number: "03",
    category: "FOODSAVER",
    title: "GOOD FOOD. BETTER PRICE.",
    description:
      "Discover selected meals from restaurants at reduced prices.",
    discount: "₹99",
    detail: "SELECTED MEALS",
  },
];

function Offers() {
  return (
    <>
      <Navbar />

      <main className="offers-page">
        <section className="offers-hero">
          <div className="offers-hero-number">
            OFFERS
            <span>2026</span>
          </div>

          <div className="offers-hero-title">
            <p>THE GOOD PART</p>

            <h1>
              More food.
              <br />
              <span>Less money.</span>
            </h1>
          </div>

          <div className="offers-hero-note">
            <p>
              Carefully selected offers from restaurants
              worth discovering.
            </p>

            <span>SCROLL ↓</span>
          </div>
        </section>

        <section className="offers-feature">
          <div className="offers-feature-image">
            <img
              src= {offerImage}
              alt="Food served at a restaurant"
            />

            <div className="offers-feature-stamp">
              <span>LIMITED</span>
              <strong>20%</strong>
              <span>FIRST ORDER</span>
            </div>
          </div>

          <div className="offers-feature-content">
            <p className="offers-eyebrow">
              01 / FIRST ORDER
            </p>

            <h2>
              Your first
              <br />
              bite is
              <br />
              <em>on us.</em>
            </h2>

            <p>
              New to FoodEase? Start with a little extra.
              Get 20% off your first order and discover
              something you might not have found otherwise.
            </p>

            <div className="offers-feature-meta">
              <span>20% OFF</span>
              <span>UP TO ₹150</span>
            </div>

            <Link to="/restaurants">
              CLAIM THE OFFER
              <span>→</span>
            </Link>
          </div>
        </section>

        <section className="offers-ticker">
          <div>
            WEEKEND SPECIALS
          </div>

          <span>•</span>

          <div>
            FOOD SAVER
          </div>

          <span>•</span>

          <div>
            NEW RESTAURANTS
          </div>

          <span>•</span>

          <div>
            WEEKEND SPECIALS
          </div>
        </section>

        <section className="offers-grid-section">
          <div className="offers-grid-heading">
            <p className="offers-eyebrow">
              MORE TO EXPLORE
            </p>

            <h2>
              Pick your
              <br />
              pleasure.
            </h2>
          </div>

          <div className="offers-grid">
            {offers.slice(1).map((offer, index) => (
              <article
                className={`offers-small-card ${
                  index === 1
                    ? "offers-small-card-light"
                    : ""
                }`}
                key={offer.number}
              >
                <div className="offers-small-top">
                  <span>{offer.number}</span>

                  <span>{offer.category}</span>
                </div>

                <div className="offers-small-middle">
                  <strong>{offer.discount}</strong>

                  <span>{offer.detail}</span>
                </div>

                <div className="offers-small-bottom">
                  <h3>{offer.title}</h3>

                  <p>{offer.description}</p>

                  <Link to="/restaurants">
                    EXPLORE
                    <span>↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="offers-foodsaver">
          <div className="offers-foodsaver-left">
            <span>03</span>

            <p>
              THE IDEA
            </p>
          </div>

          <div className="offers-foodsaver-main">
            <h2>
              Tomorrow's
              <br />
              discount
              <br />
              starts with
              <br />
              <em>today's surplus.</em>
            </h2>

            <p>
              FoodSaver connects you with selected meals
              that might otherwise go unsold. Better value
              for you. Less waste for restaurants.
            </p>

            <Link to="/restaurants">
              DISCOVER FOOD SAVER
              <span>→</span>
            </Link>
          </div>

          <div className="offers-foodsaver-mark">
            FS
          </div>
        </section>

        <section className="offers-final">
          <div>
            <p>THE MENU IS WAITING</p>

            <h2>
              Find something
              <br />
              worth eating.
            </h2>
          </div>

          <Link to="/restaurants">
            EXPLORE RESTAURANTS
            <span>→</span>
          </Link>
        </section>
      </main>
    </>
  );
}

export default Offers;