import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const BASE = process.env.SOMEE_BASE_URL || "";

async function forward(req: NextRequest, path: string[]) {
  if (!BASE) return new Response("Missing SOMEE_BASE_URL", { status: 500 });

  const escaped = Array.isArray(path) ? path.map((s) => encodeURIComponent(s)) : [];
  const url = `${BASE}/api/${escaped.join("/")}${req.nextUrl.search}`;

  const method = req.method;
  const body =
    method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const headers = new Headers(req.headers);

  headers.delete("host");
  headers.delete("content-length");

  const res = await fetch(url, { method, headers, body });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

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
