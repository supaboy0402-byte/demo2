"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Eye, Edit2 } from "lucide-react"
import { api } from "@/lib/api"

type UITicket = {
  id: number
  warrantyCode: string
  customerName: string
  productName: string
  orderCode: string
  status: string
  createdAt: string
  underWarranty: boolean
  extraCost: number
  estimatedReturnDate: string
  staffName: string
}

export default function WarrantyManagementPage() {
  const [tickets, setTickets] = useState<UITicket[]>([])
  const [searchText, setSearchText] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api("/api/WarrantyTickets")
        const rows: UITicket[] = await Promise.all(
          (Array.isArray(data) ? data : []).map(async (t: any) => {
            const oid = Number(t.OrderId ?? t.orderId)
            const pid = Number(t.ProductId ?? t.productId)

            let productName = ""
            try {
              if (Number.isFinite(pid) && pid > 0) {
                const product = await api(`/api/Products/${pid}`)
                if (product) productName = String(product.ProductName ?? product.productName ?? String(pid))
              } else if (Number.isFinite(oid) && oid > 0) {
                const allItems = await api(`/api/OrderItems`)
                const items = (Array.isArray(allItems) ? allItems : []).filter((it: any) => Number(it.OrderId ?? it.orderId) === oid)
                const names: string[] = []
                for (const it of items) {
                  const ip = Number(it.ProductId ?? it.productId)
                  if (!Number.isFinite(ip) || ip <= 0) continue
                  try {
                    const p = await api(`/api/Products/${ip}`)
                    if (p) names.push(String(p.ProductName ?? p.productName ?? String(ip)))
                  } catch {}
                }
                if (names.length === 1) productName = names[0]
                else if (names.length > 1) productName = `${names[0]} + ${names.length - 1} sản phẩm`
              }
            } catch {}

            let customerName = "Khách hàng"
            try {
              const uid = Number(t.UserId ?? t.userId)
              let resolvedUid = Number.isFinite(uid) && uid > 0 ? uid : 0
              if (!resolvedUid && Number.isFinite(oid) && oid > 0) {
                const order = await api(`/api/Orders/${oid}`)
                const ouid = Number(order?.UserId ?? order?.userId)
                if (Number.isFinite(ouid) && ouid > 0) resolvedUid = ouid
              }
              if (resolvedUid) {
                const user = await api(`/api/Users/${resolvedUid}`)
                if (user) customerName = String(user.FullName ?? user.fullName ?? user.Email ?? user.email ?? customerName)
              }
            } catch {}

            let orderCode = ""
            try {
              if (Number.isFinite(oid) && oid > 0) {
                const order = await api(`/api/Orders/${oid}`)
                if (order) orderCode = String(order.OrderCode ?? order.orderCode ?? "")
              }
            } catch {}

            let staffName = ""
            try {
              const sid = Number(t.StaffHandledBy ?? t.staffHandledBy)
              if (Number.isFinite(sid) && sid > 0) {
                const staff = await api(`/api/Users/${sid}`)
                if (staff) staffName = String(staff.FullName ?? staff.fullName ?? staff.Email ?? staff.email ?? "")
              }
            } catch {}

            const createdAtRaw = t.CreatedAt ?? t.createdAt
            const createdAt = createdAtRaw ? new Date(createdAtRaw).toISOString().slice(0, 10) : ""

            const wcRaw = t.WarrantyCode ?? t.warrantyCode
            const wc = typeof wcRaw === "string" ? wcRaw.trim() : ""
            const warrantyCode = wc && wc.toLowerCase() !== "undefined" ? wc : ""

            const idRaw = t.WarrantyId ?? t.warrantyId
            const idNum = Number(idRaw)
            const id = Number.isFinite(idNum) ? idNum : -1

            const underWarranty = !!(t.IsUnderWarranty ?? t.isUnderWarranty)
            const extraCost = Number(t.ExtraCost ?? t.extraCost ?? 0)
            const estimatedReturnDateRaw = t.EstimatedReturnDate ?? t.estimatedReturnDate
            const estimatedReturnDate = estimatedReturnDateRaw ? new Date(estimatedReturnDateRaw).toISOString().slice(0, 10) : ""

            return {
              id,
              warrantyCode,
              customerName,
              productName,
              orderCode,
              status: String((t.WarrantyStatus ?? t.warrantyStatus) || "Pending"),
              createdAt,
              underWarranty,
              extraCost,
              estimatedReturnDate,
              staffName,
            }
          })
        )
        if (!cancelled) setTickets(rows)
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản Lý Bảo Hành</h1>
            <p className="text-muted-foreground mt-1">Quản lý các phiếu bảo hành của khách hàng</p>
          </div>
          <Link href="/admin/warranty/create">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Tạo Phiếu Bảo Hành
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Tổng Phiếu</p>
              <p className="text-3xl font-bold text-foreground">{tickets.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Đang Xử Lý</p>
              <p className="text-3xl font-bold text-blue-600">
                {tickets.filter((t) => t.status === "In Progress").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Chờ Xử Lý</p>
              <p className="text-3xl font-bold text-yellow-600">
                {tickets.filter((t) => t.status === "Pending").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Hoàn Thành</p>
              <p className="text-3xl font-bold text-green-600">
                {tickets.filter((t) => t.status === "Completed").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tìm kiếm</p>
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border rounded-md bg-background text-foreground"
                  placeholder="Mã phiếu, khách hàng, sản phẩm"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border rounded-md bg-background text-foreground"
                >
                  <option value="">Tất cả</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Phiếu Bảo Hành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Mã Phiếu</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Khách Hàng</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Sản Phẩm</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Đơn Hàng</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Trạng Thái</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">BH</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Chi Phí</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Trả Dự Kiến</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">NV Xử Lý</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Ngày Tạo</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets
                    .filter((t) => (filterStatus ? t.status === filterStatus : true))
                    .filter((t) => {
                      const q = searchText.trim().toLowerCase()
                      if (!q) return true
                      return (
                        t.warrantyCode.toLowerCase().includes(q) ||
                        t.customerName.toLowerCase().includes(q) ||
                        t.productName.toLowerCase().includes(q) ||
                        t.orderCode.toLowerCase().includes(q) ||
                        t.staffName.toLowerCase().includes(q) ||
                        t.status.toLowerCase().includes(q)
                      )
                    })
                    .sort((a, b) => {
                      const da = Date.parse(a.createdAt) || 0
                      const db = Date.parse(b.createdAt) || 0
                      return db - da
                    })
                    .slice(page * pageSize, page * pageSize + pageSize)
                    .map((ticket, idx) => (
                    <tr
                      key={
                        ticket.warrantyCode
                          ? `code-${ticket.warrantyCode}`
                          : Number.isFinite(ticket.id)
                          ? `id-${ticket.id}`
                          : `row-${ticket.createdAt || ''}-${idx}`
                      }
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="py-3 px-4 font-mono text-sm text-foreground">
                        {Number.isFinite(ticket.id) && ticket.id > 0 ? (
                          <Link href={`/admin/warranty/${ticket.id}?mode=view`} className="hover:underline">
                            {ticket.warrantyCode}
                          </Link>
                        ) : (
                          ticket.warrantyCode
                        )}
                      </td>
                      <td className="py-3 px-4 text-foreground">{ticket.customerName}</td>
                      <td className="py-3 px-4 text-foreground text-sm">{ticket.productName}</td>
                      <td className="py-3 px-4 font-mono text-sm text-foreground">{ticket.orderCode}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {ticket.underWarranty ? (
                          <Badge className="bg-green-100 text-green-800">Trong hạn</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Hết hạn</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {ticket.extraCost ? `${ticket.extraCost.toLocaleString()} đ` : "0 đ"}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{ticket.estimatedReturnDate}</td>
                      <td className="py-3 px-4 text-foreground">{ticket.staffName}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{ticket.createdAt}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {Number.isFinite(ticket.id) && ticket.id > 0 ? (
                            <Link href={`/admin/warranty/${ticket.id}?mode=view`}>
                              <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                                <Eye className="w-4 h-4" />
                                Xem
                              </Button>
                            </Link>
                          ) : (
                            <Button size="sm" variant="outline" className="gap-1 bg-transparent" disabled>
                              <Eye className="w-4 h-4" />
                              Xem
                            </Button>
                          )}
                          {Number.isFinite(ticket.id) && ticket.id > 0 ? (
                            <Link href={`/admin/warranty/${ticket.id}`}>
                              <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                                <Edit2 className="w-4 h-4" />
                                Sửa
                              </Button>
                            </Link>
                          ) : (
                            <Button size="sm" variant="outline" className="gap-1 bg-transparent" disabled>
                              <Edit2 className="w-4 h-4" />
                              Sửa
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))}>Trang trước</Button>
            <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Trang sau</Button>
            <span className="text-sm text-muted-foreground">Trang {page + 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mỗi trang</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(0)
              }}
              className="px-2 py-1 border rounded bg-background text-foreground"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>
    </main>
  )
}
