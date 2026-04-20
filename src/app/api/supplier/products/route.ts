import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const sku = formData.get("sku") as string;
    const hsnCode = formData.get("hsnCode") as string;
    const gstRate = formData.get("gstRate") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;

    if (!name || !price || !sku || !hsnCode || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (sku.length !== 10) {
      return NextResponse.json({ error: "SKU must be exactly 10 characters" }, { status: 400 });
    }

    // Check SKU uniqueness
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }

    // Upload images to Cloudinary
    const imageFiles = formData.getAll("images") as File[];
    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const url = await uploadImageToCloudinary(file);
        imageUrls.push(url);
      }
    }

    const product = await prisma.product.create({
      data: {
        supplierId: session.user.id,
        name,
        price,
        sku,
        description,
        category: category || null,
        images: imageUrls,
        status: "PENDING",
      },
    });

    // Create notification for admin
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "GENERAL",
          title: "New Product Submitted",
          message: `${session.user.name} submitted "${name}" for approval.`,
          data: { productId: product.id },
        },
      });
    }

    return NextResponse.json({ message: "Product submitted successfully", productId: product.id }, { status: 201 });
  } catch (error: any) {
    console.error("Submit product error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { supplierId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
