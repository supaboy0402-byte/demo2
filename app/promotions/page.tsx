"use client"
export const dynamic = "force-dynamic"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowRight, Clock } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { api, apiBase } from "@/lib/api"

function resolveImg(url: string | null | undefined, base?: string) {
  const u = String(url || "").trim()
  if (!u) return "/placeholder.svg"
  if (/^(https?:|data:|blob:)/i.test(u)) return u
  const b = base || apiBase
  return `${b}${u.startsWith("/") ? u : `/${u}`}`
}

function formatDate(d: any) {
  try {
    const dt = typeof d === "string" ? new Date(d) : d instanceof Date ? d : null
    if (!dt || isNaN(dt.getTime())) return ""
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, "0")
    const dd = String(dt.getDate()).padStart(2, "0")
    return `${y}-${m}-${dd}`
  } catch {
    return ""
  }
}

function daysLeft(endDate?: string) {
  try {
    if (!endDate) return null
    const ed = new Date(endDate)
    if (isNaN(ed.getTime())) return null
    const today = new Date()
    const diffMs = ed.setHours(23, 59, 59, 999) - today.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return "Đã kết thúc"
    if (diffDays === 0) return "Kết thúc hôm nay"
    return `Còn ${diffDays} ngày`
  } catch {
    return null
  }
}

export default function PromotionsPage() {
  const [activePromotions, setActivePromotions] = useState<any[]>([])
  const [discountedProducts, setDiscountedProducts] = useState<any[]>([])
  const [activeCoupons, setActiveCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        // Promotions
        let promosRes: any = []
        try {
          promosRes = await api("/api/Promotions")
        } catch {
          promosRes = []
        }
        const promotions = Array.isArray(promosRes)
          ? promosRes.map((p: any) => ({
              title: p.title ?? p.Title ?? "",
              slug: p.slug ?? p.Slug ?? "",
              description: p.description ?? p.Description ?? "",
              image: resolveImg(p.featuredImage ?? p.FeaturedImage ?? ""),
              startDate: formatDate(p.startDate ?? p.StartDate),
              endDate: formatDate(p.endDate ?? p.EndDate),
              status: p.status ?? p.Status ?? 1,
            }))
          : []
        const todayStr = formatDate(new Date())
        const actPromos = promotions.filter((p: any) => {
          const s = p.startDate
          const e = p.endDate
          const isExpired = e && e < todayStr
          return p.status === 1 && !isExpired
        })
        actPromos.sort((a: any, b: any) => String(b.startDate || '').localeCompare(String(a.startDate || '')))
        setActivePromotions(actPromos)

        // Products + Images
        let productsRes: any = []
        let imagesRes: any = []
        try {
          productsRes = await api("/api/Products?status=1")
        } catch {
          productsRes = []
        }
        try {
          imagesRes = await api("/api/ProductImages")
        } catch {
          imagesRes = []
        }
        const imageMap: Record<number, string> = Array.isArray(imagesRes)
          ? imagesRes.reduce((acc: Record<number, string>, img: any) => {
              const pid = img.productId ?? img.ProductId
              const url = img.imageUrl ?? img.ImageUrl
              const isMain = img.isMain ?? img.IsMain
              if (pid == null) return acc
              if (isMain && url) acc[pid] = url
              return acc
            }, {})
          : {}
        const allProducts = Array.isArray(productsRes)
          ? productsRes.map((p: any) => {
            const unit = Number(p.unitPrice ?? p.UnitPrice ?? 0)
            const discVal = p.discountPrice ?? p.DiscountPrice
            const disc = discVal != null ? Number(discVal) : undefined
            const price = disc != null ? disc : unit
            const originalPrice = disc != null ? unit : undefined
            const createdAtStr = p.createdAt ?? p.CreatedAt
            const createdAt = createdAtStr ? new Date(createdAtStr) : null
            const isNew = createdAt ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24) <= 30 : false
            const idNum = p.productId ?? p.ProductId
            const img = resolveImg(imageMap[idNum] || "/placeholder.svg")
            return {
              id: String(idNum ?? ""),
              name: p.productName ?? p.ProductName ?? "",
              slug: p.slug ?? p.Slug ?? "",
              description: p.description ?? p.Description ?? "",
                price,
                originalPrice,
                image: img,
                images: [img],
                category: "",
                brand: "",
                stock: Number(p.quantity ?? p.Quantity ?? 0),
                isFeatured: !!(p.isFeatured ?? p.IsFeatured),
                isNew,
                specifications: {},
                rating: 0,
                reviewCount: 0,
              }
            })
          : []
        const discProducts = allProducts.filter((p: any) => p.originalPrice && p.originalPrice > p.price).slice(0, 4)
        setDiscountedProducts(discProducts)

        // Coupons
        let couponsRes: any = []
        try {
          couponsRes = await api("/api/Coupons")
        } catch {
          couponsRes = []
        }
        const now = new Date()
        const todayStr2 = formatDate(now)
        const actCoupons = Array.isArray(couponsRes)
          ? couponsRes
              .map((c: any) => ({
                id: c.couponId ?? c.CouponId,
                code: c.code ?? c.Code ?? "",
                discountType: c.discountType ?? c.DiscountType ?? "percent",
                discountValue: Number(c.discountValue ?? c.DiscountValue ?? 0),
                startDate: formatDate(c.startDate ?? c.StartDate),
                endDate: formatDate(c.endDate ?? c.EndDate),
                isActive: Boolean(c.isActive ?? c.IsActive ?? true),
                quantity: c.quantity ?? c.Quantity ?? null,
              }))
              .filter((c: any) => {
                const e = c.endDate
                const isExpired = e && e < todayStr2
                const hasLeft = c.quantity == null || Number(c.quantity) > 0
                return c.isActive && !isExpired && hasLeft
              })
              .sort((a: any, b: any) => String(a.code).localeCompare(String(b.code)))
          : []
        setActiveCoupons(actCoupons)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Khuyến mãi</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Đừng bỏ lỡ các chương trình khuyến mãi hấp dẫn và ưu đãi đặc biệt từ Harmony
        </p>
      </div>

      {/* Active Coupons */}
      <div className="mb-16">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">Mã giảm giá đang hoạt động</h2>
        {activeCoupons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCoupons.map((cp: any) => (
              <div key={cp.id} className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{cp.code}</Badge>
                  <Badge>
                    {String(cp.discountType).toLowerCase() === "percent"
                      ? `${Number(cp.discountValue)}%`
                      : `${Number(cp.discountValue).toLocaleString("vi-VN")}đ`}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {cp.startDate && cp.endDate ? (
                    <span>
                      Hiệu lực {cp.startDate} - {cp.endDate}
                    </span>
                  ) : cp.startDate ? (
                    <span>Bắt đầu từ {cp.startDate}</span>
                  ) : cp.endDate ? (
                    <span>Hết hạn {cp.endDate}</span>
                  ) : (
                    <span>Không giới hạn thời gian</span>
                  )}
                </div>
                {cp.quantity != null && (
                  <div className="text-sm text-muted-foreground mt-1">Còn lại: {Number(cp.quantity)}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">Chưa có mã giảm giá hoạt động</div>
        )}
      </div>

      {/* Promotions List */}
      <div className="space-y-8 mb-16">
        {activePromotions.map((promo: any) => (
          <article
            key={promo.slug}
            className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative aspect-video lg:aspect-auto bg-secondary overflow-hidden">
                <img
                  src={promo.image || "/placeholder.svg"}
                  alt={promo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-lg px-4 py-2">
                  Khuyến mãi
                </Badge>
              </div>

              <div className="p-6 flex flex-col justify-center">
                <Badge className="w-fit mb-3">{(() => {
                  const todayStr = new Date().toISOString().slice(0, 10)
                  const s = promo.startDate
                  const e = promo.endDate
                  if (s && s > todayStr) return "Sắp diễn ra"
                  if (e && e < todayStr) return "Đã kết thúc"
                  return "Đang diễn ra"
                })()}</Badge>
                <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {promo.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{promo.description}</p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      Từ {promo.startDate} đến {promo.endDate}
                    </span>
                  </div>
                  {(() => {
                    const t = daysLeft(promo.endDate)
                    if (!t || t === "Đã kết thúc") return null
                    return (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t}</span>
                      </div>
                    )
                  })()}
                </div>

                <Button asChild size="lg" className="w-fit">
                  <Link
                    href={
                      String(promo.slug || "").trim()
                        ? `/promotions/${encodeURIComponent(String(promo.slug || "").trim())}`
                        : "/promotions"
                    }
                  >
                    Xem chi tiết
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
        {activePromotions.length === 0 && (
          <div className="text-muted-foreground">Chưa có khuyến mãi nào</div>
        )}
      </div>

      {/* Featured Products */}
      <div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">Sản phẩm đang giảm giá</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {discountedProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {discountedProducts.length === 0 && (
          <div className="text-muted-foreground mt-4">Chưa có sản phẩm giảm giá</div>
        )}
      </div>
    </div>
  )
}
