"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Video, Plus, X, Loader2, Package, Truck } from "lucide-react";

const GST_RATES = ["0", "5", "12", "18", "28"];

interface Variant {
  name: string;
  price: string;
  stock: string;
  sku: string;
}

export default function ListProductPage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    costPrice: "",
    sku: "",
    hsn: "",
    gstRate: "18",
    description: "",
    category: "",
    moq: "",
    weight: "",
    length: "",
    width: "",
    height: "",
  });

  const [variants, setVariants]         = useState<Variant[]>([]);
  const [images, setImages]             = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videos, setVideos]             = useState<File[]>([]);
  const [videoNames, setVideoNames]     = useState<string[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [skuError, setSkuError]         = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "sku") {
      setSkuError(value.length !== 10 ? "Must be exactly 10 characters" : "");
    }
  }

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, 10);
    setImages(newImages);
    setImagePreviews(newImages.map((f) => URL.createObjectURL(f)));
  }

  function handleVideos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setVideos((prev) => [...prev, ...files]);
    setVideoNames((prev) => [...prev, ...files.map((f) => f.name)]);
  }

  function removeImage(i: number) {
    setImages((p) => p.filter((_, idx) => idx !== i));
    setImagePreviews((p) => p.filter((_, idx) => idx !== i));
  }

  function removeVideo(i: number) {
    setVideos((p) => p.filter((_, idx) => idx !== i));
    setVideoNames((p) => p.filter((_, idx) => idx !== i));
  }

  function addVariant() {
    setVariants((p) => [...p, { name: "", price: form.price, stock: "", sku: "" }]);
  }

  function updateVariant(i: number, field: keyof Variant, value: string) {
    setVariants((p) => p.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  }

  function removeVariant(i: number) {
    setVariants((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.sku.length !== 10) { setSkuError("Must be exactly 10 characters"); return; }
    if (images.length < 2) { setError("Please add at least 2 product images"); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("costPrice", form.costPrice);
      formData.append("sku", form.sku);
      formData.append("hsn", form.hsn);
      formData.append("gstRate", form.gstRate);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("moq", form.moq);
      formData.append("weight", form.weight);
      formData.append("length", form.length);
      formData.append("width", form.width);
      formData.append("height", form.height);
      formData.append("variants", JSON.stringify(variants.filter((v) => v.name.trim())));
      images.forEach((img) => formData.append("images", img));
      videos.forEach((vid) => formData.append("videos", vid));

      const res = await fetch("/api/supplier/products", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Failed to submit product"); setLoading(false); return; }
      router.push("/supplier/products");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">List New Product</h1>
        <p className="text-blue-500 text-sm mt-1">Submit your product for approval</p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Product Information ───────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-800">Product Information</h2>
          </div>
          <p className="text-blue-500 text-sm mb-6">Fill in the details below to submit your product for approval</p>

          {/* Title + Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Product Title <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required
                placeholder="Enter product title" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Selling Price (₹) <span className="text-red-500">*</span></label>
              <input type="number" name="price" value={form.price} onChange={handleChange} required
                min="0" placeholder="Price you charge AXQEN" className={inputCls} />
            </div>
          </div>

          {/* Cost Price + SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Your Cost Price (₹)</label>
              <input type="number" name="costPrice" value={form.costPrice} onChange={handleChange}
                min="0" placeholder="Your manufacturing / landed cost" className={inputCls} />
              <p className="text-gray-400 text-xs mt-1">Not visible to sellers</p>
            </div>
            <div>
              <label className={labelCls}>SKU <span className="text-red-500">*</span></label>
              <input type="text" name="sku" value={form.sku} onChange={handleChange} required
                maxLength={10} placeholder="10-character SKU" className={inputCls} />
              {skuError
                ? <p className="text-red-500 text-xs mt-1">{skuError}</p>
                : <p className="text-gray-400 text-xs mt-1">Must be exactly 10 characters</p>}
            </div>
          </div>

          {/* HSN + GST */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelCls}>HSN Code <span className="text-red-500">*</span></label>
              <input type="text" name="hsn" value={form.hsn} onChange={handleChange} required
                placeholder="4/6/8 digit HSN" className={inputCls} />
              <p className="text-gray-400 text-xs mt-1">Enter 4, 6, or 8 digits</p>
            </div>
            <div>
              <label className={labelCls}>GST Rate <span className="text-red-500">*</span></label>
              <select name="gstRate" value={form.gstRate} onChange={handleChange}
                className={`${inputCls} bg-white`}>
                {GST_RATES.map((r) => (
                  <option key={r} value={r}>{r}%</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <input type="text" name="category" value={form.category} onChange={handleChange}
                placeholder="e.g. Electronics, Clothing" className={inputCls} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description <span className="text-red-500">*</span></label>
            <textarea name="description" value={form.description} onChange={handleChange} required
              rows={4} placeholder="Describe your product..."
              className={`${inputCls} resize-y`} />
          </div>
        </div>

        {/* ── Inventory & Logistics ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-800">Inventory & Logistics</h2>
          </div>
          <p className="text-gray-400 text-sm mb-5">Used for purchase orders, shipping cost estimates, and inventory alerts</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className={labelCls}>Min. Order Qty (MOQ)</label>
              <input type="number" name="moq" value={form.moq} onChange={handleChange}
                min="1" placeholder="1" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Weight (kg)</label>
              <input type="number" name="weight" value={form.weight} onChange={handleChange}
                min="0" step="0.01" placeholder="0.50" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Dimensions (cm) — L × W × H</label>
              <div className="flex gap-2">
                <input type="number" name="length" value={form.length} onChange={handleChange}
                  min="0" step="0.1" placeholder="Length" className={inputCls} />
                <input type="number" name="width" value={form.width} onChange={handleChange}
                  min="0" step="0.1" placeholder="Width" className={inputCls} />
                <input type="number" name="height" value={form.height} onChange={handleChange}
                  min="0" step="0.1" placeholder="Height" className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Variants ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-800">Variants <span className="text-sm font-normal text-gray-400">(optional)</span></h2>
            <button type="button" onClick={addVariant}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg"
              style={{ background: "#EFF6FF", color: "#2563EB" }}>
              <Plus className="w-3.5 h-3.5" /> Add Variant
            </button>
          </div>
          <p className="text-gray-400 text-sm mb-4">e.g. different sizes, colours, or configurations of the same product</p>

          {variants.length === 0 ? (
            <div className="border-2 border-dashed border-gray-100 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-300">
              <Package className="w-8 h-8" />
              <p className="text-sm">No variants added — click &ldquo;Add Variant&rdquo; to start</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 px-1">
                {["Variant Name", "Price (₹)", "Stock", "SKU (opt.)", ""].map((h) => (
                  <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wide col-span-3 last:col-span-0">{h}</p>
                ))}
              </div>
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input value={v.name} onChange={(e) => updateVariant(i, "name", e.target.value)}
                    placeholder="e.g. Red - Large" className={`${inputCls} col-span-3`} />
                  <input type="number" value={v.price} onChange={(e) => updateVariant(i, "price", e.target.value)}
                    placeholder="₹" min="0" className={`${inputCls} col-span-3`} />
                  <input type="number" value={v.stock} onChange={(e) => updateVariant(i, "stock", e.target.value)}
                    placeholder="Qty" min="0" className={`${inputCls} col-span-2`} />
                  <input value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)}
                    placeholder="10-char" maxLength={10} className={`${inputCls} col-span-3`} />
                  <button type="button" onClick={() => removeVariant(i)}
                    className="col-span-1 p-1.5 text-gray-300 hover:text-red-500 flex justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Images ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <label className="block text-sm font-semibold text-blue-600 mb-3">
            Product Images <span className="text-red-500">*</span> (at least 2 required)
          </label>

          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div onClick={() => imageInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
            <ImageIcon className="w-10 h-10 text-gray-300 mb-3" />
            <button type="button"
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 mb-3">
              <Plus className="w-4 h-4" /> Choose Images
            </button>
            <p className="text-blue-500 text-xs">PNG, JPG, GIF, WEBP up to 10MB each</p>
            <p className="text-gray-400 text-xs mt-1">Minimum 2 images required · up to 10</p>
            {images.length > 0 && images.length < 2 && (
              <p className="text-orange-500 text-xs mt-1">{images.length} added — need at least 2</p>
            )}
          </div>
          <input ref={imageInputRef} type="file" accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
            multiple className="hidden" onChange={handleImages} />
        </div>

        {/* ── Product Videos ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Product Videos (optional)</label>

          {videoNames.length > 0 && (
            <div className="mb-4 space-y-2">
              {videoNames.map((name, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 truncate">{name}</span>
                  <button type="button" onClick={() => removeVideo(i)}>
                    <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div onClick={() => videoInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
            <Video className="w-10 h-10 text-gray-300 mb-3" />
            <button type="button"
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 mb-3">
              <Plus className="w-4 h-4" /> Choose Videos
            </button>
            <p className="text-orange-500 text-xs">MP4, WebM up to 100MB each</p>
          </div>
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm"
            multiple className="hidden" onChange={handleVideos} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        <div className="flex justify-end mb-5">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              : <><Plus className="w-4 h-4" /> Submit Product</>}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex gap-3 mb-6">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Product Submission Process</p>
            <p className="text-sm text-blue-600 mt-0.5">
              Your product will be reviewed by our team. Once approved, it will be available for sellers to add to their stores. You&apos;ll be notified of the approval status.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
