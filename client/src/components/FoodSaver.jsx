import "../css/FoodSaver.css";

import foodsaverImage from "../assets/images/foodsaver.jpg";

function FoodSaver() {
  return (
    <section className="foodsaver">
      <div className="foodsaver-image-container">
        <img
          src={foodsaverImage}
          alt="Fresh food prepared for FoodSaver"
          className="foodsaver-image"
        />
      </div>

      <div className="foodsaver-content">
        <p className="section-label">FOODSAVER</p>

        <h2>
          Good food
          <br />
          shouldn't
          <br />
          go to waste.
        </h2>

        <p className="foodsaver-description">
          FoodSaver connects you with quality surplus food
          from restaurants at reduced prices. Better value
          for you, less waste for the planet.
        </p>

        <div className="foodsaver-stats">
          <div>
            <strong>1,284</strong>
            <span>MEALS SAVED</span>
          </div>

          <div>
            <strong>382 KG</strong>
            <span>FOOD SAVED</span>
          </div>
        </div>

        <button className="foodsaver-button">
          EXPLORE FOODSAVER
          <span>→</span>
        </button>
      </div>
    </section>
  );
}

export default FoodSaver;