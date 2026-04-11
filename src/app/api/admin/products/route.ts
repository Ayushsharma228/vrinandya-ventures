import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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
    const session = await getServerSession(authOptions);
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

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, status, adminNote } = await req.json();

    if (!productId || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { status: status as ProductStatus, adminNote: adminNote || null },
      include: { supplier: true },
    });

    // Notify supplier
    await prisma.notification.create({
      data: {
        userId: product.supplierId,
        type: status === "APPROVED" ? "PRODUCT_APPROVED" : "PRODUCT_REJECTED",
        title: status === "APPROVED" ? "Product Approved!" : "Product Rejected",
        message: status === "APPROVED"
          ? `Your product "${product.name}" has been approved and is now live on the platform.`
          : `Your product "${product.name}" was rejected. ${adminNote ? `Reason: ${adminNote}` : ""}`,
        data: { productId: product.id },
      },
    });

    return NextResponse.json({ message: `Product ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error("Admin product update error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
