import { notFound } from "next/navigation"
import { ProductCard } from "@/components/product-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"

export const dynamic = "force-dynamic"
export const revalidate = 0

const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")
const toAbs = (u: any) => {
  const s = String(u || "")
  if (!s) return ""
  if (s.startsWith("http://") || s.startsWith("https://")) return s
  if (s.startsWith("/")) return `/files${s}`
  return `/files/product-images/${s}`
}

export async function generateStaticParams() {
  try {
    const brs: any = await api("/api/Brands")
    if (Array.isArray(brs)) {
      return (brs as any[])
        .map((b: any) => ({ slug: toSlug(String(b.brandName ?? b.BrandName ?? "")) }))
        .filter((x) => x.slug)
    }
  } catch {}
  return []
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const slug = String(params?.slug || "")
  let brs: any[] = []
  let prods: any[] = []
  let imgs: any[] = []
  try {
    brs = await api("/api/Brands", { cache: "no-store" })
  } catch {
    brs = []
  }
  const brandList = Array.isArray(brs) ? brs : []
  const brand = brandList.find((b: any) => toSlug(String(b.brandName ?? b.BrandName ?? "")) === slug)
  if (!brand) {
    notFound()
  }

  try {
    prods = await api("/api/Products?status=1", { cache: "no-store" })
  } catch {
    prods = []
  }
  if (!Array.isArray(prods) || prods.length === 0) {
    try {
      prods = await api("/api/Products", { cache: "no-store" })
    } catch {}
  }
  try {
    imgs = await api("/api/ProductImages", { cache: "no-store" })
  } catch {
    imgs = []
  }

  const imageMap: Record<number, string> = Array.isArray(imgs)
    ? (imgs as any[]).reduce((acc: Record<number, string>, img: any) => {
        const pid = img.productId ?? img.ProductId
        const urlRaw = img.imageUrl ?? img.ImageUrl
        const url = toAbs(urlRaw)
        const isMain = img.isMain ?? img.IsMain
        if (pid == null) return acc
        if (isMain && url) acc[pid] = url
        return acc
      }, {})
    : {}

  const brandId = (brand as any).brandId ?? (brand as any).BrandId
  const brandName = (brand as any).brandName ?? (brand as any).BrandName ?? ""
  const brandDesc = (brand as any).description ?? (brand as any).Description ?? ""

  const brandProducts = Array.isArray(prods)
    ? (prods as any[])
        .filter((p: any) => {
          const bid = p.brandId ?? p.BrandId
          const bidNum = typeof bid === "number" ? bid : Number(bid)
          const brandIdNum = typeof brandId === "number" ? brandId : Number(brandId)
          const byId = bidNum != null && Number.isFinite(bidNum) && bidNum === brandIdNum
          const bname = p.brandName ?? p.BrandName
          const byName = bname ? String(bname).trim().toLowerCase() === String(brandName).trim().toLowerCase() : false
          return byId || byName
        })
        .map((p: any) => {
          const unit = Number(p.unitPrice ?? p.UnitPrice ?? 0)
          const discVal = p.discountPrice ?? p.DiscountPrice
          const disc = discVal != null ? Number(discVal) : undefined
          const price = disc != null ? disc : unit
          const originalPrice = disc != null ? unit : undefined
          const createdAtStr = p.createdAt ?? p.CreatedAt
          const createdAt = createdAtStr ? new Date(createdAtStr) : null
          const isNew = createdAt ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24) <= 30 : false
          const idNum = p.productId ?? p.ProductId
          const img = imageMap[idNum] || "/placeholder.svg"
          const slugRaw = p.slug ?? p.Slug
          const slugFallback = typeof idNum === "number"
            ? `product-${idNum}`
            : String(p.productName ?? p.ProductName ?? "").toLowerCase().replace(/[^a-z0-9]+/gi, "-")
          return {
            id: String(idNum ?? ""),
            name: p.productName ?? p.ProductName ?? "",
            slug: String(slugRaw || slugFallback),
            description: p.description ?? p.Description ?? "",
            price,
            originalPrice,
            image: img,
            images: [img],
            category: "",
            brand: brandName,
            stock: Number(p.quantity ?? p.Quantity ?? 0),
            isFeatured: !!(p.isFeatured ?? p.IsFeatured),
            isNew,
            specifications: {},
            rating: 0,
            reviewCount: 0,
          }
        })
    : []

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-muted py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-serif font-bold text-foreground mb-4">{brandName}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{brandDesc}</p>
          <p className="text-sm text-muted-foreground mt-4">{brandProducts.length} sản phẩm</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-bold">Sản phẩm {brandName}</h2>
          <Select defaultValue="newest">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="price-asc">Giá: Thấp đến cao</SelectItem>
              <SelectItem value="price-desc">Giá: Cao đến thấp</SelectItem>
              <SelectItem value="name">Tên A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {brandProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {brandProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>
    </div>
  )
}
