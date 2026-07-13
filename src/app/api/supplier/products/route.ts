import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const name        = formData.get("name") as string;
    const price       = parseFloat(formData.get("price") as string);
    const costPrice   = formData.get("costPrice") ? parseFloat(formData.get("costPrice") as string) : null;
    const sku         = formData.get("sku") as string;
    const hsn         = (formData.get("hsn") as string) || null;
    const gstRateRaw  = formData.get("gstRate") as string;
    const gstRate     = gstRateRaw ? parseFloat(gstRateRaw) : null;
    const description = formData.get("description") as string;
    const category    = (formData.get("category") as string) || null;
    const moq         = formData.get("moq") ? parseInt(formData.get("moq") as string) : null;
    const weight      = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null;
    const length      = formData.get("length") ? parseFloat(formData.get("length") as string) : null;
    const width       = formData.get("width") ? parseFloat(formData.get("width") as string) : null;
    const height      = formData.get("height") ? parseFloat(formData.get("height") as string) : null;

    const variantsRaw = formData.get("variants") as string;
    const variants: { name: string; price: string; stock: string; sku: string }[] =
      variantsRaw ? JSON.parse(variantsRaw) : [];

    if (!name || !price || !sku || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (sku.length !== 10) {
      return NextResponse.json({ error: "SKU must be exactly 10 characters" }, { status: 400 });
    }

    // Check SKU uniqueness (product + variant SKUs)
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
        costPrice,
        sku,
        description,
        category,
        images: imageUrls,
        status: "PENDING",
        hsn,
        gstRate,
        moq,
        weight,
        length,
        width,
        height,
      },
    });

    // Create variants
    if (variants.length > 0) {
      await prisma.productVariant.createMany({
        data: variants
          .filter((v) => v.name.trim())
          .map((v) => ({
            productId: product.id,
            name: v.name.trim(),
            price: parseFloat(v.price) || price,
            stock: parseInt(v.stock) || 0,
            sku: v.sku?.trim() || null,
          })),
        skipDuplicates: true,
      });
    }

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
