import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";
import { computeOptimizationScore } from "@/lib/listing/optimization";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    await prisma.product.delete({ where: { id: productId } });
    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const status = req.nextUrl.searchParams.get("status") as ProductStatus | null;
    const products = await prisma.product.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      include: { supplier: { select: { name: true, email: true } } },
    });
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

async function approveOrRejectProduct(
  productId: string,
  status: ProductStatus,
  adminNote: string
) {
  const product = await prisma.product.update({
    where: { id: productId },
    data: { status, adminNote: adminNote || null },
    include: { supplier: true },
  });

  await prisma.notification.create({
    data: {
      userId: product.supplierId,
      type:   status === "APPROVED" ? "PRODUCT_APPROVED" : "PRODUCT_REJECTED",
      title:  status === "APPROVED" ? "Product Approved!" : "Product Rejected",
      message: status === "APPROVED"
        ? `Your product "${product.name}" has been approved and is now live on the platform.`
        : `Your product "${product.name}" was rejected.${adminNote ? ` Reason: ${adminNote}` : ""}`,
      data: { productId: product.id },
    },
  });

  if (status === "APPROVED") {
    prisma.listingContent.upsert({
      where:  { productId: product.id },
      create: {
        productId:    product.id,
        title:        product.name,
        description:  product.description ?? null,
        category:     product.category    ?? null,
        hsn:          product.hsn         ?? null,
        gstRate:      product.gstRate     ?? null,
        optimizationScore: computeOptimizationScore({
          title:       product.name,
          description: product.description,
          category:    product.category,
          hsn:         product.hsn,
          gstRate:     product.gstRate,
          imageCount:  product.images?.length ?? 0,
        }),
      },
      update: {},
    }).catch(() => {});
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, adminNote = "" } = body as { status: string; adminNote?: string };

    if (!status) return NextResponse.json({ error: "Missing status" }, { status: 400 });

    // Bulk: productIds array
    if (Array.isArray(body.productIds) && body.productIds.length > 0) {
      await Promise.all(
        body.productIds.map((id: string) =>
          approveOrRejectProduct(id, status as ProductStatus, adminNote)
        )
      );
      return NextResponse.json({ message: `${body.productIds.length} products ${status.toLowerCase()}` });
    }

    // Single: productId string
    if (body.productId) {
      await approveOrRejectProduct(body.productId, status as ProductStatus, adminNote);
      return NextResponse.json({ message: `Product ${status.toLowerCase()} successfully` });
    }

    return NextResponse.json({ error: "Missing productId or productIds" }, { status: 400 });
  } catch (error) {
    console.error("Admin product update error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
