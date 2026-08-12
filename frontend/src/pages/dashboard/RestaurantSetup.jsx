import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, MapPin, Phone, Mail, Clock, DollarSign, CreditCard,
  ChevronRight, Save, ArrowLeft, CheckCircle,
  Utensils, Timer, AlertCircle, Info,
} from "lucide-react";
import { restaurantAPI } from "../../services/api";
import ImageUploader from "../../components/ImageUploader";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import clsx from "clsx";

const CUISINE_OPTIONS = [
  "Pizza","Burgers","Sushi","Mexican","Chinese","Indian",
  "Italian","Thai","Mediterranean","American","Seafood",
  "Vegan","Healthy","Sandwiches","Desserts","Breakfast",
];

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

const DEFAULT_HOURS = DAYS.reduce((acc, day) => {
  acc[day] = { open: "09:00", close: "22:00", isClosed: day === "sunday" };
  return acc;
}, {});

function toForm(r) {
  return {
    name:                  r.name                  || "",
    description:           r.description           || "",
    cuisine:               r.cuisine               || [],
    logo:                  r.logo                  || "",
    coverImage:            r.coverImage            || "",
    phone:                 r.phone                 || "",
    email:                 r.email                 || "",
    address: {
      street:  r.address?.street  || "",
      city:    r.address?.city    || "",
      state:   r.address?.state   || "",
      zipCode: r.address?.zipCode || "",
    },
    deliveryFee:           String(r.deliveryFee           ?? "2.99"),
    minimumOrder:          String(r.minimumOrder          ?? "10"),
    estimatedDeliveryTime: r.estimatedDeliveryTime        || "30-45 min",
    openingHours:          r.openingHours                 || DEFAULT_HOURS,
    subscription:          r.subscription                 || "basic",
  };
}

const STEPS = [
  { number: 1, label: "Identity",   icon: Store       },
  { number: 2, label: "Operations", icon: Clock       },
  { number: 3, label: "Location",   icon: MapPin      },
  { number: 4, label: "Plan",       icon: CreditCard  },
];

export default function RestaurantSetup() {
  const navigate = useNavigate();
  const [step,       setStep]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [form,       setForm]       = useState(toForm({}));

  useEffect(() => {
    restaurantAPI.getMyRestaurant()
      .then(({ data }) => {
        if (data.restaurant) {
          setRestaurant(data.restaurant);
          setForm(toForm(data.restaurant));
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const isEdit = Boolean(restaurant);

  const updateField   = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const updateAddress = (f, v) => setForm(p => ({ ...p, address: { ...p.address, [f]: v } }));
  const updateHours   = (day, f, v) =>
    setForm(p => ({ ...p, openingHours: { ...p.openingHours, [day]: { ...p.openingHours[day], [f]: v } } }));
  const toggleCuisine = (c) =>
    setForm(p => ({
      ...p,
      cuisine: p.cuisine.includes(c) ? p.cuisine.filter(x => x !== c) : [...p.cuisine, c],
    }));

  const validateStep = (s) => {
    if (s === 1) {
      if (!form.name.trim())    { toast.error("Restaurant name is required");          return false; }
      if (!form.cuisine.length) { toast.error("Select at least one cuisine type");     return false; }
    }
    if (s === 2) {
      if (!form.deliveryFee && form.deliveryFee !== "0") { toast.error("Delivery fee is required"); return false; }
    }
    if (s === 3) {
      if (!form.address.city.trim()) { toast.error("City is required"); return false; }
    }
    if (s === 4) {
      if (!form.subscription) { toast.error("Please select a plan"); return false; }
    }
    return true;
  };

  const handleNext = () => { if (validateStep(step)) setStep(s => s + 1); };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        deliveryFee:  parseFloat(form.deliveryFee)  || 0,
        minimumOrder: parseFloat(form.minimumOrder) || 0,
      };
      if (isEdit) {
        await restaurantAPI.update(restaurant._id, payload);
        toast.success("Restaurant updated successfully");
      } else {
        await restaurantAPI.create(payload);
        toast.success("Restaurant submitted! Awaiting admin approval");
      }
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || (isEdit ? "Failed to update" : "Failed to create"));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-12">

      {/* Back */}
      {isEdit && (
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Store size={26} className="text-primary-500" />
        </div>
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-white">
          {isEdit ? "Edit Restaurant" : "Set Up Your Restaurant"}
        </h1>
        <p className="text-stone-400 text-sm mt-1">
          {isEdit ? "Update your restaurant information" : "Complete all steps to get started"}
        </p>
      </div>

      {/* Step progress */}
      <div className="flex items-center justify-center gap-0 mb-6 sm:mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const StepIcon = s.icon;
          const done    = step > s.number;
          const active  = step === s.number;
          return (
            <div key={s.number} className="flex items-center shrink-0">
              <div className="flex flex-col items-center">
                <div className={clsx(
                  "w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-all",
                  done   ? "bg-primary-500 border-primary-500 text-white"
                         : active ? "border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-950/30"
                                  : "border-cream-400 dark:border-stone-700 text-stone-400"
                )}>
                  {done ? <CheckCircle size={14} className="sm:hidden" /> : <StepIcon size={12} className="sm:hidden" />}
                  {done ? <CheckCircle size={17} className="hidden sm:block" /> : <StepIcon size={15} className="hidden sm:block" />}
                </div>
                <span className={clsx("text-[8px] sm:text-[10px] font-semibold mt-1 uppercase tracking-wide whitespace-nowrap",
                  active ? "text-primary-500" : done ? "text-stone-500" : "text-stone-300 dark:text-stone-600")}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={clsx("w-10 sm:w-16 lg:w-24 h-0.5 mx-1 sm:mx-2 mb-4 transition-all",
                  step > s.number ? "bg-primary-500" : "bg-cream-300 dark:bg-stone-800")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="card p-6 sm:p-8 space-y-5">

        {/* ── Step 1: Identity ── */}
        {step === 1 && (
          <>
            <SectionTitle icon={Store}>Restaurant Identity</SectionTitle>

            <Field label="Restaurant Name" required>
              <input value={form.name} onChange={e => updateField("name", e.target.value)}
                placeholder="e.g. The Golden Spatula" className="input-field" />
            </Field>

            <Field label="Description">
              <textarea value={form.description} onChange={e => updateField("description", e.target.value)}
                placeholder="Tell customers what makes your restaurant special…"
                rows={2} className="input-field resize-none" />
            </Field>

            <Field label="Cuisine Type" required hint={`${form.cuisine.length} selected`}>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {CUISINE_OPTIONS.map(c => (
                  <button key={c} type="button" onClick={() => toggleCuisine(c)}
                    className={clsx("px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border-2 transition-all",
                      form.cuisine.includes(c)
                        ? "bg-primary-500 border-primary-500 text-white"
                        : "border-cream-400 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-primary-400")}>
                    {c}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-[10px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 sm:mb-2">Logo</p>
                <ImageUploader label="" hint="Square · max 5MB" value={form.logo} onChange={url => updateField("logo", url)} />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 sm:mb-2">Cover Image</p>
                <ImageUploader label="" hint="Landscape · max 5MB" aspect="wide" value={form.coverImage} onChange={url => updateField("coverImage", url)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Field label="Phone" icon={Phone}>
                <input value={form.phone} onChange={e => updateField("phone", e.target.value)}
                  placeholder="+250 700 000 000" className="input-field" />
              </Field>
              <Field label="Business Email" icon={Mail}>
                <input type="email" value={form.email} onChange={e => updateField("email", e.target.value)}
                  placeholder="restaurant@email.com" className="input-field" />
              </Field>
            </div>
          </>
        )}

        {/* ── Step 2: Operations ── */}
        {step === 2 && (
          <>
            <SectionTitle icon={Clock}>Operational Setup</SectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Field label="Delivery Fee ($)" icon={DollarSign}>
                <input type="number" step="0.01" min="0" value={form.deliveryFee}
                  onChange={e => updateField("deliveryFee", e.target.value)} className="input-field" />
              </Field>
              <Field label="Min. Order ($)" icon={DollarSign}>
                <input type="number" step="0.01" min="0" value={form.minimumOrder}
                  onChange={e => updateField("minimumOrder", e.target.value)} className="input-field" />
              </Field>
              <Field label="Est. Delivery Time" icon={Timer}>
                <input value={form.estimatedDeliveryTime}
                  onChange={e => updateField("estimatedDeliveryTime", e.target.value)}
                  placeholder="30-45 min" className="input-field" />
              </Field>
            </div>

            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 sm:mb-3">Opening Hours</p>
              <div className="space-y-2 sm:space-y-2.5">
                {DAYS.map(day => {
                  const h = form.openingHours[day] || { open:"09:00", close:"22:00", isClosed:false };
                  return (
                    <div key={day} className="flex items-center gap-2 sm:gap-3">
                      <span className="w-6 sm:w-7 text-[10px] sm:text-xs font-bold text-stone-500 dark:text-stone-400 uppercase shrink-0">{day.slice(0,3)}</span>
                      <label className="flex items-center gap-1 text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 shrink-0 cursor-pointer select-none">
                        <input type="checkbox" checked={!h.isClosed} onChange={e => updateHours(day, "isClosed", !e.target.checked)} className="rounded accent-primary-500" />
                        Open
                      </label>
                      {!h.isClosed ? (
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                          <input type="time" value={h.open} onChange={e => updateHours(day, "open", e.target.value)} className="input-field py-1 sm:py-1.5 text-[10px] sm:text-xs flex-1" />
                          <span className="text-stone-400 text-[10px] sm:text-xs">to</span>
                          <input type="time" value={h.close} onChange={e => updateHours(day, "close", e.target.value)} className="input-field py-1 sm:py-1.5 text-[10px] sm:text-xs flex-1" />
                        </div>
                      ) : (
                        <span className="text-[10px] sm:text-xs text-stone-400 italic">Closed</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {!isEdit && (
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                <AlertCircle size={14} className="sm:hidden text-amber-500 shrink-0 mt-0.5" />
                <AlertCircle size={16} className="hidden sm:block text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-400">Pending Admin Approval</p>
                  <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-500 mt-0.5">Your restaurant will be reviewed before going live. Usually within 48 hours.</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step 3: Location ── */}
        {step === 3 && (
          <>
            <SectionTitle icon={MapPin}>Restaurant Location</SectionTitle>

            <Field label="Street Address">
              <input value={form.address.street} onChange={e => updateAddress("street", e.target.value)}
                placeholder="123 Main Street" className="input-field" />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="City" required>
                <input value={form.address.city} onChange={e => updateAddress("city", e.target.value)}
                  placeholder="Kigali" className="input-field" />
              </Field>
              <Field label="State / Province">
                <input value={form.address.state} onChange={e => updateAddress("state", e.target.value)}
                  placeholder="Kigali Province" className="input-field" />
              </Field>
            </div>

            <Field label="ZIP / Postal Code">
              <input value={form.address.zipCode} onChange={e => updateAddress("zipCode", e.target.value)}
                placeholder="00000" className="input-field" />
            </Field>

            {(form.address.street || form.address.city) && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-800/40">
                <MapPin size={15} className="text-primary-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-0.5">Address Preview</p>
                  <p className="text-xs text-primary-600 dark:text-primary-300">
                    {[form.address.street, form.address.city, form.address.state, form.address.zipCode].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {isEdit && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
                <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-600 dark:text-blue-400">Changes are saved immediately and reflected live on your restaurant page.</p>
              </div>
            )}
          </>
        )}


        {/* ── Step 4: Plan ── */}
        {step === 4 && (
          <>
            <SectionTitle icon={CreditCard}>Choose Your Plan</SectionTitle>
            <p className="text-sm text-stone-500 dark:text-stone-400 -mt-2 mb-1">
              You can upgrade or downgrade at any time from your dashboard.
            </p>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
               {[
                 {
                   key: "basic", label: "Basic", price: "$49/mo",
                   color: "border-stone-300 dark:border-stone-700",
                   active: "border-primary-500 bg-primary-50 dark:bg-primary-950/20",
                   features: ["Up to 250 orders/month","Digital Menu Builder","Basic Inventory","Email Support","QR Code Ordering"],
                 },
                 {
                   key: "pro", label: "Pro", price: "$129/mo",
                   badge: "Most Popular",
                   color: "border-stone-300 dark:border-stone-700",
                   active: "border-primary-500 bg-primary-50 dark:bg-primary-950/20",
                   features: ["Unlimited Orders","Advanced Analytics","Automated Restock Alerts","24/7 Priority Support","Kitchen Display System","Staff Management"],
                 },
                 {
                   key: "enterprise", label: "Enterprise", price: "$349/mo",
                   color: "border-stone-300 dark:border-stone-700",
                   active: "border-primary-500 bg-primary-50 dark:bg-primary-950/20",
                   features: ["Multi-Outlet Management","Custom API Integrations","White-labelled Apps","Dedicated Success Manager","SLA Guarantee"],
                 },
               ].map(plan => (
                 <button key={plan.key} type="button" onClick={() => updateField("subscription", plan.key)}
                   className={clsx("relative text-left p-3 sm:p-4 rounded-xl border-2 transition-all",
                     form.subscription === plan.key ? plan.active : plan.color + " hover:border-primary-300 dark:hover:border-primary-700")}>
                   {plan.badge && (
                     <span className="absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                       {plan.badge}
                     </span>
                   )}
                   <div className="flex items-center justify-between mb-2 sm:mt-1">
                     <span className="font-bold text-stone-900 dark:text-white text-sm">{plan.label}</span>
                     <span className={clsx("text-xs sm:text-sm font-bold", form.subscription === plan.key ? "text-primary-600 dark:text-primary-400" : "text-stone-600 dark:text-stone-300")}>
                       {plan.price}
                     </span>
                   </div>
                   <ul className="space-y-1 sm:space-y-1.5">
                     {plan.features.map(f => (
                       <li key={f} className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-stone-600 dark:text-stone-400">
                         <CheckCircle size={10} className={clsx("shrink-0 mt-0.5", form.subscription === plan.key ? "text-primary-500" : "text-stone-400")} />
                         {f}
                       </li>
                     ))}
                   </ul>
                   {form.subscription === plan.key && (
                     <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-primary-200 dark:border-primary-800/40">
                       <p className="text-[10px] sm:text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                         <CheckCircle size={10} /> Selected
                       </p>
                     </div>
                   )}
                 </button>
               ))}
             </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-cream-300 dark:border-stone-800">
          {step > 1
            ? <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5"><ArrowLeft size={13} className="sm:hidden" /><ArrowLeft size={15} className="hidden sm:block" /> Back</button>
            : <div />
          }
          {step < STEPS.length
            ? <button onClick={handleNext} className="btn-primary flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">Next <ChevronRight size={13} className="sm:hidden" /><ChevronRight size={15} className="hidden sm:block" /></button>
            : <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 disabled:opacity-60">
                {loading
                  ? <><div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>{isEdit ? "Saving…" : "Creating…"}</>
                  : isEdit ? <><Save size={13} className="sm:hidden" /><Save size={15} className="hidden sm:block" /> Save Changes</> : <><CheckCircle size={13} className="sm:hidden" /><CheckCircle size={15} className="hidden sm:block" /> Submit Restaurant</>
                }
              </button>
          }
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2 mb-2">
      <Icon size={18} className="text-primary-500" />{children}
    </h2>
  );
}

function Field({ label, required, hint, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="ml-2 text-primary-400 font-normal normal-case tracking-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}