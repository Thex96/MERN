import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import "../css/Checkout.css";

function Checkout() {
  const { cartItems, getCartTotal } = useCart();
  const [step, setStep] = useState(1);

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const total = subtotal + deliveryFee;

  function continueToPayment(event) {
    event.preventDefault();
    setStep(2);
  }

  function placeOrder(event) {
    event.preventDefault();
    setStep(3);
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Navbar />

        <main className="checkout-empty">
          <p>YOUR ORDER</p>
          <h1>Your cart is empty.</h1>

          <Link to="/restaurants">
            DISCOVER RESTAURANTS
            <span>→</span>
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="checkout-page">
        <section className="checkout-header">
          <div>
            <p>FOODEASE / CHECKOUT</p>
            <h1>
              Almost
              <br />
              <span>there.</span>
            </h1>
          </div>

          <div className="checkout-steps">
            <div className={step >= 1 ? "active" : ""}>
              <span>01</span>
              <p>DELIVERY</p>
            </div>

            <div className={step >= 2 ? "active" : ""}>
              <span>02</span>
              <p>PAYMENT</p>
            </div>

            <div className={step >= 3 ? "active" : ""}>
              <span>03</span>
              <p>CONFIRMATION</p>
            </div>
          </div>
        </section>

        {step === 1 && (
          <section className="checkout-content">
            <div className="checkout-form-area">
              <div className="checkout-section-heading">
                <span>01</span>
                <div>
                  <p>DELIVERY DETAILS</p>
                  <h2>Where should we bring it?</h2>
                </div>
              </div>

              <form
                className="checkout-form"
                onSubmit={continueToPayment}
              >
                <div className="checkout-field">
                  <label>FULL NAME</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label>PHONE NUMBER</label>
                  <input
                    type="tel"
                    placeholder="+91"
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label>ADDRESS</label>
                  <textarea
                    placeholder="House number, street, area"
                    rows="3"
                    required
                  />
                </div>

                <div className="checkout-row">
                  <div className="checkout-field">
                    <label>CITY</label>
                    <input
                      type="text"
                      placeholder="Coimbatore"
                      required
                    />
                  </div>

                  <div className="checkout-field">
                    <label>PIN CODE</label>
                    <input
                      type="text"
                      placeholder="641001"
                      required
                    />
                  </div>
                </div>

                <button
                  className="checkout-submit"
                  type="submit"
                >
                  CONTINUE TO PAYMENT
                  <span>→</span>
                </button>
              </form>
            </div>

            <OrderSummary
              cartItems={cartItems}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              total={total}
            />
          </section>
        )}

        {step === 2 && (
          <section className="checkout-content">
            <div className="checkout-form-area">
              <div className="checkout-section-heading">
                <span>02</span>
                <div>
                  <p>PAYMENT</p>
                  <h2>Choose how to pay.</h2>
                </div>
              </div>

              <form
                className="checkout-form"
                onSubmit={placeOrder}
              >
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    defaultChecked
                  />
                  <div>
                    <strong>Cash on Delivery</strong>
                    <span>Pay when your order arrives.</span>
                  </div>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                  />
                  <div>
                    <strong>UPI</strong>
                    <span>Pay securely using UPI.</span>
                  </div>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                  />
                  <div>
                    <strong>Card</strong>
                    <span>Credit or debit card.</span>
                  </div>
                </label>

                <button
                  className="checkout-submit"
                  type="submit"
                >
                  PLACE ORDER
                  <span>→</span>
                </button>
              </form>
            </div>

            <OrderSummary
              cartItems={cartItems}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              total={total}
            />
          </section>
        )}

        {step === 3 && (
          <section className="checkout-confirmation">
            <p>03 / CONFIRMATION</p>

            <h2>
              Order
              <br />
              <em>confirmed.</em>
            </h2>

            <span className="confirmation-number">
              ORDER #FE-2026-001
            </span>

            <p className="confirmation-copy">
              Your order has been placed successfully.
              The restaurant is preparing your food now.
            </p>

            <Link to="/dashboard">
              VIEW YOUR ORDER
              <span>→</span>
            </Link>
          </section>
        )}
      </main>
    </>
  );
}

function OrderSummary({
  cartItems,
  subtotal,
  deliveryFee,
  total,
}) {
  return (
    <aside className="checkout-summary">
      <div className="checkout-summary-heading">
        <span>YOUR ORDER</span>
        <span>{cartItems.length} ITEMS</span>
      </div>

      <div className="checkout-items">
        {cartItems.map((item) => (
          <div
            className="checkout-item"
            key={`${item.restaurantId}-${item.name}`}
          >
            <div>
              <span>{item.quantity} ×</span>
              <h3>{item.name}</h3>
              <p>{item.restaurantName}</p>
            </div>

            <strong>
              ₹
              {Number(
                item.price.replace("₹", "")
              ) * item.quantity}
            </strong>
          </div>
        ))}
      </div>

      <div className="checkout-total">
        <div>
          <span>SUBTOTAL</span>
          <strong>₹{subtotal}</strong>
        </div>

        <div>
          <span>DELIVERY</span>
          <strong>
            {deliveryFee === 0
              ? "FREE"
              : `₹${deliveryFee}`}
          </strong>
        </div>

        <div className="checkout-grand-total">
          <span>TOTAL</span>
          <strong>₹{total}</strong>
        </div>
      </div>
    </aside>
  );
}

export default Checkout;