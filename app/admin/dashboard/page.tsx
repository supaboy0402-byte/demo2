"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"

const statusConfig = {
  0: { label: "Chờ xác nhận", variant: "secondary" as const },
  1: { label: "Đang xử lý", variant: "default" as const },
  2: { label: "Đã giao", variant: "default" as const },
  3: { label: "Đã hủy", variant: "destructive" as const },
} as const

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    monthRevenue: number
    prevMonthRevenue?: number
    monthOrdersCount: number
    productsCount: number
    customersCount: number
  } | null>(null)
  const [recentOrders, setRecentOrders] = useState<Array<{
    id: number
    orderCode: string
    customer: string
    total: number
    status: number
    orderDate: string
  }>>([])
  const [revenueDaily, setRevenueDaily] = useState<Array<{ date: string; amount: number }>>([])
  const [statusCounts, setStatusCounts] = useState<Array<{ status: number; count: number }>>([])
  const [topProducts, setTopProducts] = useState<Array<{ productId: number; productName: string; quantity: number; revenue: number }>>([])
  const [from, setFrom] = useState<string>(() => {
    const d = new Date()
    const s = new Date(d.getFullYear(), d.getMonth(), 1)
    return s.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const qs = from && to ? `?from=${from}&to=${to}` : ""
        const data = await api(`/api/Admin/dashboard${qs}`)
        setStats(data?.stats || null)
        setRecentOrders(Array.isArray(data?.recentOrders) ? data.recentOrders : [])
        setRevenueDaily(Array.isArray(data?.revenueDaily) ? data.revenueDaily : [])
        setStatusCounts(Array.isArray(data?.statusCounts) ? data.statusCounts : [])
        setTopProducts(Array.isArray(data?.topProducts) ? data.topProducts : [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function applyRange() {
    if (!from || !to) return
    if (new Date(from) > new Date(to)) return
    try {
      setApplying(true)
      setLoading(true)
      const qs = `?from=${from}&to=${to}`
      const data = await api(`/api/Admin/dashboard${qs}`)
      setStats(data?.stats || null)
      setRecentOrders(Array.isArray(data?.recentOrders) ? data.recentOrders : [])
      setRevenueDaily(Array.isArray(data?.revenueDaily) ? data.revenueDaily : [])
      setStatusCounts(Array.isArray(data?.statusCounts) ? data.statusCounts : [])
      setTopProducts(Array.isArray(data?.topProducts) ? data.topProducts : [])
    } finally {
      setApplying(false)
      setLoading(false)
    }
  }

  const revPrev = Number(stats?.prevMonthRevenue || 0)
  const revCurr = Number(stats?.monthRevenue || 0)
  const revDiff = revCurr - revPrev
  const revPct = revPrev > 0 ? (revDiff / revPrev) * 100 : (revCurr > 0 ? 100 : 0)
  const statCards = stats
    ? [
        {
          title: "Doanh thu tháng này",
          value: `${Number(stats.monthRevenue).toLocaleString("vi-VN")}đ`,
          change: `${revDiff >= 0 ? "+" : ""}${revPct.toFixed(1)}%`,
          trend: revDiff >= 0 ? "up" as const : "down" as const,
          icon: DollarSign,
        },
        {
          title: "Đơn hàng",
          value: String(stats.monthOrdersCount),
          change: "",
          trend: "up" as const,
          icon: ShoppingCart,
        },
        {
          title: "Sản phẩm",
          value: String(stats.productsCount),
          change: "",
          trend: "up" as const,
          icon: Package,
        },
        {
          title: "Khách hàng",
          value: String(stats.customersCount),
          change: "",
          trend: "up" as const,
          icon: Users,
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Tổng quan</h2>
        <p className="text-muted-foreground">Thống kê và hoạt động gần đây</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Từ ngày</div>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[200px]" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Đến ngày</div>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[200px]" />
              </div>
              <div className="md:ml-auto">
                <Button onClick={applyRange} disabled={applying || !from || !to || new Date(from) > new Date(to)}>Áp dụng</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {loading && statCards.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Đang tải...</CardTitle>
            </CardHeader>
          </Card>
        ) : (
          statCards.map((stat) => {
            const Icon = stat.icon
            const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  {stat.change && (
                    <div className="flex items-center gap-1 text-sm">
                      <TrendIcon className={`h-4 w-4 ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`} />
                      <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>{stat.change}</span>
                      <span className="text-muted-foreground">so với tháng trước</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Đơn hàng gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig[0]
              const dateText = new Date(order.orderDate).toLocaleString("vi-VN")
              return (
                <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{order.orderCode}</p>
                    <p className="text-sm text-muted-foreground">{order.customer}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{Number(order.total).toLocaleString("vi-VN")}đ</p>
                      <p className="text-sm text-muted-foreground">{dateText}</p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>
              )
            })}
            {!loading && recentOrders.length === 0 && (
              <div className="text-muted-foreground">Chưa có đơn hàng</div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo ngày</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueDaily} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => `${Number(v).toLocaleString("vi-VN")}` } />
                <Tooltip formatter={(val: any) => `${Number(val).toLocaleString("vi-VN")}đ`} />
                <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bổ trạng thái đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[0,1,2,3].map((s) => {
                const cfg = statusConfig[s as keyof typeof statusConfig]
                const count = statusCounts.find((x) => x.status === s)?.count || 0
                return (
                  <div key={s} className="flex items-center justify-between">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    <div className="text-foreground font-medium">{count}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top sản phẩm tháng</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((p) => (
                <TableRow key={p.productId}>
                  <TableCell className="font-medium">{p.productName}</TableCell>
                  <TableCell className="text-right">{p.quantity}</TableCell>
                  <TableCell className="text-right">{Number(p.revenue).toLocaleString("vi-VN")}đ</TableCell>
                </TableRow>
              ))}
              {topProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">Chưa có dữ liệu</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
