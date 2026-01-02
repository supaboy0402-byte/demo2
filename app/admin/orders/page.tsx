"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Eye, Download, Trash2, RefreshCw, XCircle, PlusCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

const statusConfig = {
  0: { label: "Chờ xác nhận", variant: "secondary" as const },
  1: { label: "Đang xử lý", variant: "default" as const },
  2: { label: "Đã giao", variant: "default" as const },
  3: { label: "Đã hủy", variant: "destructive" as const },
} as const

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Array<{
    orderId: number
    orderCode: string
    userId: number | null
    orderDate: string
    status: number
    totalAmount: number
    shippingAddress?: string | null
    subTotal?: number
    discountAmount?: number
    couponId?: number | null
  }>>([])
  const [couponsById, setCouponsById] = useState<Record<number, { code: string }>>({})
  const [usersById, setUsersById] = useState<Record<number, { fullName?: string | null; email: string; phone?: string | null; address?: string | null }>>({})
  const [itemCountByOrderId, setItemCountByOrderId] = useState<Record<number, number>>({})
  const [orderItems, setOrderItems] = useState<Array<{ orderItemId: number; orderId: number; productId: number; quantity: number; unitPrice: number; lineTotal?: number }>>([])
  const [productsById, setProductsById] = useState<Record<number, { productName: string; unitPrice?: number; discountPrice?: number }>>({})
  const [paymentsByOrderId, setPaymentsByOrderId] = useState<Record<number, Array<{ paymentId: number; paymentMethod?: number; status?: number; amount?: number; paidAt?: string; createdAt?: string }>>>({})
  const [paymentUpdatingOrderId, setPaymentUpdatingOrderId] = useState<number | null>(null)
  const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false)
  const [pendingPayment, setPendingPayment] = useState<{ orderId: number; paymentId?: number | null; method?: number; status?: number } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCustomerId, setNewCustomerId] = useState<string>("")
  const [newShippingAddress, setNewShippingAddress] = useState<string>("")
  const [newStatus, setNewStatus] = useState<string>("0")
  const [newShippingMethod, setNewShippingMethod] = useState<string>("1")
  const [newItems, setNewItems] = useState<Array<{ productId: number | null; quantity: number }>>([{ productId: null, quantity: 1 }])
  const [paymentEnabled, setPaymentEnabled] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("1")
  const [paymentStatus, setPaymentStatus] = useState<string>("1")
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<"date" | "total" | "code">("date")
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<{ orderId: number; value: number } | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    ;(async () => {
      try {
        const [ordersRes, usersRes, itemsRes, productsRes, couponsRes, paymentsRes] = await Promise.all([
          api("/api/Orders"),
          api("/api/Users"),
          api("/api/OrderItems"),
          api("/api/Products"),
          api("/api/Coupons"),
          api("/api/Payments"),
        ])
        setOrders(Array.isArray(ordersRes) ? ordersRes.map((o: any) => ({
          orderId: o.orderId ?? o.OrderId,
          orderCode: o.orderCode ?? o.OrderCode,
          userId: o.userId ?? o.UserId ?? null,
          orderDate: o.orderDate ?? o.OrderDate,
          status: o.status ?? o.Status,
          totalAmount: o.totalAmount ?? o.TotalAmount,
          shippingAddress: o.shippingAddress ?? o.ShippingAddress ?? null,
          subTotal: o.subTotal ?? o.SubTotal,
          discountAmount: o.discountAmount ?? o.DiscountAmount,
          couponId: o.couponId ?? o.CouponId ?? null,
        })) : [])
        const usersMap: Record<number, { fullName?: string | null; email: string; phone?: string | null; address?: string | null }> = {}
        if (Array.isArray(usersRes)) {
          for (const u of usersRes as any[]) {
            const uid = (u as any).userId ?? (u as any).UserId
            if (typeof uid === "number") usersMap[uid] = { fullName: (u as any).fullName ?? (u as any).FullName ?? null, email: (u as any).email ?? (u as any).Email, phone: (u as any).phone ?? (u as any).Phone ?? null, address: (u as any).address ?? (u as any).Address ?? null }
          }
        }
        setUsersById(usersMap)
        const counts: Record<number, number> = {}
        if (Array.isArray(itemsRes)) {
          const mapped = (itemsRes as any[]).map((it) => ({
            orderItemId: it.orderItemId ?? it.OrderItemId,
            orderId: it.orderId ?? it.OrderId,
            productId: it.productId ?? it.ProductId,
            quantity: it.quantity ?? it.Quantity,
            unitPrice: it.unitPrice ?? it.UnitPrice,
            lineTotal: it.lineTotal ?? it.LineTotal,
          }))
          setOrderItems(mapped)
          for (const it of mapped) {
            const oid = it.orderId
            if (typeof oid === "number") counts[oid] = (counts[oid] || 0) + (typeof it.quantity === "number" ? it.quantity : 0)
          }
        }
        setItemCountByOrderId(counts)
        const prodMap: Record<number, { productName: string; unitPrice?: number; discountPrice?: number }> = {}
        if (Array.isArray(productsRes)) {
          for (const p of productsRes as any[]) {
            const pid = (p as any).productId ?? (p as any).ProductId
            if (typeof pid === "number") prodMap[pid] = { productName: (p as any).productName ?? (p as any).ProductName, unitPrice: (p as any).unitPrice ?? (p as any).UnitPrice, discountPrice: (p as any).discountPrice ?? (p as any).DiscountPrice }
          }
        }
        setProductsById(prodMap)
        const cpMap: Record<number, { code: string }> = {}
        if (Array.isArray(couponsRes)) {
          for (const c of couponsRes as any[]) {
            const cid = (c as any).couponId ?? (c as any).CouponId
            if (typeof cid === "number") cpMap[cid] = { code: (c as any).code ?? (c as any).Code ?? "" }
          }
        }
        setCouponsById(cpMap)
        const payMap: Record<number, Array<{ paymentId: number; paymentMethod?: number; status?: number; amount?: number; paidAt?: string; createdAt?: string }>> = {}
        if (Array.isArray(paymentsRes)) {
          for (const p of paymentsRes as any[]) {
            const oid = Number((p as any).orderId ?? (p as any).OrderId)
            if (!Number.isFinite(oid)) continue
            const list = payMap[oid] || []
            list.push({
              paymentId: Number((p as any).paymentId ?? (p as any).PaymentId),
              paymentMethod: Number((p as any).paymentMethod ?? (p as any).PaymentMethod),
              status: Number((p as any).status ?? (p as any).Status),
              amount: Number((p as any).amount ?? (p as any).Amount),
              paidAt: (p as any).paidAt ?? (p as any).PaidAt ?? null,
              createdAt: (p as any).createdAt ?? (p as any).CreatedAt ?? null,
            })
            payMap[oid] = list
          }
        }
        setPaymentsByOrderId(payMap)
      } catch (e: any) {
        setError(typeof e?.message === "string" ? e.message : "Lỗi tải dữ liệu")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    const qp = searchParams
    if (!qp) return
    const q = qp.get("q") || ""
    const st = qp.get("status") || "all"
    const sk = (qp.get("sortKey") as any) || "date"
    const sd = (qp.get("sortDir") as "asc" | "desc") || "desc"
    const fd = qp.get("from") || ""
    const td = qp.get("to") || ""
    const pg = Number(qp.get("page") || "1")
    const ps = Number(qp.get("pageSize") || "10")
    setSearchQuery(q)
    setStatusFilter(st)
    setSortKey(sk)
    setSortDir(sd)
    setFromDate(fd)
    setToDate(td)
    setPage(Number.isFinite(pg) && pg > 0 ? pg : 1)
    setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 10)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (statusFilter !== "all") params.set("status", statusFilter)
    params.set("sortKey", sortKey)
    params.set("sortDir", sortDir)
    if (fromDate) params.set("from", fromDate)
    if (toDate) params.set("to", toDate)
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchQuery, statusFilter, sortKey, sortDir, fromDate, toDate, page, pageSize])

  const statusFilterMap: Record<string, number> = { all: -1, pending: 0, processing: 1, delivered: 2, cancelled: 3 }
  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilterMap[statusFilter] === -1 || o.status === statusFilterMap[statusFilter]
    const customerName = o.userId && usersById[o.userId] ? usersById[o.userId].fullName || usersById[o.userId].email : "Khách vãng lai"
    const hay = `${o.orderCode} ${customerName}`.toLowerCase()
    const matchesSearch = hay.includes(debouncedQuery.trim().toLowerCase())
    const dateVal = new Date(o.orderDate).getTime()
    const matchesFrom = fromDate ? dateVal >= new Date(fromDate).getTime() : true
    const matchesTo = toDate ? dateVal <= new Date(toDate).getTime() : true
    return matchesStatus && matchesSearch && matchesFrom && matchesTo
  })
  const sorted = filtered.slice().sort((a, b) => {
    let cmp = 0
    if (sortKey === "date") cmp = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
    else if (sortKey === "total") cmp = Number(a.totalAmount) - Number(b.totalAmount)
    else cmp = String(a.orderCode).localeCompare(String(b.orderCode))
    return sortDir === "asc" ? cmp : -cmp
  })
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = sorted.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize)
  const sumTotal = sorted.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0)
  const selectedOrder = selectedOrderId ? orders.find((o) => o.orderId === selectedOrderId) : null
  const selectedItems = selectedOrderId ? orderItems.filter((it) => it.orderId === selectedOrderId) : []
  const selectedPayments = selectedOrderId ? paymentsByOrderId[selectedOrderId] || [] : []
  const selectedPrimaryPayment = getPrimaryPayment(selectedPayments)

  const statusOptions = [
    { value: 0, label: statusConfig[0].label },
    { value: 1, label: statusConfig[1].label },
    { value: 2, label: statusConfig[2].label },
    { value: 3, label: statusConfig[3].label },
  ]

  function paymentMethodLabel(v?: number) {
    return v === 1 ? "Tiền mặt/COD" : v === 2 ? "Chuyển khoản" : v === 3 ? "Thẻ/Momo" : "—"
  }
  function paymentStatusLabel(v?: number, paidAt?: any) {
    if (v === 1 || paidAt) return "Đã thanh toán"
    if (v === 2) return "Thất bại"
    return "Chờ"
  }

  function getPrimaryPayment(list: Array<{ paymentId: number; paymentMethod?: number; status?: number; amount?: number; paidAt?: string; createdAt?: string }> = []) {
    if (!Array.isArray(list) || list.length === 0) return undefined
    const sorted = list.slice().sort((a, b) => {
      const ta = new Date((a.paidAt ?? a.createdAt ?? "") || 0).getTime()
      const tb = new Date((b.paidAt ?? b.createdAt ?? "") || 0).getTime()
      return ta - tb
    })
    return sorted[sorted.length - 1]
  }

  async function applyPaymentChange(pp: { orderId: number; paymentId?: number | null; method?: number; status?: number }) {
    try {
      setPaymentUpdatingOrderId(pp.orderId)
      const order = orders.find((o) => o.orderId === pp.orderId)
      if (pp.paymentId) {
        const body: any = {}
        if (typeof pp.method === "number") body.paymentMethod = pp.method
        if (typeof pp.status === "number") {
          body.status = pp.status
          if (pp.status === 1) body.paidAt = new Date().toISOString()
        }
        await api(`/api/Payments/${pp.paymentId}`, { method: "PUT", body: JSON.stringify(body) })
        setPaymentsByOrderId((prev) => {
          const list = (prev[pp.orderId] || []).map((p) => (p.paymentId === pp.paymentId ? { ...p, paymentMethod: body.paymentMethod ?? p.paymentMethod, status: body.status ?? p.status, paidAt: typeof body.paidAt !== "undefined" ? body.paidAt : p.paidAt } : p))
          return { ...prev, [pp.orderId]: list }
        })
        toast({ title: "Cập nhật thanh toán thành công" })
      } else {
        const payload: any = {
          orderId: pp.orderId,
          amount: Number(order?.totalAmount ?? 0),
          paymentMethod: typeof pp.method === "number" ? pp.method : 1,
          status: typeof pp.status === "number" ? pp.status : 0,
        }
        if (payload.status === 1) payload.paidAt = new Date().toISOString()
        const res = await api(`/api/Payments`, { method: "POST", body: JSON.stringify(payload) })
        const newPay = {
          paymentId: Number(res?.paymentId ?? res?.PaymentId),
          paymentMethod: Number(res?.paymentMethod ?? res?.PaymentMethod ?? payload.paymentMethod),
          status: Number(res?.status ?? res?.Status ?? payload.status),
          amount: Number(res?.amount ?? res?.Amount ?? payload.amount),
          paidAt: res?.paidAt ?? res?.PaidAt ?? (payload.status === 1 ? payload.paidAt : null),
          createdAt: res?.createdAt ?? res?.CreatedAt ?? new Date().toISOString(),
        }
        setPaymentsByOrderId((prev) => ({ ...prev, [pp.orderId]: [...(prev[pp.orderId] || []), newPay] }))
        toast({ title: "Ghi nhận thanh toán thành công" })
      }
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "Không thể cập nhật thanh toán"
      setError(msg)
      toast({ title: "Không thể cập nhật thanh toán", description: msg })
    } finally {
      setPaymentUpdatingOrderId(null)
      setConfirmPaymentOpen(false)
      setPendingPayment(null)
    }
  }

  async function applyStatusChange(orderId: number, newStatus: number) {
    try {
      setUpdatingId(orderId)
      await api(`/api/Orders/${orderId}`, { method: "PUT", body: JSON.stringify({ status: newStatus }) })
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o)))
      toast({ title: "Cập nhật trạng thái thành công" })
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "Không thể cập nhật trạng thái"
      setError(msg)
      toast({ title: "Không thể cập nhật trạng thái", description: msg })
    } finally {
      setUpdatingId(null)
      setConfirmOpen(false)
      setPendingStatus(null)
    }
  }

  function handleExport() {
    const rows = [
      ["OrderCode", "Customer", "Email", "OrderDate", "ItemCount", "TotalAmount", "Coupon", "PaymentMethod", "PaymentStatus", "Status"],
      ...sorted.map((o) => {
        const customer = o.userId && usersById[o.userId]
          ? (usersById[o.userId].fullName && usersById[o.userId].fullName !== ""
              ? usersById[o.userId].fullName
              : usersById[o.userId].email)
          : "Khách vãng lai"
        const email = o.userId && usersById[o.userId] ? usersById[o.userId].email : ""
        const itemCount = itemCountByOrderId[o.orderId] || 0
        const statusLabel = (statusConfig[o.status as keyof typeof statusConfig] || statusConfig[0]).label
        const pays = paymentsByOrderId[o.orderId] || []
        const primary = pays.length ? pays[pays.length - 1] : undefined
        const methodText = paymentMethodLabel(primary?.paymentMethod)
        const payStatusText = paymentStatusLabel(primary?.status, primary?.paidAt)
        const couponText = o.couponId ? (couponsById[o.couponId] ? `${couponsById[o.couponId].code} (#${o.couponId})` : `#${o.couponId}`) : ""
        return [
          o.orderCode,
          customer,
          email,
          new Date(o.orderDate).toLocaleString("vi-VN"),
          String(itemCount),
          String(o.totalAmount),
          couponText,
          methodText,
          payStatusText,
          statusLabel,
        ]
      }),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function reload() {
    try {
      setLoading(true)
          const [ordersRes, usersRes, itemsRes, productsRes, couponsRes, paymentsRes] = await Promise.all([
            api("/api/Orders"),
            api("/api/Users"),
            api("/api/OrderItems"),
            api("/api/Products"),
            api("/api/Coupons"),
            api("/api/Payments"),
          ])
      setOrders(Array.isArray(ordersRes) ? ordersRes.map((o: any) => ({
        orderId: o.orderId ?? o.OrderId,
        orderCode: o.orderCode ?? o.OrderCode,
        userId: o.userId ?? o.UserId ?? null,
        orderDate: o.orderDate ?? o.OrderDate,
        status: o.status ?? o.Status,
        totalAmount: o.totalAmount ?? o.TotalAmount,
        shippingAddress: o.shippingAddress ?? o.ShippingAddress ?? null,
        subTotal: o.subTotal ?? o.SubTotal,
        discountAmount: o.discountAmount ?? o.DiscountAmount,
        couponId: o.couponId ?? o.CouponId ?? null,
      })) : [])
      const usersMap: Record<number, { fullName?: string | null; email: string; phone?: string | null; address?: string | null }> = {}
      if (Array.isArray(usersRes)) {
        for (const u of usersRes as any[]) {
          const uid = (u as any).userId ?? (u as any).UserId
          if (typeof uid === "number") usersMap[uid] = { fullName: (u as any).fullName ?? (u as any).FullName ?? null, email: (u as any).email ?? (u as any).Email, phone: (u as any).phone ?? (u as any).Phone ?? null, address: (u as any).address ?? (u as any).Address ?? null }
        }
      }
      setUsersById(usersMap)
      const counts: Record<number, number> = {}
      if (Array.isArray(itemsRes)) {
        const mapped = (itemsRes as any[]).map((it) => ({
          orderItemId: it.orderItemId ?? it.OrderItemId,
          orderId: it.orderId ?? it.OrderId,
          productId: it.productId ?? it.ProductId,
          quantity: it.quantity ?? it.Quantity,
          unitPrice: it.unitPrice ?? it.UnitPrice,
          lineTotal: it.lineTotal ?? it.LineTotal,
        }))
        setOrderItems(mapped)
        for (const it of mapped) {
          const oid = it.orderId
          if (typeof oid === "number") counts[oid] = (counts[oid] || 0) + (typeof it.quantity === "number" ? it.quantity : 0)
        }
      }
      setItemCountByOrderId(counts)
      const prodMap: Record<number, { productName: string; unitPrice?: number; discountPrice?: number }> = {}
      if (Array.isArray(productsRes)) {
        for (const p of productsRes as any[]) {
          const pid = (p as any).productId ?? (p as any).ProductId
          if (typeof pid === "number") prodMap[pid] = { productName: (p as any).productName ?? (p as any).ProductName, unitPrice: (p as any).unitPrice ?? (p as any).UnitPrice, discountPrice: (p as any).discountPrice ?? (p as any).DiscountPrice }
        }
      }
      setProductsById(prodMap)
      const cpMap: Record<number, { code: string }> = {}
      if (Array.isArray(couponsRes)) {
        for (const c of couponsRes as any[]) {
          const cid = (c as any).couponId ?? (c as any).CouponId
          if (typeof cid === "number") cpMap[cid] = { code: (c as any).code ?? (c as any).Code ?? "" }
        }
      }
      setCouponsById(cpMap)
      const payMap: Record<number, Array<{ paymentId: number; paymentMethod?: number; status?: number; amount?: number; paidAt?: string; createdAt?: string }>> = {}
      if (Array.isArray(paymentsRes)) {
        for (const p of paymentsRes as any[]) {
          const oid = Number((p as any).orderId ?? (p as any).OrderId)
          if (!Number.isFinite(oid)) continue
          const list = payMap[oid] || []
          list.push({
            paymentId: Number((p as any).paymentId ?? (p as any).PaymentId),
            paymentMethod: Number((p as any).paymentMethod ?? (p as any).PaymentMethod),
            status: Number((p as any).status ?? (p as any).Status),
            amount: Number((p as any).amount ?? (p as any).Amount),
            paidAt: (p as any).paidAt ?? (p as any).PaidAt ?? null,
            createdAt: (p as any).createdAt ?? (p as any).CreatedAt ?? null,
          })
          payMap[oid] = list
        }
      }
      setPaymentsByOrderId(payMap)
    } catch (e: any) {
      setError(typeof e?.message === "string" ? e.message : "Lỗi tải dữ liệu")
    } finally {
      setLoading(false)
      setPage(1)
    }
  }

  async function applyDelete(orderId: number) {
    try {
      setDeletingId(orderId)
      await api(`/api/Orders/${orderId}`, { method: "DELETE" })
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId))
      setItemCountByOrderId((prev) => { const next = { ...prev }; delete next[orderId]; return next })
      setOrderItems((prev) => prev.filter((it) => it.orderId !== orderId))
      toast({ title: "Xóa đơn hàng thành công" })
    } catch (e: any) {
      toast({ title: "Không thể xóa đơn hàng", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    } finally {
      setDeletingId(null)
      setDeleteOpen(false)
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Quản lý đơn hàng</h2>
          <p className="text-muted-foreground">Theo dõi và xử lý đơn hàng</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={reload} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tải lại
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Thêm đơn hàng
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm đơn hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="delivered">Đã giao</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Ngày đặt</SelectItem>
                <SelectItem value="total">Tổng tiền</SelectItem>
                <SelectItem value="code">Mã đơn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Thứ tự" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Giảm dần</SelectItem>
                <SelectItem value="asc">Tăng dần</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1) }} className="w-[170px]" />
            <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1) }} className="w-[170px]" />
            <Button variant="ghost" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setSortKey("date"); setSortDir("desc"); setFromDate(""); setToDate(""); setPage(1); setPageSize(10) }}>
              <XCircle className="h-4 w-4 mr-2" />
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn hàng</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Mã giảm giá</TableHead>
                <TableHead>Hình thức</TableHead>
                <TableHead>Thanh toán</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[160px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[140px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : (
              paged.map((order, idx) => {
                const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig[0]
                const customer = order.userId && usersById[order.userId]
                  ? (usersById[order.userId].fullName && usersById[order.userId].fullName !== ""
                      ? usersById[order.userId].fullName
                      : usersById[order.userId].email)
                  : "Khách vãng lai"
                const email = order.userId && usersById[order.userId] ? usersById[order.userId].email : ""
                const dateText = new Date(order.orderDate).toLocaleString("vi-VN")
                const itemCount = itemCountByOrderId[order.orderId] || 0
                const pays = paymentsByOrderId[order.orderId] || []
                const primary = getPrimaryPayment(pays)
                const methodText = paymentMethodLabel(primary?.paymentMethod)
                const payStatusText = paymentStatusLabel(primary?.status, primary?.paidAt)
                return (
                  <TableRow key={order.orderId ?? order.orderCode ?? idx}>
                    <TableCell className="font-medium">{order.orderCode}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer}</p>
                        {email && <p className="text-sm text-muted-foreground">{email}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{dateText}</TableCell>
                    <TableCell>{itemCount} sản phẩm</TableCell>
                    <TableCell className="font-semibold">{Number(order.totalAmount).toLocaleString("vi-VN")}đ</TableCell>
                    <TableCell>{order.couponId ? (couponsById[order.couponId] ? `${couponsById[order.couponId].code} (#${order.couponId})` : `#${order.couponId}`) : "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>{methodText}</div>
                        <Select value={primary?.paymentMethod ? String(primary.paymentMethod) : undefined} onValueChange={(v) => { setPendingPayment({ orderId: order.orderId, paymentId: primary?.paymentId, method: Number(v) }); setConfirmPaymentOpen(true) }}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Cập nhật" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1" disabled={paymentUpdatingOrderId === order.orderId}>Tiền mặt/COD</SelectItem>
                            <SelectItem value="2" disabled={paymentUpdatingOrderId === order.orderId}>Chuyển khoản</SelectItem>
                            <SelectItem value="3" disabled={paymentUpdatingOrderId === order.orderId}>Thẻ/Momo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={payStatusText === "Đã thanh toán" ? "default" : payStatusText === "Thất bại" ? "destructive" : "secondary"}>{payStatusText}</Badge>
                        <Select value={typeof primary?.status === "number" ? String(primary.status) : undefined} onValueChange={(v) => { setPendingPayment({ orderId: order.orderId, paymentId: primary?.paymentId, status: Number(v) }); setConfirmPaymentOpen(true) }}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Cập nhật" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0" disabled={paymentUpdatingOrderId === order.orderId}>Chờ</SelectItem>
                            <SelectItem value="1" disabled={paymentUpdatingOrderId === order.orderId}>Thành công</SelectItem>
                            <SelectItem value="2" disabled={paymentUpdatingOrderId === order.orderId}>Thất bại</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Select value={String(order.status)} onValueChange={(v) => { setPendingStatus({ orderId: order.orderId, value: Number(v) }); setConfirmOpen(true) }}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Cập nhật" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((opt) => (
                              <SelectItem key={opt.value} value={String(opt.value)} disabled={updatingId === order.orderId}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedOrderId(order.orderId); setDetailOpen(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setPendingDelete(order.orderId); setDeleteOpen(true) }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Trang {currentPage}/{totalPages} • Tổng {sorted.length} đơn • Tổng tiền lọc {sumTotal.toLocaleString("vi-VN")}đ</div>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Trang/size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Trang trước</Button>
          <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Trang sau</Button>
        </div>
      </div>
      {error && (
        <Card>
          <CardContent className="p-4 text-red-600">{error}</CardContent>
        </Card>
      )}
      
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{selectedOrder.orderCode}</div>
                  <div className="text-sm text-muted-foreground">{new Date(selectedOrder.orderDate).toLocaleString("vi-VN")}</div>
                </div>
                <Badge variant={(statusConfig[selectedOrder.status as keyof typeof statusConfig] || statusConfig[0]).variant}>
                  {(statusConfig[selectedOrder.status as keyof typeof statusConfig] || statusConfig[0]).label}
                </Badge>
              </div>
              {selectedOrder.userId && usersById[selectedOrder.userId] && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 border rounded">
                    <div className="text-sm text-muted-foreground">Khách hàng</div>
                    <div className="font-semibold">{usersById[selectedOrder.userId].fullName && usersById[selectedOrder.userId].fullName !== "" ? usersById[selectedOrder.userId].fullName : usersById[selectedOrder.userId].email}</div>
                    <div className="text-sm text-muted-foreground">{usersById[selectedOrder.userId].email}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-sm text-muted-foreground">Liên hệ</div>
                    <div>{usersById[selectedOrder.userId].phone || ""}</div>
                    <div className="text-sm text-muted-foreground">{usersById[selectedOrder.userId].address || ""}</div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <div className="text-sm text-muted-foreground">Địa chỉ giao hàng</div>
                  <div className="text-sm text-muted-foreground">{selectedOrder.shippingAddress || ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input value={selectedOrder.shippingAddress || ""} onChange={(e) => setOrders((prev) => prev.map((o) => (o.orderId === selectedOrder.orderId ? { ...o, shippingAddress: e.target.value } : o)))} placeholder="Nhập địa chỉ" />
                  <Button onClick={async () => { try { setUpdatingId(selectedOrder.orderId); await api(`/api/Orders/${selectedOrder.orderId}`, { method: "PUT", body: JSON.stringify({ shippingAddress: selectedOrder.shippingAddress || "" }) }); toast({ title: "Cập nhật địa chỉ giao hàng thành công" }) } catch (e: any) { toast({ title: "Không thể cập nhật địa chỉ", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" }) } finally { setUpdatingId(null) } }}>Lưu</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 border rounded">
                  <div className="text-sm text-muted-foreground">Tạm tính</div>
                  <div className="font-semibold">{Number(selectedOrder.subTotal ?? 0).toLocaleString("vi-VN")}đ</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-sm text-muted-foreground">Giảm giá</div>
                  <div className="font-semibold">{Number(selectedOrder.discountAmount ?? 0).toLocaleString("vi-VN")}đ</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-sm text-muted-foreground">Tổng tiền</div>
                  <div className="font-semibold">{Number(selectedOrder.totalAmount ?? 0).toLocaleString("vi-VN")}đ</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 border rounded">
                  <div className="text-sm text-muted-foreground">Hình thức giao dịch</div>
                  <div className="font-semibold">{paymentMethodLabel(selectedPrimaryPayment?.paymentMethod)}</div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-sm text-muted-foreground">Trạng thái giao dịch</div>
                  <div className="font-semibold">{paymentStatusLabel(selectedPrimaryPayment?.status, selectedPrimaryPayment?.paidAt)}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Mã giảm giá áp dụng: {selectedOrder.couponId ? (couponsById[selectedOrder.couponId] ? `${couponsById[selectedOrder.couponId].code} (#${selectedOrder.couponId})` : `#${selectedOrder.couponId}`) : "Không có"}</div>
              <div className="border border-border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Đơn giá</TableHead>
                      <TableHead>Tổng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((it, i) => {
                      const name = productsById[it.productId]?.productName || `Sản phẩm #${it.productId}`
                      const unit = Number(it.unitPrice)
                      const total = typeof it.lineTotal === "number" ? Number(it.lineTotal) : unit * Number(it.quantity)
                      return (
                        <TableRow key={`${it.orderItemId ?? it.productId}-${i}`}>
                          <TableCell>{name}</TableCell>
                          <TableCell>{Number(it.quantity)}</TableCell>
                          <TableCell>{unit.toLocaleString("vi-VN")}đ</TableCell>
                          <TableCell>{total.toLocaleString("vi-VN")}đ</TableCell>
                        </TableRow>
                      )
                    })}
                    {selectedItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">Không có sản phẩm</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận cập nhật trạng thái</AlertDialogTitle>
            <AlertDialogDescription>Thao tác này sẽ thay đổi trạng thái đơn hàng.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setConfirmOpen(false); setPendingStatus(null) }}>Hủy</Button>
              <Button onClick={() => { if (pendingStatus) applyStatusChange(pendingStatus.orderId, pendingStatus.value) }} disabled={!pendingStatus}>Xác nhận</Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmPaymentOpen} onOpenChange={setConfirmPaymentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận cập nhật thanh toán</AlertDialogTitle>
            <AlertDialogDescription>Thao tác này sẽ ghi nhận thay đổi phương thức hoặc trạng thái thanh toán.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setConfirmPaymentOpen(false); setPendingPayment(null) }}>Hủy</Button>
              <Button onClick={() => { if (pendingPayment) applyPaymentChange(pendingPayment) }} disabled={!pendingPayment}>Xác nhận</Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>Thao tác này sẽ xóa vĩnh viễn đơn hàng.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setDeleteOpen(false); setPendingDelete(null) }}>Hủy</Button>
              <Button onClick={() => { if (pendingDelete) applyDelete(pendingDelete) }} disabled={!pendingDelete || deletingId === pendingDelete}>Xác nhận</Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tạo đơn hàng mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Khách hàng</div>
                <Select value={newCustomerId} onValueChange={(v) => setNewCustomerId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn khách hàng (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="guest">Khách vãng lai</SelectItem>
                    {Object.entries(usersById).map(([uid, info]) => (
                      <SelectItem key={uid} value={uid}>{(info.fullName && info.fullName !== "") ? info.fullName : info.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Trạng thái</div>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Chờ xác nhận</SelectItem>
                    <SelectItem value="1">Đang xử lý</SelectItem>
                    <SelectItem value="2">Đã giao</SelectItem>
                    <SelectItem value="3">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Phương thức vận chuyển</div>
                <Select value={newShippingMethod} onValueChange={(v) => setNewShippingMethod(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn vận chuyển" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Tiêu chuẩn</SelectItem>
                    <SelectItem value="2">Nhanh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Địa chỉ giao hàng</div>
                <Input value={newShippingAddress} onChange={(e) => setNewShippingAddress(e.target.value)} placeholder="Nhập địa chỉ" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="font-medium">Sản phẩm</div>
              <div className="space-y-2">
                {newItems.map((row, idx) => {
                  const pid = row.productId || 0
                  const prod = productsById[pid]
                  const unit = prod ? Number(prod.discountPrice ?? prod.unitPrice ?? 0) : 0
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2" key={`new-item-${idx}`}>
                      <div className="md:col-span-3">
                        <Select value={row.productId ? String(row.productId) : undefined} onValueChange={(v) => setNewItems((prev) => prev.map((it, i) => i === idx ? { ...it, productId: Number(v) } : it))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn sản phẩm" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {Object.entries(productsById).map(([id, p]) => (
                              <SelectItem key={id} value={id}>{p.productName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Input type="number" min={1} value={row.quantity} onChange={(e) => setNewItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, Number(e.target.value || 1)) } : it))} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">{unit.toLocaleString("vi-VN")}đ</div>
                        <Button variant="ghost" onClick={() => setNewItems((prev) => prev.filter((_, i) => i !== idx))}>Xóa</Button>
                      </div>
                    </div>
                  )
                })}
                <Button variant="outline" onClick={() => setNewItems((prev) => [...prev, { productId: null, quantity: 1 }])}>Thêm sản phẩm</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="p-3 border rounded">
                <div className="text-sm text-muted-foreground">Tạm tính</div>
                <div className="font-semibold">{(newItems.reduce((acc, it) => { const prod = it.productId ? productsById[it.productId] : undefined; const unit = prod ? Number(prod.discountPrice ?? prod.unitPrice ?? 0) : 0; return acc + unit * Number(it.quantity || 0); }, 0)).toLocaleString("vi-VN")}đ</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-sm text-muted-foreground">Giảm giá</div>
                <div className="font-semibold">0đ</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-sm text-muted-foreground">Tổng tiền</div>
                <div className="font-semibold">{(newItems.reduce((acc, it) => { const prod = it.productId ? productsById[it.productId] : undefined; const unit = prod ? Number(prod.discountPrice ?? prod.unitPrice ?? 0) : 0; return acc + unit * Number(it.quantity || 0); }, 0)).toLocaleString("vi-VN")}đ</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={paymentEnabled} onChange={(e) => setPaymentEnabled(e.target.checked)} />
                <div className="text-sm">Ghi nhận thanh toán</div>
              </div>
              {paymentEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Số tiền</div>
                    <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Nhập số tiền" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Phương thức</div>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn phương thức" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Tiền mặt/COD</SelectItem>
                        <SelectItem value="2">Chuyển khoản</SelectItem>
                        <SelectItem value="3">Thẻ/Momo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Trạng thái</div>
                    <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Chờ</SelectItem>
                        <SelectItem value="1">Thành công</SelectItem>
                        <SelectItem value="2">Thất bại</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Đóng</Button>
              <Button onClick={async () => {
                const itemsData = newItems.filter((it) => typeof it.productId === "number" && it.productId && it.quantity > 0)
                if (itemsData.length === 0) { toast({ title: "Vui lòng chọn ít nhất 1 sản phẩm" }); return }
                const calcSub = itemsData.reduce((acc, it) => { const prod = it.productId ? productsById[it.productId] : undefined; const unit = prod ? Number(prod.discountPrice ?? prod.unitPrice ?? 0) : 0; return acc + unit * Number(it.quantity || 0); }, 0)
                const nowIso = new Date().toISOString()
                const orderCode = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
                const dto: any = {
                  orderCode,
                  userId: newCustomerId && newCustomerId !== "guest" ? Number(newCustomerId) : null,
                  status: Number(newStatus),
                  shippingMethod: Number(newShippingMethod),
                  shippingAddress: newShippingAddress || null,
                  subTotal: calcSub,
                  discountAmount: 0,
                  totalAmount: calcSub,
                  orderDate: nowIso,
                  createdAt: nowIso,
                  orderItems: itemsData.map((it) => { const prod = productsById[it.productId as number]; const unit = prod ? Number(prod.discountPrice ?? prod.unitPrice ?? 0) : 0; return { productId: it.productId, quantity: it.quantity, unitPrice: unit } })
                }
                if (paymentEnabled) {
                  const amt = Number(paymentAmount || 0)
                  if (amt > 0) {
                    dto.payments = [{ amount: amt, paymentMethod: Number(paymentMethod), status: Number(paymentStatus), transactionRef: null, paidAt: new Date().toISOString() }]
                  }
                }
                try {
                  setCreating(true)
                  const res = await api("/api/Orders", { method: "POST", body: JSON.stringify(dto) })
                  toast({ title: "Tạo đơn hàng thành công" })
                  setCreateOpen(false)
                  setNewCustomerId("")
                  setNewShippingAddress("")
                  setNewStatus("0")
                  setNewShippingMethod("1")
                  setNewItems([{ productId: null, quantity: 1 }])
                  setPaymentEnabled(false)
                  setPaymentAmount("")
                  await reload()
                } catch (e: any) {
                  toast({ title: "Không thể tạo đơn hàng", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
                } finally {
                  setCreating(false)
                }
              }} disabled={creating}>Tạo đơn</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
