"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { Product } from "@/lib/data/products"
import { api, apiBase } from "@/lib/api"
import { ProductCard } from "@/components/product-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, X } from "lucide-react"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000000])
  const [sortBy, setSortBy] = useState("relevance")
  const [currentPage, setCurrentPage] = useState(1)

  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Array<{ id?: number; name: string; slug: string; description?: string }>>([])

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
        if (s.startsWith("/")) return `${apiBase}${s}`
        return `${apiBase}/product-images/${s}`
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

      const categoryMap: Record<number, { name: string; slug: string }> = Array.isArray(cats)
        ? (cats as any[]).reduce((acc: Record<number, { name: string; slug: string }>, c: any) => {
            const id = c.categoryId ?? c.CategoryId
            const name = c.categoryName ?? c.CategoryName ?? ""
            const slugRaw = c.slug ?? c.Slug ?? ""
            const slugVal = slugRaw || String(name).toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")
            if (typeof id === "number") acc[id] = { name: String(name), slug: slugVal }
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

  const filteredProducts = useMemo(() => {
    let filtered = allProducts

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(query))
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.category))
    }

    // Price range filter
    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])

    // Sort
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        // relevance - keep original order
        break
    }

    return filtered
  }, [allProducts, searchQuery, selectedCategories, priceRange, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategories, priceRange, sortBy])

  const pageSize = 9
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * pageSize
  const pageData = filteredProducts.slice(start, start + pageSize)

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
    setPriceRange([0, 50000000])
    setSortBy("relevance")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="bg-muted py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Tìm kiếm sản phẩm</h1>
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm nhạc cụ, thương hiệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Bộ lọc</h2>
                {(selectedCategories.length > 0 || searchQuery) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Xóa tất cả
                  </Button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Danh mục</Label>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.slug} className="flex items-center">
                      <Checkbox
                        id={category.slug}
                        checked={selectedCategories.includes(category.name)}
                        onCheckedChange={() => handleCategoryToggle(category.name)}
                      />
                      <label htmlFor={category.slug} className="ml-2 text-sm cursor-pointer">
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Khoảng giá</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Từ"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="h-9"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Đến"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  Tìm thấy <span className="font-semibold text-foreground">{filteredProducts.length}</span> sản phẩm
                  {searchQuery && (
                    <span>
                      {" "}
                      cho "<span className="font-semibold text-foreground">{searchQuery}</span>"
                    </span>
                  )}
                </p>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Liên quan nhất</SelectItem>
                  <SelectItem value="price-asc">Giá: Thấp đến cao</SelectItem>
                  <SelectItem value="price-desc">Giá: Cao đến thấp</SelectItem>
                  <SelectItem value="name">Tên A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pageData.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            size="default"
                            isActive={safePage === i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-muted-foreground mb-6">Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác</p>
                <Button onClick={clearFilters}>Xóa bộ lọc</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
