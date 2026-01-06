"use client"

import { useEffect, useState, use } from "react"
import { notFound } from "next/navigation"
import { api } from "@/lib/api"
import type { Product } from "@/lib/data/products"
import { useCart } from "@/lib/contexts/cart-context"
import { useWishlist } from "@/lib/contexts/wishlist-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Heart, Share2, Star, Minus, Plus } from "lucide-react"
import { ProductCard } from "@/components/product-card"

export default function ProductDetailPage({ params }: { params: any }) {
  const resolvedParams = use(params as any) as any
  const slug = String(resolvedParams?.slug || "")

  const [product, setProduct] = useState<Product | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        let prods: any = []
        let imgs: any = []
        let brs: any = []
        let cats: any = []
        let specs: any = []
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
        try {
          specs = await api("/api/ProductSpecifications")
        } catch {
          specs = []
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

        const categoryMap: Record<number, string> = Array.isArray(cats)
          ? (cats as any[]).reduce((acc: Record<number, string>, c: any) => {
              const id = c.categoryId ?? c.CategoryId
              const name = c.categoryName ?? c.CategoryName ?? ""
              if (typeof id === "number" && name) acc[id] = String(name)
              return acc
            }, {})
          : {}

        const specsByProduct: Record<number, Record<string, string>> = Array.isArray(specs)
          ? (specs as any[]).reduce((acc: Record<number, Record<string, string>>, s: any) => {
              const pid = s.productId ?? s.ProductId
              const key = s.specName ?? s.SpecName
              const val = s.specValue ?? s.SpecValue
              if (pid == null || !key) return acc
              const ex = acc[pid] || {}
              ex[String(key)] = String(val ?? "")
              acc[pid] = ex
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
              const categoryName = categoryMap[catId] || ""
              const slugRaw = p.slug ?? p.Slug
              const slugFallback = typeof idNum === "number" ? `product-${idNum}` : String(p.productName ?? p.ProductName ?? "").toLowerCase().replace(/[^a-z0-9]+/gi, "-")
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
                specifications: specsByProduct[idNum] || {},
                rating: 0,
                reviewCount: 0,
              }
              return mappedItem
            })
          : []

        setAllProducts(mapped)
        const found = mapped.find((pp: any) => String(pp.slug) === slug)
        if (!found) {
          notFound()
          return
        }
        setProduct(found)
      } catch {
      }
    })()
  }, [slug])

  const { addItem } = useCart()
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist()
  const { toast } = useToast()

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const isInWishlist = product ? wishlistItems.some((item) => item.productId === product.id) : false
  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const relatedProducts = product
    ? allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
    : []

  const handleAddToCart = () => {
    if (!product) return
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        slug: product.slug,
      },
      quantity,
    )
    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${quantity} x ${product.name}`,
    })
  }

  const handleWishlistToggle = () => {
    if (!product) return
    if (isInWishlist) {
      removeFromWishlist(product.id)
      toast({
        title: "Đã xóa khỏi danh sách yêu thích",
      })
    } else {
      addToWishlist({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        slug: product.slug,
      })
      toast({
        title: "Đã thêm vào danh sách yêu thích",
      })
    }
  }

  const handleShare = async () => {
    if (!product) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Đã sao chép liên kết",
      })
    }
  }

  if (!product) return null
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-8">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/" className="hover:text-foreground">
              Trang chủ
            </a>
          </li>
          <li>/</li>
          <li>
            <a href="/shop" className="hover:text-foreground">
              Cửa hàng
            </a>
          </li>
          <li>/</li>
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-card rounded-lg overflow-hidden">
            <img
              src={product.images?.[selectedImage] || product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-card rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{product.category}</Badge>
              {discount > 0 && <Badge variant="destructive">-{discount}%</Badge>}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">{product.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.floor(product.rating || 0) ? "fill-primary text-primary" : "text-muted"}`}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  {product.rating || 0} ({product.reviewCount || 0} đánh giá)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-primary">{product.price.toLocaleString("vi-VN")}đ</p>
            {product.originalPrice && (
              <p className="text-xl text-muted-foreground line-through">
                {product.originalPrice.toLocaleString("vi-VN")}đ
              </p>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tình trạng:</span>
              <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Số lượng:</span>
              <div className="flex items-center border border-border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={product.stock === 0}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Thêm vào giỏ hàng
            </Button>
            <Button size="lg" variant="outline" onClick={handleWishlistToggle}>
              <Heart className={`h-5 w-5 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button size="lg" variant="outline" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="border-t border-border pt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Thương hiệu:</span>
              <span className="font-semibold">{product.brand}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Danh mục:</span>
              <span className="font-semibold">{product.category}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="mb-16">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="description"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Mô tả
          </TabsTrigger>
          <TabsTrigger
            value="specifications"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Thông số kỹ thuật
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            Đánh giá ({product.reviewCount || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <div className="prose max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">{product.description}</p>
          </div>
        </TabsContent>

        <TabsContent value="specifications" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium text-foreground">{key}</span>
                <span className="text-muted-foreground">{value as string}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <p className="text-muted-foreground">Chức năng đánh giá đang được phát triển...</p>
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
