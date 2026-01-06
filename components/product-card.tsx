"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/contexts/cart-context"
import { useWishlist } from "@/lib/contexts/wishlist-context"
import type { Product } from "@/lib/data/products"
import { useToast } from "@/hooks/use-toast"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist()
  const { toast } = useToast()

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const isInWishlist = wishlistItems.some((item) => item.productId === product.id)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    })
    toast({
      title: "Đã thêm vào giỏ hàng",
      description: product.name,
    })
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isInWishlist) {
      removeFromWishlist(product.id)
      toast({
        title: "Đã xóa khỏi danh sách yêu thích",
        description: product.name,
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
        description: product.name,
      })
    }
  }

  return (
    <div className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link href={`/shop/${product.slug}`} className="block relative aspect-square bg-secondary overflow-hidden">
        <Image
          src={(() => {
            const u = String(product.image || "").trim()
            if (!u) return "/placeholder.svg"
            if (/^(https?:|data:|blob:)/i.test(u)) return u
            if (u.startsWith("/product-images/")) return `/files${u}`
            if (u.startsWith("/")) return u
            return `/files/${u}`
          })()}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={false}
        />
        {discount > 0 && (
          <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">-{discount}%</Badge>
        )}
        {product.isNew && <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">Mới</Badge>}
        <Button
          size="icon"
          variant="secondary"
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
          <span className="sr-only">Yêu thích</span>
        </Button>
      </Link>
      <div className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{product.category}</p>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-primary">{product.price.toLocaleString("vi-VN")}đ</p>
            {product.originalPrice && (
              <p className="text-sm text-muted-foreground line-through">
                {product.originalPrice.toLocaleString("vi-VN")}đ
              </p>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleAddToCart}
            className="hover:bg-primary hover:text-primary-foreground"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="sr-only">Thêm vào giỏ</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
