"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Wallet, Banknote } from "lucide-react"
import { useCart } from "@/lib/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/contexts/auth-context"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [shippingConfig, setShippingConfig] = useState<{ freeShippingThreshold: number; standardShippingFee: number; expressShippingFee: number }>({
    freeShippingThreshold: 10000000,
    standardShippingFee: 200000,
    expressShippingFee: 350000,
  })
  const [paymentConfig, setPaymentConfig] = useState<{ enableCOD: boolean; enableBankTransfer: boolean; enableCreditCard: boolean; enableMomo: boolean }>({
    enableCOD: true,
    enableBankTransfer: true,
    enableCreditCard: false,
    enableMomo: true,
  })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api("/api/Settings")
        const list = Array.isArray(res) ? res : []
        const map: Record<string, any> = {}
        for (const s of list as any[]) {
          const k = (s as any).settingKey ?? (s as any).SettingKey
          if (k) map[String(k)] = s
        }
        const getVal = (key: string, fallback: string) => {
          const s = map[key]
          const v = s ? (s.settingValue ?? s.SettingValue) : undefined
          return typeof v === "string" ? v : fallback
        }
        const toBool = (v: any) => {
          const s = String(v ?? "").toLowerCase().trim()
          return s === "true" || s === "1" || s === "yes"
        }
        setShippingConfig({
          freeShippingThreshold: Number(getVal("freeShippingThreshold", String(shippingConfig.freeShippingThreshold))) || 0,
          standardShippingFee: Number(getVal("standardShippingFee", String(shippingConfig.standardShippingFee))) || 0,
          expressShippingFee: Number(getVal("expressShippingFee", String(shippingConfig.expressShippingFee))) || 0,
        })
        const nextPayment = {
          enableCOD: toBool(getVal("enableCOD", String(paymentConfig.enableCOD))),
          enableBankTransfer: toBool(getVal("enableBankTransfer", String(paymentConfig.enableBankTransfer))),
          enableCreditCard: toBool(getVal("enableCreditCard", String(paymentConfig.enableCreditCard))),
          enableMomo: toBool(getVal("enableMomo", String(paymentConfig.enableMomo))),
        }
        setPaymentConfig(nextPayment)
        const avail: string[] = []
        if (nextPayment.enableCOD) avail.push("cod")
        if (nextPayment.enableMomo) avail.push("momo")
        if (nextPayment.enableBankTransfer) avail.push("bank")
        if (avail.length > 0 && !avail.includes(paymentMethod)) setPaymentMethod(avail[0])
      } catch {}
    })()
  }, [])

  const subtotal = totalPrice
  const shipping = subtotal > shippingConfig.freeShippingThreshold ? 0 : shippingConfig.standardShippingFee
  const discount = appliedCoupon
    ? (() => {
        const v = Number(appliedCoupon?.discountValue || 0)
        if (String(appliedCoupon?.discountType).toLowerCase() === "percent") {
          const d = Math.round((subtotal * v) / 100)
          return Math.min(d, subtotal)
        }
        return Math.min(v, subtotal)
      })()
    : 0
  const total = subtotal - discount + shipping

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    try {
      setIsPlacingOrder(true)
      const code = "ORD" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + Math.floor(Math.random() * 100000).toString().padStart(5, "0")
      const methodCode = paymentMethod === "cod" ? 1 : paymentMethod === "momo" ? 2 : paymentMethod === "bank" ? 3 : 1
      const isPaid = paymentMethod === "momo" ? 0 : paymentMethod === "cod" ? 0 : 1
      const paidAt = paymentMethod === "cod" ? null : new Date().toISOString()
      const dto = {
        OrderCode: code,
        UserId: user?.userId ?? null,
        CouponId: appliedCoupon?.id ?? null,
        ShippingAddress: formData.address,
        Status: 1,
        ShippingMethod: 1,
        SubTotal: subtotal,
        DiscountAmount: discount,
        TotalAmount: total,
        OrderDate: new Date().toISOString(),
        CreatedAt: new Date().toISOString(),
        OrderItems: items.map((it) => ({ ProductId: Number(it.productId), Quantity: it.quantity, UnitPrice: it.price })),
        Payments: [
          {
            Amount: total,
            PaymentMethod: methodCode,
            Status: isPaid,
            TransactionRef: null,
            PaidAt: paidAt,
          },
        ],
      }
      const created = await api("/api/Orders", { method: "POST", body: JSON.stringify(dto) })
      toast({ title: "Đặt hàng thành công", description: "Đơn hàng của bạn đã được tạo" })
      clearCart()
      const createdCode = (created && (created.orderCode ?? created.OrderCode)) || code
      if (paymentMethod === "momo") {
        try {
          const momo = await api("/api/Payments/momo/create", { method: "POST", body: JSON.stringify({ OrderCode: createdCode, Amount: total }) })
          const url = momo?.payUrl || momo?.deeplink
          if (url && typeof window !== "undefined") {
            window.location.href = url
            return
          }
        } catch {}
      }
      router.push(`/checkout/success?order=${encodeURIComponent(createdCode)}`)
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể tạo đơn hàng" })
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Giỏ hàng trống</h1>
        <p className="text-muted-foreground mb-6">Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán</p>
        <Button asChild>
          <Link href="/shop">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-8">Thanh toán</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin giao hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Họ và tên <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Số điện thoại <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Địa chỉ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Số nhà, tên đường"
                    required
                  />
                </div>

                

                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú đơn hàng (tùy chọn)</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full min-h-[100px] px-3 py-2 border border-input rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {paymentConfig.enableCOD ? (
                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Banknote className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">Thanh toán khi nhận hàng (COD)</p>
                          <p className="text-sm text-muted-foreground">Thanh toán bằng tiền mặt khi nhận hàng</p>
                        </div>
                      </Label>
                    </div>
                  ) : null}

                  {paymentConfig.enableMomo ? (
                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="momo" id="momo" />
                      <Label htmlFor="momo" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Wallet className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">Ví MoMo</p>
                          <p className="text-sm text-muted-foreground">Thanh toán qua ví điện tử MoMo</p>
                        </div>
                      </Label>
                    </div>
                  ) : null}

                  {paymentConfig.enableBankTransfer ? (
                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="bank" id="bank" />
                      <Label htmlFor="bank" className="flex items-center gap-3 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">Chuyển khoản ngân hàng</p>
                          <p className="text-sm text-muted-foreground">Thanh toán qua chuyển khoản ngân hàng</p>
                        </div>
                      </Label>
                    </div>
                  ) : null}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-20">
              <h2 className="font-semibold text-lg text-foreground mb-4">Đơn hàng của bạn</h2>

              <div className="space-y-4 mb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded bg-secondary flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Số lượng: {item.quantity}</p>
                      <p className="text-sm font-semibold text-primary">{item.price.toLocaleString("vi-VN")}đ</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

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
                <div className="space-y-2">
                  <Label htmlFor="coupon">Mã giảm giá</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Nhập mã giảm giá"
                    />
                    <Button type="button" onClick={async () => {
                      if (!couponCode.trim()) return
                      try {
                        setCouponLoading(true)
                        const res = await api(`/api/Coupons/validate?code=${encodeURIComponent(couponCode.trim())}&subtotal=${subtotal}`)
                        if (res && res.valid) {
                          setAppliedCoupon({ id: res.id, code: res.code, discountType: res.discountType, discountValue: Number(res.discountValue) })
                          toast({ title: "Đã áp dụng mã giảm giá", description: String(res.discountType).toLowerCase() === "percent" ? `Giảm ${res.discountValue}%` : `Giảm ${Number(res.discountValue).toLocaleString("vi-VN")}đ` })
                        } else {
                          setAppliedCoupon(null)
                          toast({ title: "Mã giảm giá không hợp lệ", description: typeof res?.message === "string" ? res.message : "Vui lòng kiểm tra lại mã" })
                        }
                      } catch (err: any) {
                        toast({ title: "Lỗi", description: typeof err?.message === "string" ? err.message : "Không thể kiểm tra mã giảm giá" })
                      } finally {
                        setCouponLoading(false)
                      }
                    }} disabled={couponLoading}>
                      Áp dụng
                    </Button>
                  </div>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Giảm giá ({appliedCoupon.code})</span>
                    <span className="font-semibold text-foreground">- {discount.toLocaleString("vi-VN")}đ</span>
                  </div>
                ) : null}
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between mb-6">
                <span className="font-semibold text-foreground">Tổng cộng</span>
                <span className="text-2xl font-bold text-primary">{total.toLocaleString("vi-VN")}đ</span>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isPlacingOrder}>
                Đặt hàng
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
