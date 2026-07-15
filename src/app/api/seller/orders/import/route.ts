import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { dispatchEvent } from "@/lib/automation/engine";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  // Parse header, handling quoted fields
  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        cells.push(cur.trim()); cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, "_"));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ""; });
    rows.push(row);
  }
  return rows;
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sellerId = session.user.id;
  const text = await req.text();
  const rows = parseCSV(text);

  if (rows.length === 0)
    return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 });

  let created = 0, skipped = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed + header

    const externalOrderId = row["order_id"] ?? row["order_#"] ?? row["order_number"] ?? "";
    if (!externalOrderId) {
      errors.push({ row: rowNum, message: "Missing order_id" });
      skipped++;
      continue;
    }

    const productName = row["product_name"] ?? row["product"] ?? row["item_name"] ?? "";
    if (!productName) {
      errors.push({ row: rowNum, message: `Row ${rowNum}: Missing product_name` });
      skipped++;
      continue;
    }

    const quantity   = parseInt(row["quantity"] ?? row["qty"] ?? "1", 10) || 1;
    const unitPrice  = parseFloat(row["unit_price"] ?? row["price"] ?? "0") || 0;
    const totalAmountRaw = parseFloat(row["total_amount"] ?? row["amount"] ?? "0");
    const totalAmount = totalAmountRaw > 0 ? totalAmountRaw : unitPrice * quantity;

    const sku        = row["sku"] ?? "";
    const courier    = row["courier"] ?? "";
    const awb        = row["awb"] ?? row["awb_number"] ?? "";
    const rawStatus  = (row["status"] ?? "NEW").toUpperCase();
    const validStatuses = ["NEW","PROCESSING","SHIPPED","IN_TRANSIT","DELIVERED","CANCELLED","RTO"];
    const status     = validStatuses.includes(rawStatus) ? rawStatus : "NEW";

    const orderDateRaw = row["order_date"] ?? row["date"] ?? "";
    const createdAt    = orderDateRaw ? new Date(orderDateRaw) : undefined;

    const phone   = row["phone"] ?? row["customer_phone"] ?? "";
    const address = row["address"] ?? "";
    const city    = row["city"] ?? "";
    const state   = row["state"] ?? "";
    const pincode = row["pincode"] ?? row["zip"] ?? "";
    const customerName  = row["customer_name"] ?? row["name"] ?? "";
    const customerEmail = row["customer_email"] ?? row["email"] ?? "";

    try {
      await prisma.order.create({
        data: {
          sellerId,
          externalOrderId,
          source:        "OTHER",
          status:        status as never,
          customerName:  customerName  || null,
          customerEmail: customerEmail || null,
          customerAddress: (phone || address || city) ? { phone, address, city, state, pincode } : undefined,
          totalAmount,
          awbNumber: awb   || null,
          courier:   courier || null,
          ...(createdAt && !isNaN(createdAt.getTime()) ? { createdAt } : {}),
          items: {
            create: [{
              name:     productName,
              sku:      sku || null,
              quantity,
              price:    unitPrice,
            }],
          },
        },
      });
      const newOrder = await prisma.order.findFirst({ where: { externalOrderId, sellerId }, select: { id: true } });
      if (newOrder) dispatchEvent({ type: "ORDER_CREATED", entityId: newOrder.id, entityType: "ORDER",
                                    payload: { sellerId, externalOrderId, status } });
      created++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("Unique constraint")) {
        skipped++;
      } else {
        errors.push({ row: rowNum, message: msg });
        skipped++;
      }
    }
  }

  return NextResponse.json({ created, skipped, errors: errors.slice(0, 20) });
}
