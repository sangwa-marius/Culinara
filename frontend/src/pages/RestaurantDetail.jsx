import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Clock, Bike, MapPin, Phone, Search, Plus, Minus, X, Layers, ArrowRight, ShoppingCart, ArrowLeft } from "lucide-react";
import { Skeleton, MenuCardSkeleton, CardSkeleton } from "../components/Skeleton";
import SafeImage from "../components/SafeImage";
import Logo from "../components/Logo";
import { restaurantAPI, menuAPI, collectionAPI } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import ConfirmDialog from "../components/ConfirmDialog";
import clsx from "clsx";

const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function isEffectivelyOpen(restaurant) {
  if (!restaurant) return false;
  if (restaurant.isOpen === false) return false;
  const hours = restaurant.openingHours || {};
  const today = DAYS[new Date().getDay()];
  const todayHours = hours[today];
  if (!todayHours || todayHours.isClosed) return false;
  const [openH, openM] = (todayHours.open || "00:00").split(":").map(Number);
  const [closeH, closeM] = (todayHours.close || "23:59").split(":").map(Number);
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const open = openH * 60 + openM;
  const close = closeH * 60 + closeM;
  return current >= open && current < close;
}

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
  const [collections,    setCollections]    = useState([]);
  const [colLoading,     setColLoading]     = useState(false);
  const [view,           setView]           = useState("menu"); // menu | collections
  const [selectedCollection, setSelectedCollection] = useState(null);
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
        const [restRes, menuRes, colRes] = await Promise.all([
          restaurantAPI.getOne(id),
          menuAPI.getItems(id, { isAvailable: "true" }),
          collectionAPI.getPublic(id).catch(() => ({ data: { collections: [] } })),
        ]);
        setRestaurant(restRes.data.restaurant);
        const grouped = groupByCategory(menuRes.data.items || []);
        setMenu(grouped);
        const cats = Object.keys(grouped);
        setAllCategories(cats);
        if (cats.length) setActiveCategory(cats[0]);
        setCollections(colRes.data.collections || []);
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
    if (!restaurant?.isOpen) {
      toast.error("This restaurant is currently closed");
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

  const handleAddAllToCart = () => {
    if (!selectedCollection?.items?.length) return;
    if (!user) { toast.error("Please login to add items to cart"); return; }
    if (user.role === "restaurant_owner" && restaurant?.owner?._id?.toString() === user.id) {
      toast.error("You can't order from your own restaurant");
      return;
    }
    if (!restaurant?.isOpen) {
      toast.error("This restaurant is currently closed");
      return;
    }
    selectedCollection.items.forEach(item => {
      if (item.isAvailable !== false) addToCart(item, restaurant);
    });
    toast.success(`Added ${selectedCollection.items.length} items from ${selectedCollection.name}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-cream-50 dark:bg-stone-900 pt-24 px-4 pb-16">
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-56 sm:h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <MenuCardSkeleton key={i} />)}
            </div>
          </div>
          <div className="card p-5 space-y-4">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
  if (!restaurant) return (
    <div className="pt-24 text-center text-stone-400 dark:text-stone-500">Restaurant not found</div>
  );

  const isOwner = user?.role === "restaurant_owner" && restaurant?.owner?._id?.toString() === user.id;

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-stone-900">

      {/* Cover image with back button overlay */}
      <div className="h-64 bg-gradient-to-br from-orange-200 to-red-200 dark:bg-stone-700 relative overflow-hidden">
        {/* Back button */}
        <Link to="/restaurants" className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg transition-all">
          <ArrowLeft size={14} className="sm:hidden" /><ArrowLeft size={16} className="hidden sm:block" /> <span className="hidden sm:inline">Back to restaurants</span>
        </Link>

        <SafeImage
          src={restaurant.coverImage}
          alt={restaurant.name}
          className="w-full h-full"
          imgClass="object-cover"
          fallback={<div className="w-full h-full flex items-center justify-center"><Logo className="w-24 h-24" iconOnly /></div>}
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
              isEffectivelyOpen(restaurant) ? "bg-green-500 text-white" : "bg-stone-700/90 text-white"
            )}>
              {isEffectivelyOpen(restaurant) ? "🟢 Open" : "🔴 Closed"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Info bar */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-cream-100 dark:border-stone-700 -mt-4 relative z-10 p-5 mb-8">

          {/* Owner banner */}
          {isOwner && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
              🏪 This is your restaurant — you can't place orders here.
            </div>
          )}

          <div className="flex flex-wrap gap-5">
            <div className="flex items-center gap-1.5 text-amber-500">
              <Star size={18} fill="currentColor" />
              <span className="font-bold text-stone-800 dark:text-stone-100">
                {restaurant.rating?.toFixed(1) || "New"}
              </span>
              <span className="text-stone-400 dark:text-stone-500 text-sm">
                ({restaurant.totalRatings || 0} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
              <Clock size={16} />
              <span className="text-sm">{restaurant.estimatedDeliveryTime || "30-45 min"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
              <Bike size={16} />
              <span className="text-sm">
                {restaurant.deliveryFee === 0
                  ? <span className="text-green-600 dark:text-green-400 font-medium">Free delivery</span>
                  : `$${restaurant.deliveryFee?.toFixed(2)} delivery`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
              <MapPin size={16} />
              <span className="text-sm">{restaurant.address?.city || "Location"}</span>
            </div>
            {restaurant.phone && (
              <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
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
                  : <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
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
                      : "text-stone-600 dark:text-stone-400 hover:bg-cream-100 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Main menu content */}
          <div className="flex-1 pb-16 min-w-0">

            {/* Menu / Collections tabs */}
            <div className="flex gap-1 bg-cream-200 dark:bg-stone-800 rounded-xl p-1 mb-6 w-fit">
              <button onClick={() => { setView("menu"); setSelectedCollection(null); }}
                className={clsx("px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all",
                  view === "menu" ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm" : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200")}>
                Menu
              </button>
              <button onClick={() => { setView("collections"); setSelectedCollection(null); }}
                className={clsx("px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
                  view === "collections" ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm" : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200")}>
                <Layers size={14} /> Collections
                {collections.length > 0 && (
                  <span className={clsx("text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold", view === "collections" ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" : "bg-cream-300 dark:bg-stone-700 text-stone-500")}>
                    {collections.length > 9 ? "9+" : collections.length}
                  </span>
                )}
              </button>
            </div>

            {view === "collections" && (
              <>
                {/* Back button when viewing collection items */}
                {selectedCollection && (
                  <button onClick={() => setSelectedCollection(null)} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 mb-4 transition-colors">
                    <X size={16} /> Back to collections
                  </button>
                )}

                {selectedCollection ? (
                  /* Collection items */
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-cream-200 dark:bg-stone-800 shrink-0">
                        <SafeImage src={selectedCollection.coverImage} alt={selectedCollection.name} className="w-full h-full" imgClass="object-cover" fallback={<div className="w-full h-full flex items-center justify-center"><Logo className="w-8 h-8 opacity-50" iconOnly /></div>} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">{selectedCollection.name}</h2>
                        <p className="text-xs sm:text-sm text-stone-400 mt-0.5">{selectedCollection.description || "Curated selection"}</p>
                        <p className="text-[10px] sm:text-xs text-stone-400 mt-1">{selectedCollection.items?.length || 0} items</p>
                      </div>
                      <button onClick={handleAddAllToCart} className="btn-primary flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-2.5 shrink-0">
                        <ShoppingCart size={14} className="sm:hidden" /><ShoppingCart size={16} className="hidden sm:block" /> Add all
                      </button>
                    </div>
                    {selectedCollection.items?.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-stone-400 text-sm">No items in this collection yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {selectedCollection.items.map((item) => {
                          const qty = getCartQuantity(item._id);
                          const discountedPrice = item.discount > 0 ? item.price * (1 - item.discount / 100) : null;
                          return (
                            <div key={item._id} className="card p-3 sm:p-4 flex gap-3 sm:gap-4">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-cream-200 dark:bg-stone-800 overflow-hidden shrink-0">
                                <SafeImage src={item.image} alt={item.name} className="w-full h-full" imgClass="object-cover" fallback={<div className="w-full h-full flex items-center justify-center"><Logo className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" iconOnly /></div>} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-white truncate">{item.name}</h3>
                                <p className="text-[10px] sm:text-xs text-stone-400 line-clamp-2 mt-0.5">{item.description || "No description"}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <div>
                                    {discountedPrice ? (
                                      <>
                                        <span className="text-sm sm:text-base font-bold text-primary-500">${discountedPrice.toFixed(2)}</span>
                                        <span className="text-[10px] sm:text-xs text-stone-400 line-through ml-1.5">${item.price.toFixed(2)}</span>
                                      </>
                                    ) : (
                                      <span className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">${item.price.toFixed(2)}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    {qty === 0 ? (
                                      <button onClick={() => handleAddToCart(item)} className="btn-primary py-1.5 sm:py-2 px-3 sm:px-4 text-[10px] sm:text-xs">Add</button>
                                    ) : (
                                      <div className="flex items-center gap-1 sm:gap-1.5">
                                        <button onClick={() => handleDecrement(item)} className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-cream-200 dark:bg-stone-700 flex items-center justify-center hover:bg-cream-300 dark:hover:bg-stone-600 transition-colors">
                                          <Minus size={12} className="sm:hidden" /><Minus size={13} className="hidden sm:block" />
                                        </button>
                                        <span className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-100 min-w-[1.25rem] text-center">{qty}</span>
                                        <button onClick={() => handleIncrement(item)} className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600">
                                          <Plus size={12} className="sm:hidden" /><Plus size={13} className="hidden sm:block" />
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
                    )}
                  </div>
                ) : (
                  /* Collections grid */
                  <div>
                    {collections.length === 0 ? (
                      <div className="text-center py-12 sm:py-16">
                        <Layers size={40} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                        <p className="text-stone-500 text-sm">No collections available yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {collections.map((col) => (
                          <div key={col._id} className="card overflow-hidden group cursor-pointer" onClick={() => setSelectedCollection(col)}>
                            <div className="h-40 sm:h-48 bg-cream-200 dark:bg-stone-800 overflow-hidden relative">
                              <SafeImage src={col.coverImage} alt={col.name} className="w-full h-full group-hover:scale-105 transition-transform duration-500" imgClass="object-cover" fallback={<div className="w-full h-full flex items-center justify-center"><Logo className="w-12 h-12 opacity-50" iconOnly /></div>} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                                <h3 className="font-bold text-white text-base sm:text-lg">{col.name}</h3>
                                <p className="text-[10px] sm:text-xs text-white/80 mt-0.5 line-clamp-1">{col.description || "Curated selection"}</p>
                              </div>
                            </div>
                            <div className="p-3 sm:p-4 flex items-center justify-between">
                              <span className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">{col.items?.length || 0} items</span>
                              <span className="text-[10px] sm:text-xs font-semibold text-primary-500 flex items-center gap-1">
                                View <ArrowRight size={11} className="sm:hidden" /><ArrowRight size={13} className="hidden sm:block" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Mobile search */}
            <div className="lg:hidden mb-5 relative">
              {searchLoading
                ? <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                : <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
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
                  className="px-4 py-2 rounded-full bg-white dark:bg-stone-800 border border-cream-200 dark:border-stone-600 text-sm whitespace-nowrap text-stone-700 dark:text-stone-200 hover:border-primary-500 hover:text-primary-500 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-all"
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Empty search state */}
            {categories.length === 0 && !searchLoading && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4"><Search size={40} className="mx-auto text-stone-300 dark:text-stone-600" /></div>
                <p className="text-lg font-medium text-stone-500 dark:text-stone-400">
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
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-5 flex items-center gap-3">
                  {category}
                  <span className="text-sm font-normal text-stone-400 dark:text-stone-500 bg-cream-100 dark:bg-stone-700 px-2 py-0.5 rounded-full">
                    {menu[category]?.length}
                  </span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {menu[category]?.map((item) => {
                    const qty = getCartQuantity(item._id);
                    const discountedPrice = item.discount > 0
                      ? item.price * (1 - item.discount / 100)
                      : null;

                    return (
                      <div key={item._id} className="card overflow-hidden group hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow flex flex-col">
                        {/* Item image */}
                        <div className="w-full h-40 sm:h-44 bg-cream-200 dark:bg-stone-800 overflow-hidden shrink-0">
                          <SafeImage
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full"
                            imgClass="object-cover"
                            fallback={<div className="w-full h-full flex items-center justify-center"><Logo className="w-8 h-8 sm:w-10 sm:h-10 opacity-50" iconOnly /></div>}
                          />
                        </div>

                        {/* Item info */}
                        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <h3 className="font-semibold text-stone-900 dark:text-white text-sm sm:text-base truncate">{item.name}</h3>
                            </div>
                            {item.description && (
                              <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-2">{item.description}</p>
                            )}
                            <div className="flex items-center gap-1.5 flex-wrap mb-2">
                              {item.isVegetarian && (
                                <span className="text-[10px] sm:text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">🥬 Veg</span>
                              )}
                              {item.isVegan && (
                                <span className="text-[10px] sm:text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">🌱 Vegan</span>
                              )}
                              {item.isSpicy && (
                                <span className="text-[10px] sm:text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded">🌶️ Spicy</span>
                              )}
                              {item.isGlutenFree && (
                                <span className="text-[10px] sm:text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded">🌾 GF</span>
                              )}
                            </div>
                          </div>

                          {/* Price + cart controls */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-cream-200 dark:border-stone-700">
                            <div>
                              {discountedPrice ? (
                                <>
                                  <p className="text-sm sm:text-base font-bold text-primary-500">${discountedPrice.toFixed(2)}</p>
                                  <p className="text-[10px] sm:text-xs text-stone-400 line-through">${item.price.toFixed(2)}</p>
                                </>
                              ) : (
                                <p className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">${item.price.toFixed(2)}</p>
                              )}
                            </div>

                            {qty === 0 ? (
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                              >
                                <Plus size={12} className="sm:hidden" /><Plus size={14} className="hidden sm:block" /> Add
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 sm:gap-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-1">
                                <button
                                  onClick={() => handleDecrement(item)}
                                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-white dark:bg-stone-700 text-primary-500 border border-primary-200 dark:border-primary-800 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-stone-600 transition-colors"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="font-bold text-primary-600 dark:text-primary-400 min-w-[1.5rem] text-center text-xs sm:text-sm">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => handleIncrement(item)}
                                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            )}
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