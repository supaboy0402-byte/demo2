// lib/api.ts
const envBase = process.env.NEXT_PUBLIC_API_BASE_URL

// QUAN TRỌNG: default phải là "/api" (proxy next) chứ KHÔNG phải localhost
export const apiBase = typeof envBase === "string" && envBase.trim().length > 0 ? envBase.trim() : "/api"

function toAbsoluteIfNeeded(base: string) {
  // Client: relative OK
  if (typeof window !== "undefined") return base

  // Server: nếu base là "/api" thì convert thành "https://<domain>/api"
  if (base.startsWith("/")) {
    // Vercel luôn có VERCEL_URL (dạng: demo2-one-lilac.vercel.app)
    const vercel = process.env.VERCEL_URL
    if (vercel) return `https://${vercel}${base}`

    // Local SSR fallback
    const port = process.env.PORT || "3000"
    return `http://localhost:${port}${base}`
  }

  return base
}

export async function api(path: string, options?: RequestInit) {
  const isForm = typeof FormData !== "undefined" && options?.body instanceof FormData
  const headers = {
    ...(options?.headers || {}),
    ...(isForm ? {} : { "Content-Type": "application/json" }),
  }

  // Thử lần lượt: /api (đã convert absolute trên server) -> apiBase -> fallback localhost (dev)
  const candidates = Array.from(
    new Set(
      [
        apiBase,
        "/api",
        "http://localhost:5077",
        "https://localhost:7132",
        "https://localhost:44377",
        "http://localhost:50777",
      ].filter(Boolean)
    )
  )

  let lastErr: any = null
  let lastResponse: Response | null = null

  for (const base0 of candidates) {
    try {
      const base = toAbsoluteIfNeeded(base0)
      const b = base.endsWith("/") ? base.slice(0, -1) : base

      let p = path.startsWith("/") ? path : `/${path}`

      // Tránh bị /api/api/...
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

      if (r.ok) {
        const contentType = r.headers.get("content-type") || ""
        if (contentType.includes("application/json")) return r.json()
        return r.text()
      }

      lastResponse = r
    } catch (e) {
      lastErr = e
    }
  }

  if (lastResponse && !lastResponse.ok) {
    throw new Error(`HTTP ${lastResponse.status}`)
  }

  throw lastErr || new Error("Network error")
}
