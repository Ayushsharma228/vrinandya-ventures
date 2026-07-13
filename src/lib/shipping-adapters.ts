export interface ShipmentInput {
  externalOrderId: string;
  customerName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  totalAmount: number;
  productDesc: string;
  weight?: number;
}

export interface ShipmentResult {
  awb: string;
  courier: string;
  trackingUrl?: string;
}

// ── Shiprocket ────────────────────────────────────────────────────────────────
export async function shiprocketCreateShipment(
  email: string,
  password: string,
  input: ShipmentInput
): Promise<ShipmentResult> {
  // 1. Authenticate
  const loginRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginData = await loginRes.json();
  if (!loginData.token) throw new Error(`Shiprocket auth failed: ${loginData.message ?? "no token"}`);
  const token = loginData.token as string;

  // 2. Create order
  const orderRes = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      order_id: input.externalOrderId,
      order_date: new Date().toISOString().split("T")[0],
      billing_customer_name: input.customerName,
      billing_last_name: "",
      billing_address: input.address,
      billing_city: input.city,
      billing_state: input.state,
      billing_country: "India",
      billing_pincode: input.pincode,
      billing_phone: input.phone,
      shipping_is_billing: true,
      order_items: [{
        name: input.productDesc,
        sku: input.externalOrderId,
        units: 1,
        selling_price: input.totalAmount,
      }],
      payment_method: "COD",
      sub_total: input.totalAmount,
      length: 10, breadth: 10, height: 5,
      weight: input.weight ?? 0.5,
    }),
  });
  const orderData = await orderRes.json();
  if (!orderData.shipment_id) {
    throw new Error(`Shiprocket order failed: ${orderData.message ?? JSON.stringify(orderData)}`);
  }

  // 3. Assign AWB
  const awbRes = await fetch("https://apiv2.shiprocket.in/v1/external/courier/assign/awb", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ shipment_id: orderData.shipment_id }),
  });
  const awbData = await awbRes.json();
  const awb = awbData?.response?.data?.awb_code as string | undefined;
  if (!awb) throw new Error(`Shiprocket AWB failed: ${awbData?.response?.data?.remark ?? "no AWB returned"}`);

  return {
    awb,
    courier: (awbData?.response?.data?.courier_name as string) ?? "Shiprocket",
    trackingUrl: `https://shiprocket.co/tracking/${awb}`,
  };
}

// ── Delhivery ─────────────────────────────────────────────────────────────────
export async function delhiveryCreateShipment(
  apiToken: string,
  input: ShipmentInput
): Promise<ShipmentResult> {
  // Fetch pickup location name
  let pickupLocation = "SELF";
  try {
    const wRes = await fetch("https://track.delhivery.com/api/backend/clientwarehouse/get/", {
      headers: { Authorization: `Token ${apiToken}` },
    });
    if (wRes.ok) {
      const wData = await wRes.json();
      const warehouses = wData?.results ?? wData?.data ?? [];
      if (warehouses.length > 0) pickupLocation = warehouses[0].name;
    }
  } catch { /* use default */ }

  const payload = {
    shipments: [{
      name: input.customerName,
      add: input.address,
      city: input.city,
      state: input.state,
      country: "India",
      pin: input.pincode,
      phone: input.phone.replace(/\D/g, "").slice(-10),
      order: input.externalOrderId,
      payment_mode: "COD",
      return_pin: "", return_city: "", return_phone: "",
      return_add: "", return_state: "", return_country: "India",
      products_desc: input.productDesc,
      hsn_code: "",
      cod_amount: input.totalAmount,
      order_date: new Date().toISOString().replace("T", " ").split(".")[0],
      total_amount: input.totalAmount,
      seller_add: "", seller_name: "", seller_inv: input.externalOrderId,
      quantity: 1,
      waybill: "",
      shipment_width: 13, shipment_height: 4,
      weight: input.weight ?? 0.5,
      shipment_length: 23,
      pickup_location: pickupLocation,
    }],
    pickup_location: { name: pickupLocation },
  };

  const res = await fetch("https://track.delhivery.com/api/cmu/create.json", {
    method: "POST",
    headers: { Authorization: `Token ${apiToken}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: `format=json&data=${encodeURIComponent(JSON.stringify(payload))}`,
  });

  if (!res.ok) throw new Error(`Delhivery HTTP ${res.status}`);
  const result = await res.json();
  const pkg = result?.packages?.[0];
  if (!pkg?.waybill || pkg?.status === "Error") {
    throw new Error(pkg?.remark ?? result?.rmk ?? "Delhivery shipment failed");
  }

  return {
    awb: pkg.waybill as string,
    courier: "Delhivery",
    trackingUrl: `https://www.delhivery.com/track/package/${pkg.waybill}`,
  };
}

// ── Custom REST API ───────────────────────────────────────────────────────────
export async function customCreateShipment(
  apiKey: string,
  baseUrl: string,
  input: ShipmentInput
): Promise<ShipmentResult> {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Custom API HTTP ${res.status}`);
  const data = await res.json();
  const awb = data.awb ?? data.tracking_number ?? data.waybill ?? data.awb_code;
  if (!awb) throw new Error("Custom API did not return an AWB field");
  return {
    awb: String(awb),
    courier: data.courier ?? data.courier_name ?? "Custom",
    trackingUrl: data.tracking_url ?? data.trackingUrl,
  };
}
