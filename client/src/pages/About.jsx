import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../css/About.css";

function About() {
  return (
    <>
      <Navbar />

      <main className="about-page">
        <section className="about-hero">
          <div className="about-hero-top">
            <span>FOOD / PEOPLE / PLACES</span>
          </div>

          <div className="about-hero-title">
            <span>FOOD</span>
            <span className="about-hero-offset">EASE</span>
          </div>

          <div className="about-hero-bottom">
            <p>
              A food delivery platform for people who care
              about what ends up on the table.
            </p>

            <span>SCROLL TO DISCOVER ↓</span>
          </div>
        </section>

        <section className="about-manifesto">
          <div className="about-manifesto-content">
            <div className="about-manifesto-lead">
              <p className="about-eyebrow">WHY WE EXIST</p>
              <h2>Ordering food<br />should be a<br /><em>discovery.</em></h2>
            </div>

            <div className="about-manifesto-copy">
              <p>
                There are thousands of restaurants around us.
                Most of the time, we keep ordering from the same
                few.
              </p>

              <p>
                FoodEase exists to change that.
              </p>

              <p>
                We want finding your next favourite restaurant
                to feel just as exciting as eating there.
              </p>
            </div>
          </div>
        </section>

        <section className="about-values">
          <div className="about-values-intro">
            <p className="about-eyebrow">
              OUR RULES
            </p>

            <h2>
              We keep
              <br />
              things simple.
            </h2>
          </div>

          <div className="about-values-grid">
            <article className="about-value value-one">
              <h3>
                FIND
              </h3>

              <p>
                Don't just search for food. Find somewhere
                you'll want to return to.
              </p>
            </article>

            <article className="about-value value-two">
              <h3>
                EAT
              </h3>

              <p>
                Great food doesn't need a complicated journey
                between the kitchen and your table.
              </p>
            </article>

            <article className="about-value value-three">
              <h3>
                SAVE
              </h3>

              <p>
                Discover local restaurants and order directly
                from the kitchens that make your favourites.
              </p>
            </article>

            <article className="about-value value-four">
              <h3>
                RETURN
              </h3>

              <p>
                Because the best compliment you can give a
                restaurant is coming back.
              </p>
            </article>
          </div>
        </section>

        <section className="about-final">
          <div className="about-final-small">
            ONE LAST THING
          </div>

          <h2>
            Don't order
            <br />
            <span>boring.</span>
          </h2>

          <p>
            There's a whole city waiting to be tasted.
          </p>

          <Link to="/restaurants">
            LET'S EAT
            <span>→</span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default About;
