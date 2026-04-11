"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Video, Plus, X, Loader2 } from "lucide-react";

const GST_RATES = ["0%", "5%", "12%", "18%", "28%"];

export default function ListProductPage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    sku: "",
    hsnCode: "",
    gstRate: "18%",
    description: "",
    category: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoNames, setVideoNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [skuError, setSkuError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "sku") {
      if (value.length !== 10) {
        setSkuError("Must be exactly 10 characters");
      } else {
        setSkuError("");
      }
    }
  }

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, 10);
    setImages(newImages);
    const previews = newImages.map((f) => URL.createObjectURL(f));
    setImagePreviews(previews);
  }

  function handleVideos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setVideos((prev) => [...prev, ...files]);
    setVideoNames((prev) => [...prev, ...files.map((f) => f.name)]);
  }

  function removeImage(index: number) {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  }

  function removeVideo(index: number) {
    setVideos((prev) => prev.filter((_, i) => i !== index));
    setVideoNames((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.sku.length !== 10) {
      setSkuError("Must be exactly 10 characters");
      return;
    }
    if (images.length < 2) {
      setError("Please add at least 2 product images");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("sku", form.sku);
      formData.append("hsnCode", form.hsnCode);
      formData.append("gstRate", form.gstRate);
      formData.append("description", form.description);
      formData.append("category", form.category);
      images.forEach((img) => formData.append("images", img));
      videos.forEach((vid) => formData.append("videos", vid));

      const res = await fetch("/api/supplier/products", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit product");
        setLoading(false);
        return;
      }

      router.push("/supplier/products");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">List New Product</h1>
        <p className="text-blue-500 text-sm mt-1">Submit your product for approval</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Product Information Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Plus className="w-4 h-4 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-800">Product Information</h2>
          </div>
          <p className="text-blue-500 text-sm mb-6">Fill in the details below to submit your product for approval</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Product Title */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter product title"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Price */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                min="0"
                placeholder="Enter price"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                required
                maxLength={10}
                placeholder="10-character SKU"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {skuError ? (
                <p className="text-red-500 text-xs mt-1">{skuError}</p>
              ) : (
                <p className="text-gray-400 text-xs mt-1">Must be exactly 10 characters</p>
              )}
            </div>

            {/* HSN Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HSN Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hsnCode"
                value={form.hsnCode}
                onChange={handleChange}
                required
                placeholder="4/6/8 digit HSN"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-gray-400 text-xs mt-1">Enter 4, 6, or 8 digits</p>
            </div>

            {/* GST Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Rate <span className="text-red-500">*</span>
              </label>
              <select
                name="gstRate"
                value={form.gstRate}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {GST_RATES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="e.g. Electronics, Clothing, Home & Kitchen"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describe your product..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y"
            />
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <label className="block text-sm font-semibold text-blue-600 mb-3">
            Product Images (at least 2 required)
          </label>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            onClick={() => imageInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          >
            <ImageIcon className="w-10 h-10 text-gray-300 mb-3" />
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 mb-3"
            >
              <Plus className="w-4 h-4" /> Choose Images
            </button>
            <p className="text-blue-500 text-xs">
              Click to select images • PNG, JPG, GIF, WEBP up to 10MB each
            </p>
            <p className="text-gray-400 text-xs mt-1">
              You can select multiple images at once • Drag & drop also supported. Minimum 2 images required.
            </p>
            {images.length < 2 && images.length > 0 && (
              <p className="text-orange-500 text-xs mt-1">
                You currently have {images.length} image(s). Please add at least 2.
              </p>
            )}
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={handleImages}
          />
        </div>

        {/* Product Videos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Product Videos (optional)
          </label>

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

          <div
            onClick={() => videoInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          >
            <Video className="w-10 h-10 text-gray-300 mb-3" />
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 mb-3"
            >
              <Plus className="w-4 h-4" /> Choose Videos
            </button>
            <p className="text-orange-500 text-xs">MP4, WebM up to 100MB each</p>
          </div>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm"
            multiple
            className="hidden"
            onChange={handleVideos}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end mb-5">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
            ) : (
              <><Plus className="w-4 h-4" /> Submit Product</>
            )}
          </button>
        </div>

        {/* Info Box */}
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
