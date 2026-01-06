"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Music, Guitar, Drum } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/data/products"
import { api } from "@/lib/api"

export default function HomePage() {
  const [categories, setCategories] = useState<Array<{ id?: number; name: string; slug: string; description?: string }>>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

  useEffect(() => {
    ;(async () => {
      let prods: any = []
      let imgs: any = []
      let brs: any = []
      let cats: any = []
      try {
        prods = await api("/api/Products?status=1")
      } catch {
        prods = []
      }
      try {
        imgs = await api("/api/ProductImages")
      } catch {
        imgs = []
      }
      try {
        brs = await api("/api/Brands")
      } catch {
        brs = []
      }
      try {
        cats = await api("/api/Categories")
      } catch {
        cats = []
      }

      const toAbs = (u: any) => {
        const s = String(u || "")
        if (!s) return ""
        if (s.startsWith("http://") || s.startsWith("https://")) return s
        if (s.startsWith("/")) return `/files${s}`
        return `/files/product-images/${s}`
      }

      const imagesByPid: Record<number, Array<{ url: string; sort: number; main: boolean }>> = Array.isArray(imgs)
        ? (imgs as any[]).reduce((acc: Record<number, Array<{ url: string; sort: number; main: boolean }>>, im: any) => {
            const pid = im.productId ?? im.ProductId
            const urlRaw = im.imageUrl ?? im.ImageUrl
            const url = toAbs(urlRaw)
            const sort = Number(im.sortOrder ?? im.SortOrder ?? 0)
            const main = !!(im.isMain ?? im.IsMain)
            if (pid == null || !url) return acc
            const ex = acc[pid] || []
            ex.push({ url: String(url), sort, main })
            acc[pid] = ex
            return acc
          }, {})
        : {}

      const brandMap: Record<number, string> = Array.isArray(brs)
        ? (brs as any[]).reduce((acc: Record<number, string>, b: any) => {
            const id = b.brandId ?? b.BrandId
            const name = b.brandName ?? b.BrandName ?? ""
            if (typeof id === "number" && name) acc[id] = String(name)
            return acc
          }, {})
        : {}

      const categoryMap: Record<number, { name: string; slug: string }> = Array.isArray(cats)
        ? (cats as any[]).reduce((acc: Record<number, { name: string; slug: string }>, c: any) => {
            const id = c.categoryId ?? c.CategoryId
            const name = c.categoryName ?? c.CategoryName ?? ""
            const slugRaw = c.slug ?? c.Slug ?? ""
            const slug = slugRaw || String(name).toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")
            if (typeof id === "number") acc[id] = { name: String(name), slug }
            return acc
          }, {})
        : {}

      const mapped: Product[] = Array.isArray(prods)
        ? (prods as any[]).map((p: any) => {
            const unit = Number(p.unitPrice ?? p.UnitPrice ?? 0)
            const discVal = p.discountPrice ?? p.DiscountPrice
            const disc = discVal != null ? Number(discVal) : undefined
            const price = disc != null ? disc : unit
            const originalPrice = disc != null ? unit : undefined
            const createdAtStr = p.createdAt ?? p.CreatedAt
            const createdAt = createdAtStr ? new Date(createdAtStr) : null
            const isNew = createdAt ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24) <= 30 : false
            const idNum = p.productId ?? p.ProductId
            const arr = imagesByPid[idNum] || []
            const sorted = arr.slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
            const imageList = sorted.map((it) => it.url)
            const mainObj = sorted.find((it) => it.main)
            const img = (mainObj ? mainObj.url : imageList[0]) || "/placeholder.svg"
            const catId = p.categoryId ?? p.CategoryId
            const brandId = p.brandId ?? p.BrandId
            const brandName = brandMap[brandId] || ""
            const categoryName = categoryMap[catId]?.name || ""
            const slugRaw = p.slug ?? p.Slug
            const slugFallback = typeof idNum === "number"
              ? `product-${idNum}`
              : String(p.productName ?? p.ProductName ?? "").toLowerCase().replace(/[^a-z0-9]+/gi, "-")
            const mappedItem: Product = {
              id: String(idNum ?? ""),
              name: p.productName ?? p.ProductName ?? "",
              slug: String(slugRaw || slugFallback),
              description: p.description ?? p.Description ?? "",
              price,
              originalPrice,
              image: img,
              images: imageList.length ? imageList : [img],
              category: categoryName,
              brand: brandName,
              stock: Number(p.quantity ?? p.Quantity ?? 0),
              isFeatured: !!(p.isFeatured ?? p.IsFeatured),
              isNew,
              specifications: {},
              rating: 0,
              reviewCount: 0,
            }
            return mappedItem
          })
        : []

      setFeaturedProducts(mapped.filter((p) => p.isFeatured).slice(0, 4))
      const catList = Array.isArray(cats)
        ? (cats as any[]).map((c: any) => ({
            id: c.categoryId ?? c.CategoryId,
            name: c.categoryName ?? c.CategoryName ?? "",
            slug: c.slug ?? c.Slug ?? "",
            description: c.description ?? c.Description ?? "",
          }))
        : []
      setCategories(catList)
    })()
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-muted py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance">
              Khám phá thế giới âm nhạc cùng Harmony
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty leading-relaxed">
              Cửa hàng nhạc cụ chuyên nghiệp với hàng ngàn sản phẩm chất lượng cao từ các thương hiệu hàng đầu thế giới.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base">
                <Link href="/shop">
                  Khám phá ngay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base bg-transparent">
                <Link href="/about">Về chúng tôi</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Danh mục sản phẩm</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tìm kiếm nhạc cụ phù hợp với phong cách của bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.slice(0, 3).map((category) => {
              const icons = { Guitar, Piano: Music, Drum }
              const Icon = icons[category.name as keyof typeof icons] || Music

              return (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="group bg-card border border-border rounded-lg p-8 hover:shadow-lg transition-all duration-300 hover:border-primary"
                >
                  <Icon className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-xl text-foreground mb-2">{category.name}</h3>
                  <p className="text-muted-foreground text-sm">{category.description}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">Sản phẩm nổi bật</h2>
              <p className="text-muted-foreground">Những sản phẩm được yêu thích nhất</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/shop">
                Xem tất cả
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Nhận ưu đãi đặc biệt
            </h2>
            <p className="text-primary-foreground/90 text-lg mb-6 max-w-2xl mx-auto">
              Đăng ký nhận tin để cập nhật sản phẩm mới và khuyến mãi hấp dẫn
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">Đăng ký ngay</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
