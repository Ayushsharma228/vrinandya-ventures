const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getCJToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken!;

  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.CJ_EMAIL,
      password: process.env.CJ_API_KEY,
    }),
  });

  const data = await res.json();
  if (!data.result || !data.data?.accessToken) {
    throw new Error(`CJ auth failed: ${data.message ?? "unknown error"}`);
  }

  cachedToken = data.data.accessToken;
  tokenExpiry = Date.now() + 20 * 60 * 1000; // 20 min cache
  return cachedToken!;
}

export async function cjFetch(path: string, params?: Record<string, string>) {
  const token = await getCJToken();
  const url = new URL(`${CJ_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { "CJ-Access-Token": token },
  });
  return res.json();
}
