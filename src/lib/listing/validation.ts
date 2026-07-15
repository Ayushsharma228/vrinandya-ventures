import { prisma } from "@/lib/prisma";
import { ValidationResult, ValidationIssue, TemplateRequirement } from "./types";
import { getTemplate } from "./templates";

interface ValidateInput {
  productId:      string;
  platform:       string;
  imageUrls?:     string[];
}

export async function validateListing(input: ValidateInput): Promise<ValidationResult> {
  const errors:   ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const [product, content, template] = await Promise.all([
    prisma.product.findUnique({
      where:  { id: input.productId },
      select: { id: true, name: true, sku: true, images: true, hsn: true, gstRate: true,
                description: true, category: true },
    }),
    prisma.listingContent.findUnique({ where: { productId: input.productId } }),
    getTemplate(input.platform),
  ]);

  if (!product) {
    return { valid: false, score: 0, errors: [{ field: "product", message: "Product not found", code: "PRODUCT_NOT_FOUND" }], warnings: [] };
  }

  // ── SKU uniqueness ────────────────────────────────────────────────────────────
  if (!product.sku) {
    errors.push({ field: "sku", message: "Product must have a unique SKU", code: "SKU_MISSING" });
  }

  // ── Image validation ─────────────────────────────────────────────────────────
  const imageUrls = input.imageUrls ?? product.images ?? [];
  const imgReq = template?.imageRequirements as { minCount?: number; maxCount?: number } | null;
  const minImages = imgReq?.minCount ?? 1;

  if (imageUrls.length < minImages) {
    errors.push({ field: "images", message: `Minimum ${minImages} image(s) required. Found ${imageUrls.length}.`, code: "IMAGES_INSUFFICIENT" });
  }

  // ── Template field validation ─────────────────────────────────────────────────
  const required = (template?.requiredFields as TemplateRequirement[] | null) ?? [];
  for (const req of required) {
    if (!req.required) continue;
    const value = getFieldValue(req.field, content, product);
    if (!value) {
      errors.push({ field: req.field, message: `${req.description || req.field} is required for ${input.platform}`, code: "FIELD_REQUIRED" });
    } else if (req.maxLength && String(value).length > req.maxLength) {
      errors.push({ field: req.field, message: `${req.field} exceeds ${req.maxLength} character limit (${String(value).length} chars)`, code: "FIELD_TOO_LONG" });
    }
  }

  // ── Optional but scored ───────────────────────────────────────────────────────
  const optionals = required.filter(r => !r.required);
  for (const opt of optionals) {
    const value = getFieldValue(opt.field, content, product);
    if (!value) {
      warnings.push({ field: opt.field, message: `${opt.description || opt.field} improves listing quality`, code: "FIELD_SUGGESTED" });
    }
  }

  // ── HSN format check ──────────────────────────────────────────────────────────
  const hsn = content?.hsn ?? product.hsn;
  if (hsn && !/^\d{4,8}$/.test(hsn)) {
    errors.push({ field: "hsn", message: "HSN code must be 4–8 digits", code: "HSN_INVALID" });
  }

  // ── GST rate check ────────────────────────────────────────────────────────────
  const gstRate = content?.gstRate ?? product.gstRate;
  const validGst = [0, 5, 12, 18, 28];
  if (gstRate !== null && gstRate !== undefined && !validGst.includes(gstRate)) {
    warnings.push({ field: "gstRate", message: `GST rate ${gstRate}% is non-standard (expected: 0, 5, 12, 18, 28)`, code: "GST_NONSTANDARD" });
  }

  // ── Duplicate product check ───────────────────────────────────────────────────
  const existingLive = await prisma.marketplaceListing.findFirst({
    where: {
      listingContent: { productId: input.productId },
      platform:       input.platform as never,
      status:         { in: ["LIVE", "APPROVED"] },
    },
  });
  if (existingLive) {
    warnings.push({ field: "product", message: "Product already has a live listing on this marketplace", code: "DUPLICATE_LIVE" });
  }

  // ── Optimization score ────────────────────────────────────────────────────────
  const totalFields = required.length + optionals.length + 3; // +3 for images, sku, content-quality
  const issues = errors.length + warnings.length * 0.5;
  const score = Math.max(0, Math.round(100 - (issues / Math.max(1, totalFields)) * 100));

  return { valid: errors.length === 0, score, errors, warnings };
}

function getFieldValue(
  field: string,
  content: { title?: string | null; bullets?: string[]; description?: string | null; keywords?: string[]; searchTerms?: string[]; category?: string | null; hsn?: string | null; gstRate?: number | null; brand?: string | null } | null,
  product: { name?: string; description?: string | null; category?: string | null; hsn?: string | null; gstRate?: number | null }
): unknown {
  switch (field) {
    case "title":       return content?.title ?? product.name;
    case "description": return content?.description ?? product.description;
    case "bullets":     return content?.bullets?.length ? content.bullets : null;
    case "keywords":    return content?.keywords?.length ? content.keywords : null;
    case "searchTerms": return content?.searchTerms?.length ? content.searchTerms : null;
    case "category":    return content?.category ?? product.category;
    case "hsn":         return content?.hsn ?? product.hsn;
    case "gstRate":     return content?.gstRate ?? product.gstRate;
    case "brand":       return content?.brand ?? null;
    default:            return null;
  }
}
