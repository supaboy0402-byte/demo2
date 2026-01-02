"use client"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"

type StatusLabel = "Chờ xác nhận" | "Đang xử lý" | "Đã giao" | "Đã hủy"

export default function OrderCheckPage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [result, setResult] = useState<null | {
    orderCode: string
    orderDate: string
    status: StatusLabel
    subtotal: number
    discount: number
    shipping: number
    total: number
    paymentStatus: "Đã thanh toán" | "Chưa thanh toán" | "Thất bại"
    itemsCount: number
  }>(null)

  const handleSearch = async () => {
    const c = code.trim()
    if (!c) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      let byCode: any = null
      try {
        byCode = await api(`/api/Orders/by-code/${encodeURIComponent(c)}`, { cache: "no-store" })
      } catch {}
      if (!byCode) {
        try {
          const all = await api(`/api/Orders`, { cache: "no-store" })
          const found = (Array.isArray(all) ? all : []).find((o: any) => String(o.OrderCode ?? o.orderCode).trim().toUpperCase() === c.toUpperCase())
          if (found) {
            byCode = { OrderId: Number(found.OrderId ?? found.orderId), OrderCode: String(found.OrderCode ?? found.orderCode) }
          }
        } catch {}
      }
      if (!byCode) {
        setError(`Không tìm thấy đơn hàng với mã "${c}"`)
        return
      }
      const id = Number(byCode?.OrderId ?? byCode?.orderId ?? 0)
      const oc = String(byCode?.OrderCode ?? byCode?.orderCode ?? c)
      let full: any = null
      try {
        if (id) full = await api(`/api/Orders/${id}`, { cache: "no-store" })
      } catch {}
      const sub = Number(full?.SubTotal ?? full?.subTotal ?? 0)
      const disc = Number(full?.DiscountAmount ?? full?.discountAmount ?? 0)
      const tot = Number(full?.TotalAmount ?? full?.totalAmount ?? sub)
      const ship = sub > 10000000 ? 0 : 200000
      const createdRaw = full?.CreatedAt ?? full?.createdAt ?? full?.OrderDate ?? full?.orderDate
      let orderDate = new Date().toLocaleDateString("vi-VN")
      if (createdRaw) {
        try {
          const d = new Date(createdRaw)
          if (!Number.isNaN(d.getTime())) orderDate = d.toLocaleDateString("vi-VN")
        } catch {}
      }
      const stCode = Number(full?.Status ?? full?.status ?? 0)
      const status: StatusLabel = stCode === 0 ? "Chờ xác nhận" : stCode === 1 ? "Đang xử lý" : stCode === 3 ? "Đã hủy" : "Đã giao"
      let paymentStatus: "Đã thanh toán" | "Chưa thanh toán" | "Thất bại" = "Chưa thanh toán"
      try {
        const payRes = await api(`/api/Payments`, { cache: "no-store" })
        const list = (Array.isArray(payRes) ? payRes : []).filter((p: any) => Number(p.OrderId ?? p.orderId) === id)
        if (list.length > 0) {
          const anyPaid = list.some((p: any) => Number(p.Status ?? p.status) === 1 || !!(p.PaidAt ?? p.paidAt))
          paymentStatus = anyPaid ? "Đã thanh toán" : "Chưa thanh toán"
        }
      } catch {}
      let itemsCount = 0
      try {
        const orderItems = await api(`/api/OrderItems`, { cache: "no-store" })
        itemsCount = (Array.isArray(orderItems) ? orderItems : []).filter((it: any) => Number(it.OrderId ?? it.orderId) === id).length
      } catch {}
      setResult({ orderCode: oc, orderDate, status, subtotal: sub, discount: disc, shipping: ship, total: tot, paymentStatus, itemsCount })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">Tra cứu đơn hàng</h1>
          <p className="text-muted-foreground">Nhập mã đơn để xem trạng thái và chi tiết</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nhập mã đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="VD: ORD2024120100123"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1"
                disabled={loading}
              />
              <Button type="button" onClick={handleSearch} disabled={loading}>
                Tra cứu
              </Button>
            </div>
            {error && (
              <div className="mt-4 text-sm text-red-600">{error}</div>
            )}
          </CardContent>
        </Card>

        {result && (
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kết quả tra cứu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
                    <p className="font-semibold text-foreground">{result.orderCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày đặt</p>
                    <p className="font-semibold text-foreground">{result.orderDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                    <p className="font-semibold text-foreground">{result.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Thanh toán</p>
                    <p className="font-semibold text-foreground">{result.paymentStatus}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tạm tính</p>
                    <p className="font-semibold text-foreground">{result.subtotal.toLocaleString("vi-VN")}đ</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Giảm giá</p>
                    <p className="font-semibold text-green-600">-{result.discount.toLocaleString("vi-VN")}đ</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phí vận chuyển</p>
                    <p className="font-semibold text-foreground">{result.shipping === 0 ? "Miễn phí" : `${result.shipping.toLocaleString("vi-VN")}đ`}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tổng cộng</p>
                    <p className="text-xl font-bold text-primary">{result.total.toLocaleString("vi-VN")}đ</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Số sản phẩm: {result.itemsCount}</p>
                  <Button asChild variant="outline">
                    <Link href={`/orders/${result.orderCode}`}>Xem chi tiết</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button asChild variant="ghost">
            <Link href="/shop">Tiếp tục mua sắm</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

