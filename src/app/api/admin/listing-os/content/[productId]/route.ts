import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { computeOptimizationScore } from "@/lib/listing/optimization";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;

  const content = await prisma.listingContent.findUnique({
    where:   { productId },
    include: { product: { select: { id: true, name: true, sku: true, images: true, hsn: true, gstRate: true, category: true, description: true } } },
  });

  return NextResponse.json({ content });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;
  const body = await req.json().catch(() => ({}));

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, images: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const existing = await prisma.listingContent.findUnique({ where: { productId } });
  if (existing) return NextResponse.json({ error: "Content already exists. Use PATCH to update." }, { status: 409 });

  const score = computeOptimizationScore({
    title:       body.title,
    bullets:     body.bullets,
    description: body.description,
    keywords:    body.keywords,
    searchTerms: body.searchTerms,
    brand:       body.brand,
    category:    body.category,
    hsn:         body.hsn,
    gstRate:     body.gstRate,
    imageCount:  product.images.length,
  });

  const content = await prisma.listingContent.create({
    data: {
      productId,
      title:          body.title          ?? null,
      bullets:        body.bullets        ?? [],
      description:    body.description    ?? null,
      specifications: body.specifications as Prisma.InputJsonValue ?? Prisma.JsonNull,
      keywords:       body.keywords       ?? [],
      searchTerms:    body.searchTerms    ?? [],
      category:       body.category       ?? null,
      hsn:            body.hsn            ?? null,
      gstRate:        body.gstRate        ?? null,
      brand:          body.brand          ?? null,
      attributes:     body.attributes     as Prisma.InputJsonValue ?? Prisma.JsonNull,
      optimizationScore: score,
    },
  });

  // Create initial version
  await prisma.listingContentVersion.create({
    data: {
      listingContentId: content.id,
      version:          1,
      title:            body.title       ?? null,
      bullets:          body.bullets     ?? [],
      description:      body.description ?? null,
      specifications:   body.specifications as Prisma.InputJsonValue ?? Prisma.JsonNull,
      keywords:         body.keywords    ?? [],
      searchTerms:      body.searchTerms ?? [],
      category:         body.category    ?? null,
      hsn:              body.hsn         ?? null,
      gstRate:          body.gstRate     ?? null,
      brand:            body.brand       ?? null,
      attributes:       body.attributes  as Prisma.InputJsonValue ?? Prisma.JsonNull,
      changeNote:       body.changeNote  ?? "Initial content",
      createdById:      session.user.id,
    },
  });

  return NextResponse.json({ content }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.listingContent.findUnique({
    where:  { productId },
    select: { id: true, _count: { select: { versions: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Content not found. Use POST to create." }, { status: 404 });

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { images: true },
  });

  const score = computeOptimizationScore({
    title:       body.title,
    bullets:     body.bullets,
    description: body.description,
    keywords:    body.keywords,
    searchTerms: body.searchTerms,
    brand:       body.brand,
    category:    body.category,
    hsn:         body.hsn,
    gstRate:     body.gstRate,
    imageCount:  product?.images.length ?? 0,
  });

  const nextVersion = existing._count.versions + 1;

  const [content] = await prisma.$transaction([
    prisma.listingContent.update({
      where: { productId },
      data:  {
        ...(body.title          !== undefined ? { title:          body.title }          : {}),
        ...(body.bullets        !== undefined ? { bullets:        body.bullets }        : {}),
        ...(body.description    !== undefined ? { description:    body.description }    : {}),
        ...(body.specifications !== undefined ? { specifications: body.specifications as Prisma.InputJsonValue } : {}),
        ...(body.keywords       !== undefined ? { keywords:       body.keywords }       : {}),
        ...(body.searchTerms    !== undefined ? { searchTerms:    body.searchTerms }    : {}),
        ...(body.category       !== undefined ? { category:       body.category }       : {}),
        ...(body.hsn            !== undefined ? { hsn:            body.hsn }            : {}),
        ...(body.gstRate        !== undefined ? { gstRate:        body.gstRate }        : {}),
        ...(body.brand          !== undefined ? { brand:          body.brand }          : {}),
        ...(body.attributes     !== undefined ? { attributes:     body.attributes as Prisma.InputJsonValue } : {}),
        optimizationScore: score,
      },
    }),
    prisma.listingContentVersion.create({
      data: {
        listingContentId: existing.id,
        version:          nextVersion,
        title:            body.title          ?? null,
        bullets:          body.bullets        ?? [],
        description:      body.description    ?? null,
        specifications:   body.specifications as Prisma.InputJsonValue ?? Prisma.JsonNull,
        keywords:         body.keywords       ?? [],
        searchTerms:      body.searchTerms    ?? [],
        category:         body.category       ?? null,
        hsn:              body.hsn            ?? null,
        gstRate:          body.gstRate        ?? null,
        brand:            body.brand          ?? null,
        attributes:       body.attributes     as Prisma.InputJsonValue ?? Prisma.JsonNull,
        changeNote:       body.changeNote     ?? null,
        createdById:      session.user.id,
      },
    }),
  ]);

  return NextResponse.json({ content, score });
}
