import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../css/About.css";

function About() {
  return (
    <>
      <Navbar />

      <main className="about-page">
        <section className="about-hero">
          <div className="about-hero-top">
            <span>EST. 2026</span>
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
          <div className="about-manifesto-mark">
            01
          </div>

          <div className="about-manifesto-content">
            <p className="about-eyebrow">
              WHY WE EXIST
            </p>

            <h2>
              Ordering food
              <br />
              should be a
              <br />
              <em>discovery.</em>
            </h2>

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
              <span>01</span>

              <h3>
                FIND
              </h3>

              <p>
                Don't just search for food. Find somewhere
                you'll want to return to.
              </p>
            </article>

            <article className="about-value value-two">
              <span>02</span>

              <h3>
                EAT
              </h3>

              <p>
                Great food doesn't need a complicated journey
                between the kitchen and your table.
              </p>
            </article>

            <article className="about-value value-three">
              <span>03</span>

              <h3>
                SAVE
              </h3>

              <p>
                Better prices for customers. Less wasted food
                for restaurants.
              </p>
            </article>

            <article className="about-value value-four">
              <span>04</span>

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

        <section className="about-foodsaver">
          <div className="about-foodsaver-stamp">
            <span>FOOD</span>
            <strong>SAVER</strong>
            <small>LESS WASTE / MORE TASTE</small>
          </div>

          <div className="about-foodsaver-content">
            <p className="about-eyebrow">
              OUR LITTLE IDEA
            </p>

            <h2>
              Yesterday's
              <br />
              surplus.
              <br />
              Today's
              <br />
              <em>favourite.</em>
            </h2>

            <p>
              FoodSaver gives restaurants a way to turn
              unsold meals into opportunities rather than waste.
              Customers get something delicious at a better
              price, while restaurants recover value.
            </p>

            <Link to="/restaurants">
              SEE FOOD SAVER
              <span>↗</span>
            </Link>
          </div>
        </section>

        <section className="about-partners">
          <div className="about-partners-number">
            02
          </div>

          <div className="about-partners-content">
            <p className="about-eyebrow">
              FOR THE PEOPLE BEHIND THE FOOD
            </p>

            <h2>
              Restaurants
              <br />
              are the
              <br />
              <em>heart.</em>
            </h2>

            <p className="about-partners-copy">
              FoodEase isn't here to put distance between
              restaurants and their customers.
              We're here to bring them closer.
            </p>

            <Link to="/restaurants">
              MEET OUR RESTAURANTS
              <span>→</span>
            </Link>
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
    </>
  );
}

export default About;