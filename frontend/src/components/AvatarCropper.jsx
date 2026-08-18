import { useState, useRef, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Upload, X, CheckCircle, Loader2 } from "lucide-react";
import { uploadAPI } from "../services/api";
import toast from "react-hot-toast";
import clsx from "clsx";

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  if (
    isNaN(mediaWidth) ||
    isNaN(mediaHeight) ||
    mediaWidth <= 0 ||
    mediaHeight <= 0
  ) {
    return { unit: "%", width: 90, height: 90, x: 5, y: 5 };
  }
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 90, height: 90 },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

function getRotatedSize(width, height, rotation) {
  const rotRad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  return {
    width: Math.floor(width * cos + height * sin),
    height: Math.floor(width * sin + height * cos),
  };
}

export default function AvatarCropper({ value, onChange, label, hint }) {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const inputRef = useRef(null);

  const onSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => setImgSrc(reader.result));
    reader.readAsDataURL(file);
    setOpen(true);
    e.target.value = "";
  };

  const onImageLoad = (e) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };

  const cropToBlob = async () => {
    if (!previewCanvasRef.current || !completedCrop) return null;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const img = imgRef.current;
    if (!img) return null;

    const { width: sourceWidth, height: sourceHeight } = getRotatedSize(
      img.naturalWidth,
      img.naturalHeight,
      0,
    );

    const scaleX = sourceWidth / img.width;
    const scaleY = sourceHeight / img.height;

    let cropX, cropY, cropWidth, cropHeight;
    if (completedCrop.unit === "%") {
      cropX = (completedCrop.x / 100) * img.width * scaleX;
      cropY = (completedCrop.y / 100) * img.height * scaleY;
      cropWidth = (completedCrop.width / 100) * img.width * scaleX;
      cropHeight = (completedCrop.height / 100) * img.height * scaleY;
    } else {
      cropX = completedCrop.x * scaleX;
      cropY = completedCrop.y * scaleY;
      cropWidth = completedCrop.width * scaleX;
      cropHeight = completedCrop.height * scaleY;
    }

    canvas.width = Math.max(1, Math.floor(cropWidth));
    canvas.height = Math.max(1, Math.floor(cropHeight));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2,
      0,
      Math.PI * 2,
    );
    ctx.clip();
    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  };

  const handleSave = async () => {
    const blob = await cropToBlob();
    if (!blob) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("image", blob, "avatar.png");
      const { data } = await uploadAPI.image(formData);
      if (!data.url) throw new Error("No URL returned");
      onChange?.(data.url);
      toast.success("Profile picture updated");
      setOpen(false);
      setImgSrc(null);
      setCrop(undefined);
      setCompletedCrop(null);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Upload failed — please try again",
      );
    } finally {
      setSaving(false);
    }
  };

  const closeModal = useCallback(() => {
    setOpen(false);
    setImgSrc(null);
    setCrop(undefined);
    setCompletedCrop(null);
  }, []);

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
          {label}
        </p>
      )}

      <div
        onClick={() => !uploading && !saving && inputRef.current?.click()}
        className={clsx(
          "relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-dashed transition-all duration-200 cursor-pointer",
          "hover:border-primary-400 dark:hover:border-primary-600 hover:scale-[1.02]",
          "border-cream-400 dark:border-stone-700 bg-cream-100 dark:bg-stone-800/40",
          value && "border-solid border-cream-300 dark:border-stone-700",
          (uploading || saving) && "opacity-70 cursor-not-allowed",
        )}
      >
        {value && !open && (
          <>
            <img
              src={value}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <Upload size={18} className="text-white" />
            </div>
          </>
        )}
        {!value && !open && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-stone-400">
            <Upload size={20} />
            <span className="text-[10px] font-semibold">Photo</span>
          </div>
        )}
        {(uploading || saving) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm gap-2">
            <Loader2 size={22} className="text-primary-500 animate-spin" />
            <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-300">
              {saving ? "Saving…" : "Uploading…"}
            </span>
          </div>
        )}
      </div>

      {hint && <p className="text-[10px] text-stone-400">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onSelectFile}
        disabled={uploading || saving}
      />

      {/* Crop Modal */}
      {open && imgSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
            <div className="px-5 py-4 border-b border-cream-300 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                  Adjust Profile Photo
                </h3>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Drag to reposition • Scroll or pinch to zoom
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="relative bg-cream-100 dark:bg-stone-800 rounded-xl overflow-hidden flex items-center justify-center min-h-[260px]">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    className="max-w-full max-h-[320px] object-contain"
                    style={{ display: "block" }}
                  />
                </ReactCrop>
              </div>

              <canvas
                ref={previewCanvasRef}
                className={clsx(
                  "mx-auto rounded-full border-2 border-cream-300 dark:border-stone-700 shadow-sm",
                  completedCrop ? "w-20 h-20" : "w-0 h-0",
                )}
              />

              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeModal}
                  className="btn-secondary flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!completedCrop || saving}
                  className="btn-primary flex-1 py-2.5 gap-2"
                >
                  <CheckCircle size={15} /> {saving ? "Saving…" : "Save Photo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
