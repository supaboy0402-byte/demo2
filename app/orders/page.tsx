"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Clock, CheckCircle2, XCircle, Eye } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/contexts/auth-context"

const statusConfig = {
  pending: { label: "Chờ xác nhận", icon: Clock, variant: "secondary" as const },
  processing: { label: "Đang xử lý", icon: Package, variant: "default" as const },
  delivered: { label: "Đã giao", icon: CheckCircle2, variant: "default" as const },
  cancelled: { label: "Đã hủy", icon: XCircle, variant: "destructive" as const },
}

 

type OrderSummary = {
  orderId: number
  orderCode: string
  orderDate: string
  status: "pending" | "processing" | "delivered" | "cancelled"
  totalAmount: number
  items: Array<{ name: string; quantity: number; price: number; image?: string }>
}

function toStatus(v: number): OrderSummary["status"] {
  return v === 0 ? "pending" : v === 1 ? "processing" : v === 3 ? "cancelled" : "delivered"
}

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderSummary[]>([])

  useEffect(() => {
    ;(async () => {
      if (authLoading) return
      try {
        if (!user) {
          setOrders([])
          return
        }
        const [ordersRes, itemsRes, productsRes, imagesRes] = await Promise.all([
          api("/api/Orders", { cache: "no-store" }),
          api("/api/OrderItems", { cache: "no-store" }),
          api("/api/Products", { cache: "no-store" }),
          api("/api/ProductImages", { cache: "no-store" }),
        ])
        const userOrders = (Array.isArray(ordersRes) ? ordersRes : [])
          .filter((o: any) => Number(o.UserId ?? o.userId) === user.userId)
          .map((o: any) => ({
            orderId: Number(o.OrderId ?? o.orderId),
            orderCode: String(o.OrderCode ?? o.orderCode),
            orderDate: String(o.OrderDate ?? o.orderDate ?? o.CreatedAt ?? o.createdAt ?? new Date().toISOString()),
            status: toStatus(Number(o.Status ?? o.status ?? 0)),
            totalAmount: Number(o.TotalAmount ?? o.totalAmount ?? 0),
            items: [],
          }))
        const items = Array.isArray(itemsRes)
          ? (itemsRes as any[]).map((it) => ({
              orderId: Number(it.OrderId ?? it.orderId),
              productId: Number(it.ProductId ?? it.productId),
              quantity: Number(it.Quantity ?? it.quantity) || 0,
              unitPrice: Number(it.UnitPrice ?? it.unitPrice ?? 0),
            }))
          : []
        const productsMap: Record<number, { name: string; price: number }> = {}
        if (Array.isArray(productsRes)) {
          for (const p of productsRes as any[]) {
            const pid = Number((p as any).ProductId ?? (p as any).productId)
            const name = String((p as any).ProductName ?? (p as any).productName ?? pid)
            const priceRaw = (p as any).discountPrice ?? (p as any).DiscountPrice
            const unitRaw = (p as any).unitPrice ?? (p as any).UnitPrice
            const price = priceRaw != null ? Number(priceRaw) : Number(unitRaw ?? 0)
            if (pid) productsMap[pid] = { name, price }
          }
        }
        const imageMap: Record<number, string> = {}
        if (Array.isArray(imagesRes)) {
          for (const im of imagesRes as any[]) {
            const pid = Number((im as any).ProductId ?? (im as any).productId)
            const url = String((im as any).ImageUrl ?? (im as any).imageUrl ?? "")
            const isMain = !!((im as any).IsMain ?? (im as any).isMain)
            if (pid && url && isMain) imageMap[pid] = url
          }
        }
        const enriched = userOrders.map((o) => {
          const its = items.filter((it) => it.orderId === o.orderId).map((it) => {
            const info = productsMap[it.productId]
            return {
              name: info ? info.name : String(it.productId),
              quantity: it.quantity,
              price: info ? info.price : it.unitPrice,
              image: imageMap[it.productId],
            }
          })
          return { ...o, items: its }
        })
        setOrders(enriched)
      } finally {
        setLoading(false)
      }
    })()
  }, [authLoading, user])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">Đơn hàng của tôi</h1>
        <p className="text-muted-foreground">Theo dõi và quản lý đơn hàng của bạn</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg text-foreground mb-2">Đang tải đơn hàng...</h3>
            <p className="text-muted-foreground mb-6">Vui lòng đợi trong giây lát</p>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg text-foreground mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-muted-foreground mb-6">{user ? "Bạn chưa có đơn hàng nào." : "Vui lòng đăng nhập để xem đơn hàng."}</p>
            <div className="flex gap-2 justify-center">
              {!user ? (
                <Button asChild variant="default">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/orders/check">Tra cứu đơn hàng</Link>
              </Button>
              <Button asChild>
                <Link href="/shop">Khám phá sản phẩm</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const status = statusConfig[order.status]
            const StatusIcon = status.icon
            const dateLabel = (() => {
              try {
                const d = new Date(order.orderDate)
                if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("vi-VN")
              } catch {}
              return order.orderDate
            })()
            return (
              <Card key={order.orderCode}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg mb-2">{order.orderCode}</CardTitle>
                      <p className="text-sm text-muted-foreground">Ngày đặt: {dateLabel}</p>
                    </div>
                    <Badge variant={status.variant} className="w-fit">
                      <StatusIcon className="h-4 w-4 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-20 h-20 object-cover rounded bg-secondary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground line-clamp-2">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Số lượng: {item.quantity}</p>
                          <p className="text-sm font-semibold text-primary">{item.price.toLocaleString("vi-VN")}đ</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tổng cộng</p>
                      <p className="text-xl font-bold text-primary">{order.totalAmount.toLocaleString("vi-VN")}đ</p>
                    </div>
                    <Button asChild variant="outline">
                      <Link href={`/orders/${order.orderCode}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Chi tiết
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
