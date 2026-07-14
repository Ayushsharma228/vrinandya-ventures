export interface ParsedRow {
  marketplaceOrderId: string;
  grossAmount: number;
  marketplaceFee: number;
  tds: number;
  shippingFee: number;
  netAmount: number;
  rawData: Record<string, string>;
}

function parseFloat2(v: string | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[₹,\s]/g, "").replace(/[()]/g, (c) => (c === "(" ? "-" : "")));
  return isNaN(n) ? 0 : n;
}

function parseCsvLine(line: string): string[] {
  const cols: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { cols.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  cols.push(cur.trim());
  return cols;
}

function csvToRows(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
  const rows = lines.slice(1).map(line => {
    const vals = parseCsvLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });
  return { headers, rows };
}

// ── Amazon ────────────────────────────────────────────────────────────────────
// Handles both Amazon Seller Central settlement CSV and flat MIS exports.
// Common columns: order id | product sales | selling fees | total
export function parseAmazon(text: string): ParsedRow[] {
  const { rows } = csvToRows(text);
  const results: ParsedRow[] = [];

  for (const row of rows) {
    const orderId =
      row["order id"] || row["order-id"] || row["amazon order id"] || row["orderid"] || "";
    if (!orderId || orderId.toLowerCase().includes("total")) continue;

    const gross      = parseFloat2(row["product sales"]         || row["selling price"] || row["amount"]);
    const fee        = Math.abs(parseFloat2(row["selling fees"]  || row["commission"]   || row["marketplace fee"] || "0"));
    const shipping   = Math.abs(parseFloat2(row["shipping credits"] || row["shipping"] || "0"));
    const tds        = Math.abs(parseFloat2(row["tds"]          || row["marketplace withheld tax"] || "0"));
    const net        = parseFloat2(row["total"]                  || row["net amount"]   || row["net payment"] || "0");

    results.push({ marketplaceOrderId: orderId.trim(), grossAmount: gross, marketplaceFee: fee, tds, shippingFee: shipping, netAmount: net || (gross - fee - tds), rawData: row });
  }
  return results;
}

// ── Flipkart ──────────────────────────────────────────────────────────────────
// Typical columns: Sub Order ID, Final Amount, Commission, Shipping Charges, Net Amount
export function parseFlipkart(text: string): ParsedRow[] {
  const { rows } = csvToRows(text);
  const results: ParsedRow[] = [];

  for (const row of rows) {
    const orderId =
      row["sub order id"] || row["suborderid"] || row["order id"] || row["sub_order_id"] || "";
    if (!orderId) continue;

    const gross    = parseFloat2(row["final amount"]    || row["order amount"] || row["selling price"] || "0");
    const fee      = Math.abs(parseFloat2(row["commission"]         || row["commission amount"] || "0"));
    const shipping = Math.abs(parseFloat2(row["shipping charges"]   || row["forward shipping charges"] || "0"));
    const tds      = Math.abs(parseFloat2(row["tds"]               || "0"));
    const net      = parseFloat2(row["net amount"]       || row["amount to be paid"] || row["settlement amount"] || "0");

    results.push({ marketplaceOrderId: orderId.trim(), grossAmount: gross, marketplaceFee: fee, tds, shippingFee: shipping, netAmount: net || (gross - fee - shipping - tds), rawData: row });
  }
  return results;
}

// ── Meesho ────────────────────────────────────────────────────────────────────
// Typical columns: Sub Order No, Selling Price, Platform Fee, Net Payment Amount
export function parseMeesho(text: string): ParsedRow[] {
  const { rows } = csvToRows(text);
  const results: ParsedRow[] = [];

  for (const row of rows) {
    const orderId =
      row["sub order no"] || row["sub_order_no"] || row["suborderno"] || row["order id"] || row["order no"] || "";
    if (!orderId) continue;

    const gross    = parseFloat2(row["selling price"]        || row["customer paid"]   || "0");
    const fee      = Math.abs(parseFloat2(row["platform fee"]      || row["commission"]       || "0"));
    const shipping = Math.abs(parseFloat2(row["shipping fee"]      || row["shipping charge"]  || "0"));
    const tds      = Math.abs(parseFloat2(row["tds"]               || "0"));
    const net      = parseFloat2(row["net payment amount"]   || row["net amount"]       || row["amount payable"] || "0");

    results.push({ marketplaceOrderId: orderId.trim(), grossAmount: gross, marketplaceFee: fee, tds, shippingFee: shipping, netAmount: net || (gross - fee - shipping - tds), rawData: row });
  }
  return results;
}

export function parseMarketplaceCsv(marketplace: string, text: string): ParsedRow[] {
  switch (marketplace.toUpperCase()) {
    case "AMAZON":   return parseAmazon(text);
    case "FLIPKART": return parseFlipkart(text);
    case "MEESHO":   return parseMeesho(text);
    default:         throw new Error(`Unknown marketplace: ${marketplace}`);
  }
}
