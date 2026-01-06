import type { NextRequest } from "next/server"

export const runtime = "nodejs"

const BASE = process.env.SOMEE_BASE_URL || ""

function buildUrl(req: NextRequest, path: string[]) {
  const base = BASE.replace(/\/+$/, "")
  const escaped = Array.isArray(path) ? path.map((s) => encodeURIComponent(s)) : []
  return `${base}/${escaped.join("/")}${req.nextUrl.search}`
}

async function forward(req: NextRequest, path: string[]) {
  if (!BASE) return new Response("Missing SOMEE_BASE_URL", { status: 500 })
  const url = buildUrl(req, path)
  const method = req.method.toUpperCase()
  const headers = new Headers(req.headers)
  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")
  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer()
  const res = await fetch(url, { method, headers, body, redirect: "manual", cache: "no-store" })
  const outHeaders = new Headers(res.headers)
  outHeaders.delete("content-encoding")
  if (method === "GET") {
    outHeaders.set("cache-control", "public, max-age=300")
  }
  return new Response(res.body, { status: res.status, headers: outHeaders })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return forward(req, path)
}
export async function HEAD(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return forward(req, path)
}
export async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return forward(req, path)
}
