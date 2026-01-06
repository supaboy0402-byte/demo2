// lib/api.ts
const envBase = process.env.NEXT_PUBLIC_API_BASE_URL

// Ưu tiên dùng /api (proxy Next) để chạy được cả local + vercel.
// Nếu bạn muốn gọi thẳng backend, set NEXT_PUBLIC_API_BASE_URL = "https://your-backend-domain"
export const apiBase =
  typeof envBase === "string" && envBase.trim().length > 0 ? envBase.trim() : "/api"

// Convert base relative ("/api") -> absolute ("https://<host>/api") khi chạy server (SSR)
async function normalizeBase(base: string): Promise<string> {
  const b = String(base || "").trim()
  if (!b) return b

  // Client: relative URL OK
  if (typeof window !== "undefined") return b

  // Server: nếu là relative (/api) thì cần origin
  if (b.startsWith("/")) {
    // 1) Vercel cung cấp VERCEL_URL (thường không có protocol)
    const vercelUrl = process.env.VERCEL_URL
    if (vercelUrl) {
      const origin = vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`
      return `${origin}${b}`
    }

    // 2) Nếu bạn có set sẵn site url thì dùng
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.SITE_URL ||
      process.env.APP_URL
    if (siteUrl) {
      const origin = siteUrl.replace(/\/$/, "")
      return `${origin}${b}`
    }

    // 3) Fallback: lấy host/proto từ request headers (App Router)
    try {
const { headers } = await import("next/headers")
const h = await headers()

const proto = h.get("x-forwarded-proto") ?? "https"
const host = h.get("x-forwarded-host") ?? h.get("host")
      if (host) return `${proto}://${host}${b}`
    } catch {
      // ignore
    }
  }

  return b
}

export async function api(path: string, options?: RequestInit) {
  const isForm = typeof FormData !== "undefined" && options?.body instanceof FormData

  const headers: Record<string, string> = {
    ...(options?.headers as any),
    ...(isForm ? {} : { "Content-Type": "application/json" }),
  }

  const candidates = Array.from(
    new Set(
      [
        "/api",
        apiBase,
        "http://localhost:5077",
        "https://localhost:7132",
        "https://localhost:44377",
        "http://localhost:50777",
      ].filter((s) => typeof s === "string" && s.length > 0)
    )
  )

  let lastErr: any = null
  let lastResponse: Response | null = null

  for (const base0 of candidates) {
    try {
      const base1 = await normalizeBase(base0)
      const b = base1.endsWith("/") ? base1.slice(0, -1) : base1

      let p = path.startsWith("/") ? path : `/${path}`

      // Nếu base là /api mà path lại bắt đầu /api/... => bỏ /api ở đầu path để tránh /api/api/xxx
      if ((b.endsWith("/api") || b === "/api") && p.startsWith("/api")) {
        p = p.replace(/^\/api/, "")
      }

      const url = `${b}${p}`

      const r = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
        cache: "no-store",
      })

      if (process.env.NODE_ENV !== "production") {
        try {
          console.log("api", base0, "=>", url, r.status)
        } catch {}
      }

      if (r.ok) {
        const contentType = r.headers.get("content-type") || ""
        if (contentType.includes("application/json")) return r.json()
        return r.text()
      }

      lastResponse = r
      continue
    } catch (e) {
      lastErr = e
      continue
    }
  }

  if (lastResponse && !lastResponse.ok) {
    let message = `HTTP ${lastResponse.status}`
    try {
      const body = await lastResponse.json()
      if (body && typeof body === "object" && "message" in body) {
        message = String((body as any).message)
      }
    } catch {}
    throw new Error(message)
  }

  throw lastErr || new Error("Network error")
}
