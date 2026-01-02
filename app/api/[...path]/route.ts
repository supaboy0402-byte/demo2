import type { NextRequest } from "next/server";

export const runtime = "nodejs"; // quan trọng: để chạy fetch ổn định

const BASE = process.env.SOMEE_BASE_URL || ""; // ví dụ: http://harmony-music.somee.com

async function forward(req: NextRequest, path: string[]) {
  if (!BASE) return new Response("Missing SOMEE_BASE_URL", { status: 500 });

  // ✅ luôn forward sang backend /api/...
  const url = `${BASE}/api/${path.join("/")}${req.nextUrl.search}`;

  const method = req.method;
  const body =
    method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const headers = new Headers(req.headers);

  // tránh vài header gây lỗi khi forward
  headers.delete("host");
  headers.delete("content-length");

  const res = await fetch(url, { method, headers, body });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

// ✅ params phải await
type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function HEAD(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
