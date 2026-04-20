import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "SELLER" || session.user.plan !== "DROPSHIPPING") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();

    const [product, shopifyStore] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.shopifyStore.findUnique({ where: { sellerId: session.user.id } }),
    ]);

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (!shopifyStore) {
      return NextResponse.json({ error: "No Shopify store connected. Please connect your store first." }, { status: 400 });
    }

    // Push to Shopify via API
    const shopifyRes = await fetch(
      `https://${shopifyStore.storeUrl}/admin/api/2025-01/products.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": shopifyStore.accessToken,
        },
        body: JSON.stringify({
          product: {
            title: product.name,
            body_html: product.description,
            vendor: "Vrinandya Ventures",
            product_type: product.category || "",
            variants: [{ price: product.price.toString(), sku: product.sku }],
            images: product.images.map((src) => ({ src })),
          },
        }),
      }
    );

    if (!shopifyRes.ok) {
      const err = await shopifyRes.json();
      console.error("Shopify error:", err);
      return NextResponse.json({ error: "Failed to push to Shopify" }, { status: 500 });
    }

    return NextResponse.json({ message: "Product pushed to Shopify successfully" });
  } catch (error) {
    console.error("Push Shopify error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
