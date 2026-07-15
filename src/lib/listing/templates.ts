import { prisma } from "@/lib/prisma";
import { TemplateRequirement, ImageRequirement } from "./types";

interface TemplateDefinition {
  platform:            string;
  requiredFields:      TemplateRequirement[];
  imageRequirements:   ImageRequirement;
  titleMaxLength:      number;
  descriptionMaxLength: number;
  bulletsCount:        number;
}

const TEMPLATE_DEFS: TemplateDefinition[] = [
  {
    platform: "AMAZON",
    titleMaxLength: 200,
    descriptionMaxLength: 2000,
    bulletsCount: 5,
    imageRequirements: { minCount: 1, maxCount: 9, minWidth: 1000, minHeight: 1000, formats: ["jpg", "png", "gif"], maxSizeMB: 10 },
    requiredFields: [
      { field: "title",       required: true,  maxLength: 200,  description: "Product title" },
      { field: "bullets",     required: true,  description: "5 bullet points" },
      { field: "description", required: true,  maxLength: 2000, description: "Product description" },
      { field: "brand",       required: true,  description: "Brand name" },
      { field: "category",    required: true,  description: "Amazon browse node / category" },
      { field: "hsn",         required: true,  description: "HSN code for GST compliance" },
      { field: "gstRate",     required: true,  description: "GST rate %" },
      { field: "keywords",    required: false, description: "Backend search keywords" },
      { field: "searchTerms", required: false, description: "Backend search terms (max 250 chars combined)" },
    ],
  },
  {
    platform: "FLIPKART",
    titleMaxLength: 255,
    descriptionMaxLength: 5000,
    bulletsCount: 5,
    imageRequirements: { minCount: 1, maxCount: 8, minWidth: 500, minHeight: 500, formats: ["jpg", "png"], maxSizeMB: 5 },
    requiredFields: [
      { field: "title",       required: true,  maxLength: 255,  description: "Listing title" },
      { field: "description", required: true,  description: "Product description" },
      { field: "brand",       required: true,  description: "Brand name" },
      { field: "category",    required: true,  description: "Flipkart category path" },
      { field: "hsn",         required: true,  description: "HSN code" },
      { field: "gstRate",     required: true,  description: "GST rate %" },
      { field: "bullets",     required: false, description: "Key features (optional)" },
    ],
  },
  {
    platform: "MEESHO",
    titleMaxLength: 100,
    descriptionMaxLength: 1000,
    bulletsCount: 3,
    imageRequirements: { minCount: 1, maxCount: 6, minWidth: 300, minHeight: 300, formats: ["jpg", "png"], maxSizeMB: 3 },
    requiredFields: [
      { field: "title",       required: true,  maxLength: 100,  description: "Product name" },
      { field: "description", required: true,  maxLength: 1000, description: "Product description" },
      { field: "category",    required: true,  description: "Meesho category" },
      { field: "hsn",         required: true,  description: "HSN code" },
      { field: "gstRate",     required: true,  description: "GST rate %" },
    ],
  },
  {
    platform: "SHOPIFY",
    titleMaxLength: 255,
    descriptionMaxLength: 65535,
    bulletsCount: 0,
    imageRequirements: { minCount: 1, maxCount: 250, minWidth: 100, minHeight: 100, formats: ["jpg", "png", "gif", "webp"], maxSizeMB: 20 },
    requiredFields: [
      { field: "title",       required: true,  maxLength: 255,  description: "Product title" },
      { field: "description", required: false, description: "Product description (HTML supported)" },
      { field: "brand",       required: false, description: "Vendor / brand" },
      { field: "category",    required: false, description: "Product type / collection" },
    ],
  },
];

let templatesSeeded = false;

export async function ensureTemplates() {
  if (templatesSeeded) return;
  try {
    for (const def of TEMPLATE_DEFS) {
      await prisma.marketplaceTemplate.upsert({
        where:  { platform: def.platform as never },
        create: {
          platform:            def.platform as never,
          requiredFields:      def.requiredFields as never,
          imageRequirements:   def.imageRequirements as never,
          titleMaxLength:      def.titleMaxLength,
          descriptionMaxLength: def.descriptionMaxLength,
          bulletsCount:        def.bulletsCount,
        },
        update: {
          requiredFields:      def.requiredFields as never,
          imageRequirements:   def.imageRequirements as never,
          titleMaxLength:      def.titleMaxLength,
          descriptionMaxLength: def.descriptionMaxLength,
          bulletsCount:        def.bulletsCount,
        },
      });
    }
    templatesSeeded = true;
  } catch { /* non-critical */ }
}

export async function getTemplate(platform: string) {
  await ensureTemplates();
  return prisma.marketplaceTemplate.findUnique({ where: { platform: platform as never } });
}
