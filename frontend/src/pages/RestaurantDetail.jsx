import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Star, Clock, Bike, MapPin, Phone, Search, Plus, Minus, X } from "lucide-react";
import Spinner from "../components/Spinner";
import SafeImage from "../components/SafeImage";
import { restaurantAPI, menuAPI } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import ConfirmDialog from "../components/ConfirmDialog";
import clsx from "clsx";

export default function RestaurantDetail() {
  const { id } = useParams();
  const { addToCart, cartItems, updateQuantity, removeFromCart, pendingSwitch, confirmSwitch, cancelSwitch } = useCart();
  const { user } = useAuth();

  const [restaurant,     setRestaurant]     = useState(null);
  const [menu,           setMenu]           = useState({});
  const [allCategories,  setAllCategories]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search,         setSearch]         = useState("");
  const debounceRef = useRef(null);

  const groupByCategory = (items) =>
    items.reduce((acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

  useEffect(() => {
    const load = async () => {
      try {
        const [restRes, menuRes] = await Promise.all([
          restaurantAPI.getOne(id),
          menuAPI.getItems(id, { isAvailable: "true" }),
        ]);
        setRestaurant(restRes.data.restaurant);
        const grouped = groupByCategory(menuRes.data.items || []);
        setMenu(grouped);
        const cats = Object.keys(grouped);
        setAllCategories(cats);
        if (cats.length) setActiveCategory(cats[0]);
      } catch {
        toast.error("Failed to load restaurant");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (loading) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const params = { isAvailable: "true" };
        if (search.trim()) params.search = search.trim();
        const { data } = await menuAPI.getItems(id, params);
        const grouped = groupByCategory(data.items || []);
        setMenu(grouped);
        const resultCats = Object.keys(grouped);
        if (resultCats.length && !grouped[activeCategory]) setActiveCategory(resultCats[0]);
      } catch {
        // keep last results
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search, id]);

  const clearSearch = () => setSearch("");

  const categories = search.trim()
    ? Object.keys(menu)
    : allCategories.filter((c) => menu[c]?.length > 0);

  const getCartQuantity = (itemId) => {
    const ci = cartItems.find((c) => c._id === itemId);
    return ci ? ci.quantity : 0;
  };

  const handleAddToCart = (item) => {
    if (!user) { toast.error("Please login to add items to cart"); return; }
    if (user.role === "restaurant_owner" && restaurant?.owner?._id?.toString() === user.id) {
      toast.error("You can't order from your own restaurant");
      return;
    }
    const added = addToCart(item, restaurant);
    // If addToCart returns false it means user is switching restaurants
    // — the ConfirmDialog will appear automatically via pendingSwitch state
  };

  const handleIncrement = (item) => {
    const ci = cartItems.find((c) => c._id === item._id);
    if (ci) updateQuantity(ci.cartKey, ci.quantity + 1);
    else handleAddToCart(item);
  };

  const handleDecrement = (item) => {
    const ci = cartItems.find((c) => c._id === item._id);
    if (ci) {
      if (ci.quantity === 1) removeFromCart(ci.cartKey);
      else updateQuantity(ci.cartKey, ci.quantity - 1);
    }
  };

  if (loading) return <Spinner center />;
  if (!restaurant) return (
    <div className="pt-24 text-center text-gray-400 dark:text-gray-500">Restaurant not found</div>
  );

  const isOwner = user?.role === "restaurant_owner" && restaurant?.owner?._id?.toString() === user?.id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">

      {/* Cover image */}
      <div className="h-64 bg-gradient-to-br from-orange-200 to-red-200 dark:from-gray-800 dark:to-gray-700 relative overflow-hidden">
        <SafeImage
          src={restaurant.coverImage}
          alt={restaurant.name}
          className="w-full h-full"
          imgClass="object-cover"
          fallback={<div className="w-full h-full flex items-center justify-center text-8xl">🍽️</div>}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1 drop-shadow">{restaurant.name}</h1>
              <p className="text-white/80 text-sm">{restaurant.cuisine?.join(" • ")}</p>
            </div>
            <span className={clsx(
              "shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold shadow",
              restaurant.isOpen ? "bg-green-500 text-white" : "bg-gray-700/90 text-white"
            )}>
              {restaurant.isOpen ? "🟢 Open" : "🔴 Closed"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Info bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 -mt-4 relative z-10 p-5 mb-8">

          {/* Owner banner */}
          {isOwner && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
              🏪 This is your restaurant — you can't place orders here.
            </div>
          )}

          <div className="flex flex-wrap gap-5">
            <div className="flex items-center gap-1.5 text-amber-500">
              <Star size={18} fill="currentColor" />
              <span className="font-bold text-gray-800 dark:text-gray-100">
                {restaurant.rating?.toFixed(1) || "New"}
              </span>
              <span className="text-gray-400 dark:text-gray-500 text-sm">
                ({restaurant.totalRatings || 0} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <Clock size={16} />
              <span className="text-sm">{restaurant.estimatedDeliveryTime || "30-45 min"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <Bike size={16} />
              <span className="text-sm">
                {restaurant.deliveryFee === 0
                  ? <span className="text-green-600 dark:text-green-400 font-medium">Free delivery</span>
                  : `$${restaurant.deliveryFee?.toFixed(2)} delivery`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <MapPin size={16} />
              <span className="text-sm">{restaurant.address?.city || "Location"}</span>
            </div>
            {restaurant.phone && (
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <Phone size={16} />
                <span className="text-sm">{restaurant.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-8">

          {/* Desktop sidebar */}
          <div className="hidden lg:block w-48 shrink-0">
            <div className="sticky top-24 space-y-1">

              {/* Sidebar search */}
              <div className="relative mb-4">
                {searchLoading
                  ? <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                  : <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                }
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search menu..."
                  className="input-field pl-9 pr-8 py-2 text-sm"
                />
                {search && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Sidebar category nav */}
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={clsx(
                    "w-full text-left px-3 py-2 rounded-xl text-sm transition-all",
                    activeCategory === cat
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Main menu content */}
          <div className="flex-1 pb-16 min-w-0">

            {/* Mobile search */}
            <div className="lg:hidden mb-5 relative">
              {searchLoading
                ? <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                : <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              }
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items..."
                className="input-field pl-9 pr-9"
              />
              {search && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Mobile category chips */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: "smooth" })}
                  className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm whitespace-nowrap text-gray-700 dark:text-gray-200 hover:border-primary-500 hover:text-primary-500 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-all"
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Empty search state */}
            {categories.length === 0 && !searchLoading && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                  {search ? `No items found for "${search}"` : "No menu items available"}
                </p>
                {search && (
                  <button onClick={clearSearch} className="mt-3 text-sm text-primary-500 dark:text-primary-400 hover:underline">
                    Clear search
                  </button>
                )}
              </div>
            )}

            {/* Category sections */}
            {categories.map((category) => (
              <section key={category} id={`cat-${category}`} className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
                  {category}
                  <span className="text-sm font-normal text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {menu[category]?.length}
                  </span>
                </h2>

                <div className="space-y-3">
                  {menu[category]?.map((item) => {
                    const qty = getCartQuantity(item._id);
                    const discountedPrice = item.discount > 0
                      ? item.price * (1 - item.discount / 100)
                      : null;

                    return (
                      <div key={item._id} className="card p-4 flex gap-4 group hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow">

                        {/* Item image */}
                        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                          <SafeImage
                            src={item.image}
                            alt={item.name}
                            className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-gray-700"
                            imgClass="object-cover"
                            fallback={<div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>}
                          />
                        </div>

                        {/* Item info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                                {item.isVegetarian && (
                                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">🥬 Veg</span>
                                )}
                                {item.isVegan && (
                                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">🌱 Vegan</span>
                                )}
                                {item.isSpicy && (
                                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded">🌶️ Spicy</span>
                                )}
                                {item.isGlutenFree && (
                                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded">🌾 GF</span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>
                              )}
                            </div>

                            {/* Price + cart controls */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="text-right">
                                {discountedPrice ? (
                                  <>
                                    <p className="font-bold text-primary-500">${discountedPrice.toFixed(2)}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 line-through">${item.price.toFixed(2)}</p>
                                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded font-semibold">
                                      -{item.discount}%
                                    </span>
                                  </>
                                ) : (
                                  <p className="font-bold text-gray-900 dark:text-white">${item.price.toFixed(2)}</p>
                                )}
                              </div>

                              {qty === 0 ? (
                                <button
                                  onClick={() => handleAddToCart(item)}
                                  className="flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                                >
                                  <Plus size={14} /> Add
                                </button>
                              ) : (
                                <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-1">
                                  <button
                                    onClick={() => handleDecrement(item)}
                                    className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 text-primary-500 border border-primary-200 dark:border-primary-800 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="font-bold text-primary-600 dark:text-primary-400 min-w-[1.5rem] text-center">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() => handleIncrement(item)}
                                    className="w-6 h-6 rounded-md bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Cross-restaurant cart switch confirmation */}
      <ConfirmDialog
        open={!!pendingSwitch}
        title="Switch restaurant?"
        message="Your cart has items from another restaurant. Adding this item will clear your current cart."
        confirmLabel="Clear & Add"
        variant="warning"
        onConfirm={confirmSwitch}
        onCancel={cancelSwitch}
      />
    </div>
  );
}