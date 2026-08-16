import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star, MapPin, Phone, CheckCheck, Users, Bell,
  Receipt, ArrowLeft, Utensils, Clock, Truck,
  ChefHat, CheckCircle, Package,
} from "lucide-react";
import { orderAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../utils/socket";
import OrderStatusBadge from "../components/OrderStatusBadge";
import { CardSkeleton, Skeleton } from "../components/Skeleton";
import SafeAvatar from "../components/SafeImage";
import toast from "react-hot-toast";
import clsx from "clsx";

// ── Delivery steps ─────────────────────────────────────────────────────────
const DELIVERY_STEPS = [
  { status: "pending",          label: "Order Placed",   icon: Package,      desc: "We received your order" },
  { status: "confirmed",        label: "Confirmed",      icon: CheckCircle,  desc: "Restaurant confirmed your order" },
  { status: "preparing",        label: "Preparing",      icon: ChefHat,      desc: "Your food is being prepared" },
  { status: "ready_for_pickup", label: "Ready",          icon: Package,      desc: "Waiting for driver pick-up" },
  { status: "out_for_delivery", label: "On the Way",     icon: Truck,        desc: "Your driver is heading to you" },
  { status: "delivered",        label: "Delivered",      icon: CheckCircle,  desc: "Enjoy your meal!" },
];

// ── Dine-in steps ──────────────────────────────────────────────────────────
const DINE_IN_STEPS = [
  { status: "pending",          label: "Order Placed",   icon: Package,     desc: "Your order has been sent to the kitchen" },
  { status: "confirmed",        label: "Confirmed",      icon: CheckCircle, desc: "Kitchen confirmed your order" },
  { status: "preparing",        label: "Preparing",      icon: ChefHat,     desc: "Your food is being prepared" },
  { status: "ready_for_pickup", label: "Ready to Serve", icon: Utensils,    desc: "Your food is ready — waiter on the way" },
  { status: "delivered",        label: "Served",         icon: CheckCircle, desc: "Enjoy your meal!" },
];

const DELIVERY_ORDER = ["pending","confirmed","preparing","ready_for_pickup","out_for_delivery","delivered"];
const DINE_IN_ORDER  = ["pending","confirmed","preparing","ready_for_pickup","delivered"];

export default function OrderTracking() {
  const { id }    = useParams();
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [order,      setOrder]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [rating,     setRating]     = useState(0);
  const [review,     setReview]     = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [confirming, setConfirming] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchOrder();
    const reg = () => {
      const socket = getSocket();
      if (!socket) return false;
      const handler = (data) => {
        if (data.orderId !== id) return;
        toast.success(data.message, { icon: "🍽️" });
        fetchOrder();
      };
      socket.on("order_status_updated", handler);
      socketRef.current = () => socket.off("order_status_updated", handler);
      return true;
    };
    if (!reg()) {
      const iv = setInterval(() => { if (reg()) clearInterval(iv); }, 500);
      return () => { clearInterval(iv); socketRef.current?.(); };
    }
    return () => socketRef.current?.();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data } = await orderAPI.getOne(id);
      setOrder(data.order);
    } catch { toast.error("Failed to load order"); }
    finally { setLoading(false); }
  };

  const handleConfirmDelivery = async () => {
    setConfirming(true);
    try {
      await orderAPI.confirmDelivery(id);
      toast.success("Delivery confirmed! 🎉");
      fetchOrder();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to confirm"); }
    finally { setConfirming(false); }
  };

  const handleRate = async () => {
    if (!rating) { toast.error("Please select a rating"); return; }
    try {
      await orderAPI.rate(id, { rating, review });
      setSubmitted(true);
      toast.success("Thanks for your review!");
      fetchOrder();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to submit review"); }
  };

  if (loading) return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <Skeleton className="h-6 w-40" />
      <CardSkeleton lines={4} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-3 sm:p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
      <CardSkeleton lines={5} />
    </div>
  );
  if (!order)  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Package size={40} className="text-stone-300 mb-3" />
      <p className="text-stone-500">Order not found</p>
      <button onClick={() => navigate("/orders")} className="btn-primary mt-4">My Orders</button>
    </div>
  );

  const isDineIn = order.orderType === "dine_in";
  const steps    = isDineIn ? DINE_IN_STEPS    : DELIVERY_STEPS;
  const statusOrder = isDineIn ? DINE_IN_ORDER : DELIVERY_ORDER;
  const currentIdx  = statusOrder.indexOf(order.status);
  const isFinished  = order.status === "delivered" || order.status === "cancelled";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate("/orders")}
        className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
        <ArrowLeft size={15} /> Back to Orders
      </button>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-bold text-stone-900 dark:text-white text-lg">
                #{order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.status} />
              {/* Order type badge */}
              <span className={clsx(
                "badge text-xs",
                isDineIn
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                  : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              )}>
                {isDineIn ? <><Users size={11} className="inline mr-1"/>Dine-in</> : <><Truck size={11} className="inline mr-1"/>Delivery</>}
              </span>
            </div>
            <p className="text-stone-400 text-sm">{order.restaurant?.name}</p>
            {isDineIn && order.tableNumber && (
              <p className="text-primary-500 font-semibold text-sm mt-1 flex items-center gap-1.5">
                <Users size={14} /> Table {order.tableNumber}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-bold text-stone-900 dark:text-white text-xl">
              ${order.total?.toFixed(2)}
            </p>
            <p className="text-xs text-stone-400 capitalize mt-0.5">
              {order.paymentMethod?.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      </div>

      {/* ── DINE-IN UI ── */}
      {isDineIn ? (
        <>
          {/* Status stepper */}
          <div className="card p-5">
            <h2 className="font-semibold text-stone-900 dark:text-white mb-5 flex items-center gap-2">
              <Clock size={16} className="text-primary-500" /> Kitchen Status
            </h2>
            <div className="space-y-4">
              {steps.map((step, idx) => {
                const done    = idx < currentIdx || isFinished;
                const active  = idx === currentIdx && !isFinished;
                const pending = idx > currentIdx && !isFinished;
                const Icon    = step.icon;
                return (
                  <div key={step.status} className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={clsx(
                        "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                        done   ? "bg-green-500 text-white"
                               : active ? "bg-primary-500 text-white ring-4 ring-primary-200 dark:ring-primary-900/40"
                                        : "bg-cream-200 dark:bg-stone-800 text-stone-400"
                      )}>
                        {done ? <CheckCircle size={18} /> : <Icon size={16} />}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={clsx("w-0.5 h-6 rounded-full transition-all",
                          done ? "bg-green-400" : "bg-cream-300 dark:bg-stone-700")} />
                      )}
                    </div>
                    <div className={clsx("pb-2 flex-1", pending && "opacity-40")}>
                      <p className={clsx("font-semibold text-sm",
                        active ? "text-primary-600 dark:text-primary-400" : done ? "text-stone-900 dark:text-white" : "text-stone-400")}>
                        {step.label}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">{step.desc}</p>
                      {active && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions — only while order is active */}
          {!isFinished && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toast.success("Waiter has been notified! 🔔")}
                className="card p-4 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center">
                  <Bell size={20} className="text-amber-500" />
                </div>
                <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">Call Waiter</span>
                <span className="text-xs text-stone-400">Tap to get attention</span>
              </button>
              <button
                onClick={() => toast.success("Bill request sent! 🧾")}
                className="card p-4 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-950/30 rounded-xl flex items-center justify-center">
                  <Receipt size={20} className="text-green-500" />
                </div>
                <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">Request Bill</span>
                <span className="text-xs text-stone-400">When you're ready to pay</span>
              </button>
            </div>
          )}
        </>
      ) : (
        /* ── DELIVERY UI ── */
        <>
          {/* Progress stepper */}
          <div className="card p-5">
            <h2 className="font-semibold text-stone-900 dark:text-white mb-5 flex items-center gap-2">
              <Truck size={16} className="text-primary-500" /> Delivery Progress
            </h2>
            <div className="space-y-4">
              {steps.map((step, idx) => {
                const done    = idx < currentIdx || (isFinished && order.status !== "cancelled");
                const active  = statusOrder[currentIdx] === step.status && !isFinished;
                const pending = idx > currentIdx && !isFinished;
                const Icon    = step.icon;
                return (
                  <div key={step.status} className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={clsx(
                        "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                        done   ? "bg-green-500 text-white"
                               : active ? "bg-primary-500 text-white ring-4 ring-primary-200 dark:ring-primary-900/40"
                                        : "bg-cream-200 dark:bg-stone-800 text-stone-400"
                      )}>
                        {done ? <CheckCircle size={18} /> : <Icon size={16} />}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={clsx("w-0.5 h-6 rounded-full transition-all",
                          done ? "bg-green-400" : "bg-cream-300 dark:bg-stone-700")} />
                      )}
                    </div>
                    <div className={clsx("pb-2 flex-1", pending && "opacity-40")}>
                      <p className={clsx("font-semibold text-sm",
                        active ? "text-primary-600 dark:text-primary-400" : done ? "text-stone-900 dark:text-white" : "text-stone-400")}>
                        {step.label}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">{step.desc}</p>
                      {active && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Driver info */}
          {order.driver && (
            <div className="card p-5">
              <h2 className="font-semibold text-stone-900 dark:text-white mb-3 flex items-center gap-2">
                <Truck size={16} className="text-primary-500" /> Your Driver
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full overflow-hidden">
                     <SafeAvatar src={order.driver?.avatar} name={order.driver?.name} size="w-10 h-10" textSize="text-base" />
                   </div>
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-white text-sm">{order.driver.name}</p>
                    <p className="text-xs text-stone-400">Delivery Driver</p>
                  </div>
                </div>
                {order.driver.phone && (
                  <a href={`tel:${order.driver.phone}`}
                    className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 font-semibold transition-colors">
                    <Phone size={15} /> Call
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Delivery address */}
          {order.deliveryAddress && (
            <div className="card p-5">
              <h2 className="font-semibold text-stone-900 dark:text-white mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-primary-500" /> Delivery Address
              </h2>
              <p className="text-stone-600 dark:text-stone-300 text-sm">
                {[order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.state].filter(Boolean).join(", ")}
              </p>
            </div>
          )}

          {/* Confirm delivery button */}
          {order.status === "out_for_delivery" && (
            <button onClick={handleConfirmDelivery} disabled={confirming}
              className="btn-primary w-full py-3 gap-2 disabled:opacity-60">
              {confirming
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><CheckCheck size={17} /> Confirm I Received My Order</>}
            </button>
          )}
        </>
      )}

      {/* ── Order items (both types) ── */}
      <div className="card p-5">
        <h2 className="font-semibold text-stone-900 dark:text-white mb-4">
          {isDineIn ? "Your Order" : "Items"}
        </h2>
        <div className="space-y-3">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-cream-200 dark:bg-stone-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  : <Utensils size={14} className="text-stone-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{item.name}</p>
                <p className="text-xs text-stone-400">×{item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-cream-300 dark:border-stone-700 space-y-2 text-sm">
          <div className="flex justify-between text-stone-500 dark:text-stone-400">
            <span>Subtotal</span><span>${order.subtotal?.toFixed(2)}</span>
          </div>
          {!isDineIn && order.deliveryFee > 0 && (
            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>Delivery fee</span><span>${order.deliveryFee?.toFixed(2)}</span>
            </div>
          )}
          {order.tax > 0 && (
            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>Tax</span><span>${order.tax?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-stone-900 dark:text-white text-base pt-1 border-t border-cream-200 dark:border-stone-700">
            <span>Total</span>
            <span className="text-primary-600 dark:text-primary-400">${order.total?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Rating — only after delivered */}
      {order.status === "delivered" && !order.rating && !submitted && (
        <div className="card p-5">
          <h2 className="font-semibold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-400" />
            How was your {isDineIn ? "experience" : "order"}?
          </h2>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}
                className={clsx("text-3xl transition-transform hover:scale-110 active:scale-95",
                  n <= rating ? "text-amber-400" : "text-stone-200 dark:text-stone-700")}>
                ★
              </button>
            ))}
          </div>
          <textarea value={review} onChange={e => setReview(e.target.value)}
            placeholder={isDineIn ? "Tell us about your dining experience…" : "Tell us about your order…"}
            rows={3} className="input-field resize-none mb-3" />
          <button onClick={handleRate} className="btn-primary gap-2">
            <Star size={15} /> Submit Review
          </button>
        </div>
      )}

      {(order.rating || submitted) && (
        <div className="card p-5 text-center">
          <CheckCircle size={28} className="text-green-500 mx-auto mb-2" />
          <p className="font-semibold text-stone-900 dark:text-white">Review submitted — thank you!</p>
          <div className="flex justify-center gap-1 mt-2">
            {[...Array(order.rating || rating)].map((_, i) => (
              <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}