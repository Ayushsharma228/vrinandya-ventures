import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cjFetch } from "@/lib/cj";

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { products } = await req.json();
  if (!products?.length) {
    return NextResponse.json({ error: "No products selected" }, { status: 400 });
  }

  // Ensure the Vrinandya system supplier account exists (update name if it was set to old value)
  const cjSupplier = await prisma.user.upsert({
    where: { email: "cj@vrinandya.system" },
    update: { name: "Vrinandya Ventures" },
    create: {
      email: "cj@vrinandya.system",
      name: "Vrinandya Ventures",
      password: "system",
      role: "SUPPLIER",
    },
  });

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const { pid, inrPrice, image: catalogImage } of products) {
    try {
      // Fetch full product details from CJ
      const data = await cjFetch("/product/query", { pid });
      if (!data.result || !data.data) { errors.push(pid); continue; }

      const p = data.data;
      const sku = p.productSku || p.pid || pid;

      // Skip if already imported
      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) { skipped++; continue; }

      // Build image list — start with the catalog image (known to be visible)
      const images: string[] = [];
      if (catalogImage) images.push(catalogImage);
      if (p.productImage && !images.includes(p.productImage)) images.push(p.productImage);
      if (p.productImages?.length) {
        p.productImages.forEach((img: { imageUrl?: string; url?: string }) => {
          const url = img.imageUrl || img.url;
          if (url && !images.includes(url)) images.push(url);
        });
      }

      await prisma.product.create({
        data: {
          supplierId: cjSupplier.id,
          name: p.productNameEn || p.productName,
          description: p.productIntroductionEn || p.productIntroduction || p.productNameEn || "",
          price: typeof inrPrice === "number" ? inrPrice : parseFloat(String(inrPrice)),
          sku,
          category: p.categoryName || null,
          images: images.slice(0, 5),
          status: "APPROVED",
        },
      });

      imported++;
    } catch (e) {
      errors.push(`${pid}: ${String(e)}`);
    }
  }

  return NextResponse.json({ imported, skipped, errors });
}
