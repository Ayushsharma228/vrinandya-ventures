"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Plus, Trash2, RotateCcw, CheckCircle,
  XCircle, AlertTriangle, Zap, Package,
} from "lucide-react";

interface Product {
  id: string; name: string; sku: string | null; images: string[];
  hsn: string | null; gstRate: number | null; category: string | null;
  description: string | null;
}

interface ListingContent {
  id:               string;
  title?:           string | null;
  bullets?:         string[];
  description?:     string | null;
  keywords?:        string[];
  searchTerms?:     string[];
  category?:        string | null;
  hsn?:             string | null;
  gstRate?:         number | null;
  brand?:           string | null;
  optimizationScore: number;
  product:          Product;
}

interface ValidationIssue { field: string; message: string; code: string }
interface ValidationResult { valid: boolean; score: number; errors: ValidationIssue[]; warnings: ValidationIssue[] }

interface Version {
  id: string; version: number; title?: string | null;
  bullets?: string[]; description?: string | null; changeNote?: string | null;
  createdAt: string; createdBy?: { name: string | null; email: string } | null;
}

interface MarketplaceListing {
  id: string; platform: string; status: string; optimizationScore: number; listingUrl?: string | null;
}

const PLATFORMS = ["AMAZON", "FLIPKART", "MEESHO", "SHOPIFY"];

const score_color = (s: number) =>
  s >= 80 ? "#16a34a" : s >= 50 ? "#d97706" : "#dc2626";

export default function ProductListingEditor({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);

  const [content, setContent]       = useState<ListingContent | null>(null);
  const [versions, setVersions]     = useState<Version[]>([]);
  const [mlListings, setMlListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [validation, setValidation] = useState<Record<string, ValidationResult>>({});
  const [validating, setValidating] = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<"content" | "versions" | "marketplace">("content");

  // Editable fields
  const [form, setForm] = useState({
    title: "", bullets: ["", "", "", "", ""], description: "",
    keywords: "", searchTerms: "", category: "", hsn: "",
    gstRate: "", brand: "", changeNote: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, vr, mr] = await Promise.all([
        fetch(`/api/admin/listing-os/content/${productId}`),
        fetch(`/api/admin/listing-os/content/${productId}/versions`),
        fetch(`/api/admin/listing-os/marketplace?productId=${productId}`),
      ]);
      const cd = cr.ok ? await cr.json() : null;
      const vd = vr.ok ? await vr.json() : null;
      const md = mr.ok ? await mr.json() : null;

      if (cd?.content) {
        setContent(cd.content);
        const c = cd.content;
        setForm({
          title:       c.title        ?? "",
          bullets:     c.bullets?.length ? [...c.bullets, ...Array(5).fill("")].slice(0, 5) : ["", "", "", "", ""],
          description: c.description  ?? "",
          keywords:    (c.keywords    ?? []).join(", "),
          searchTerms: (c.searchTerms ?? []).join(", "),
          category:    c.category     ?? "",
          hsn:         c.hsn          ?? "",
          gstRate:     c.gstRate !== null ? String(c.gstRate) : "",
          brand:       c.brand        ?? "",
          changeNote:  "",
        });
      } else if (cd) {
        // content is null — product exists, no content yet
        setContent(null);
      }

      setVersions(vd?.versions ?? []);
      setMlListings(md?.listings ?? []);
    } finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        title:       form.title       || null,
        bullets:     form.bullets.filter(Boolean),
        description: form.description || null,
        keywords:    form.keywords.split(",").map(k => k.trim()).filter(Boolean),
        searchTerms: form.searchTerms.split(",").map(k => k.trim()).filter(Boolean),
        category:    form.category    || null,
        hsn:         form.hsn         || null,
        gstRate:     form.gstRate     ? parseFloat(form.gstRate) : null,
        brand:       form.brand       || null,
        changeNote:  form.changeNote  || null,
      };

      const method = content ? "PATCH" : "POST";
      const r = await fetch(`/api/admin/listing-os/content/${productId}`, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (r.ok) { await load(); setForm(f => ({ ...f, changeNote: "" })); }
    } finally { setSaving(false); }
  };

  const validate = async (platform: string) => {
    setValidating(platform);
    try {
      const r = await fetch("/api/admin/listing-os/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, platform }),
      });
      if (r.ok) { const d = await r.json(); setValidation(v => ({ ...v, [platform]: d })); }
    } finally { setValidating(null); }
  };

  const createMarketplaceListing = async (platform: string) => {
    const r = await fetch("/api/admin/listing-os/marketplace", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, platform }),
    });
    if (r.ok || r.status === 409) await load();
  };

  if (loading) {
    return <div style={{ padding: 32, color: "var(--text-400)" }}>Loading…</div>;
  }

  const product = content?.product;

  return (
    <div style={{ padding: "24px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/listing-os"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-400)",
                   textDecoration: "none", fontSize: 13, marginBottom: 12 }}>
          <ArrowLeft size={14} /> Back to Listing OS
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-900)", margin: 0 }}>
              {product?.name ?? "Product"}
            </h1>
            <div style={{ fontSize: 13, color: "var(--text-400)", marginTop: 4 }}>
              SKU: {product?.sku ?? "—"} · {product?.category ?? "No category"}
            </div>
          </div>
          {content && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "var(--text-400)" }}>Optimization Score</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: score_color(content.optimizationScore) }}>
                {content.optimizationScore}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
        {(["content", "versions", "marketplace"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding: "8px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
                     fontWeight: activeTab === t ? 600 : 400,
                     color: activeTab === t ? "var(--accent)" : "var(--text-400)",
                     borderBottom: activeTab === t ? "2px solid var(--accent)" : "2px solid transparent",
                     textTransform: "capitalize" }}>
            {t === "marketplace" ? "Marketplace Listings" : t === "versions" ? "Version History" : "Content"}
          </button>
        ))}
      </div>

      {/* CONTENT TAB */}
      {activeTab === "content" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Title */}
            <Field label="Title" hint={`${form.title.length}/200`}>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                maxLength={200} placeholder="Product title for marketplace…"
                style={inputStyle} />
            </Field>

            {/* Brand + Category */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Brand">
                <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  placeholder="Brand name" style={inputStyle} />
              </Field>
              <Field label="Category">
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Electronics > Mobiles" style={inputStyle} />
              </Field>
            </div>

            {/* Bullet Points */}
            <Field label="Bullet Points (5 max)">
              {form.bullets.map((b, i) => (
                <input key={i} value={b}
                  onChange={e => setForm(f => ({ ...f, bullets: f.bullets.map((x, j) => j === i ? e.target.value : x) }))}
                  placeholder={`Bullet point ${i + 1}…`}
                  style={{ ...inputStyle, marginBottom: i < 4 ? 6 : 0 }} />
              ))}
            </Field>

            {/* Description */}
            <Field label="Description">
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={5} placeholder="Detailed product description…"
                style={{ ...inputStyle, resize: "vertical" }} />
            </Field>

            {/* Keywords + Search Terms */}
            <Field label="Keywords" hint="Comma separated">
              <input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                placeholder="keyword1, keyword2, keyword3…" style={inputStyle} />
            </Field>
            <Field label="Backend Search Terms" hint="Comma separated">
              <input value={form.searchTerms} onChange={e => setForm(f => ({ ...f, searchTerms: e.target.value }))}
                placeholder="search term 1, search term 2…" style={inputStyle} />
            </Field>

            {/* HSN + GST */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="HSN Code">
                <input value={form.hsn} onChange={e => setForm(f => ({ ...f, hsn: e.target.value }))}
                  placeholder="e.g. 8471" maxLength={8} style={inputStyle} />
              </Field>
              <Field label="GST Rate %">
                <input value={form.gstRate} onChange={e => setForm(f => ({ ...f, gstRate: e.target.value }))}
                  type="number" placeholder="0, 5, 12, 18, 28" style={inputStyle} />
              </Field>
            </div>

            {/* Change Note */}
            <Field label="Change Note (for version history)">
              <input value={form.changeNote} onChange={e => setForm(f => ({ ...f, changeNote: e.target.value }))}
                placeholder="What did you change?" style={inputStyle} />
            </Field>

            <button onClick={save} disabled={saving}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                       padding: "11px 24px", borderRadius: 9, border: "none", cursor: "pointer",
                       background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 14,
                       opacity: saving ? 0.7 : 1 }}>
              <Save size={15} />
              {saving ? "Saving…" : content ? "Save & Create Version" : "Create Content"}
            </button>
          </div>

          {/* Right sidebar — product info + images */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-400)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Supplier Data
              </div>
              <Kv k="Description" v={product?.description ?? "—"} />
              <Kv k="Category" v={product?.category ?? "—"} />
              <Kv k="HSN" v={product?.hsn ?? "—"} />
              <Kv k="GST" v={product?.gstRate !== null ? `${product?.gstRate}%` : "—"} />
            </div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-400)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Images ({product?.images.length ?? 0})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(product?.images ?? []).slice(0, 8).map((img, i) => (
                  <img key={i} src={img} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                ))}
                {(product?.images?.length ?? 0) === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-300)" }}>No images uploaded</div>
                )}
              </div>
            </div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-400)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                AI Assistant
              </div>
              <div style={{ fontSize: 12, color: "var(--text-400)", marginBottom: 10 }}>
                AI content generation will be available in a future update. The service architecture is ready.
              </div>
              <button disabled style={{ width: "100%", padding: "8px", borderRadius: 7, border: "1px solid var(--border)",
                                        background: "var(--bg-muted)", color: "var(--text-300)", fontSize: 12, cursor: "not-allowed" }}>
                <Zap size={12} style={{ display: "inline", marginRight: 4 }} /> Generate with AI (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERSIONS TAB */}
      {activeTab === "versions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {versions.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-400)" }}>No versions yet</div>
          )}
          {versions.map(v => (
            <div key={v.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)",
                                      borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-900)" }}>Version {v.version}</span>
                  {v.changeNote && <span style={{ fontSize: 12, color: "var(--text-400)" }}>— {v.changeNote}</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-400)" }}>
                  {new Date(v.createdAt).toLocaleString("en-IN")} · {v.createdBy?.name ?? v.createdBy?.email ?? "System"}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-400)" }}>
                {v.title ?? <span style={{ fontStyle: "italic" }}>No title</span>}
              </div>
              {v.bullets && v.bullets.length > 0 && (
                <div style={{ fontSize: 12, color: "var(--text-300)", marginTop: 4 }}>
                  {v.bullets.filter(Boolean).length} bullet points · {(v.description ?? "").length} char description
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MARKETPLACE TAB */}
      {activeTab === "marketplace" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
            {PLATFORMS.map(platform => {
              const existing = mlListings.find(l => l.platform === platform);
              const val      = validation[platform];
              return (
                <div key={platform} style={{ background: "var(--bg-card)", border: "1px solid var(--border)",
                                              borderRadius: 10, padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{platform}</div>
                    {existing && (
                      <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                                     background: existing.status === "LIVE" ? "#dcfce7" : "#fef9c3",
                                     color: existing.status === "LIVE" ? "#15803d" : "#b45309" }}>
                        {existing.status}
                      </span>
                    )}
                  </div>

                  {/* Validation result */}
                  {val && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        {val.valid
                          ? <CheckCircle size={14} style={{ color: "#16a34a" }} />
                          : <XCircle size={14} style={{ color: "#dc2626" }} />}
                        <span style={{ fontSize: 12, fontWeight: 600, color: val.valid ? "#16a34a" : "#dc2626" }}>
                          Score: {val.score}/100
                        </span>
                      </div>
                      {val.errors.map((e, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#dc2626", marginBottom: 2 }}>
                          ✗ {e.message}
                        </div>
                      ))}
                      {val.warnings.map((w, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#d97706", marginBottom: 2 }}>
                          ⚠ {w.message}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={() => validate(platform)} disabled={validating === platform}
                      style={{ padding: "7px", borderRadius: 7, border: "1px solid var(--border)",
                               background: "var(--bg-muted)", color: "var(--text-900)", cursor: "pointer", fontSize: 12 }}>
                      {validating === platform ? "Validating…" : "Validate"}
                    </button>
                    {!existing && content && (
                      <button onClick={() => createMarketplaceListing(platform)}
                        style={{ padding: "7px", borderRadius: 7, border: "none",
                                 background: "var(--accent)", color: "#fff", cursor: "pointer",
                                 fontSize: 12, fontWeight: 600 }}>
                        <Plus size={11} style={{ display: "inline", marginRight: 4 }} />
                        Create Listing
                      </button>
                    )}
                    {!content && (
                      <div style={{ fontSize: 11, color: "var(--text-300)", textAlign: "center" }}>
                        Create content first
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {mlListings.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-400)" }}>
                  <th style={{ textAlign: "left", padding: "8px 10px" }}>Platform</th>
                  <th style={{ textAlign: "left", padding: "8px 10px" }}>Status</th>
                  <th style={{ textAlign: "center", padding: "8px 10px" }}>Score</th>
                  <th style={{ textAlign: "left", padding: "8px 10px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mlListings.map(l => (
                  <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px" }}>{l.platform}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                                     background: l.status === "LIVE" ? "#dcfce7" : "#fef9c3",
                                     color: l.status === "LIVE" ? "#15803d" : "#b45309" }}>
                        {l.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px", textAlign: "center", fontWeight: 700,
                                  color: score_color(l.optimizationScore) }}>
                      {l.optimizationScore}
                    </td>
                    <td style={{ padding: "10px" }}>
                      {l.listingUrl && (
                        <a href={l.listingUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, color: "var(--accent)" }}>View Live →</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 8,
  border: "1px solid var(--border)", background: "var(--bg-card)",
  color: "var(--text-900)", fontSize: 13, outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-400)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 11, color: "var(--text-300)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
      <span style={{ color: "var(--text-400)" }}>{k}</span>
      <span style={{ color: "var(--text-900)", fontWeight: 500, maxWidth: "60%", textAlign: "right",
                     overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
    </div>
  );
}
