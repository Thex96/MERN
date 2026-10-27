import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import "../css/Cart.css";

function Cart() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getCartTotal,
  } = useCart();

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const total = subtotal + deliveryFee;

  return (
    <>
      <Navbar />

      <main className="cart-page">
        <div className="cart-header">
          <div>
            <p className="cart-label">YOUR ORDER</p>

            <h1>
              Your
              <br />
              <span>cart.</span>
            </h1>
          </div>

          <span className="cart-count">
            {cartItems.length} ITEMS
          </span>
        </div>

        {cartItems.length === 0 ? (
          <section className="cart-empty">
            <p>YOUR CART IS EMPTY</p>

            <h2>
              Nothing here
              <br />
              just yet.
            </h2>

            <Link to="/restaurants">
              EXPLORE RESTAURANTS
              <span>→</span>
            </Link>
          </section>
        ) : (
          <section className="cart-content">
            <div className="cart-items">
              {cartItems.map((item) => (
                <article
                  className="cart-item"
                  key={`${item.restaurantId}-${item.name}`}
                >
                  <div className="cart-item-image">
                    <img
                      src={item.image}
                      alt={item.name}
                    />
                  </div>

                  <div className="cart-item-info">
                    <div>
                      <p>{item.restaurantName}</p>

                      <h2>{item.name}</h2>

                      <span>{item.price}</span>
                    </div>

                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.name,
                              item.restaurantId,
                              item.quantity - 1
                            )
                          }
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.name,
                              item.restaurantId,
                              item.quantity + 1
                            )
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="remove-item"
                        onClick={() =>
                          removeFromCart(
                            item.name,
                            item.restaurantId
                          )
                        }
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="cart-summary">
              <p className="cart-summary-label">
                ORDER SUMMARY
              </p>

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>

              <div className="cart-summary-row">
                <span>Delivery</span>
                <span>₹{deliveryFee}</span>
              </div>

              <div className="cart-summary-total">
                <span>TOTAL</span>
                <strong>₹{total}</strong>
              </div>

              <Link
                to="/checkout"
                className="cart-checkout"
              >
                PROCEED TO CHECKOUT
                <span>→</span>
              </Link>
            </aside>
          </section>
        )}
      </main>
    </>
  );
}

export default Cart;