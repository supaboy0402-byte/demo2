"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, Package } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { api } from "@/lib/api"

function SuccessContent() {
  const params = useSearchParams()
  const orderParam = params.get("order") || ""
  const orderIdParam = params.get("orderId") || ""
  const orderInfoParam = params.get("orderInfo") || ""
  const code = (() => {
    let c = orderParam
    if (!c && orderIdParam) {
      const parts = String(orderIdParam).split("-")
      if (parts.length > 0) c = parts[0]
    }
    if (!c && orderInfoParam) {
      const m = String(orderInfoParam).match(/ORD\d{8}\d*/i)
      if (m && m[0]) c = m[0]
    }
    return c
  })()
  const [loading, setLoading] = useState(true)
  const [orderCode, setOrderCode] = useState("—")
  const [orderDate, setOrderDate] = useState<string>(new Date().toLocaleDateString("vi-VN"))
  const [items, setItems] = useState<Array<{ productId: number; name: string; quantity: number; price: number; image?: string }>>([])
  const [subtotal, setSubtotal] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [total, setTotal] = useState(0)
  const [shippingAddress, setShippingAddress] = useState<string>("")
  const [payments, setPayments] = useState<Array<{ amount: number; method: string; status: string; transactionRef?: string; paidAt?: string }>>([])

  useEffect(() => {
    ;(async () => {
      if (!code) {
        setLoading(false)
        return
      }
      try {
        const byCode = await api(`/api/Orders/by-code/${encodeURIComponent(code)}`, { cache: "no-store" })
        const id = Number(byCode?.OrderId ?? byCode?.orderId ?? 0)
        const oc = String(byCode?.OrderCode ?? byCode?.orderCode ?? code)
        setOrderCode(oc)
        let full: any = null
        try {
          if (id) full = await api(`/api/Orders/${id}`, { cache: "no-store" })
        } catch {}
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
        const createdAtStr = full?.CreatedAt ?? full?.createdAt ?? full?.OrderDate ?? full?.orderDate
        if (createdAtStr) {
          try {
            const d = new Date(createdAtStr)
            if (!Number.isNaN(d.getTime())) setOrderDate(d.toLocaleDateString("vi-VN"))
          } catch {}
        }
        let baseItems: Array<{ ProductId: number; Quantity: number }> = Array.isArray(byCode?.Items ?? byCode?.items)
          ? (byCode?.Items ?? byCode?.items)
          : []
        if (!baseItems.length && id) {
          try {
            const orderItems = await api(`/api/OrderItems`, { cache: "no-store" })
            baseItems = (Array.isArray(orderItems) ? orderItems : []).filter((it: any) => Number(it.OrderId ?? it.orderId) === id)
          } catch {}
        }
        try {
          const payRes = await api(`/api/Payments`, { cache: "no-store" })
          const list = (Array.isArray(payRes) ? payRes : []).filter((p: any) => Number(p.OrderId ?? p.orderId) === id)
          const mapped = list.map((p: any) => {
            const methodCode = Number(p.PaymentMethod ?? p.paymentMethod)
            const statusCode = Number(p.Status ?? p.status)
            const paidAtRaw = p.PaidAt ?? p.paidAt
            const method = methodCode === 1 ? "Thanh toán khi nhận hàng (COD)" : methodCode === 2 ? "Ví MoMo" : methodCode === 3 ? "Chuyển khoản ngân hàng" : `Phương thức #${methodCode}`
            const status = statusCode === 1 || !!paidAtRaw ? "Đã thanh toán" : statusCode === 0 ? "Chưa thanh toán" : `Trạng thái #${statusCode}`
            const paidAt = paidAtRaw ? (() => { const d = new Date(paidAtRaw as any); return Number.isNaN(d.getTime()) ? undefined : d.toLocaleString("vi-VN") })() : undefined
            const transactionRef = p.TransactionRef ?? p.transactionRef
            return { amount: Number(p.Amount ?? p.amount ?? 0), method, status, transactionRef: transactionRef || undefined, paidAt }
          })
          setPayments(mapped)
          const needsRetry = list.some((p: any) => Number(p.PaymentMethod ?? p.paymentMethod) === 2 && Number(p.Status ?? p.status) === 0)
          if (needsRetry) {
            await new Promise((r) => setTimeout(r, 1500))
            try {
              const payRes2 = await api(`/api/Payments`, { cache: "no-store" })
              const list2 = (Array.isArray(payRes2) ? payRes2 : []).filter((p: any) => Number(p.OrderId ?? p.orderId) === id)
              const mapped2 = list2.map((p: any) => {
                const methodCode = Number(p.PaymentMethod ?? p.paymentMethod)
                const statusCode = Number(p.Status ?? p.status)
                const paidAtRaw = p.PaidAt ?? p.paidAt
                const method = methodCode === 1 ? "Thanh toán khi nhận hàng (COD)" : methodCode === 2 ? "Ví MoMo" : methodCode === 3 ? "Chuyển khoản ngân hàng" : `Phương thức #${methodCode}`
                const status = statusCode === 1 || !!paidAtRaw ? "Đã thanh toán" : statusCode === 0 ? "Chưa thanh toán" : `Trạng thái #${statusCode}`
                const paidAt = paidAtRaw ? (() => { const d = new Date(paidAtRaw as any); return Number.isNaN(d.getTime()) ? undefined : d.toLocaleString("vi-VN") })() : undefined
                const transactionRef = p.TransactionRef ?? p.transactionRef
                return { amount: Number(p.Amount ?? p.amount ?? 0), method, status, transactionRef: transactionRef || undefined, paidAt }
              })
              setPayments(mapped2)
            } catch {}
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
      } finally {
        setLoading(false)
      }
    })()
  }, [code])

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Đặt hàng thành công!</h1>

        <p className="text-lg text-muted-foreground mb-8">
          Cảm ơn bạn đã đặt hàng. Chúng tôi đã nhận được đơn hàng của bạn và sẽ xử lý trong thời gian sớm nhất.
        </p>

        <div className="bg-card border border-border rounded-lg p-6 mb-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Mã đơn hàng</p>
              <p className="font-semibold text-foreground">{orderCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ngày đặt hàng</p>
              <p className="font-semibold text-foreground">{orderDate}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-8 text-left">
          <div className="flex items-start gap-4">
            <Package className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Thông tin đơn hàng</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="font-semibold text-foreground">{subtotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Giảm giá</span>
                  <span className="font-semibold text-green-600">-{discount.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span className="font-semibold text-foreground">{shipping === 0 ? "Miễn phí" : `${shipping.toLocaleString("vi-VN")}đ`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Tổng cộng</span>
                  <span className="text-xl font-bold text-primary">{total.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>
              {shippingAddress ? (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-1">Địa chỉ giao hàng</p>
                  <p className="text-sm text-foreground">{shippingAddress}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-foreground mb-4">Sản phẩm</h3>
            <div className="space-y-4">
              {items.map((it) => (
                <div key={it.productId} className="flex gap-4">
                  <img src={it.image || "/placeholder.svg"} alt={it.name} className="w-16 h-16 object-cover rounded bg-secondary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{it.name}</p>
                    <p className="text-sm text-muted-foreground">Số lượng: {it.quantity}</p>
                    <p className="text-sm font-semibold text-primary">{it.price.toLocaleString("vi-VN")}đ</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{(it.price * it.quantity).toLocaleString("vi-VN")}đ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-foreground mb-4">Thông tin thanh toán</h3>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có thông tin thanh toán</p>
          ) : (
            <div className="space-y-4">
              {payments.map((p, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phương thức</p>
                    <p className="font-medium text-foreground">{p.method}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                    <p className="font-medium text-foreground">{p.status}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Số tiền</p>
                    <p className="font-medium text-foreground">{p.amount.toLocaleString("vi-VN")}đ</p>
                  </div>
                  {p.transactionRef ? (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Mã giao dịch</p>
                      <p className="font-medium text-foreground">{p.transactionRef}</p>
                    </div>
                  ) : null}
                  {p.paidAt ? (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Thời điểm thanh toán</p>
                      <p className="font-medium text-foreground">{p.paidAt}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/orders">
              Xem đơn hàng
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/shop">Tiếp tục mua sắm</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
