
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../css/Checkout.css";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function getPrice(value) {
  if (typeof value === "number") return value;

  const price = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(price) ? price : 0;
}

function Checkout() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [successOrder, setSuccessOrder] = useState(null);

  const subtotal = Number(getCartTotal()) || 0;
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    let active = true;

    async function fetchAddresses() {
      setLoadingAddresses(true);
      setError("");

      try {
        const response = await api.get("/addresses");
        const savedAddresses = Array.isArray(response.data.addresses)
          ? response.data.addresses
          : [];

        if (!active) return;

        setAddresses(savedAddresses);

        const defaultAddress = savedAddresses.find(
          (address) => address.isDefault
        );

        setSelectedAddressId(
          defaultAddress?._id || savedAddresses[0]?._id || ""
        );
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load your saved addresses. Please try again."
          );
        }
      } finally {
        if (active) setLoadingAddresses(false);
      }
    }

    fetchAddresses();

    return () => {
      active = false;
    };
  }, []);

  async function placeOrder(event) {
    event.preventDefault();
    setError("");

    if (!user) {
      navigate("/login");
      return;
    }

    if (!selectedAddressId) {
      setError("Please select a delivery address before continuing.");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const selectedAddress = addresses.find(
      (address) => address._id === selectedAddressId
    );

    if (!selectedAddress) {
      setError("Please select a valid saved delivery address.");
      return;
    }

    const restaurantIds = [
      ...new Set(
        cartItems
          .map((item) => String(item.restaurantId || ""))
          .filter(Boolean)
      ),
    ];

    if (restaurantIds.length !== 1) {
      setError(
        "Please order from one restaurant at a time. Remove items from other restaurants before checkout."
      );
      return;
    }

    const items = cartItems.map((item) => ({
      foodId: item.foodId || item._id || null,
      name: item.name,
      image: item.image || "",
      quantity: Number(item.quantity),
      price: getPrice(item.price),
    }));

    if (
      items.some(
        (item) =>
          !item.name ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.price < 0
      )
    ) {
      setError("Your cart contains invalid items. Please review your cart.");
      return;
    }

    setPlacingOrder(true);

    try {
      const response = await api.post("/orders", {
        restaurantId: restaurantIds[0],
        items,
        deliveryAddressId: selectedAddressId,
        paymentMethod,
      });

      const createdOrder = response.data.order;

      if (!createdOrder) {
        throw new Error("The server did not return the created order.");
      }

      setSuccessOrder(createdOrder);

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
  }

  if (cartItems.length === 0 && !successOrder) {
    return (
      <>
        <Navbar />
        <main className="checkout-empty">
          <p>YOUR ORDER</p>
          <h1>Your cart is empty.</h1>
          <Link to="/restaurants">
            DISCOVER RESTAURANTS <span>→</span>
          </Link>
        </main>
      </>
    );
  }

  if (successOrder) {
    return (
      <>
        <Navbar />
        <main className="checkout-page">
          <section className="checkout-confirmation">
            <p>03 / CONFIRMATION</p>
            <h2>
              Order
              <br />
              <em>placed.</em>
            </h2>
            <span className="confirmation-number">
              ORDER #{String(successOrder._id).slice(-8).toUpperCase()}
            </span>
            <p className="confirmation-copy">
              Your order has been recorded. You can track its status in your
              customer dashboard.
            </p>
            <Link to="/dashboard">
              VIEW YOUR ORDER <span>→</span>
            </Link>
          </section>
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
            <div className="active">
              <span>01</span>
              <p>DELIVERY</p>
            </div>
            <div className="active">
              <span>02</span>
              <p>PAYMENT</p>
            </div>
            <div>
              <span>03</span>
              <p>CONFIRMATION</p>
            </div>
          </div>
        </section>

        <section className="checkout-content">
          <div className="checkout-form-area">
            <div className="checkout-section-heading">
              <span>01</span>
              <div>
                <p>DELIVERY ADDRESS</p>
                <h2>Where should we bring it?</h2>
              </div>
            </div>

            {loadingAddresses ? (
              <p>Loading your saved addresses...</p>
            ) : addresses.length === 0 ? (
              <div className="checkout-no-address">
                <p>You haven't saved a delivery address yet.</p>
                <Link to="/dashboard">
                  ADD AN ADDRESS IN YOUR DASHBOARD <span>→</span>
                </Link>
              </div>
            ) : (
              <div className="checkout-address-selector">
                <label htmlFor="checkout-address">DELIVER TO</label>

                <select
                  id="checkout-address"
                  value={selectedAddressId}
                  onChange={(event) =>
                    setSelectedAddressId(event.target.value)
                  }
                >
                  {addresses.map((address) => (
                    <option key={address._id} value={address._id}>
                      {address.label} — {address.addressLine}, {address.city}
                      {address.isDefault ? " (Default)" : ""}
                    </option>
                  ))}
                </select>

                {addresses
                  .filter((address) => address._id === selectedAddressId)
                  .map((address) => (
                    <div className="checkout-selected-address" key={address._id}>
                      <span>{address.label.toUpperCase()}</span>
                      <h3>{address.fullName}</h3>
                      <p>{address.phone}</p>
                      <p>{address.addressLine}</p>
                      {address.area && <p>{address.area}</p>}
                      <p>
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                    </div>
                  ))}

                <Link to="/dashboard" className="checkout-manage-addresses">
                  MANAGE SAVED ADDRESSES <span>→</span>
                </Link>
              </div>
            )}

            <div className="checkout-section-heading checkout-payment-heading">
              <span>02</span>
              <div>
                <p>PAYMENT</p>
                <h2>Choose how to pay.</h2>
              </div>
            </div>

            <form className="checkout-form" onSubmit={placeOrder}>
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
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
                  value="upi"
                  checked={paymentMethod === "upi"}
                  onChange={() => setPaymentMethod("upi")}
                />
                <div>
                  <strong>UPI</strong>
                  <span>Pay using UPI when online payments are enabled.</span>
                </div>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <div>
                  <strong>Card</strong>
                  <span>Pay by card when online payments are enabled.</span>
                </div>
              </label>

              {error && (
                <p className="checkout-error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="checkout-submit"
                type="submit"
                disabled={
                  placingOrder ||
                  loadingAddresses ||
                  addresses.length === 0
                }
              >
                {placingOrder ? "PLACING ORDER..." : "PLACE ORDER"}
                {!placingOrder && <span>→</span>}
              </button>

              {paymentMethod !== "cod" && (
                <p className="checkout-payment-notice">
                  Online payment processing is not connected yet. Choose Cash
                  on Delivery to place an order in the current version.
                </p>
              )}
            </form>
          </div>

          <OrderSummary
            cartItems={cartItems}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
          />
        </section>
      </main>
    </>
  );
}

function OrderSummary({ cartItems, subtotal, deliveryFee, total }) {
  return (
    <aside className="checkout-summary">
      <div className="checkout-summary-heading">
        <span>YOUR ORDER</span>
        <span>{cartItems.length} ITEMS</span>
      </div>

      <div className="checkout-items">
        {cartItems.map((item, index) => (
          <div
            className="checkout-item"
            key={`${item.restaurantId}-${item.name}-${index}`}
          >
            <div>
              <span>{item.quantity} ×</span>
              <h3>{item.name}</h3>
              <p>{item.restaurantName}</p>
            </div>
            <strong>
              {formatCurrency(getPrice(item.price) * Number(item.quantity))}
            </strong>
          </div>
        ))}
      </div>

      <div className="checkout-total">
        <div>
          <span>SUBTOTAL</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <div>
          <span>DELIVERY</span>
          <strong>
            {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}
          </strong>
        </div>
        <div className="checkout-grand-total">
          <span>TOTAL</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      </div>
    </aside>
  );
}

export default Checkout;
