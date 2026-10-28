
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../css/Checkout.css";

function getPrice(price) {
  if (typeof price === "number") {
    return Number.isFinite(price) && price >= 0 ? price : 0;
  }

  const parsed = Number(String(price ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatPrice(price) {
  return `₹${Number(price || 0).toFixed(2)}`;
}

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoadingAddresses(true);
      setError("");

      const response = await api.get("/addresses");
      const savedAddresses = response.data.addresses || [];

      setAddresses(savedAddresses);

      const defaultAddress = savedAddresses.find(
        (address) => address.isDefault
      );

      setSelectedAddressId((currentId) => {
        if (savedAddresses.some((address) => address._id === currentId)) {
          return currentId;
        }

        return defaultAddress?._id || savedAddresses[0]?._id || "";
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load your saved addresses. Please try again."
      );
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const selectedAddress = addresses.find(
    (address) => address._id === selectedAddressId
  );

  const restaurantIds = [
    ...new Set(
      cartItems
        .map((item) => item.restaurantId)
        .filter(Boolean)
        .map(String)
    ),
  ];

  const cartTotal =
    typeof getCartTotal === "function"
      ? getCartTotal()
      : cartItems.reduce(
          (total, item) => total + getPrice(item.price) * item.quantity,
          0
        );

  const validCart =
    cartItems.length > 0 &&
    restaurantIds.length === 1 &&
    cartItems.every(
      (item) =>
        item.name &&
        Number.isSafeInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0 &&
        Number.isFinite(getPrice(item.price))
    );

  const placeOrder = async () => {
    if (placingOrder) return;

    setError("");

    if (!user) {
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (restaurantIds.length !== 1) {
      setError(
        "Please order from one restaurant at a time. Remove items from other restaurants before continuing."
      );
      return;
    }

    if (!selectedAddressId || !selectedAddress) {
      setError("Please select a saved delivery address.");
      return;
    }

    if (paymentMethod !== "cod") {
      setError(
        "Online payments are not available yet. Please select Cash on Delivery."
      );
      return;
    }

    const items = cartItems.map((item) => ({
      foodId: item.foodId || item._id || undefined,
      name: item.name,
      image: item.image || "",
      quantity: Number(item.quantity),
      price: getPrice(item.price),
    }));

    if (
      items.some(
        (item) =>
          !item.name ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1 ||
          !Number.isFinite(item.price) ||
          item.price < 0
      )
    ) {
      setError("Some cart items have invalid details. Please review your cart.");
      return;
    }

    try {
      setPlacingOrder(true);

      const response = await api.post("/orders", {
        restaurantId: restaurantIds[0],
        items,
        deliveryAddressId: selectedAddressId,
        paymentMethod,
      });

      const createdOrder = response.data.order;

      if (!createdOrder?._id) {
        throw new Error("The server did not return a valid order.");
      }

      setOrder(createdOrder);

      if (typeof clearCart === "function") {
        clearCart();
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to place your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="checkout-page">
        <div className="checkout-container">
          {order ? (
            <section className="checkout-confirmation">
              <div className="checkout-confirmation-icon">
                <span aria-hidden="true">✓</span>
              </div>

              <p className="checkout-eyebrow">ORDER CONFIRMED</p>
              <h1>Thank you for your order.</h1>
              <p className="checkout-confirmation-description">
                Your order has been placed successfully. You can check its
                progress from your customer dashboard.
              </p>

              <div className="checkout-order-summary">
                <div>
                  <span>Order ID</span>
                  <strong>{order._id}</strong>
                </div>

                <div>
                  <span>Payment method</span>
                  <strong>Cash on Delivery</strong>
                </div>

                <div>
                  <span>Payment status</span>
                  <strong>
                    {order.paymentStatus || "pending"}
                  </strong>
                </div>

                <div>
                  <span>Order total</span>
                  <strong>{formatPrice(order.totalAmount)}</strong>
                </div>
              </div>

              <div className="checkout-confirmation-actions">
                <button
                  type="button"
                  className="checkout-primary-button"
                  onClick={() => navigate("/dashboard")}
                >
                  View My Orders
                </button>

                <Link to="/" className="checkout-secondary-button">
                  Continue Shopping
                </Link>
              </div>
            </section>
          ) : (
            <>
              <div className="checkout-heading">
                <p className="checkout-eyebrow">FOODEASE CHECKOUT</p>
                <h1>Complete your order.</h1>
                <p>
                  Confirm your delivery address and review your payment
                  details.
                </p>
              </div>

              {error && (
                <div className="checkout-error" role="alert">
                  {error}
                </div>
              )}

              {loadingAddresses ? (
                <div className="checkout-loading">
                  Loading your saved addresses...
                </div>
              ) : (
                <div className="checkout-layout">
                  <section className="checkout-details">
                    <div className="checkout-section-heading">
                      <div>
                        <p className="checkout-step-label">STEP 01</p>
                        <h2>Delivery address</h2>
                      </div>

                      <Link
                        to="/dashboard"
                        className="checkout-text-link"
                      >
                        Manage addresses
                      </Link>
                    </div>

                    {addresses.length === 0 ? (
                      <div className="checkout-no-address">
                        <h3>No saved addresses yet</h3>
                        <p>
                          Add a delivery address from your customer dashboard
                          before placing your order.
                        </p>
                        <Link
                          to="/dashboard"
                          className="checkout-primary-button"
                        >
                          Add an Address
                        </Link>
                      </div>
                    ) : (
                      <>
                        <label
                          htmlFor="checkout-address"
                          className="checkout-field-label"
                        >
                          Choose a saved address
                        </label>

                        <select
                          id="checkout-address"
                          className="checkout-address-selector"
                          value={selectedAddressId}
                          onChange={(event) =>
                            setSelectedAddressId(event.target.value)
                          }
                        >
                          {addresses.map((address) => (
                            <option
                              key={address._id}
                              value={address._id}
                            >
                              {address.label}
                              {address.isDefault ? " (Default)" : ""} —{" "}
                              {address.city}
                            </option>
                          ))}
                        </select>

                        {selectedAddress && (
                          <div className="checkout-selected-address">
                            <div className="checkout-address-topline">
                              <span className="checkout-address-label">
                                {selectedAddress.label}
                              </span>

                              {selectedAddress.isDefault && (
                                <span className="checkout-default-label">
                                  DEFAULT
                                </span>
                              )}
                            </div>

                            <h3>{selectedAddress.fullName}</h3>
                            <p>{selectedAddress.phone}</p>
                            <p>{selectedAddress.addressLine}</p>

                            {selectedAddress.area && (
                              <p>{selectedAddress.area}</p>
                            )}

                            <p>
                              {selectedAddress.city},{" "}
                              {selectedAddress.state} —{" "}
                              {selectedAddress.postalCode}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="checkout-payment-section">
                      <div className="checkout-section-heading">
                        <div>
                          <p className="checkout-step-label">STEP 02</p>
                          <h2>Payment method</h2>
                        </div>
                      </div>

                      <label
                        className={`checkout-payment-option ${
                          paymentMethod === "cod" ? "selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === "cod"}
                          onChange={(event) =>
                            setPaymentMethod(event.target.value)
                          }
                        />

                        <span className="checkout-payment-copy">
                          <strong>Cash on Delivery</strong>
                          <span>
                            Pay when your order arrives.
                          </span>
                        </span>

                        <span className="checkout-payment-availability">
                          Available
                        </span>
                      </label>

                      <label className="checkout-payment-option disabled">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="upi"
                          checked={paymentMethod === "upi"}
                          disabled
                          onChange={(event) =>
                            setPaymentMethod(event.target.value)
                          }
                        />

                        <span className="checkout-payment-copy">
                          <strong>UPI</strong>
                          <span>Online payments are not integrated yet.</span>
                        </span>
                      </label>

                      <label className="checkout-payment-option disabled">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === "card"}
                          disabled
                          onChange={(event) =>
                            setPaymentMethod(event.target.value)
                          }
                        />

                        <span className="checkout-payment-copy">
                          <strong>Credit or Debit Card</strong>
                          <span>Online payments are not integrated yet.</span>
                        </span>
                      </label>
                    </div>
                  </section>

                  <aside className="checkout-summary">
                    <p className="checkout-step-label">YOUR ORDER</p>
                    <h2>Order summary</h2>

                    {cartItems.length === 0 ? (
                      <p className="checkout-empty-cart">
                        Your cart is empty.
                      </p>
                    ) : (
                      <div className="checkout-summary-items">
                        {cartItems.map((item, index) => (
                          <div
                            className="checkout-summary-item"
                            key={item.foodId || item._id || `${item.name}-${index}`}
                          >
                            <div className="checkout-item-details">
                              <strong>{item.name}</strong>
                              <span>Qty: {item.quantity}</span>
                            </div>

                            <span className="checkout-item-price">
                              {formatPrice(
                                getPrice(item.price) * item.quantity
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="checkout-summary-total">
                      <span>Total</span>
                      <strong>{formatPrice(cartTotal)}</strong>
                    </div>

                    <button
                      type="button"
                      className="checkout-primary-button checkout-place-order"
                      onClick={placeOrder}
                      disabled={
                        placingOrder ||
                        loadingAddresses ||
                        addresses.length === 0 ||
                        !selectedAddressId ||
                        cartItems.length === 0 ||
                        !validCart
                      }
                    >
                      {placingOrder ? "Placing Order..." : "Place Order"}
                    </button>

                    <p className="checkout-terms">
                      By placing your order, you confirm that your delivery
                      details are correct.
                    </p>

                    <Link to="/cart" className="checkout-back-link">
                      Return to Cart
                    </Link>
                  </aside>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default Checkout;
