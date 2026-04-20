import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { WarehousePanel } from "@prisma/client";

export async function GET(req: NextRequest)() {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const warehouses = await prisma.warehouse.findMany({
      where: { supplierId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ warehouses });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest)(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, contactName, phone, addressLine1, addressLine2, pincode, city, state, email, targetPanel } = body;

    if (!name || !contactName || !phone || !addressLine1 || !pincode || !city || !state) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        supplierId: session.user.id,
        name,
        contactName,
        phone,
        addressLine1,
        addressLine2: addressLine2 || null,
        pincode,
        city,
        state,
        email: email || null,
        targetPanel: (targetPanel as WarehousePanel) || "BOTH",
        status: "PENDING",
      },
    });

    // Notify admin
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "GENERAL",
          title: "New Warehouse Request",
          message: `${session.user.name} requested a new warehouse: "${name}" in ${city}, ${state}.`,
          data: { warehouseId: warehouse.id },
        },
      });
    }

    return NextResponse.json({ message: "Warehouse request submitted", warehouse }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
