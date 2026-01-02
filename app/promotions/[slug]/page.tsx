export const dynamic = "force-dynamic"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowLeft, Clock } from "lucide-react"
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

export default async function PromotionDetailPage({ params }: { params: any }) {
  const resolvedParams = await Promise.resolve(params as any)
  const rawSlug = String(resolvedParams?.slug || "")
  const slug = (() => {
    try {
      return decodeURIComponent(rawSlug)
    } catch {
      return rawSlug
    }
  })()
  let promotionRes: any = null
  try {
    promotionRes = await api(`/api/Promotions/slug/${encodeURIComponent(slug)}`)
  } catch {
    promotionRes = null
  }
  let promotion = promotionRes
    ? {
        id: promotionRes.promotionId ?? promotionRes.PromotionId,
        title: promotionRes.title ?? promotionRes.Title ?? "",
        slug: promotionRes.slug ?? promotionRes.Slug ?? "",
        description: promotionRes.description ?? promotionRes.Description ?? "",
        image: resolveImg(promotionRes.featuredImage ?? promotionRes.FeaturedImage ?? ""),
        startDate: formatDate(promotionRes.startDate ?? promotionRes.StartDate),
        endDate: formatDate(promotionRes.endDate ?? promotionRes.EndDate),
        status: promotionRes.status ?? promotionRes.Status ?? 1,
      }
    : null
  if (!promotion) {
    let promosRes: any = []
    try {
      promosRes = await api("/api/Promotions")
    } catch {
      promosRes = []
    }
    const promotions = Array.isArray(promosRes)
      ? promosRes.map((p: any) => ({
          id: p.promotionId ?? p.PromotionId,
          title: p.title ?? p.Title ?? "",
          slug: p.slug ?? p.Slug ?? "",
          description: p.description ?? p.Description ?? "",
          image: resolveImg(p.featuredImage ?? p.FeaturedImage ?? ""),
          startDate: formatDate(p.startDate ?? p.StartDate),
          endDate: formatDate(p.endDate ?? p.EndDate),
          status: p.status ?? p.Status ?? 1,
        }))
      : []
    promotion =
      promotions.find(
        (p: any) => String(p.slug || "").trim().toLowerCase() === slug.trim().toLowerCase()
      ) || null
  }

  if (!promotion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/promotions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại khuyến mãi
          </Link>
        </Button>
        <div className="text-center py-24">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Không tìm thấy khuyến mãi</h1>
          <p className="text-muted-foreground">Đường dẫn không hợp lệ hoặc khuyến mãi đã bị xóa.</p>
        </div>
      </div>
    )
  }

  let productsRes: any = []
  let imagesRes: any = []
  try {
    productsRes = await api(`/api/Promotions/${promotion.id}/products`)
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
  const relatedProducts = allProducts.filter((p: any) => p.originalPrice && p.originalPrice > p.price).slice(0, 8)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/promotions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại khuyến mãi
        </Link>
      </Button>

      {/* Promotion Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="relative aspect-video lg:aspect-square bg-card rounded-lg overflow-hidden">
          <img
            src={resolveImg(promotion.image)}
            alt={promotion.title}
            className="w-full h-full object-contain"
          />
          <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-lg px-4 py-2">
            Khuyến mãi
          </Badge>
        </div>

        <div className="flex flex-col justify-center">
          <Badge className="w-fit mb-4">{(() => {
            const todayStr = new Date().toISOString().slice(0, 10)
            const s = promotion.startDate
            const e = promotion.endDate
            if (s && s > todayStr) return "Sắp diễn ra"
            if (e && e < todayStr) return "Đã kết thúc"
            return "Đang diễn ra"
          })()}</Badge>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-6">{promotion.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">{promotion.description}</p>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Thời gian áp dụng</p>
                <p className="font-semibold text-foreground">
                  Từ {promotion.startDate} đến {promotion.endDate}
                </p>
              </div>
            </div>
            {(() => {
              const t = daysLeft(promotion.endDate)
              if (!t || t === "Đã kết thúc") return null
              return (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Thời lượng</p>
                    <p className="font-semibold text-muted-foreground">{t}</p>
                  </div>
                </div>
              )
            })()}
          </div>

          <Button asChild size="lg" className="w-fit">
            <Link href="/shop">Mua sắm ngay</Link>
          </Button>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="bg-muted rounded-lg p-6 mb-12">
        <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Điều khoản & Điều kiện</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            • Chương trình áp dụng từ {promotion.startDate} đến {promotion.endDate}
          </li>
          <li>• Áp dụng cho các sản phẩm được chọn, chi tiết tùy theo sản phẩm</li>
          <li>• Không áp dụng đồng thời với các chương trình khuyến mãi khác</li>
          <li>• Số lượng có hạn, áp dụng theo nguyên tắc đến trước được phục vụ trước</li>
          <li>• Harmony Music Store có quyền thay đổi điều khoản mà không cần báo trước</li>
        </ul>
      </div>

      {/* Related Products */}
      <div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">Sản phẩm áp dụng</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {relatedProducts.length === 0 && (
          <div className="text-muted-foreground mt-4">Chưa có sản phẩm áp dụng</div>
        )}
      </div>
    </div>
  )
}
