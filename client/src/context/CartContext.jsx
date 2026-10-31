
import { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

function getRestaurantId(restaurant) {
  return restaurant?._id || restaurant?.id || restaurant?.restaurantId || "";
}

function getItemPrice(item) {
  if (typeof item?.price === "number") {
    return Number.isFinite(item.price) ? item.price : 0;
  }

  const parsed = Number(String(item?.price ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function CartProvider({ children }) {
  const [, setCartRevision] = useState(0);
  const { user } = useAuth();
  const customerKey = user?.role === "customer" ? `foodease_cart_${user._id || user.id || user.email}` : "";

  function readCart() {
    if (!customerKey) return [];
    try {
      const cart = JSON.parse(localStorage.getItem(customerKey) || "[]");
      return Array.isArray(cart) ? cart : [];
    } catch { return []; }
  }

  const cartItems = readCart();
  function updateCart(updater) {
    if (!customerKey) return;
    localStorage.setItem(customerKey, JSON.stringify(updater(readCart())));
    setCartRevision((revision) => revision + 1);
  }

  function addToCart(item, restaurant) {
    if (!customerKey) return;
    const restaurantId = getRestaurantId(restaurant);

    if (!restaurantId || !item?.name) {
      console.error("Cannot add item: restaurant ID or item name is missing.");
      return;
    }

    const price = getItemPrice(item);

    updateCart((currentItems) => {
      const existingItem = currentItems.find(
        (cartItem) =>
          cartItem.name === item.name &&
          String(cartItem.restaurantId) === String(restaurantId)
      );

      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.name === item.name &&
          String(cartItem.restaurantId) === String(restaurantId)
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      return [
        ...currentItems,
        {
          ...item,
          price,
          quantity: 1,
          restaurantId,
          restaurantName:
            restaurant.restaurantName || restaurant.name || "",
        },
      ];
    });
  }

  function removeFromCart(itemName, restaurantId) {
    updateCart((currentItems) =>
      currentItems.filter(
        (item) =>
          !(
            item.name === itemName &&
            String(item.restaurantId) === String(restaurantId)
          )
      )
    );
  }

  function updateQuantity(itemName, restaurantId, quantity) {
    const nextQuantity = Number(quantity);

    if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) {
      removeFromCart(itemName, restaurantId);
      return;
    }

    updateCart((currentItems) =>
      currentItems.map((item) =>
        item.name === itemName &&
        String(item.restaurantId) === String(restaurantId)
          ? {
              ...item,
              quantity: nextQuantity,
            }
          : item
      )
    );
  }

  function getCartCount() {
    return cartItems.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );
  }

  function getCartTotal() {
    return cartItems.reduce(
      (total, item) =>
        total + getItemPrice(item) * Number(item.quantity || 0),
      0
    );
  }

  function clearCart() {
    updateCart(() => []);
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartCount,
        getCartTotal,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// The context hook is exported beside its provider for this app's context pattern.
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext);
}

export default CartProvider;
