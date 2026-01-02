"use client"

import { useWishlist } from "@/lib/contexts/wishlist-context"
import type { Product } from "@/lib/data/products"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import Link from "next/link"

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlist()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Danh sách yêu thích</h1>
              <p className="text-muted-foreground">{items.length} sản phẩm</p>
            </div>
            {items.length > 0 && (
              <Button variant="outline" onClick={clearWishlist}>
                Xóa tất cả
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((wish) => {
              const normalized: Product = {
                id: wish.productId,
                name: wish.name,
                slug: wish.slug,
                description: "",
                price: wish.price,
                originalPrice: undefined,
                image: wish.image,
                images: [wish.image],
                category: "",
                brand: "",
                stock: 1,
                isFeatured: false,
                isNew: false,
                specifications: {},
                rating: 0,
                reviewCount: 0,
              }
              return <ProductCard key={wish.productId} product={normalized} />
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-2">Danh sách yêu thích trống</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Bạn chưa có sản phẩm nào trong danh sách yêu thích. Hãy khám phá và thêm những sản phẩm bạn thích!
            </p>
            <Button asChild>
              <Link href="/shop">Khám phá sản phẩm</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
