import "../css/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <h2>FOODEASE</h2>

          <p>
            Good food.
            <br />
            Great choices.
          </p>
        </div>

        <div className="footer-column">
          <h3>EXPLORE</h3>

          <a href="#">Restaurants</a>
          <a href="#">Offers</a>
          <a href="#">FoodSaver</a>
          <a href="#">Popular Dishes</a>
        </div>

        <div className="footer-column">
          <h3>COMPANY</h3>

          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Careers</a>
          <a href="#">Partner with us</a>
        </div>

        <div className="footer-column">
          <h3>ACCOUNT</h3>

          <a href="#">Login</a>
          <a href="#">Sign Up</a>
          <a href="#">My Orders</a>
          <a href="#">Profile</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 FoodEase. All rights reserved.</p>

        <div className="footer-legal">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;