import crypto from "crypto";

// ─── Constants ────────────────────────────────────────────────────────────────

export const SP_API_BASE = {
  eu: "https://sellingpartnerapi-eu.amazon.com", // covers EU + India
  na: "https://sellingpartnerapi-na.amazon.com",
  fe: "https://sellingpartnerapi-fe.amazon.com", // Japan, Australia
};

export const AWS_REGIONS = {
  eu: "eu-west-1",
  na: "us-east-1",
  fe: "us-west-2",
};

export const MARKETPLACE_IDS: Record<string, { name: string; region: keyof typeof SP_API_BASE; id: string }> = {
  IN: { name: "Amazon.in (India)",     region: "eu", id: "A21TJRUUN4KGV" },
  US: { name: "Amazon.com (USA)",      region: "na", id: "ATVPDKIKX0DER" },
  UK: { name: "Amazon.co.uk (UK)",     region: "eu", id: "A1F83G8C2ARO7P" },
  DE: { name: "Amazon.de (Germany)",   region: "eu", id: "A1PA6795UKMFR9" },
  AE: { name: "Amazon.ae (UAE)",       region: "eu", id: "A2VIGQ35RCS4UG" },
  JP: { name: "Amazon.co.jp (Japan)",  region: "fe", id: "A1VC38T7YXB528" },
};

const LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token";

// ─── Platform credentials (env vars) ─────────────────────────────────────────

function lwaCredentials() {
  const clientId     = process.env.AMAZON_CLIENT_ID;
  const clientSecret = process.env.AMAZON_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("AMAZON_CLIENT_ID / AMAZON_CLIENT_SECRET not set");
  return { clientId, clientSecret };
}

function awsCredentials() {
  const accessKey = process.env.AMAZON_AWS_ACCESS_KEY;
  const secretKey = process.env.AMAZON_AWS_SECRET_KEY;
  if (!accessKey || !secretKey) throw new Error("AMAZON_AWS_ACCESS_KEY / AMAZON_AWS_SECRET_KEY not set");
  return { accessKey, secretKey };
}

// ─── LWA token exchange ───────────────────────────────────────────────────────

export async function getLWAAccessToken(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = lwaCredentials();
  const res = await fetch(LWA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "refresh_token",
      refresh_token: refreshToken,
      client_id:     clientId,
      client_secret: clientSecret,
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LWA token exchange failed (${res.status}): ${err}`);
  }
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ─── AWS Signature V4 ─────────────────────────────────────────────────────────

function sha256hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function hmacSHA256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function getSigningKey(secretKey: string, dateStamp: string, region: string): Buffer {
  const kDate    = hmacSHA256(`AWS4${secretKey}`, dateStamp);
  const kRegion  = hmacSHA256(kDate, region);
  const kService = hmacSHA256(kRegion, "execute-api");
  return hmacSHA256(kService, "aws4_request");
}

// ─── Signed SP-API request ────────────────────────────────────────────────────

export interface SpApiOptions {
  method?: string;
  path: string;
  params?: Record<string, string>;
  body?: object;
  accessToken: string;
  region: keyof typeof SP_API_BASE;
}

export async function spApiRequest<T = unknown>(opts: SpApiOptions): Promise<T> {
  const { method = "GET", path, params = {}, body, accessToken, region } = opts;
  const { accessKey, secretKey } = awsCredentials();

  const baseUrl     = SP_API_BASE[region];
  const awsRegion   = AWS_REGIONS[region];
  const queryString = new URLSearchParams(params).toString();
  const url         = `${baseUrl}${path}${queryString ? "?" + queryString : ""}`;
  const parsedUrl   = new URL(url);
  const bodyStr     = body ? JSON.stringify(body) : "";

  const now       = new Date();
  const dateTime  = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "").slice(0, 15) + "Z";
  const dateStamp = dateTime.slice(0, 8);

  const rawHeaders: Record<string, string> = {
    "host":               parsedUrl.hostname,
    "x-amz-access-token": accessToken,
    "x-amz-date":         dateTime,
  };
  if (bodyStr) rawHeaders["content-type"] = "application/json";

  const sortedKeys      = Object.keys(rawHeaders).sort();
  const signedHeaders   = sortedKeys.join(";");
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${rawHeaders[k]}\n`).join("");

  const canonicalRequest = [
    method.toUpperCase(),
    parsedUrl.pathname,
    queryString,
    canonicalHeaders,
    signedHeaders,
    sha256hex(bodyStr),
  ].join("\n");

  const credentialScope = `${dateStamp}/${awsRegion}/execute-api/aws4_request`;
  const stringToSign    = ["AWS4-HMAC-SHA256", dateTime, credentialScope, sha256hex(canonicalRequest)].join("\n");

  const signingKey  = getSigningKey(secretKey, dateStamp, awsRegion);
  const signature   = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const requestHeaders: HeadersInit = {
    "x-amz-access-token": accessToken,
    "x-amz-date":         dateTime,
    "Authorization":      authorization,
    ...(bodyStr ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url, {
    method: method.toUpperCase(),
    headers: requestHeaders,
    body:    bodyStr || undefined,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SP-API ${method.toUpperCase()} ${path} → ${res.status}: ${errText}`);
  }
  return res.json() as Promise<T>;
}

// ─── Orders API ───────────────────────────────────────────────────────────────

export interface AmazonOrder {
  AmazonOrderId:        string;
  SellerOrderId?:       string;
  PurchaseDate:         string;
  LastUpdateDate:       string;
  OrderStatus:          string;
  FulfillmentChannel:   string;
  SalesChannel?:        string;
  OrderTotal?:          { Amount: string; CurrencyCode: string };
  NumberOfItemsShipped: number;
  NumberOfItemsUnshipped: number;
  BuyerInfo?:           { BuyerEmail?: string; BuyerName?: string };
  ShippingAddress?: {
    Name?:            string;
    AddressLine1?:    string;
    AddressLine2?:    string;
    City?:            string;
    StateOrRegion?:   string;
    PostalCode?:      string;
    CountryCode?:     string;
    Phone?:           string;
  };
}

export interface AmazonOrderItem {
  ASIN:            string;
  SellerSKU?:      string;
  OrderItemId:     string;
  Title:           string;
  QuantityOrdered: number;
  ItemPrice?:      { Amount: string; CurrencyCode: string };
}

export async function getAmazonOrders(
  accessToken: string,
  marketplaceId: string,
  region: keyof typeof SP_API_BASE,
  createdAfter: Date,
  nextToken?: string,
): Promise<{ orders: AmazonOrder[]; nextToken?: string }> {
  const params: Record<string, string> = {
    MarketplaceIds: marketplaceId,
    CreatedAfter:   createdAfter.toISOString(),
  };
  if (nextToken) params.NextToken = nextToken;

  const data = await spApiRequest<{
    payload: { Orders: AmazonOrder[]; NextToken?: string };
  }>({ path: "/orders/v0/orders", params, accessToken, region });

  return {
    orders:    data.payload?.Orders ?? [],
    nextToken: data.payload?.NextToken,
  };
}

export async function getOrderItems(
  accessToken: string,
  orderId: string,
  region: keyof typeof SP_API_BASE,
): Promise<AmazonOrderItem[]> {
  const data = await spApiRequest<{
    payload: { OrderItems: AmazonOrderItem[] };
  }>({ path: `/orders/v0/orders/${orderId}/orderItems`, accessToken, region });
  return data.payload?.OrderItems ?? [];
}

// ─── Catalog / Listings API ───────────────────────────────────────────────────

export interface CatalogItem {
  asin:          string;
  summaries?:    { itemName?: string; brand?: string }[];
  images?:       { images?: { link: string; height: number; width: number }[] }[];
}

export async function searchCatalog(
  accessToken: string,
  marketplaceId: string,
  region: keyof typeof SP_API_BASE,
  keywords: string,
): Promise<CatalogItem[]> {
  const data = await spApiRequest<{ items?: CatalogItem[] }>({
    path:   "/catalog/2022-04-01/items",
    params: { marketplaceIds: marketplaceId, keywords, includedData: "summaries,images" },
    accessToken,
    region,
  });
  return data.items ?? [];
}

export async function getSellerListings(
  accessToken: string,
  sellerId: string,
  marketplaceId: string,
  region: keyof typeof SP_API_BASE,
): Promise<unknown[]> {
  const data = await spApiRequest<{ items?: unknown[] }>({
    path:   `/listings/2021-08-01/items/${sellerId}`,
    params: { marketplaceIds: marketplaceId },
    accessToken,
    region,
  });
  return data.items ?? [];
}

// ─── Reports API (Settlements) ────────────────────────────────────────────────

export async function requestReport(
  accessToken: string,
  marketplaceId: string,
  region: keyof typeof SP_API_BASE,
  reportType: string,
  dataStartTime?: string,
): Promise<string> {
  const data = await spApiRequest<{ reportId: string }>({
    method: "POST",
    path:   "/reports/2021-06-30/reports",
    body: {
      reportType,
      marketplaceIds:   [marketplaceId],
      ...(dataStartTime ? { dataStartTime } : {}),
    },
    accessToken,
    region,
  });
  return data.reportId;
}

export async function getReportStatus(
  accessToken: string,
  reportId: string,
  region: keyof typeof SP_API_BASE,
): Promise<{ processingStatus: string; reportDocumentId?: string }> {
  const data = await spApiRequest<{ processingStatus: string; reportDocumentId?: string }>({
    path:   `/reports/2021-06-30/reports/${reportId}`,
    accessToken,
    region,
  });
  return data;
}

export async function getReportDocument(
  accessToken: string,
  documentId: string,
  region: keyof typeof SP_API_BASE,
): Promise<string> {
  const data = await spApiRequest<{ url: string; compressionAlgorithm?: string }>({
    path:   `/reports/2021-06-30/documents/${documentId}`,
    accessToken,
    region,
  });
  // Fetch the actual document content
  const res = await fetch(data.url);
  return res.text();
}

// ─── Connection test ──────────────────────────────────────────────────────────

export async function testAmazonConnection(
  refreshToken: string,
  marketplaceId: string,
  region: keyof typeof SP_API_BASE,
): Promise<{ ok: boolean; error?: string; orderCount?: number }> {
  try {
    const accessToken = await getLWAAccessToken(refreshToken);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { orders } = await getAmazonOrders(accessToken, marketplaceId, region, thirtyDaysAgo);
    return { ok: true, orderCount: orders.length };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─── Order status mapping ─────────────────────────────────────────────────────

export function mapAmazonStatus(amazonStatus: string): string {
  switch (amazonStatus) {
    case "Pending":
    case "PendingAvailability":
      return "NEW";
    case "Unshipped":
    case "PartiallyShipped":
      return "PROCESSING";
    case "Shipped":
      return "SHIPPED";
    case "InvoiceUnconfirmed":
      return "PROCESSING";
    case "Canceled":
      return "CANCELLED";
    case "Unfulfillable":
      return "CANCELLED";
    default:
      return "NEW";
  }
}
