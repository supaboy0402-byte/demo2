"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const [productsRes, detailsRes, movementsRes] = await Promise.all([
          api("/api/Products").catch(() => []),
          api("/api/StockDetails").catch(() => []),
          api("/api/StockMovements").catch(() => []),
        ])
        const productMap: Record<number, string> = Array.isArray(productsRes)
          ? productsRes.reduce((acc: Record<number, string>, p: any) => {
              const pid = p.productId ?? p.ProductId
              const name = p.productName ?? p.ProductName ?? ""
              if (pid != null) acc[pid] = String(name)
              return acc
            }, {})
          : {}
        const mvMap: Record<number, any> = Array.isArray(movementsRes)
          ? movementsRes.reduce((acc: Record<number, any>, m: any) => {
              const id = m.stockMovementId ?? m.StockMovementId
              if (id != null) acc[id] = m
              return acc
            }, {})
          : {}
        const items = Array.isArray(detailsRes)
          ? detailsRes.map((d: any) => {
              const pid = d.productId ?? d.ProductId
              const mid = d.stockMovementId ?? d.StockMovementId
              const qty = Number(d.quantity ?? d.Quantity ?? 0)
              const mv = mvMap[mid] || {}
              const type = mv.movementType ?? mv.MovementType ?? ""
              const refType = mv.referenceType ?? mv.ReferenceType ?? ""
              const refCode = mv.referenceCode ?? mv.ReferenceCode ?? ""
              const createdById = mv.createdBy ?? mv.CreatedBy
              const createdAtStr = mv.createdAt ?? mv.CreatedAt
              const createdAt = createdAtStr ? new Date(createdAtStr).toISOString().slice(0, 10) : ""
              const createdBy = createdById != null ? `User #${createdById}` : "Hệ thống"
              return {
                id: String((d.stockDetailId ?? d.StockDetailId) ?? `${mid}-${pid}-${createdAt}`),
                movementType: String(type),
                productId: String(pid ?? ""),
                productName: productMap[pid] || "",
                quantity: qty,
                referenceType: String(refType || ""),
                referenceCode: String(refCode || ""),
                createdBy,
                createdAt,
              }
            })
          : []
        items.sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt)))
        setMovements(items)
      } catch {}
    })()
  }, [])
  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN":
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case "OUT":
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case "ADJUST":
        return <Minus className="w-4 h-4 text-blue-600" />
      default:
        return null
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case "IN":
        return "bg-green-100 text-green-800"
      case "OUT":
        return "bg-red-100 text-red-800"
      case "ADJUST":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "IN":
        return "Nhập Kho"
      case "OUT":
        return "Xuất Kho"
      case "ADJUST":
        return "Điều Chỉnh"
      default:
        return type
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Phiếu Xuất Nhập Hàng</h1>
          <p className="text-muted-foreground mt-1">Lịch sử tất cả các phiếu xuất nhập kho</p>
        </div>

        {/* Movements Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Phiếu Xuất Nhập</CardTitle>
            <CardDescription>Hiển thị {movements.length} phiếu gần đây</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Loại</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Sản Phẩm</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Số Lượng</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Tham Chiếu</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Người Tạo</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.movementType)}
                          <Badge className={getMovementColor(movement.movementType)}>
                            {getMovementLabel(movement.movementType)}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground">{movement.productName}</td>
                      <td className="py-3 px-4 text-center font-semibold text-foreground">
                        {movement.movementType === "OUT" ? "-" : "+"}
                        {movement.quantity}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-mono text-muted-foreground">{movement.referenceCode}</p>
                          <p className="text-xs text-muted-foreground">{movement.referenceType}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{movement.createdBy}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{movement.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
