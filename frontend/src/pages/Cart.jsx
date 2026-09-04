import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import SafeImage from "../components/SafeImage";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Cart() {
  const {
    cartItems,
    cartRestaurant,
    removeFromCart,
    updateQuantity,
    subtotal,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const deliveryFee = cartRestaurant?.deliveryFee || 2.99;
  const tax = parseFloat((subtotal * 0.1).toFixed(2));
  const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-4 py-20 mt-20">
        <div className="text-8xl mt-30 mb-6">🛒</div>
        <h2 className="text-3xl font-bold text-stone-900 dark:text-white mb-3">
          Your cart is empty
        </h2>
        <p className="text-stone-500 mb-8">
          Browse restaurants and add some delicious items!
        </p>
        <Link to="/restaurants" className="btn-primary">
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pb-16">
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-2">
          Your Cart
        </h1>
        {cartRestaurant && (
          <p className="text-stone-500 mb-8">
            From{" "}
            <Link
              to={`/restaurants/${cartRestaurant._id}`}
              className="text-primary-500 font-medium hover:underline"
            >
              {cartRestaurant.name}
            </Link>
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {cartItems.map((item) => {
              const customCost = (item.customizations || []).reduce(
                (s, c) => s + (c.price || 0),
                0,
              );
              const itemPrice = item.price + customCost;

              return (
                <div key={item.cartKey} className="card p-4 flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-cream-200 dark:bg-stone-800 overflow-hidden shrink-0">
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl"
                      imgClass="object-cover"
                      fallback={
                        <div className="w-full h-full flex items-center justify-center">
                          <Logo className="w-8 h-8 opacity-50" iconOnly />
                        </div>
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-900 dark:text-white">
                      {item.name}
                    </h3>
                    {item.customizations.length > 0 && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        {item.customizations.map((c) => c.selected).join(", ")}
                      </p>
                    )}
                    <p className="text-primary-500 font-bold mt-1">
                      ${itemPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => removeFromCart(item.cartKey)}
                      className="text-stone-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-center gap-2 bg-cream-50 dark:bg-stone-900 rounded-lg p-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.cartKey, item.quantity - 1)
                        }
                        className="w-7 h-7 rounded-md bg-white dark:bg-stone-800 border border-cream-300 dark:border-stone-700 flex items-center justify-center hover:bg-cream-100 dark:hover:bg-stone-700"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="font-bold text-stone-800 dark:text-stone-100 min-w-[1.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.cartKey, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded-md bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                      ${(itemPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}

            <button
              onClick={clearCart}
              className="text-sm text-red-400 hover:text-red-500 hover:underline"
            >
              Clear cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-6">
                Order Summary
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-stone-600 dark:text-stone-300">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-300">
                  <span>Delivery fee</span>
                  <span>
                    {deliveryFee === 0 ? "Free" : `$${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-300">
                  <span>Tax (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-cream-200 dark:border-stone-700 pt-3 flex justify-between font-bold text-lg text-stone-900 dark:text-white">
                  <span>Total</span>
                  <span className="text-primary-500">${total.toFixed(2)}</span>
                </div>
              </div>

              {!user ? (
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
                    Login to place your order
                  </p>
                  <Link
                    to="/login"
                    state={{ from: { pathname: "/cart" } }}
                    className="btn-primary w-full block text-center"
                  >
                    Login to Order
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/checkout")}
                  className="btn-primary w-full mt-6 flex items-center justify-center gap-2 py-3"
                >
                  Checkout <ArrowRight size={18} />
                </button>
              )}

              <Link
                to="/restaurants"
                className="block text-center text-sm text-stone-500 dark:text-stone-400 hover:text-primary-500 mt-4"
              >
                + Add more items
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
