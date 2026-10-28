
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../css/CustomerDashboard.css";

const emptyAddress = {
  label: "Home",
  fullName: "",
  phone: "",
  addressLine: "",
  area: "",
  city: "",
  state: "",
  postalCode: "",
  isDefault: false,
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(date) {
  if (!date) return "DATE UNAVAILABLE";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "DATE UNAVAILABLE";
  }

  return parsedDate
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

function CustomerDashboard() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderError, setOrderError] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState("");
  const [addressMessage, setAddressMessage] = useState("");

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrderError("");

    try {
      const response = await api.get("/orders/customer");

      setOrders(
        Array.isArray(response.data.orders) ? response.data.orders : []
      );
    } catch (error) {
      setOrderError(
        error.response?.data?.message ||
          "Unable to load your orders. Please try again."
      );
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    setAddressError("");

    try {
      const response = await api.get("/addresses");

      setAddresses(
        Array.isArray(response.data.addresses)
          ? response.data.addresses
          : []
      );
    } catch (error) {
      setAddressError(
        error.response?.data?.message ||
          "Unable to load your saved addresses. Please try again."
      );
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchAddresses();
  }, [fetchOrders, fetchAddresses]);

  function openNewAddressForm() {
    setEditingAddressId(null);
    setAddressForm({
      ...emptyAddress,
      isDefault: addresses.length === 0,
    });
    setAddressError("");
    setAddressMessage("");
    setShowAddressForm(true);
  }

  function openEditAddressForm(address) {
    setEditingAddressId(address._id);
    setAddressForm({
      label: address.label || "Home",
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine: address.addressLine || "",
      area: address.area || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      isDefault: Boolean(address.isDefault),
    });
    setAddressError("");
    setAddressMessage("");
    setShowAddressForm(true);
  }

  function closeAddressForm() {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
  }

  function handleAddressChange(event) {
    const { name, value, type, checked } = event.target;

    setAddressForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleAddressSubmit(event) {
    event.preventDefault();
    setSavingAddress(true);
    setAddressError("");
    setAddressMessage("");

    try {
      const payload = {
        label: addressForm.label,
        fullName: addressForm.fullName.trim(),
        phone: addressForm.phone.trim(),
        addressLine: addressForm.addressLine.trim(),
        area: addressForm.area.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        postalCode: addressForm.postalCode.trim(),
      };

      let savedAddress;

      if (editingAddressId) {
        const response = await api.put(
          `/addresses/${editingAddressId}`,
          payload
        );

        savedAddress = response.data.address;
      } else {
        const response = await api.post("/addresses", {
          ...payload,
          isDefault: addressForm.isDefault,
        });

        savedAddress = response.data.address;
      }

      if (addressForm.isDefault && !savedAddress.isDefault) {
        await api.patch(`/addresses/${savedAddress._id}/default`);
      }

      closeAddressForm();
      setAddressMessage(
        editingAddressId
          ? "Delivery address updated successfully."
          : "Delivery address saved successfully."
      );

      await fetchAddresses();
    } catch (error) {
      setAddressError(
        error.response?.data?.message ||
          "Unable to save the address. Please try again."
      );
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleSetDefault(addressId) {
    setSettingDefaultId(addressId);
    setAddressError("");
    setAddressMessage("");

    try {
      await api.patch(`/addresses/${addressId}/default`);
      setAddressMessage("Default delivery address updated.");
      await fetchAddresses();
    } catch (error) {
      setAddressError(
        error.response?.data?.message ||
          "Unable to update the default address."
      );
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function handleDeleteAddress(address) {
    const confirmed = window.confirm(
      `Delete the ${address.label || "saved"} address for ${address.city}?`
    );

    if (!confirmed) return;

    setDeletingAddressId(address._id);
    setAddressError("");
    setAddressMessage("");

    try {
      await api.delete(`/addresses/${address._id}`);
      setAddressMessage("Delivery address deleted successfully.");
      await fetchAddresses();
    } catch (error) {
      setAddressError(
        error.response?.data?.message ||
          "Unable to delete the address. Please try again."
      );
    } finally {
      setDeletingAddressId(null);
    }
  }

  const mealsCount = orders.reduce(
    (total, order) =>
      total +
      (order.items || []).reduce(
        (itemTotal, item) => itemTotal + (Number(item.quantity) || 0),
        0
      ),
    0
  );

  const restaurantCount = new Set(
    orders
      .map((order) => order.restaurant?._id || order.restaurant)
      .filter(Boolean)
      .map(String)
  ).size;

  return (
    <>
      <Navbar />

      <main className="customer-dashboard">
        <section className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">YOUR FOODEASE</p>

            <h1>
              Welcome,
              <br />
              <span>{user?.username?.toUpperCase() || "CUSTOMER"}.</span>
            </h1>
          </div>

          <div className="dashboard-header-meta">
            <span>ACCOUNT / 01</span>
            <span>EST. 2026</span>
          </div>
        </section>

        <section className="dashboard-overview">
          <div className="dashboard-stat">
            <span>ORDERS</span>
            <strong>{loadingOrders ? "—" : orders.length}</strong>
            <p>Total orders</p>
          </div>

          <div className="dashboard-stat">
            <span>MEALS ORDERED</span>
            <strong>{loadingOrders ? "—" : mealsCount}</strong>
            <p>Items across your orders</p>
          </div>

          <div className="dashboard-stat">
            <span>RESTAURANTS</span>
            <strong>{loadingOrders ? "—" : restaurantCount}</strong>
            <p>Restaurants ordered from</p>
          </div>

          <div className="dashboard-stat dashboard-stat-action">
            <Link to="/restaurants">
              FIND SOMETHING
              <span>→</span>
            </Link>
          </div>
        </section>

        <section className="dashboard-content">
          <div className="dashboard-orders">
            <div className="dashboard-section-heading">
              <div>
                <p>01 / ACTIVITY</p>
                <h2>Recent orders.</h2>
              </div>
              <span>{orders.length} ORDERS</span>
            </div>

            {loadingOrders ? (
              <div className="orders-list">
                <p>Loading your orders...</p>
              </div>
            ) : orderError ? (
              <div className="orders-list">
                <p role="alert">{orderError}</p>
                <button type="button" onClick={fetchOrders}>
                  RETRY
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="orders-list">
                <p>You haven't placed any orders yet.</p>
                <Link to="/restaurants">EXPLORE RESTAURANTS</Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <article className="order-row" key={order._id}>
                    <div className="order-number">
                      <span>
                        #{String(order._id).slice(-8).toUpperCase()}
                      </span>
                      <small>{formatDate(order.createdAt)}</small>
                    </div>

                    <div className="order-info">
                      <h3>
                        {order.restaurant?.restaurantName || "Restaurant"}
                      </h3>
                      <p>
                        {(order.items || [])
                          .map(
                            (item) => `${item.name} × ${item.quantity}`
                          )
                          .join(", ")}
                      </p>
                    </div>

                    <div className="order-status">
                      <span>
                        {(order.orderStatus || "placed")
                          .replaceAll("_", " ")
                          .toUpperCase()}
                      </span>
                      <strong>{formatCurrency(order.totalAmount)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="dashboard-side">
            <div className="dashboard-profile">
              <p>02 / PROFILE</p>

              <div className="profile-initial">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>

              <h3>{user?.username?.toUpperCase() || "CUSTOMER"}</h3>
              <span>{user?.email || ""}</span>
            </div>

            <div className="dashboard-saver">
              <span>FOODSAVER</span>

              <h3>
                Less waste.
                <br />
                <em>More taste.</em>
              </h3>

              <p>
                Discover meals from restaurants at reduced prices
                while helping prevent good food from going to waste.
              </p>

              <Link to="/restaurants">
                EXPLORE FOODSAVER
                <span>→</span>
              </Link>
            </div>
          </aside>
        </section>

        <section className="dashboard-addresses">
          <div className="dashboard-section-heading">
            <div>
              <p>03 / DELIVERY</p>
              <h2>Saved addresses.</h2>
            </div>

            <button
              type="button"
              className="address-add-button"
              onClick={openNewAddressForm}
            >
              ADD ADDRESS <span>+</span>
            </button>
          </div>

          {addressError && (
            <p className="address-feedback address-feedback-error" role="alert">
              {addressError}
            </p>
          )}

          {addressMessage && (
            <p className="address-feedback" role="status">
              {addressMessage}
            </p>
          )}

          {showAddressForm && (
            <form
              className="address-form"
              onSubmit={handleAddressSubmit}
            >
              <div className="address-form-heading">
                <h3>
                  {editingAddressId ? "Edit address" : "New delivery address"}
                </h3>

                <button
                  type="button"
                  className="address-close-button"
                  onClick={closeAddressForm}
                  disabled={savingAddress}
                >
                  CANCEL
                </button>
              </div>

              <div className="address-form-grid">
                <label>
                  ADDRESS LABEL
                  <select
                    name="label"
                    value={addressForm.label}
                    onChange={handleAddressChange}
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  RECIPIENT NAME
                  <input
                    name="fullName"
                    value={addressForm.fullName}
                    onChange={handleAddressChange}
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  PHONE NUMBER
                  <input
                    name="phone"
                    type="tel"
                    value={addressForm.phone}
                    onChange={handleAddressChange}
                    maxLength={20}
                    required
                  />
                </label>

                <label>
                  HOUSE / STREET ADDRESS
                  <input
                    name="addressLine"
                    value={addressForm.addressLine}
                    onChange={handleAddressChange}
                    maxLength={200}
                    required
                  />
                </label>

                <label>
                  AREA
                  <input
                    name="area"
                    value={addressForm.area}
                    onChange={handleAddressChange}
                    maxLength={100}
                  />
                </label>

                <label>
                  CITY
                  <input
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  STATE
                  <input
                    name="state"
                    value={addressForm.state}
                    onChange={handleAddressChange}
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  PIN CODE
                  <input
                    name="postalCode"
                    value={addressForm.postalCode}
                    onChange={handleAddressChange}
                    maxLength={12}
                    required
                  />
                </label>
              </div>

              <label className="address-default-toggle">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={addressForm.isDefault}
                  onChange={handleAddressChange}
                />
                Set as my default delivery address
              </label>

              <button
                type="submit"
                className="address-save-button"
                disabled={savingAddress}
              >
                {savingAddress ? "SAVING..." : "SAVE ADDRESS"}
                {!savingAddress && <span>→</span>}
              </button>
            </form>
          )}

          {loadingAddresses ? (
            <div className="address-empty-state">
              Loading your saved addresses...
            </div>
          ) : addressError && addresses.length === 0 ? (
            <div className="address-empty-state">
              <p>Your saved addresses could not be loaded.</p>
              <button type="button" onClick={fetchAddresses}>
                RETRY
              </button>
            </div>
          ) : addresses.length === 0 ? (
            <div className="address-empty-state">
              <h3>No saved addresses yet.</h3>
              <p>
                Add a delivery address once, then select it during checkout.
              </p>
              <button type="button" onClick={openNewAddressForm}>
                ADD YOUR FIRST ADDRESS <span>→</span>
              </button>
            </div>
          ) : (
            <div className="address-grid">
              {addresses.map((address) => (
                <article className="saved-address-card" key={address._id}>
                  <div className="saved-address-top">
                    <span className="saved-address-label">
                      {address.label || "Other"}
                    </span>

                    {address.isDefault && (
                      <span className="saved-address-default">
                        DEFAULT
                      </span>
                    )}
                  </div>

                  <h3>{address.fullName}</h3>
                  <p>{address.phone}</p>
                  <p>{address.addressLine}</p>

                  {address.area && <p>{address.area}</p>}

                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>

                  <div className="saved-address-actions">
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address._id)}
                        disabled={
                          settingDefaultId === address._id ||
                          deletingAddressId === address._id
                        }
                      >
                        {settingDefaultId === address._id
                          ? "UPDATING..."
                          : "SET DEFAULT"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditAddressForm(address)}
                      disabled={deletingAddressId === address._id}
                    >
                      EDIT
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(address)}
                      disabled={
                        deletingAddressId === address._id ||
                        settingDefaultId === address._id
                      }
                    >
                      {deletingAddressId === address._id
                        ? "DELETING..."
                        : "DELETE"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-footer">
          <span>FOOD / PEOPLE / PLACES</span>

          <Link to="/restaurants">
            CONTINUE DISCOVERING
            <span>→</span>
          </Link>
        </section>
      </main>
    </>
  );
}

export default CustomerDashboard;
