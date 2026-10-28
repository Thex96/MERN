
import { createContext, useContext, useState } from "react";

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
  const [cartItems, setCartItems] = useState([]);

  function addToCart(item, restaurant) {
    const restaurantId = getRestaurantId(restaurant);

    if (!restaurantId || !item?.name) {
      console.error("Cannot add item: restaurant ID or item name is missing.");
      return;
    }

    const price = getItemPrice(item);

    setCartItems((currentItems) => {
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
    setCartItems((currentItems) =>
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

    setCartItems((currentItems) =>
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
    setCartItems([]);
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

export function useCart() {
  return useContext(CartContext);
}

export default CartProvider;
