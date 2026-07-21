"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  ShoppingBag, Globe, Package, Loader2, Check, Tag,
  X, Info, SlidersHorizontal, AlertCircle, Layers,
  Calculator, RotateCcw, ChevronDown, ChevronUp, TrendingUp,
  IndianRupee, Weight, Barcode,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Variant {
  id: string; name: string; sku: string | null; price: number;
  stock: number; attributes: Record<string, string> | null; images: string[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  suggestedPrice: number | null;
  costPrice: number | null;
  sku: string | null;
  category: string | null;
  images: string[];
  stock: number;
  weight: number | null;
  hsn: string | null;
  gstRate: number | null;
  variants: Variant[];
  supplier: { name: string };
  pushed: boolean;
}

const MARKETPLACES = ["AMAZON", "EBAY", "ETSY", "WALMART"] as const;

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}
function fmtDec(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

function margin(sell: number, cost: number | null) {
  if (!cost || cost <= 0) return null;
  return Math.round(((sell - cost) / sell) * 100);
}

// ─── Profit Calculator ────────────────────────────────────────────────────────

function ProfitCalculator({
  product, onClose, onPush, pushing, pushDone,
}: {
  product: Product;
  onClose: () => void;
  onPush: (id: string) => void;
  pushing: string | null;
  pushDone: boolean;
}) {
  const appPrice = product.costPrice ?? product.price;
  const sell0    = product.suggestedPrice ?? product.price;

  const [sellingPrice,   setSellingPrice]   = useState(sell0 > 0 ? String(sell0) : "");
  const [expectedOrders, setExpectedOrders] = useState("100");
  const [confirmRate,    setConfirmRate]    = useState("70");
  const [deliveryRate,   setDeliveryRate]   = useState("80");
  const [adSpend,        setAdSpend]        = useState("30");
  const [rtoCharge,      setRtoCharge]      = useState("70");
  const [miscCharges,    setMiscCharges]    = useState("");
  const [calculated,     setCalculated]     = useState(false);
  const [ordersOpen,     setOrdersOpen]     = useState(false);
  const [spendsOpen,     setSpendsOpen]     = useState(false);

  // parsed numbers
  const sp  = parseFloat(sellingPrice)   || 0;
  const eo  = parseFloat(expectedOrders) || 0;
  const cr  = parseFloat(confirmRate)    || 0;
  const dr  = parseFloat(deliveryRate)   || 0;
  const ads = parseFloat(adSpend)        || 0;
  const rtc = parseFloat(rtoCharge)      || 0;
  const mc  = parseFloat(miscCharges)    || 0;

  // ── Derived ──────────────────────────────────────────────────────────────
  const confirmedOrders = eo * (cr / 100);
  const deliveredOrders = confirmedOrders * (dr / 100);
  const rtoOrders       = confirmedOrders * (1 - dr / 100);
  const cancelledOrders = eo * (1 - cr / 100);

  const marginPerOrder  = sp - appPrice;
  const totalEarnings   = marginPerOrder * deliveredOrders;

  const totalAdSpend    = ads * eo;
  const totalRtoLoss    = rtc * rtoOrders;
  const totalSpends     = totalAdSpend + totalRtoLoss + mc;

  const netProfit       = totalEarnings - totalSpends;
  const netProfitPerOrder = deliveredOrders > 0 ? netProfit / deliveredOrders : 0;
  const roi             = totalSpends > 0 ? (netProfit / totalSpends) * 100 : 0;

  function reset() {
    setSellingPrice(sell0 > 0 ? String(sell0) : "");
    setExpectedOrders("100");
    setConfirmRate("70");
    setDeliveryRate("80");
    setAdSpend("30");
    setRtoCharge("70");
    setMiscCharges("");
    setCalculated(false);
  }

  const profitColor = netProfit > 0 ? "#16A34A" : netProfit < 0 ? "#DC2626" : "#6B7280";
  const roiColor    = roi > 20 ? "#16A34A" : roi > 0 ? "#D97706" : "#DC2626";

  const numInput = (
    value: string,
    setter: (v: string) => void,
    placeholder: string,
    prefix?: string,
    suffix?: string,
  ) => (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>{prefix}</span>}
      <input
        type="number" min="0" value={value}
        onChange={(e) => { setter(e.target.value); setCalculated(false); }}
        placeholder={placeholder}
        className="w-full py-2.5 text-sm rounded-xl outline-none"
        style={{
          paddingLeft: prefix ? "1.75rem" : "0.75rem",
          paddingRight: suffix ? "2rem" : "0.75rem",
          background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-primary)",
        }}
        onFocus={(e) => { e.currentTarget.style.border = "1.5px solid var(--accent)"; }}
        onBlur={(e)  => { e.currentTarget.style.border = "1px solid var(--border)"; }}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>{suffix}</span>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="relative w-full sm:max-w-3xl max-h-[96vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl flex flex-col"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(67,97,238,0.1)" }}>
              <Calculator className="w-4 h-4" style={{ color: "var(--accent)" }} />
            </div>
            <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Profit Calculator</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-muted)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product info bar */}
        <div className="px-5 py-3 flex items-center gap-4 flex-shrink-0 flex-wrap"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
          {product.images[0] && (
            <img src={product.images[0]} alt={product.name}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              style={{ border: "1px solid var(--border)" }} />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{product.name}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>by {product.supplier.name}</p>
          </div>
          <div className="flex items-center gap-5 flex-wrap flex-shrink-0">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>App Price</p>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>₹{fmt(appPrice)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>RTO / Return</p>
              <p className="text-sm font-bold" style={{ color: "#EF4444" }}>₹{fmt(parseFloat(rtoCharge) || 70)}</p>
            </div>
            {product.weight && (
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Weight</p>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{product.weight}kg</p>
              </div>
            )}
            {product.sku && (
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>SKU</p>
                <p className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>{product.sku}</p>
              </div>
            )}
          </div>
          {/* Push button in header */}
          {!pushDone && !product.pushed ? (
            <button onClick={() => onPush(product.id)} disabled={pushing === product.id}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex-shrink-0"
              style={{ background: "var(--accent)" }}>
              {pushing === product.id
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Pushing...</>
                : <><ShoppingBag className="w-4 h-4" /> Push to Shopify</>}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0"
              style={{ background: "#16A34A" }}>
              <Check className="w-4 h-4" /> Pushed
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row gap-5 p-5 flex-1">

          {/* ── Left: inputs ─────────────────────────────────────────────── */}
          <div className="md:w-64 flex-shrink-0 space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Selling Price (₹) <span style={{ color: "#EF4444" }}>*</span>
              </label>
              {numInput(sellingPrice, setSellingPrice, "e.g. 299", "₹")}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Expected Orders <span style={{ color: "#EF4444" }}>*</span>
              </label>
              {numInput(expectedOrders, setExpectedOrders, "e.g. 100")}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Confirm Orders (%) <span style={{ color: "#EF4444" }}>*</span>
              </label>
              {numInput(confirmRate, setConfirmRate, "e.g. 70", undefined, "%")}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Expected Delivery (%) <span style={{ color: "#EF4444" }}>*</span>
              </label>
              {numInput(deliveryRate, setDeliveryRate, "e.g. 80", undefined, "%")}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Ad Spend per Order (₹) <span style={{ color: "#EF4444" }}>*</span>
              </label>
              {numInput(adSpend, setAdSpend, "e.g. 30", "₹")}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                RTO / Return Cost (₹)
              </label>
              {numInput(rtoCharge, setRtoCharge, "e.g. 70", "₹")}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Total Misc. Charges (₹)
              </label>
              {numInput(miscCharges, setMiscCharges, "e.g. 500", "₹")}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setCalculated(true)}
                disabled={!sp || !eo || !cr || !dr}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "var(--accent)" }}>
                Calculate
              </button>
              <button onClick={reset}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* ── Right: results ───────────────────────────────────────────── */}
          <div className="flex-1 space-y-3">

            {/* Total Earnings */}
            <div className="rounded-2xl p-4" style={{ background: totalEarnings >= 0 ? "rgba(22,163,74,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${totalEarnings >= 0 ? "rgba(22,163,74,0.2)" : "rgba(239,68,68,0.2)"}` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Total Earnings</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Margin per Order × Delivered Orders</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: totalEarnings >= 0 ? "#16A34A" : "#DC2626" }}>
                  ₹{fmt(totalEarnings)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: "var(--bg-muted)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Margin per Order</p>
                  <div className="flex items-center gap-1.5 text-sm flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg font-semibold" style={{ background: "rgba(67,97,238,0.1)", color: "var(--accent)" }}>₹{fmt(sp)}</span>
                    <span style={{ color: "var(--text-muted)" }}>−</span>
                    <span className="px-2 py-0.5 rounded-lg font-semibold" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>₹{fmt(appPrice)}</span>
                    <span style={{ color: "var(--text-muted)" }}>=</span>
                    <span className="font-bold" style={{ color: marginPerOrder >= 0 ? "#16A34A" : "#EF4444" }}>₹{fmt(marginPerOrder)}</span>
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>Selling Price − App Price</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "var(--bg-muted)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Delivered Orders</p>
                  <div className="flex items-center gap-1.5 text-sm flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg font-semibold" style={{ background: "rgba(67,97,238,0.1)", color: "var(--accent)" }}>{Math.round(confirmedOrders)}</span>
                    <span style={{ color: "var(--text-muted)" }}>×</span>
                    <span className="px-2 py-0.5 rounded-lg font-semibold" style={{ background: "rgba(67,97,238,0.1)", color: "var(--accent)" }}>{dr}%</span>
                    <span style={{ color: "var(--text-muted)" }}>=</span>
                    <span className="font-bold" style={{ color: "var(--text-primary)" }}>{Math.round(deliveredOrders)}</span>
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>Confirmed × Delivery%</p>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="rounded-2xl p-4" style={{ background: netProfit > 0 ? "rgba(22,163,74,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${netProfit > 0 ? "rgba(22,163,74,0.2)" : "rgba(239,68,68,0.2)"}` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Net Profit</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total Earnings − Total Spends</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: profitColor }}>
                    Per order: ₹{fmtDec(netProfitPerOrder)}
                  </p>
                </div>
                <p className="text-2xl font-bold" style={{ color: profitColor }}>
                  ₹{fmt(netProfit)}
                </p>
              </div>
            </div>

            {/* ROI */}
            <div className="rounded-2xl p-4" style={{ background: roi > 0 ? "rgba(245,158,11,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${roi > 0 ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>ROI</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Net Profit ÷ Total Spends × 100</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: roiColor }}>{fmtDec(roi)}%</p>
              </div>
            </div>

            {/* Orders Breakdown */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <button onClick={() => setOrdersOpen(!ordersOpen)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: "var(--bg-muted)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full" style={{ background: "var(--accent)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Orders Breakdown</span>
                </div>
                {ordersOpen ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
              </button>
              {ordersOpen && (
                <div className="px-4 py-3 grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Orders",   value: Math.round(eo),               color: "var(--text-primary)" },
                    { label: "Confirmed",       value: Math.round(confirmedOrders), note: `${cr}%`, color: "#3B82F6" },
                    { label: "Delivered",       value: Math.round(deliveredOrders), note: `${dr}%`, color: "#16A34A" },
                    { label: "RTO / Return",    value: Math.round(rtoOrders),       note: `${fmtDec(100 - dr)}%`, color: "#EF4444" },
                    { label: "Cancelled",       value: Math.round(cancelledOrders), note: `${fmtDec(100 - cr)}%`, color: "#F59E0B" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-1.5"
                      style={{ borderBottom: "1px solid var(--border)" }}>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold" style={{ color: row.color }}>{row.value}</span>
                        {row.note && <span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>({row.note})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spends Breakdown */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <button onClick={() => setSpendsOpen(!spendsOpen)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: "var(--bg-muted)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full" style={{ background: "#EF4444" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Total Spends Breakdown</span>
                </div>
                {spendsOpen ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
              </button>
              {spendsOpen && (
                <div className="px-4 py-3 space-y-1">
                  {[
                    { label: "Total Ad Spend",  value: totalAdSpend,  note: `₹${adSpend}/order × ${Math.round(eo)} orders` },
                    { label: "RTO Loss",         value: totalRtoLoss,  note: `₹${rtoCharge}/RTO × ${Math.round(rtoOrders)} RTO orders` },
                    { label: "Misc. Charges",    value: mc,            note: "fixed" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-1.5"
                      style={{ borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{row.label}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{row.note}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: "#EF4444" }}>₹{fmt(row.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Total Spends</span>
                    <span className="text-base font-bold" style={{ color: "#EF4444" }}>₹{fmt(totalSpends)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Product detail panel ──────────────────────────────────────────────────────

function ProductDetail({
  product, onClose, onPush, pushing, pushError, pushDone, isMarketplace,
  onOpenMarketplace, onOpenCalc,
}: {
  product: Product;
  onClose: () => void;
  onPush: (id: string) => void;
  pushing: string | null;
  pushError: string | null;
  pushDone: boolean;
  isMarketplace: boolean;
  onOpenMarketplace: (id: string) => void;
  onOpenCalc: (p: Product) => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const sell = product.suggestedPrice ?? product.price;
  const m    = margin(sell, product.costPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl flex flex-col"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Product Details</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-muted)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-0 sm:gap-6 p-5 flex-1">
          <div className="sm:w-64 flex-shrink-0">
            <div className="rounded-xl overflow-hidden mb-2" style={{ background: "var(--bg-muted)", aspectRatio: "1" }}>
              {product.images[imgIdx]
                ? <img src={product.images[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12" style={{ color: "var(--border)" }} /></div>
              }
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                {product.images.map((src, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ border: `2px solid ${i === imgIdx ? "var(--accent)" : "var(--border)"}` }}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 mt-4 sm:mt-0">
            {product.category && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-2"
                style={{ background: "rgba(67,97,238,0.1)", color: "var(--accent)" }}>
                <Tag className="w-3 h-3" />
                {product.category.split(">").pop()?.trim() ?? product.category}
              </span>
            )}
            <h2 className="text-base font-bold leading-snug mb-1" style={{ color: "var(--text-primary)" }}>{product.name}</h2>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>by {product.supplier.name}</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-xl p-3" style={{ background: "var(--bg-muted)" }}>
                <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Sell Price</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>₹{fmt(sell)}</p>
              </div>
              {product.costPrice && (
                <div className="rounded-xl p-3" style={{ background: "var(--bg-muted)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Your Cost</p>
                  <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>₹{fmt(product.costPrice)}</p>
                  {m !== null && (
                    <p className="text-[10px] font-semibold" style={{ color: m > 20 ? "#16A34A" : m > 0 ? "#D97706" : "#DC2626" }}>
                      {m}% margin
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
              {[
                { label: "SKU",    value: product.sku },
                { label: "Stock",  value: product.stock > 0 ? `${product.stock} units` : "On demand" },
                { label: "Weight", value: product.weight ? `${product.weight} kg` : null },
                { label: "HSN",    value: product.hsn },
                { label: "GST",    value: product.gstRate ? `${product.gstRate}%` : null },
              ].filter((r) => r.value).map((row) => (
                <div key={row.label}>
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                  <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{row.value}</p>
                </div>
              ))}
            </div>

            {product.variants.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>{product.variants.length} Variants</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((v) => (
                    <span key={v.id} className="text-xs px-2 py-1 rounded-lg font-medium"
                      style={{ background: "var(--bg-muted)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                      {v.name}{v.price > 0 ? ` · ₹${fmt(v.price)}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.description && (
              <div className="mb-4">
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Description</p>
                <p className="text-xs leading-relaxed line-clamp-4" style={{ color: "var(--text-secondary)" }}>{product.description}</p>
              </div>
            )}

            {pushError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-3 text-xs"
                style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {pushError}
              </div>
            )}

            {/* Profit calculator CTA */}
            <button onClick={() => { onClose(); onOpenCalc(product); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold mb-2"
              style={{ background: "rgba(67,97,238,0.08)", color: "var(--accent)", border: "1px solid rgba(67,97,238,0.2)" }}>
              <Calculator className="w-4 h-4" /> Calculate Profit Before Pushing
            </button>

            {isMarketplace ? (
              <button onClick={() => { onClose(); onOpenMarketplace(product.id); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#7C3AED" }}>
                <Globe className="w-4 h-4" /> List on Marketplace
              </button>
            ) : product.pushed || pushDone ? (
              <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#16A34A" }}>
                <Check className="w-4 h-4" /> Pushed to Shopify
              </div>
            ) : (
              <button onClick={() => onPush(product.id)} disabled={pushing === product.id}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "var(--accent)" }}>
                {pushing === product.id
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Pushing...</>
                  : <><ShoppingBag className="w-4 h-4" /> Push to Shopify</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SellerCatalogPage() {
  const { data: session } = useSession();
  const [products,     setProducts]     = useState<Product[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [category,     setCategory]     = useState("");
  const [pushing,      setPushing]      = useState<string | null>(null);
  const [pushErrors,   setPushErrors]   = useState<Record<string, string>>({});
  const [freshPushed,  setFreshPushed]  = useState<Set<string>>(new Set());
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [calcProduct,   setCalcProduct]   = useState<Product | null>(null);
  const [marketplaceModal,    setMarketplaceModal]    = useState<string | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState("");
  const [mlProcessing, setMlProcessing] = useState(false);
  const [mlDone,       setMlDone]       = useState<Record<string, boolean>>({});

  const isMarketplace = session?.user?.plan === "MARKETPLACE";

  useEffect(() => {
    fetch("/api/seller/catalog")
      .then((r) => r.json())
      .then((d) => { setProducts(d.products ?? []); setLoading(false); });
  }, []);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const p of products) {
      if (p.category) seen.add(p.category.split(">").pop()?.trim() ?? p.category);
    }
    return Array.from(seen).sort();
  }, [products]);

  const filtered = useMemo(() => products.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = !category ||
      (p.category?.split(">").pop()?.trim() ?? p.category) === category;
    return matchSearch && matchCat;
  }), [products, search, category]);

  async function handlePushShopify(productId: string) {
    setPushing(productId);
    setPushErrors((prev) => { const n = { ...prev }; delete n[productId]; return n; });
    const res = await fetch("/api/seller/push-shopify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      setFreshPushed((prev) => new Set([...prev, productId]));
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, pushed: true } : p));
    } else {
      const d = await res.json().catch(() => ({ error: "Push failed" }));
      setPushErrors((prev) => ({ ...prev, [productId]: d.error ?? "Push failed" }));
    }
    setPushing(null);
  }

  async function handleListMarketplace(productId: string) {
    if (!selectedMarketplace) return;
    setMlProcessing(true);
    const res = await fetch("/api/seller/list-marketplace", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, platform: selectedMarketplace }),
    });
    if (res.ok) {
      setMlDone((prev) => ({ ...prev, [`${productId}-${selectedMarketplace}`]: true }));
      setMarketplaceModal(null); setSelectedMarketplace("");
    }
    setMlProcessing(false);
  }

  const isPushed = (p: Product) => p.pushed || freshPushed.has(p.id);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Product Catalog"
        subtitle={loading ? "Loading products…" : `${products.length} approved products available`}
        searchValue={search}
        searchPlaceholder="Search by name or SKU…"
        onSearchChange={setSearch}
        filters={
          categories.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="pl-8 pr-3 py-2 text-sm rounded-xl outline-none appearance-none"
                  style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                  <option value="">All Categories</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <SlidersHorizontal className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-muted)" }} />
              </div>
              {category && (
                <button onClick={() => setCategory("")}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium"
                  style={{ background: "rgba(67,97,238,0.1)", color: "var(--accent)", border: "1px solid rgba(67,97,238,0.2)" }}>
                  {category} <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="px-4 md:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="card animate-pulse overflow-hidden">
                <div className="bg-gray-100" style={{ height: 220 }} />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-8 bg-gray-100 rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card py-20 flex flex-col items-center gap-3 text-center">
            <Package className="w-14 h-14" style={{ color: "var(--border)" }} />
            <p className="font-semibold" style={{ color: "var(--text-600)" }}>
              {search || category ? "No products match your filters" : "No approved products available"}
            </p>
            <p className="text-sm" style={{ color: "var(--text-400)" }}>
              {(search || category)
                ? <button onClick={() => { setSearch(""); setCategory(""); }} className="underline">Clear filters</button>
                : "Products approved by admin will appear here"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((product) => {
              const pushed       = isPushed(product);
              const isProcessing = pushing === product.id;
              const sell         = product.suggestedPrice ?? product.price;
              const m            = margin(sell, product.costPrice);
              const err          = pushErrors[product.id];

              return (
                <div key={product.id} className="card overflow-hidden flex flex-col group hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setDetailProduct(product)}>

                  <div className="relative w-full overflow-hidden" style={{ height: 220, background: "var(--bg-muted)" }}>
                    {product.images[0]
                      ? <img src={product.images[0]} alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10" style={{ color: "var(--border)" }} />
                        </div>
                    }
                    {pushed && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ background: "#16A34A" }}>
                        <Check className="w-3 h-3" /> Pushed
                      </div>
                    )}
                    {product.variants.length > 0 && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ background: "rgba(0,0,0,0.55)" }}>
                        <Layers className="w-3 h-3" /> {product.variants.length}
                      </div>
                    )}
                    {product.category && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ background: "rgba(0,0,0,0.55)" }}>
                        <Tag className="w-2.5 h-2.5" />
                        {product.category.split(">").pop()?.trim() ?? product.category}
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col flex-1" onClick={(e) => e.stopPropagation()}>
                    <p className="text-sm font-semibold leading-snug line-clamp-2 mb-0.5" style={{ color: "var(--text-900)" }}>
                      {product.name}
                    </p>
                    <p className="text-xs mb-2" style={{ color: "var(--text-400)" }}>by {product.supplier.name}</p>

                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-base font-bold" style={{ color: "var(--text-900)" }}>₹{fmt(sell)}</span>
                      {m !== null && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: m > 20 ? "#DCFCE7" : "#FEF9C3", color: m > 20 ? "#16A34A" : "#92400E" }}>
                          {m}% margin
                        </span>
                      )}
                    </div>

                    {err && (
                      <p className="text-[10px] flex items-center gap-1 mb-1.5" style={{ color: "#DC2626" }}>
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{err}</span>
                      </p>
                    )}

                    {/* Profit calc button */}
                    <button onClick={(e) => { e.stopPropagation(); setCalcProduct(product); }}
                      className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium mb-2 w-full"
                      style={{ background: "rgba(67,97,238,0.08)", color: "var(--accent)", border: "1px solid rgba(67,97,238,0.15)" }}>
                      <Calculator className="w-3.5 h-3.5" /> Calculate Profit
                    </button>

                    {isMarketplace ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setMarketplaceModal(product.id); setSelectedMarketplace(""); }}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-white"
                        style={{ background: "#7C3AED" }}>
                        <Globe className="w-3.5 h-3.5" /> List on Marketplace
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePushShopify(product.id); }}
                        disabled={isProcessing || pushed}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
                        style={{ background: pushed ? "#16A34A" : "var(--accent)" }}>
                        {isProcessing
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Pushing...</>
                          : pushed
                          ? <><Check className="w-3.5 h-3.5" /> Pushed</>
                          : <><ShoppingBag className="w-3.5 h-3.5" /> Push to Shopify</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product detail panel */}
      {detailProduct && (
        <ProductDetail
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onPush={handlePushShopify}
          pushing={pushing}
          pushError={pushErrors[detailProduct.id] ?? null}
          pushDone={freshPushed.has(detailProduct.id)}
          isMarketplace={isMarketplace}
          onOpenMarketplace={(id) => { setMarketplaceModal(id); setSelectedMarketplace(""); }}
          onOpenCalc={(p) => setCalcProduct(p)}
        />
      )}

      {/* Profit Calculator */}
      {calcProduct && (
        <ProfitCalculator
          product={calcProduct}
          onClose={() => setCalcProduct(null)}
          onPush={handlePushShopify}
          pushing={pushing}
          pushDone={isPushed(calcProduct)}
        />
      )}

      {/* Marketplace modal */}
      {marketplaceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>List on Marketplace</h3>
              <button onClick={() => { setMarketplaceModal(null); setSelectedMarketplace(""); }}
                className="p-1 rounded-lg" style={{ color: "var(--text-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Select which marketplace to list this product on</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {MARKETPLACES.map((m) => {
                const done = mlDone[`${marketplaceModal}-${m}`];
                return (
                  <button key={m} onClick={() => !done && setSelectedMarketplace(m)} disabled={done}
                    className="py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      border: `2px solid ${done ? "#D1FAE5" : selectedMarketplace === m ? "#7C3AED" : "var(--border)"}`,
                      background: done ? "#F0FDF4" : selectedMarketplace === m ? "#F5F3FF" : "var(--bg-muted)",
                      color: done ? "#16A34A" : selectedMarketplace === m ? "#7C3AED" : "var(--text-primary)",
                    }}>
                    {done ? `✓ ${m}` : m}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setMarketplaceModal(null); setSelectedMarketplace(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button onClick={() => handleListMarketplace(marketplaceModal)}
                disabled={!selectedMarketplace || mlProcessing}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#7C3AED" }}>
                {mlProcessing ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
