import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../css/Offers.css";
import offerImage from "../assets/images/offer.jpg";

function Offers() {
  return (
    <>
      <Navbar />
      <main className="offers-page">
        <section className="offers-hero">
          <div className="offers-hero-number">GOOD FOOD, FOUND</div>

          <div className="offers-hero-title">
            <p>MORE TO DISCOVER</p>
            <h1>
              Find your next
              <br />
              <span>favourite place.</span>
            </h1>
          </div>

          <div className="offers-hero-note">
            <p>
              Explore approved neighbourhood restaurants and their menus in
              one place.
            </p>
          </div>
        </section>

        <section className="offers-feature">
          <div className="offers-feature-image">
            <img src={offerImage} alt="A meal ready to be shared" />
            <div className="offers-feature-stamp">
              <span>FOODEASE</span>
              <strong>LOCAL</strong>
              <span>GOOD FOOD NEAR YOU</span>
            </div>
          </div>

          <div className="offers-feature-content">
            <p className="offers-eyebrow">A BETTER WAY TO BROWSE</p>
            <h2>
              Start with
              <br />
              your <em>city.</em>
            </h2>
            <p>
              Choose your saved delivery address to explore nearby restaurants.
              You can switch to another city whenever you want.
            </p>
            <Link to="/restaurants">
              EXPLORE RESTAURANTS <span>→</span>
            </Link>
          </div>
        </section>

        <section className="offers-final">
          <div>
            <p>YOUR NEXT MEAL STARTS HERE</p>
            <h2>
              Find something
              <br />
              worth sharing.
            </h2>
          </div>
          <Link to="/restaurants">
            BROWSE RESTAURANTS <span>→</span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Offers;
