"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TrendingDown, TrendingUp, AlertTriangle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"

export default function StockManagementPage() {
  const [summary, setSummary] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const [productsRes, detailsRes, movementsRes] = await Promise.all([
          api("/api/Products").catch(() => []),
          api("/api/StockDetails").catch(() => []),
          api("/api/StockMovements").catch(() => []),
        ])
        const mvMap: Record<number, any> = Array.isArray(movementsRes)
          ? movementsRes.reduce((acc: Record<number, any>, m: any) => {
              const id = m.stockMovementId ?? m.StockMovementId
              if (id != null) acc[id] = m
              return acc
            }, {})
          : {}
        const lastByProduct: Record<number, string> = {}
        if (Array.isArray(detailsRes)) {
          for (const d of detailsRes) {
            const pid = d.productId ?? d.ProductId
            const mid = d.stockMovementId ?? d.StockMovementId
            if (pid == null || mid == null) continue
            const mv = mvMap[mid]
            const created = mv ? mv.createdAt ?? mv.CreatedAt : null
            const dateStr = created ? new Date(created).toISOString().slice(0, 10) : ""
            const prev = lastByProduct[pid]
            if (dateStr && (!prev || prev < dateStr)) lastByProduct[pid] = dateStr
          }
        }
        const items = Array.isArray(productsRes)
          ? productsRes.map((p: any) => {
              const pid = p.productId ?? p.ProductId
              const name = p.productName ?? p.ProductName ?? ""
              const sku = p.sku ?? p.Sku ?? ""
              const qty = Number(p.quantity ?? p.Quantity ?? 0)
              const price = Number((p.discountPrice ?? p.DiscountPrice ?? p.unitPrice ?? p.UnitPrice) ?? 0)
              const last = lastByProduct[pid]
              return {
                productId: String(pid ?? ""),
                productName: String(name),
                sku: String(sku || ""),
                currentStock: qty,
                minStock: 3,
                maxStock: 100,
                lastMovement: last || "",
                value: qty * price,
              }
            })
          : []
        setSummary(items)
      } catch {}
    })()
  }, [])

  const lowStockItems = useMemo(() => summary.filter((item) => item.currentStock <= item.minStock), [summary])
  const totalValue = useMemo(() => summary.reduce((sum, item) => sum + Number(item.value ?? 0), 0), [summary])

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản Lý Kho Hàng</h1>
            <p className="text-muted-foreground mt-1">Theo dõi tồn kho và quản lý phiếu xuất nhập</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/stock/in">
              <Button className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Nhập Kho
              </Button>
            </Link>
            <Link href="/admin/stock/out">
              <Button variant="outline" className="gap-2 bg-transparent">
                <TrendingDown className="w-4 h-4" />
                Xuất Kho
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Tổng SKU</p>
              <p className="text-3xl font-bold text-foreground">{summary.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Tổng Tồn Kho</p>
              <p className="text-3xl font-bold text-foreground">
                {summary.reduce((sum, item) => sum + Number(item.currentStock || 0), 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Giá Trị Kho</p>
              <p className="text-2xl font-bold text-foreground">{(totalValue / 1000000000).toFixed(1)}B VND</p>
            </CardContent>
          </Card>
          <Card className={lowStockItems.length > 0 ? "border-red-200 bg-red-50" : ""}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Hàng Sắp Hết</p>
              <p className={`text-3xl font-bold ${lowStockItems.length > 0 ? "text-red-600" : "text-foreground"}`}>
                {lowStockItems.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertTriangle className="w-5 h-5" />
                Cảnh Báo Hàng Sắp Hết
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center p-2 bg-white rounded">
                    <div>
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        Tồn kho: {item.currentStock} / Tối thiểu: {item.minStock}
                      </p>
                    </div>
                    <Link href="/admin/stock/in">
                      <Button size="sm">Nhập Kho</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tồn Kho Sản Phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Sản Phẩm</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">SKU</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Tồn Kho</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Tối Thiểu</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Tối Đa</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Cập Nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((item) => (
                    <tr key={item.productId} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-foreground">{item.productName}</td>
                      <td className="py-3 px-4 font-mono text-sm text-muted-foreground">{item.sku}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold ${Number(item.currentStock || 0) <= Number(item.minStock || 0) ? "text-red-600" : "text-foreground"}`}
                        >
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{item.minStock}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{item.maxStock}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{item.lastMovement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-3">
          <Link href="/admin/stock/movements">
            <Button variant="outline">Xem Phiếu Xuất Nhập</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
