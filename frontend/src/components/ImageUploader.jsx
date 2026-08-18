import { useState, useRef } from "react";
import { Upload, X, Image, Loader2, CheckCircle } from "lucide-react";
import { uploadAPI } from "../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

/**
 * ImageUploader — reusable drag-and-drop image upload component.
 *
 * Props:
 *   value       — current image URL (shows preview)
 *   onChange    — called with the uploaded URL
 *   label       — optional label above the uploader
 *   hint        — small text below (e.g. "Square · max 5 MB")
 *   aspect      — "square" | "wide" | "free"  (controls preview shape)
 *   disabled    — disables all interaction
 */
export default function ImageUploader({
  value,
  onChange,
  label,
  hint,
  aspect = "square",
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const aspectClass =
    {
      square: "aspect-square",
      wide: "aspect-video",
      free: "min-h-[120px]",
    }[aspect] || "aspect-square";

  const upload = async (file) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed (JPG, PNG, WebP, GIF)");
      return;
    }

    // Validate size — 5 MB cap
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await uploadAPI.image(formData);

      if (!data.url) throw new Error("No URL returned");

      onChange?.(data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Upload failed — please try again",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("");
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
          {label}
        </p>
      )}

      <div
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          "relative w-full rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden",
          aspectClass,
          disabled || uploading
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer",
          dragging
            ? "border-primary-400 bg-primary-50 dark:bg-primary-950/20 scale-[1.01]"
            : value
              ? "border-cream-300 dark:border-stone-700 hover:border-primary-400 dark:hover:border-primary-600"
              : "border-cream-400 dark:border-stone-700 hover:border-primary-400 dark:hover:border-primary-600 bg-cream-100 dark:bg-stone-800/40",
        )}
      >
        {/* Preview */}
        {value && !uploading && (
          <>
            <img
              src={value}
              alt="Upload preview"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            {/* Dark overlay on hover */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex flex-col items-center gap-2 text-white">
                <Upload size={20} />
                <span className="text-xs font-semibold">Change image</span>
              </div>
            </div>
            {/* Clear button */}
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors shadow-lg z-10"
              >
                <X size={14} />
              </button>
            )}
            {/* Success tick */}
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
              <CheckCircle size={14} className="text-white" />
            </div>
          </>
        )}

        {/* Uploading state */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm gap-3">
            <Loader2 size={28} className="text-primary-500 animate-spin" />
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
              Uploading…
            </p>
          </div>
        )}

        {/* Empty state */}
        {!value && !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <div
              className={clsx(
                "rounded-xl flex items-center justify-center transition-colors",
                aspect === "square" ? "w-12 h-12" : "w-10 h-10",
                dragging
                  ? "bg-primary-100 dark:bg-primary-900/40"
                  : "bg-cream-200 dark:bg-stone-700",
              )}
            >
              {dragging ? (
                <Upload size={20} className="text-primary-500" />
              ) : (
                <Image size={18} className="text-stone-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                {dragging ? "Drop to upload" : "Click or drag image"}
              </p>
              {hint && (
                <p className="text-[10px] text-stone-400 mt-0.5">{hint}</p>
              )}
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
      </div>
    </div>
  );
}
