import { NextRequest, NextResponse } from "next/server";
import { cjFetch } from "@/lib/cj";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productName = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const pageNum = searchParams.get("page") ?? "1";

  try {
    const params: Record<string, string> = { pageNum, pageSize: "20" };
    if (productName) params.productName = productName;
    if (categoryId) params.categoryId = categoryId;

    const data = await cjFetch("/product/list", params);

    if (!data.result) {
      return NextResponse.json({ error: data.message ?? "CJ API error" }, { status: 400 });
    }

    return NextResponse.json({
      products: data.data?.list ?? [],
      total: data.data?.total ?? 0,
      pageNum: Number(pageNum),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
