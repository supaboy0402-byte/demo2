"use client"

import { use, useEffect, useMemo, useState } from "react"
import { notFound } from "next/navigation"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Product } from "@/lib/data/products"
import { api } from "@/lib/api"

export default function CategoryPage({ params }: { params: any }) {
  const resolvedParams = use(params as any) as any
  const slug = String(resolvedParams?.slug || "")

  const [category, setCategory] = useState<{ id?: number; name: string; slug: string } | null>(null)
  const [catTree, setCatTree] = useState<Array<{ id: number; name: string; slug: string; parentId: number | null }>>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])

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

      const brandMap: Record<number, string> = Array.isArray(brs)
        ? (brs as any[]).reduce((acc: Record<number, string>, b: any) => {
            const id = b.brandId ?? b.BrandId
            const name = b.brandName ?? b.BrandName ?? ""
            if (typeof id === "number" && name) acc[id] = String(name)
            return acc
          }, {})
        : {}

      const rawCats: Array<{ id: number; name: string; slug: string; parentId: number | null }> = Array.isArray(cats)
        ? (cats as any[]).map((c: any) => {
            const id = c.categoryId ?? c.CategoryId
            const name = c.categoryName ?? c.CategoryName ?? ""
            const slugRaw = c.slug ?? c.Slug ?? ""
            const slugVal = slugRaw || String(name).toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")
            const parentId = c.parentCategoryId ?? c.ParentCategoryId
            return { id: Number(id), name: String(name), slug: slugVal, parentId: typeof parentId === "number" ? parentId : null }
          })
        : []
      const categoryMap: Record<number, { name: string; slug: string }> = rawCats.reduce((acc, c) => {
        acc[c.id] = { name: c.name, slug: c.slug }
        return acc
      }, {} as Record<number, { name: string; slug: string }>)

      const matchedCategory = rawCats.find((c) => c.slug.toLowerCase() === slug.toLowerCase())

      if (!matchedCategory) {
        notFound()
        return
      }
      setCategory({ id: matchedCategory.id, name: matchedCategory.name, slug: matchedCategory.slug })
      setCatTree(rawCats)

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
            const img = imageMap[idNum] || "/placeholder.svg"
            const catId = p.categoryId ?? p.CategoryId
            const brandId = p.brandId ?? p.BrandId
            const cat = categoryMap[catId] || { name: "", slug: "" }
            const brandName = brandMap[brandId] || ""
            const slugRaw = p.slug ?? p.Slug
            const slugFallback = typeof idNum === "number" ? `product-${idNum}` : String(p.productName ?? p.ProductName ?? "").toLowerCase().replace(/[^a-z0-9]+/gi, "-")
            return {
              id: String(idNum ?? ""),
              name: p.productName ?? p.ProductName ?? "",
              slug: String(slugRaw || slugFallback),
              description: p.description ?? p.Description ?? "",
              price,
              originalPrice,
              image: img,
              images: [img],
              category: cat.name,
              brand: brandName,
              stock: Number(p.quantity ?? p.Quantity ?? 0),
              isFeatured: !!(p.isFeatured ?? p.IsFeatured),
              isNew,
              specifications: {},
              rating: 0,
              reviewCount: 0,
            } as Product
          })
        : []

      setAllProducts(mapped)
    })()
  }, [slug])

  const categoryProducts = useMemo(() => {
    if (!category) return []
    const byParent: Record<number, number[]> = {}
    for (const c of catTree) {
      const pid = c.parentId
      if (pid == null) continue
      const arr = byParent[pid] || []
      arr.push(c.id)
      byParent[pid] = arr
    }
    const target = new Set<number>()
    const stack: number[] = []
    if (typeof category.id === "number") stack.push(category.id)
    while (stack.length) {
      const id = stack.pop() as number
      if (target.has(id)) continue
      target.add(id)
      const children = byParent[id] || []
      for (const ch of children) stack.push(ch)
    }
    const nameSet = new Set(catTree.filter((c) => target.has(c.id)).map((c) => c.name))
    return allProducts.filter((p) => nameSet.has(p.category))
  }, [allProducts, category, catTree])
  const brands = useMemo(() => Array.from(new Set(categoryProducts.map((p) => p.brand).filter(Boolean))), [categoryProducts])

  if (!category) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">{category.name}</h1>
          <p className="text-muted-foreground">{categoryProducts.length} sản phẩm</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-6">Bộ lọc</h2>

              {/* Price Range */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Khoảng giá</Label>
                <Slider defaultValue={[0, 50000000]} max={50000000} step={1000000} className="mb-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0đ</span>
                  <span>50.000.000đ</span>
                </div>
              </div>

              {/* Brands */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Thương hiệu</Label>
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <div key={brand} className="flex items-center">
                      <Checkbox id={brand} />
                      <label htmlFor={brand} className="ml-2 text-sm cursor-pointer">
                        {brand}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Tình trạng</Label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Checkbox id="in-stock" defaultChecked />
                    <label htmlFor="in-stock" className="ml-2 text-sm cursor-pointer">
                      Còn hàng
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="out-of-stock" />
                    <label htmlFor="out-of-stock" className="ml-2 text-sm cursor-pointer">
                      Hết hàng
                    </label>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-transparent" variant="outline">
                Xóa bộ lọc
              </Button>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">Hiển thị {categoryProducts.length} sản phẩm</p>
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

            {/* Products */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {categoryProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Không tìm thấy sản phẩm nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
