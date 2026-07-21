import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type CsvRow = Record<string, string>;

function parseCSV(text: string): CsvRow[] {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      current.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      current.push(cell);
      cell = "";
      if (current.some((c) => c.length > 0)) rows.push(current);
      current = [];
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || current.length > 0) {
    current.push(cell);
    rows.push(current);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const obj: CsvRow = {};
    headers.forEach((h, i) => {
      obj[h] = (row[i] ?? "").trim();
    });
    return obj;
  });
}

// Strip HTML tags for a plain-text description fallback
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Group CSV rows by Handle — Shopify puts one product per Handle, multiple rows per product for images/variants
function groupByHandle(rows: CsvRow[]): Map<string, CsvRow[]> {
  const map = new Map<string, CsvRow[]>();
  for (const row of rows) {
    const handle = row["Handle"];
    if (!handle) continue;
    if (!map.has(handle)) map.set(handle, []);
    map.get(handle)!.push(row);
  }
  return map;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("csv") as File | null;
    if (!file) return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });

    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV is empty or has no data rows" }, { status: 400 });
    }

    // Validate that this looks like a Shopify product export
    if (!("Handle" in rows[0]) || !("Title" in rows[0])) {
      return NextResponse.json(
        { error: "CSV format not recognised. Please export from Shopify using Products → Export." },
        { status: 400 }
      );
    }

    const grouped = groupByHandle(rows);
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [handle, productRows] of grouped) {
      try {
        // First row with a Title is the product master row
        const master = productRows.find((r) => r["Title"]) ?? productRows[0];

        const name = master["Title"];
        if (!name) { skipped++; continue; }

        // Collect all non-empty image URLs across all rows for this handle
        const images = productRows
          .map((r) => r["Image Src"])
          .filter(Boolean);

        // Price: "Variant Price" = what deodap charges us (our cost)
        const priceRaw = master["Variant Price"];
        const price = priceRaw ? parseFloat(priceRaw) : 0;
        if (!price) { errors.push(`Skipped "${name}": no price found`); skipped++; continue; }

        const suggestedPrice = master["Variant Compare At Price"]
          ? parseFloat(master["Variant Compare At Price"])
          : null;

        const sku = master["Variant SKU"] || null;
        const stock = master["Variant Inventory Qty"]
          ? parseInt(master["Variant Inventory Qty"])
          : 0;

        // Grams → kg to match the supplier form convention
        const weightGrams = master["Variant Grams"]
          ? parseFloat(master["Variant Grams"])
          : null;
        const weight = weightGrams ? weightGrams / 1000 : null;

        const category = master["Type"] || null;

        // Store raw HTML description; strip for empty check
        const rawDescription = master["Body (HTML)"] || "";
        const description = rawDescription || null;

        // Collect variant rows: rows where Variant SKU differs from master
        const masterSku = master["Variant SKU"];
        const variantRows = productRows.filter(
          (r) => r["Variant SKU"] && r["Variant SKU"] !== masterSku && r["Variant Price"]
        );

        // Check SKU collision before insert
        if (sku) {
          const collision = await prisma.product.findUnique({ where: { sku } });
          if (collision) {
            errors.push(`Skipped "${name}": SKU ${sku} already exists`);
            skipped++;
            continue;
          }
        }

        const product = await prisma.product.create({
          data: {
            supplierId:    session.user.id,
            name,
            description,
            price,
            suggestedPrice,
            stock,
            weight,
            category,
            sku,
            images,
            status: "PENDING",
          },
        });

        // Create variant records for multi-variant products
        if (variantRows.length > 0) {
          const variantData = variantRows.map((r) => {
            const optVal =
              r["Option1 Value"] || r["Option2 Value"] || r["Option3 Value"] || "Default";
            return {
              productId: product.id,
              name:      optVal,
              price:     parseFloat(r["Variant Price"]) || price,
              stock:     parseInt(r["Variant Inventory Qty"]) || 0,
              sku:       r["Variant SKU"] || null,
            };
          });
          await prisma.productVariant.createMany({
            data: variantData,
            skipDuplicates: true,
          });
        }

        imported++;
      } catch (err: any) {
        const masterTitle = productRows.find((r) => r["Title"]?.trim())?.[
          "Title"
        ] ?? handle;
        if (err?.code === "P2002") {
          errors.push(`Skipped "${masterTitle}": duplicate SKU`);
          skipped++;
        } else {
          errors.push(`Error on "${masterTitle}": ${err?.message ?? "unknown"}`);
          skipped++;
        }
      }
    }

    // Notify admin about the bulk import
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (admin && imported > 0) {
      await prisma.notification.create({
        data: {
          userId:  admin.id,
          type:    "GENERAL",
          title:   "Bulk CSV Import",
          message: `${session.user.name} imported ${imported} product${imported !== 1 ? "s" : ""} via CSV.`,
          data:    { supplierId: session.user.id, imported, skipped },
        },
      }).catch(() => {});
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
