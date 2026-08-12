import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, Smartphone, Banknote, Utensils, Truck, Users, X, CheckCircle, AlertCircle } from "lucide-react";
import { useCart }    from "../context/CartContext";
import { useAuth }    from "../context/AuthContext";
import { orderAPI, tableAPI } from "../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

const PAYMENT_METHODS = [
  { value: "card",            label: "Credit / Debit Card",   icon: CreditCard },
  { value: "mobile_money",    label: "Mobile Money",          icon: Smartphone },
  { value: "cash_on_delivery",label: "Cash on Delivery",      icon: Banknote },
];

export default function Checkout() {
  const { items, restaurant, subtotal, clearCart } = useCart();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  // Order type
  const [orderType, setOrderType] = useState("delivery");

  // Dine-in
  const [tables,       setTables]       = useState([]);
  const [tablesLoad,   setTablesLoad]   = useState(false);
  const [selectedTable,setSelectedTable]= useState(null);

  // Delivery
  const [address, setAddress] = useState({
    street:  user?.addresses?.[0]?.street  || "",
    city:    user?.addresses?.[0]?.city    || "",
    state:   user?.addresses?.[0]?.state   || "",
    zipCode: user?.addresses?.[0]?.zipCode || "",
  });

  const [payment, setPayment] = useState("cash_on_delivery");
  const [notes,   setNotes]   = useState("");
  const [loading, setLoading] = useState(false);

  const deliveryFee = orderType === "delivery" ? (restaurant?.deliveryFee || 0) : 0;
  const tax         = parseFloat((subtotal * 0.1).toFixed(2));
  const total       = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

  // Fetch available tables when switching to dine-in
  useEffect(() => {
    if (orderType !== "dine_in" || !restaurant?._id) return;
    setTablesLoad(true);
    tableAPI.getAvailable(restaurant._id)
      .then(({ data }) => setTables(data.tables || []))
      .catch(() => toast.error("Failed to load tables"))
      .finally(() => setTablesLoad(false));
  }, [orderType, restaurant?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (orderType === "delivery") {
      if (!address.street.trim() || !address.city.trim()) {
        toast.error("Please enter your delivery address");
        return;
      }
    }

    if (orderType === "dine_in" && !selectedTable) {
      toast.error("Please select a table for dine-in");
      return;
    }

    if (!items.length) { toast.error("Your cart is empty"); return; }

    setLoading(true);
    try {
      const payload = {
        restaurantId:    restaurant._id,
        items:           items.map(i => ({
          menuItem:       i._id,
          name:           i.name,
          price:          i.price,
          quantity:       i.quantity,
          customizations: i.customizations || [],
        })),
        paymentMethod:   payment,
        notes,
        orderType,
        ...(orderType === "delivery" && { deliveryAddress: address }),
        ...(orderType === "dine_in"  && { tableId: selectedTable._id }),
      };

      const { data } = await orderAPI.place(payload);
      clearCart();
      toast.success(orderType === "dine_in"
        ? `Order placed for Table ${selectedTable.number}! 🍽️`
        : "Order placed! Tracking your delivery 🚗");
      navigate(`/orders/${data.order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (items?.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-white mb-2">Your cart is empty</h2>
        <button onClick={() => navigate("/restaurants")} className="btn-primary mt-4">Browse Restaurants</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-stone-950 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-white mb-7">
          Checkout
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left column ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Order Type */}
              <div className="card p-5">
                <h2 className="font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                  <Utensils size={16} className="text-primary-500" /> How would you like your order?
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => { setOrderType("delivery"); setSelectedTable(null); }}
                    className={clsx("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      orderType === "delivery"
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20"
                        : "border-cream-300 dark:border-stone-700 hover:border-primary-300 dark:hover:border-primary-700")}>
                    <Truck size={22} className={orderType === "delivery" ? "text-primary-500" : "text-stone-400"} />
                    <div className="text-center">
                      <p className={clsx("font-bold text-sm", orderType === "delivery" ? "text-primary-700 dark:text-primary-300" : "text-stone-700 dark:text-stone-200")}>
                        Delivery
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">Delivered to your door</p>
                    </div>
                    {orderType === "delivery" && <CheckCircle size={16} className="text-primary-500" />}
                  </button>

                  <button type="button" onClick={() => setOrderType("dine_in")}
                    className={clsx("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      orderType === "dine_in"
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20"
                        : "border-cream-300 dark:border-stone-700 hover:border-primary-300 dark:hover:border-primary-700")}>
                    <Users size={22} className={orderType === "dine_in" ? "text-primary-500" : "text-stone-400"} />
                    <div className="text-center">
                      <p className={clsx("font-bold text-sm", orderType === "dine_in" ? "text-primary-700 dark:text-primary-300" : "text-stone-700 dark:text-stone-200")}>
                        Dine-in
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">Reserve a table & eat here</p>
                    </div>
                    {orderType === "dine_in" && <CheckCircle size={16} className="text-primary-500" />}
                  </button>
                </div>
              </div>

              {/* Delivery address */}
              {orderType === "delivery" && (
                <div className="card p-5">
                  <h2 className="font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-primary-500" /> Delivery Address
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Street Address</label>
                      <input value={address.street} onChange={e => setAddress(a => ({...a, street: e.target.value}))}
                        placeholder="123 Main Street" className="input-field" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">City</label>
                        <input value={address.city} onChange={e => setAddress(a => ({...a, city: e.target.value}))}
                          placeholder="Kigali" className="input-field" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">ZIP Code</label>
                        <input value={address.zipCode} onChange={e => setAddress(a => ({...a, zipCode: e.target.value}))}
                          placeholder="00000" className="input-field" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dine-in table selector */}
              {orderType === "dine_in" && (
                <div className="card p-5">
                  <h2 className="font-bold text-stone-900 dark:text-white mb-1 flex items-center gap-2">
                    <Users size={16} className="text-primary-500" /> Select a Table
                  </h2>
                  <p className="text-xs text-stone-400 mb-4">Choose from available tables at {restaurant?.name}</p>

                  {tablesLoad ? (
                    <div className="flex items-center justify-center py-8 gap-3 text-stone-400">
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      Loading tables…
                    </div>
                  ) : tables.length === 0 ? (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                      <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm">No tables available</p>
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                          All tables are currently occupied. Please try delivery or come back later.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {tables.map(t => (
                        <button key={t._id} type="button" onClick={() => setSelectedTable(t)}
                          className={clsx("flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                            selectedTable?._id === t._id
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20"
                              : "border-cream-300 dark:border-stone-700 hover:border-primary-400")}>
                          <p className={clsx("font-black text-lg leading-none",
                            selectedTable?._id === t._id ? "text-primary-600 dark:text-primary-400" : "text-stone-700 dark:text-stone-300")}>
                            T-{String(t.number).padStart(2, "0")}
                          </p>
                          <p className="text-[10px] text-stone-400 flex items-center gap-1">
                            <Users size={9} /> {t.capacity} seats
                          </p>
                          {t.location && <p className="text-[9px] text-stone-300 dark:text-stone-600">{t.location}</p>}
                          {selectedTable?._id === t._id && (
                            <CheckCircle size={14} className="text-primary-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedTable && (
                    <div className="mt-3 flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800/40 rounded-xl">
                      <CheckCircle size={16} className="text-primary-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                          Table {selectedTable.number} selected
                        </p>
                        <p className="text-xs text-primary-500">{selectedTable.capacity} seats · {selectedTable.location}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedTable(null)}
                        className="p-1 rounded text-primary-400 hover:text-primary-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Payment */}
              <div className="card p-5">
                <h2 className="font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-primary-500" /> Payment Method
                </h2>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                    <label key={value}
                      className={clsx("flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
                        payment === value
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20"
                          : "border-cream-300 dark:border-stone-700 hover:border-cream-400")}>
                      <input type="radio" value={value} checked={payment === value}
                        onChange={() => setPayment(value)} className="accent-primary-500" />
                      <Icon size={17} className={payment === value ? "text-primary-500" : "text-stone-400"} />
                      <span className={clsx("text-sm font-medium",
                        payment === value ? "text-primary-700 dark:text-primary-300" : "text-stone-700 dark:text-stone-200")}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="card p-5">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Special Instructions (optional)
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Allergies, dietary needs, or any special requests…"
                  rows={3} className="input-field resize-none" />
              </div>
            </div>

            {/* ── Right column — Order Summary ── */}
            <div className="lg:col-span-1">
              <div className="card p-5 sticky top-6">
                <h2 className="font-bold text-stone-900 dark:text-white mb-4">Order Summary</h2>

                {/* Restaurant */}
                <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-cream-300 dark:border-stone-700">
                  <div className="w-8 h-8 bg-cream-200 dark:bg-stone-800 rounded-lg overflow-hidden shrink-0">
                    {restaurant?.logo
                      ? <img src={restaurant.logo} alt="" className="w-full h-full object-cover" />
                      : <Utensils size={14} className="text-stone-400 m-auto" />}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-white text-sm">{restaurant?.name}</p>
                    <p className="text-xs text-stone-400 capitalize">{orderType === "dine_in" ? "Dine-in" : "Delivery"}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-stone-600 dark:text-stone-300">{item.quantity}× {item.name}</span>
                      <span className="text-stone-700 dark:text-stone-200 font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t border-cream-300 dark:border-stone-700 text-sm">
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {orderType === "delivery" && (
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Delivery fee</span>
                      <span>{deliveryFee === 0 ? <span className="text-green-600 font-medium">Free</span> : `$${deliveryFee.toFixed(2)}`}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 dark:text-white text-base pt-2 border-t border-cream-300 dark:border-stone-700">
                    <span>Total</span>
                    <span className="text-primary-600 dark:text-primary-400">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Dine-in table reminder */}
                {orderType === "dine_in" && selectedTable && (
                  <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-950/20 rounded-xl border border-primary-100 dark:border-primary-800/40">
                    <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 flex items-center gap-1.5">
                      <Users size={13} /> Table {selectedTable.number} · {selectedTable.location}
                    </p>
                  </div>
                )}

                <button type="submit" disabled={loading || (orderType === "dine_in" && !selectedTable && tables.length > 0)}
                  className="btn-primary w-full mt-5 py-3 text-sm disabled:opacity-60">
                  {loading
                    ? <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Placing order…
                      </div>
                    : `Place Order · $${total.toFixed(2)}`
                  }
                </button>

                <p className="text-[10px] text-stone-400 text-center mt-3">
                  By ordering you agree to our{" "}
                  <a href="/terms" className="underline hover:text-primary-500">Terms of Service</a>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}