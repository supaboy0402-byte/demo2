const envBase = process.env.NEXT_PUBLIC_API_BASE_URL
export const apiBase = typeof envBase === 'string' && envBase.length > 0 ? envBase : 'http://localhost:5077'

export async function api(path: string, options?: RequestInit) {
  const isForm = typeof FormData !== 'undefined' && options?.body instanceof FormData
  const headers = {
    ...(options?.headers || {}),
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
  }
  const candidates = Array.from(
    new Set(
      [
        '/api',
        apiBase,
        'http://localhost:5077',
        'https://localhost:7132',
        'https://localhost:44377',
        'http://localhost:50777',
      ].filter((s) => typeof s === 'string' && s.length > 0)
    )
  )
  let lastErr: any = null
  let lastResponse: Response | null = null
  for (const base of candidates) {
    try {
      const b = base.endsWith('/') ? base.slice(0, -1) : base
      let p = path.startsWith('/') ? path : `/${path}`
      if ((b.endsWith('/api') || b === '/api') && p.startsWith('/api')) p = p.replace(/^\/api/, '')
      const r = await fetch(`${b}${p}`, {
        ...options,
        headers,
        credentials: 'include',
      })
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.log('api', base, path, r.status)
        } catch {}
      }
      if (r.ok) {
        const contentType = r.headers.get('content-type') || ''
        if (contentType.includes('application/json')) return r.json()
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
      if (body && typeof body === 'object' && 'message' in body) message = String((body as any).message)
    } catch {}
    throw new Error(message)
  }
  throw lastErr || new Error('Network error')
}
