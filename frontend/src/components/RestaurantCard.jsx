import { Link } from "react-router-dom";
import { Star, Clock, Bike, MapPin } from "lucide-react";
import clsx from "clsx";
import SafeImage from "./SafeImage";

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

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

export default function RestaurantCard({ restaurant }) {
  const {
    _id,
    name,
    cuisine,
    logo,
    coverImage,
    rating,
    deliveryFee,
    estimatedDeliveryTime,
    isOpen,
    description,
    totalRatings,
  } = restaurant;
  const effectiveOpen = isEffectivelyOpen(restaurant);
  return (
    <Link
      to={`/restaurants/${_id}`}
      className="group block bg-white dark:bg-stone-900 rounded-xl border border-cream-300 dark:border-stone-800 overflow-hidden hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-950/50 hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Cover */}
      <div className="relative h-44 bg-cream-200 dark:bg-stone-800 overflow-hidden">
        <SafeImage
          src={coverImage}
          alt={name}
          className="w-full h-full"
          imgClass="object-cover group-hover:scale-105 transition-transform duration-500"
          fallback={
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🍽️
            </div>
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div
          className={clsx(
            "absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm",
            effectiveOpen
              ? "bg-green-500/90 text-white"
              : "bg-stone-900/80 text-stone-300",
          )}
        >
          {effectiveOpen ? "● Open" : "● Closed"}
        </div>
        <div className="absolute -bottom-4 left-3.5 w-10 h-10 rounded-lg bg-white dark:bg-stone-900 shadow-md border border-cream-300 dark:border-stone-700 overflow-hidden">
          <SafeImage
            src={logo}
            alt={name}
            className="w-full h-full"
            imgClass="object-cover"
            fallback={
              <div className="w-full h-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-sm font-bold text-primary-600">
                {name?.charAt(0)}
              </div>
            }
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-3.5 pt-6 pb-3.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-stone-900 dark:text-white truncate text-sm">
              {name}
            </h3>
            <p className="text-xs text-stone-400 truncate mt-0.5">
              {Array.isArray(cuisine) ? cuisine.join(" · ") : cuisine}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded-md shrink-0">
            <Star size={10} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {rating ? rating.toFixed(1) : "New"}
            </span>
            {totalRatings > 0 && (
              <span className="text-[10px] text-stone-400">
                ({totalRatings})
              </span>
            )}
          </div>
        </div>
        {description && (
          <p className="text-xs text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-cream-200 dark:border-stone-800 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {estimatedDeliveryTime || "30–45 min"}
          </span>
          <span
            className={clsx(
              "flex items-center gap-1",
              deliveryFee === 0 &&
                "text-green-600 dark:text-green-500 font-medium",
            )}
          >
            <Bike size={11} />
            {deliveryFee === 0
              ? "Free delivery"
              : `$${deliveryFee?.toFixed(2)}`}
          </span>
          <span className="ml-auto text-primary-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity text-[11px]">
            View menu →
          </span>
        </div>
      </div>
    </Link>
  );
}
