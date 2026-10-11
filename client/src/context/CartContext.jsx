import { createContext, useContext, useState } from "react";

const CartContext = createContext();

function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  function addToCart(item, restaurant) {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (cartItem) =>
          cartItem.name === item.name &&
          cartItem.restaurantId === restaurant.id
      );

      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.name === item.name &&
          cartItem.restaurantId === restaurant.id
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
          quantity: 1,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
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
            item.restaurantId === restaurantId
          )
      )
    );
  }

  function updateQuantity(itemName, restaurantId, quantity) {
    if (quantity <= 0) {
      removeFromCart(itemName, restaurantId);
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.name === itemName &&
        item.restaurantId === restaurantId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  }

  function getCartCount() {
    return cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  function getCartTotal() {
    return cartItems.reduce(
      (total, item) =>
        total +
        Number(item.price.replace("₹", "")) *
          item.quantity,
      0
    );
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