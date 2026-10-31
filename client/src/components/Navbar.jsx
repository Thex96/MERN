import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "../css/Navbar.css";

function Navbar() {
  const { getCartCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = getCartCount();
  const dashboardPath = user?.role === "restaurant" ? "/restaurant-dashboard" : "/dashboard";

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/");
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
        FOODEASE
      </Link>

      <button
        type="button"
        className={`navbar-menu-toggle${menuOpen ? " is-open" : ""}`}
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls="foodease-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav
        id="foodease-navigation"
        className={`navbar-links${menuOpen ? " navbar-links-open" : ""}`}
      >
        <Link to="/restaurants" onClick={() => setMenuOpen(false)}>Restaurants</Link>
        <Link to="/offers" onClick={() => setMenuOpen(false)}>Offers</Link>
        <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
        {user?.role === "customer" && <Link to="/cart" className="navbar-cart" onClick={() => setMenuOpen(false)}>
          Cart{cartCount > 0 && <span className="navbar-cart-count">{cartCount}</span>}
        </Link>}
        {user ? (
          <div className="navbar-mobile-account">
            <Link to={dashboardPath} className="navbar-profile" onClick={() => setMenuOpen(false)}>
              {user.username}
            </Link>
            <button type="button" className="navbar-logout" onClick={handleLogout}>
              LOG OUT
            </button>
          </div>
        ) : (
          <Link to="/login" className="navbar-mobile-login" onClick={() => setMenuOpen(false)}>
            Login
          </Link>
        )}
      </nav>

      {user ? (
        <div className="navbar-account">
          <Link to={dashboardPath} className="navbar-profile">{user.username}</Link>
          <button type="button" className="navbar-logout" onClick={handleLogout}>LOG OUT</button>
        </div>
      ) : (
        <Link to="/login" className="navbar-login">Login</Link>
      )}
    </header>
  );
}

export default Navbar;
