"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/contexts/cart-context"

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart()

  const subtotal = totalPrice
  const shipping = subtotal > 10000000 ? 0 : 200000
  const total = subtotal + shipping

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Giỏ hàng trống</h1>
          <p className="text-muted-foreground mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
          <Button asChild size="lg">
            <Link href="/shop">
              Tiếp tục mua sắm
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-8">Giỏ hàng của bạn</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="bg-card border border-border rounded-lg p-4 md:p-6">
              <div className="flex gap-4">
                <Link href={`/shop/${item.slug}`} className="flex-shrink-0">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg bg-secondary"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <Link href={`/shop/${item.slug}`}>
                        <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">{item.price.toLocaleString("vi-VN")}đ</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.productId)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Xóa</span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center border border-border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-9 w-9"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="h-9 w-9"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-lg font-bold text-primary">
                      {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-20">
            <h2 className="font-semibold text-lg text-foreground mb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-semibold text-foreground">{subtotal.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className="font-semibold text-foreground">
                  {shipping === 0 ? "Miễn phí" : `${shipping.toLocaleString("vi-VN")}đ`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">Miễn phí vận chuyển cho đơn hàng trên 10.000.000đ</p>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold text-foreground">Tổng cộng</span>
              <span className="text-2xl font-bold text-primary">{total.toLocaleString("vi-VN")}đ</span>
            </div>

            <Button asChild size="lg" className="w-full mb-3">
              <Link href="/checkout">
                Thanh toán
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full bg-transparent">
              <Link href="/shop">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
