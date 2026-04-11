import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cjFetch } from "@/lib/cj";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productIds } = await req.json();
  if (!productIds?.length) {
    return NextResponse.json({ error: "No products selected" }, { status: 400 });
  }

  // Find or create a CJ Dropshipping system supplier account
  let cjSupplier = await prisma.user.findFirst({
    where: { email: "cj@vrinandya.system" },
  });

  if (!cjSupplier) {
    cjSupplier = await prisma.user.create({
      data: {
        email: "cj@vrinandya.system",
        name: "CJ Dropshipping",
        password: "system",
        role: "SUPPLIER",
      },
    });
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const pid of productIds) {
    try {
      // Fetch full product details from CJ
      const data = await cjFetch("/product/query", { pid });
      if (!data.result || !data.data) { errors.push(pid); continue; }

      const p = data.data;
      const sku = p.productSku || p.pid || pid;

      // Skip if already imported
      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) { skipped++; continue; }

      // Get first variant image or product images
      const images: string[] = [];
      if (p.productImage) images.push(p.productImage);
      if (p.productImages?.length) {
        p.productImages.forEach((img: { imageUrl?: string; url?: string }) => {
          const url = img.imageUrl || img.url;
          if (url && !images.includes(url)) images.push(url);
        });
      }

      await prisma.product.create({
        data: {
          supplierId: cjSupplier!.id,
          name: p.productNameEn || p.productName,
          description: p.productIntroductionEn || p.productIntroduction || p.productNameEn || "",
          price: parseFloat(p.sellPrice || p.productPrice || "0"),
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
