import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const CartContext = createContext(null);

const CART_KEY       = "cul_cart";
const RESTAURANT_KEY = "cul_cart_restaurant";

export const CartProvider = ({ children }) => {
  const [cartItems,      setCartItems]      = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);
  // For cross-restaurant confirm (replaces window.confirm)
  const [pendingSwitch, setPendingSwitch] = useState(null); // { item, restaurant, customizations }

  useEffect(() => {
    try {
      const saved    = localStorage.getItem(CART_KEY);
      const savedRest= localStorage.getItem(RESTAURANT_KEY);
      if (saved)     setCartItems(JSON.parse(saved));
      if (savedRest) setCartRestaurant(JSON.parse(savedRest));
    } catch {
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(RESTAURANT_KEY);
    }
  }, []);

  const saveCart = (items, restaurant) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    if (restaurant) localStorage.setItem(RESTAURANT_KEY, JSON.stringify(restaurant));
    else            localStorage.removeItem(RESTAURANT_KEY);
  };

  const doAdd = (item, restaurant, customizations = []) => {
    setCartRestaurant(restaurant);

    const effectivePrice = item.discount > 0
      ? parseFloat((item.price * (1 - item.discount / 100)).toFixed(2))
      : item.price;

    const cartKey = `${item._id}_${JSON.stringify(customizations)}`;

    setCartItems((prev) => {
      const existing = prev.find(ci => ci.cartKey === cartKey);
      const updated  = existing
        ? prev.map(ci => ci.cartKey === cartKey ? { ...ci, quantity: ci.quantity + 1 } : ci)
        : [...prev, { ...item, price: effectivePrice, cartKey, quantity: 1, customizations }];
      saveCart(updated, restaurant);
      return updated;
    });

    toast.success(`${item.name} added to cart`);
  };

  const addToCart = (item, restaurant, customizations = []) => {
    // Different restaurant — queue the pending action, caller shows confirmation UI
    if (cartRestaurant && cartRestaurant._id !== restaurant._id && cartItems.length > 0) {
      setPendingSwitch({ item, restaurant, customizations });
      return false; // signal: "show confirm dialog"
    }
    doAdd(item, restaurant, customizations);
    return true;
  };

  // Called when user confirms switching restaurants
  const confirmSwitch = () => {
    if (!pendingSwitch) return;
    const { item, restaurant, customizations } = pendingSwitch;
    setCartItems([]);
    doAdd(item, restaurant, customizations);
    setPendingSwitch(null);
  };

  const cancelSwitch = () => setPendingSwitch(null);

  const removeFromCart = (cartKey) => {
    setCartItems((prev) => {
      const updated = prev.filter(ci => ci.cartKey !== cartKey);
      if (updated.length === 0) {
        setCartRestaurant(null);
        saveCart([], null);
      } else {
        saveCart(updated, cartRestaurant);
      }
      return updated;
    });
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity < 1) { removeFromCart(cartKey); return; }
    setCartItems((prev) => {
      const updated = prev.map(ci => ci.cartKey === cartKey ? { ...ci, quantity } : ci);
      saveCart(updated, cartRestaurant);
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setCartRestaurant(null);
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(RESTAURANT_KEY);
  };

  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);

  const subtotal = cartItems.reduce((s, i) => {
    const customCost = (i.customizations || []).reduce((cs, c) => cs + (c.price || 0), 0);
    return s + (i.price + customCost) * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{
      // Primary names (used in Checkout, Cart, etc.)
      items:      cartItems,
      restaurant: cartRestaurant,
      subtotal,
      totalItems,
      clearCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      confirmSwitch,
      cancelSwitch,
      pendingSwitch,
      // Aliases for any file still using the old names
      cartItems,
      cartRestaurant,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};