"use client"

import { useState, useMemo, useEffect } from "react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { Product } from "@/lib/data/products"
import { api } from "@/lib/api"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

export default function ShopPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 50000000])
  const [sortBy, setSortBy] = useState("featured")
  const [currentPage, setCurrentPage] = useState(1)

  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Array<{ id?: number; name: string; slug: string; description?: string }>>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
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
              }
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
        const brandList = Array.from(new Set(mapped.map((p) => p.brand).filter(Boolean)))
        setBrands(brandList)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filteredProducts = useMemo(() => {
    let filtered = allProducts

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.category))
    }

    if (selectedBrands.length > 0) {
      filtered = filtered.filter((p) => selectedBrands.includes(p.brand))
    }

    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])

    switch (sortBy) {
      case "newest":
        filtered = [...filtered].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      case "price-asc":
        filtered = [...filtered].sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        filtered = [...filtered].sort((a, b) => b.price - a.price)
        break
      case "name":
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return filtered
  }, [allProducts, selectedCategories, selectedBrands, priceRange, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategories, selectedBrands, priceRange, sortBy])

  const pageSize = 15
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * pageSize
  const pageData = filteredProducts.slice(start, start + pageSize)

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]))
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedBrands([])
    setPriceRange([0, 50000000])
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Danh mục</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.slug} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.slug}`}
                checked={selectedCategories.includes(category.name)}
                onCheckedChange={() => toggleCategory(category.name)}
              />
              <Label htmlFor={`category-${category.slug}`} className="text-sm cursor-pointer">
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Thương hiệu</h3>
        <div className="space-y-2">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <Label htmlFor={`brand-${brand}`} className="text-sm cursor-pointer">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Khoảng giá</h3>
        <Slider
          min={0}
          max={50000000}
          step={1000000}
          value={priceRange}
          onValueChange={setPriceRange}
          className="mb-2"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{priceRange[0].toLocaleString("vi-VN")}đ</span>
          <span>{priceRange[1].toLocaleString("vi-VN")}đ</span>
        </div>
      </div>

      {(selectedCategories.length > 0 || selectedBrands.length > 0) && (
        <Button variant="outline" className="w-full bg-transparent" onClick={clearFilters}>
          Xóa bộ lọc
        </Button>
      )}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">Cửa hàng</h1>
        <p className="text-muted-foreground">Khám phá bộ sưu tập nhạc cụ chất lượng cao</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 bg-card border border-border rounded-lg p-6">
            <h2 className="font-semibold text-lg text-foreground mb-4">Bộ lọc</h2>
            <FilterContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <p className="text-sm text-muted-foreground">
              Hiển thị <span className="font-semibold text-foreground">{filteredProducts.length}</span> sản phẩm
            </p>

            <div className="flex items-center gap-3">
              {/* Mobile Filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden bg-transparent">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Bộ lọc
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Bộ lọc</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Nổi bật</SelectItem>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                  <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                  <SelectItem value="name">Tên A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Không tìm thấy sản phẩm nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
