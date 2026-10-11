import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "../css/Navbar.css";

function Navbar() {
  const { getCartCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const cartCount = getCartCount();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        FOODEASE
      </Link>

      <nav className="navbar-links">
        <Link to="/restaurants">Restaurants</Link>
        <Link to="/offers">Offers</Link>
        <Link to="/about">About</Link>

        <Link to="/cart" className="navbar-cart">
          Cart
          {cartCount > 0 && (
            <span className="navbar-cart-count">
              {cartCount}
            </span>
          )}
        </Link>
      </nav>

      {user ? (
        <div className="navbar-account">
          <Link
            to="/dashboard"
            className="navbar-profile"
          >
            {user.username}
          </Link>

          <button
            type="button"
            className="navbar-logout"
            onClick={handleLogout}
          >
            LOG OUT
          </button>
        </div>
      ) : (
        <Link to="/login" className="navbar-login">
          Login
        </Link>
      )}
    </header>
  );
}

export default Navbar;