"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, Phone, Mail } from "lucide-react"
import { api } from "@/lib/api"

type Status = "pending" | "processing" | "delivered" | "cancelled"

export default function OrderDetailPage() {
  const routeParams = useParams<{ orderId: string }>()
  const code = String(routeParams?.orderId ?? "")
  const [loading, setLoading] = useState(true)
  const [orderCode, setOrderCode] = useState<string>(code)
  const [createdAt, setCreatedAt] = useState<string>("")
  const [status, setStatus] = useState<Status>("pending")
  const [items, setItems] = useState<Array<{ productId: number; name: string; quantity: number; price: number; image?: string }>>([])
  const [subtotal, setSubtotal] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [total, setTotal] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<string>("—")
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "failed">("pending")
  const [shippingAddress, setShippingAddress] = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        let byCode: any = null
        try {
          byCode = await api(`/api/Orders/by-code/${encodeURIComponent(code)}`, { cache: "no-store" })
        } catch {}
        const id = Number(byCode?.OrderId ?? byCode?.orderId ?? 0)
        const oc = String(byCode?.OrderCode ?? byCode?.orderCode ?? code)
        setOrderCode(oc)
        let full: any = null
        try {
          if (!full && id) full = await api(`/api/Orders/${id}`, { cache: "no-store" })
          if (!full) {
            const all = await api(`/api/Orders`, { cache: "no-store" })
            full = (Array.isArray(all) ? all : []).find((o: any) => String(o.OrderCode ?? o.orderCode) === oc) || null
          }
        } catch {}
        const stCode = Number(full?.Status ?? full?.status ?? 0)
        setStatus(stCode === 0 ? "pending" : stCode === 1 ? "processing" : stCode === 3 ? "cancelled" : "delivered")
        const created = full?.CreatedAt ?? full?.createdAt ?? full?.OrderDate ?? full?.orderDate
        if (created) {
          try {
            const d = new Date(created)
            if (!Number.isNaN(d.getTime())) setCreatedAt(d.toLocaleDateString("vi-VN"))
          } catch {}
        }
        const sub = Number(full?.SubTotal ?? full?.subTotal ?? 0)
        const disc = Number(full?.DiscountAmount ?? full?.discountAmount ?? 0)
        const tot = Number(full?.TotalAmount ?? full?.totalAmount ?? sub)
        const ship = sub > 10000000 ? 0 : 200000
        setSubtotal(sub)
        setDiscount(disc)
        setShipping(ship)
        setTotal(tot)
        const addr = String(full?.ShippingAddress ?? full?.shippingAddress ?? "")
        setShippingAddress(addr)

        let baseItems: Array<{ ProductId: number; Quantity: number }> = []
        try {
          if (byCode?.Items || byCode?.items) {
            baseItems = (Array.isArray(byCode.Items ?? byCode.items) ? (byCode.Items ?? byCode.items) : []) as any
          }
          if ((!baseItems || baseItems.length === 0) && id) {
            const orderItems = await api(`/api/OrderItems`, { cache: "no-store" })
            baseItems = (Array.isArray(orderItems) ? orderItems : []).filter((it: any) => Number(it.OrderId ?? it.orderId) === id)
          }
        } catch {}
        let images: any[] = []
        try {
          images = await api(`/api/ProductImages`, { cache: "no-store" })
        } catch {}
        const imageMap = Array.isArray(images)
          ? images.reduce((acc: Record<number, string>, im: any) => {
              const pid = Number(im.ProductId ?? im.productId)
              const url = String(im.ImageUrl ?? im.imageUrl ?? "")
              const isMain = !!(im.IsMain ?? im.isMain)
              if (pid && url && isMain) acc[pid] = url
              return acc
            }, {} as Record<number, string>)
          : {}
        const enriched = await Promise.all(
          baseItems.map(async (it: any) => {
            const pid = Number(it.ProductId ?? it.productId)
            const qty = Number(it.Quantity ?? it.quantity) || 0
            let name = String(pid)
            let price = 0
            try {
              const p = await api(`/api/Products/${pid}`, { cache: "no-store" })
              name = String(p?.ProductName ?? p?.productName ?? name)
              const unit = Number(p?.UnitPrice ?? p?.unitPrice ?? 0)
              const discp = p?.DiscountPrice ?? p?.discountPrice
              price = discp != null ? Number(discp) : unit
            } catch {}
            const img = imageMap[pid]
            return { productId: pid, name, quantity: qty, price, image: img }
          })
        )
        setItems(enriched)

        try {
          const payRes = await api(`/api/Payments`, { cache: "no-store" })
          const list = (Array.isArray(payRes) ? payRes : []).filter((p: any) => Number(p.OrderId ?? p.orderId) === id)
          if (list.length > 0) {
            const anyPaid = list.some((p: any) => Number(p.Status ?? p.status) === 1 || !!(p.PaidAt ?? p.paidAt))
            setPaymentStatus(anyPaid ? "paid" : "pending")
            const methodCode = Number(list[0].PaymentMethod ?? list[0].paymentMethod)
            setPaymentMethod(methodCode === 1 ? "Thanh toán khi nhận hàng (COD)" : methodCode === 2 ? "Ví MoMo" : methodCode === 3 ? "Chuyển khoản ngân hàng" : `Phương thức #${methodCode}`)
          }
        } catch {}
      } finally {
        setLoading(false)
      }
    })()
  }, [code])

  const statusConfig = {
    pending: { label: "Chờ xác nhận", color: "bg-yellow-500" },
    processing: { label: "Đang xử lý", color: "bg-blue-500" },
    shipped: { label: "Đang giao hàng", color: "bg-purple-500" },
    delivered: { label: "Đã giao hàng", color: "bg-green-500" },
    cancelled: { label: "Đã hủy", color: "bg-red-500" },
  }
  const currentStatus = statusConfig[status]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại đơn hàng
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Chi tiết đơn hàng</h1>
            <p className="text-muted-foreground">Mã đơn hàng: {orderCode}</p>
          </div>
          <Badge className={`${currentStatus.color} text-white w-fit`}>{currentStatus.label}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${status === "pending" || status === "processing" || status === "delivered" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Đơn hàng đã được đặt</p>
                    <p className="text-sm text-muted-foreground">{createdAt || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${status === "processing" || status === "delivered" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Đơn hàng đã được xác nhận</p>
                    <p className="text-sm text-muted-foreground">{status !== "pending" ? "Đã xác nhận" : "Chờ xác nhận"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${status === "delivered" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Đang giao hàng</p>
                    <p className="text-sm text-muted-foreground">{status === "delivered" ? "Đơn hàng đang được vận chuyển hoặc đã giao" : "Chưa giao hàng"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${status === "delivered" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Đã giao hàng</p>
                    <p className="text-sm text-muted-foreground">{status === "delivered" ? "Giao hàng thành công" : "Chưa giao hàng"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-20 h-20 object-cover rounded bg-secondary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground line-clamp-2">{item.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">Số lượng: {item.quantity}</p>
                      <p className="text-sm font-semibold text-primary mt-1">{item.price.toLocaleString("vi-VN")}đ</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{(item.price * item.quantity).toLocaleString("vi-VN")}đ</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tổng đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-semibold text-foreground">{subtotal.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className="font-semibold text-foreground">{shipping === 0 ? "Miễn phí" : `${shipping.toLocaleString("vi-VN")}đ`}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Giảm giá</span>
                  <span className="font-semibold text-green-600">-{discount.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Tổng cộng</span>
                <span className="text-xl font-bold text-primary">{total.toLocaleString("vi-VN")}đ</span>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Phương thức thanh toán</p>
                <p className="font-semibold text-foreground">{paymentMethod}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Trạng thái thanh toán</p>
                <Badge variant={paymentStatus === "paid" ? "default" : "secondary"}>{paymentStatus === "paid" ? "Đã thanh toán" : paymentStatus === "failed" ? "Thất bại" : "Chưa thanh toán"}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin giao hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Địa chỉ</p>
                  <p className="text-sm text-foreground">{shippingAddress || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="text-sm text-foreground">—</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground">—</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {status === "pending" && (
            <Button variant="destructive" className="w-full">Hủy đơn hàng</Button>
          )}
          {status === "delivered" && <Button className="w-full">Mua lại</Button>}
        </div>
      </div>
    </div>
  )
}
