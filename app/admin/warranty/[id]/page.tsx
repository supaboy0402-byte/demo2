"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"

type Ticket = {
  WarrantyId: number
  WarrantyCode: string
  OrderId: number
  ProductId: number
  UserId?: number | null
  StaffHandledBy?: number | null
  IssueDescription?: string | null
  Diagnosis?: string | null
  WarrantyStatus?: string | null
  IsUnderWarranty?: boolean | null
  ExtraCost?: number | null
  CostNote?: string | null
  EstimatedReturnDate?: string | null
  CompletedDate?: string | null
  CreatedAt?: string | null
}

export default function WarrantyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = useMemo(() => Number(String(params?.id || "0")), [params])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [orderCode, setOrderCode] = useState("")
  const [productName, setProductName] = useState("")
  const [customerName, setCustomerName] = useState("")

  const [warrantyStatus, setWarrantyStatus] = useState("Pending")
  const [issueDescription, setIssueDescription] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [isUnderWarranty, setIsUnderWarranty] = useState(true)
  const [extraCost, setExtraCost] = useState<string>("0")
  const [costNote, setCostNote] = useState("")
  const [estimatedReturnDate, setEstimatedReturnDate] = useState("")
  const [completedDate, setCompletedDate] = useState("")
  const [staffHandledBy, setStaffHandledBy] = useState<string>("")
  const [orderItems, setOrderItems] = useState<Array<{ id: number; name: string }>>([])
  const searchParams = useSearchParams()
  const readOnly = String(searchParams.get("mode") || "").toLowerCase() === "view"

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id || Number.isNaN(id)) return
      try {
        setLoading(true)
        setError("")
        const t = await api(`/api/WarrantyTickets/${id}`)
        if (!t) throw new Error("Không tìm thấy phiếu bảo hành")

        const norm: Ticket = {
          WarrantyId: Number(t.WarrantyId ?? t.warrantyId ?? id),
          WarrantyCode: String(t.WarrantyCode ?? t.warrantyCode ?? ""),
          OrderId: Number(t.OrderId ?? t.orderId ?? 0),
          ProductId: Number(t.ProductId ?? t.productId ?? 0),
          UserId: t.UserId ?? t.userId ?? null,
          StaffHandledBy: t.StaffHandledBy ?? t.staffHandledBy ?? null,
          IssueDescription: t.IssueDescription ?? t.issueDescription ?? "",
          Diagnosis: t.Diagnosis ?? t.diagnosis ?? "",
          WarrantyStatus: t.WarrantyStatus ?? t.warrantyStatus ?? "Pending",
          IsUnderWarranty: (t.IsUnderWarranty ?? t.isUnderWarranty ?? true) ? true : false,
          ExtraCost: Number(t.ExtraCost ?? t.extraCost ?? 0),
          CostNote: t.CostNote ?? t.costNote ?? "",
          EstimatedReturnDate: t.EstimatedReturnDate ?? t.estimatedReturnDate ?? null,
          CompletedDate: t.CompletedDate ?? t.completedDate ?? null,
          CreatedAt: t.CreatedAt ?? t.createdAt ?? null,
        }
        if (cancelled) return
        setTicket(norm)
        setWarrantyStatus(norm.WarrantyStatus || "Pending")
        setIssueDescription(norm.IssueDescription || "")
        setDiagnosis(norm.Diagnosis || "")
        setIsUnderWarranty(norm.IsUnderWarranty ?? true)
        setExtraCost(String(norm.ExtraCost ?? 0))
        setCostNote(norm.CostNote || "")
        setEstimatedReturnDate(norm.EstimatedReturnDate ? new Date(norm.EstimatedReturnDate).toISOString().slice(0, 10) : "")
        setCompletedDate(norm.CompletedDate ? new Date(norm.CompletedDate).toISOString().slice(0, 10) : "")
        setStaffHandledBy(String(norm.StaffHandledBy ?? ""))

        try {
          const o = await api(`/api/Orders/${norm.OrderId}`)
          setOrderCode(String(o.OrderCode ?? o.orderCode ?? ""))
        } catch {}
        try {
          const items = await api(`/api/OrderItems`)
          const list = (Array.isArray(items) ? items : [])
            .filter((it: any) => Number(it.OrderId ?? it.orderId) === norm.OrderId)
          const names: Array<{ id: number; name: string }> = await Promise.all(
            list.map(async (it: any) => {
              const pid = Number(it.ProductId ?? it.productId)
              let name = String(pid)
              try {
                const p = await api(`/api/Products/${pid}`)
                if (p) name = String(p.ProductName ?? p.productName ?? name)
              } catch {}
              return { id: pid, name }
            })
          )
          setOrderItems(names)
        } catch {}
        try {
          const p = await api(`/api/Products/${norm.ProductId}`)
          setProductName(String(p.ProductName ?? p.productName ?? ""))
        } catch {}
        try {
          if (norm.UserId) {
            const u = await api(`/api/Users/${norm.UserId}`)
            setCustomerName(String(u.FullName ?? u.fullName ?? u.Email ?? u.email ?? ""))
          }
        } catch {}
      } catch (err: any) {
        if (!cancelled) setError(String(err?.message || "Có lỗi xảy ra"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const statusColor = (s: string) => {
    switch (s) {
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

  const handleSave = async () => {
    if (!ticket) return
    try {
      setError("")
      const payload: any = {
        warrantyStatus,
        issueDescription,
        diagnosis,
        isUnderWarranty,
        extraCost: Number(extraCost || "0"),
        costNote,
        estimatedReturnDate: estimatedReturnDate ? new Date(estimatedReturnDate).toISOString() : null,
        completedDate: completedDate ? new Date(completedDate).toISOString() : null,
        staffHandledBy: staffHandledBy ? Number(staffHandledBy) : null,
        productId: Number(ticket.ProductId),
      }
      if (payload.warrantyStatus === "Completed" && !payload.completedDate) {
        payload.completedDate = new Date().toISOString()
      }
      await api(`/api/WarrantyTickets/${ticket.WarrantyId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      router.refresh()
    } catch (err: any) {
      setError(String(err?.message || "Có lỗi xảy ra"))
    }
  }

  const handleDelete = async () => {
    if (!ticket) return
    try {
      setError("")
      await api(`/api/WarrantyTickets/${ticket.WarrantyId}`, { method: "DELETE" })
      router.push("/admin/warranty")
    } catch (err: any) {
      setError(String(err?.message || "Có lỗi xảy ra"))
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chi Tiết Phiếu Bảo Hành</h1>
            {ticket && (
              <p className="text-muted-foreground mt-1">Mã phiếu: {ticket.WarrantyCode}</p>
            )}
          </div>
          <div className="flex gap-2">
            {ticket && <Badge className={statusColor(warrantyStatus)}>{warrantyStatus}</Badge>}
            <Button variant="outline" onClick={() => router.push("/admin/warranty")}>Quay Lại</Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mã Phiếu</p>
                  <p className="font-mono text-foreground">{ticket?.WarrantyCode || ""}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng Thái</p>
                  <select
                    value={warrantyStatus}
                    onChange={(e) => setWarrantyStatus(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border rounded-md bg-background text-foreground"
                    disabled={readOnly}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đơn Hàng</p>
                  <p className="font-mono text-foreground">{orderCode || ticket?.OrderId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sản Phẩm</p>
                  <p className="text-foreground">{productName || ticket?.ProductId}</p>
                  {orderItems.length > 0 && (
                    <div className="mt-2">
                      <Label>Đổi Sản Phẩm</Label>
                      <select
                        value={String(ticket?.ProductId ?? "")}
                        onChange={(e) => {
                          const pid = Number(e.target.value)
                          setTicket((prev) => (prev ? { ...prev, ProductId: pid } : prev))
                        }}
                        className="w-full mt-2 px-3 py-2 border rounded-md bg-background text-foreground"
                        disabled={readOnly}
                      >
                        {orderItems.map((it) => (
                          <option key={it.id} value={it.id}>{it.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Khách Hàng</p>
                  <p className="text-foreground">{customerName || (ticket?.UserId ?? "")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày Tạo</p>
                  <p className="text-foreground">
                    {ticket?.CreatedAt ? new Date(ticket.CreatedAt).toISOString().slice(0, 10) : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cập Nhật Xử Lý</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Vấn Đề</Label>
                <Textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} rows={4} className="mt-2" disabled={readOnly} />
              </div>
              <div>
                <Label>Chuẩn Đoán</Label>
                <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={4} className="mt-2" disabled={readOnly} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Bảo Hành</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <input type="checkbox" checked={isUnderWarranty} onChange={(e) => setIsUnderWarranty(e.target.checked)} disabled={readOnly} />
                    <span className="text-sm text-muted-foreground">Trong hạn bảo hành</span>
                  </div>
                </div>
                <div>
                  <Label>Chi Phí Phát Sinh</Label>
                  <Input type="number" min="0" value={extraCost} onChange={(e) => setExtraCost(e.target.value)} className="mt-2" disabled={readOnly} />
                </div>
                <div>
                  <Label>Nhân Viên Xử Lý (User ID)</Label>
                  <Input type="number" min="0" value={staffHandledBy} onChange={(e) => setStaffHandledBy(e.target.value)} className="mt-2" disabled={readOnly} />
                </div>
              </div>
              <div>
                <Label>Ghi Chú Chi Phí</Label>
                <Textarea value={costNote} onChange={(e) => setCostNote(e.target.value)} rows={3} className="mt-2" disabled={readOnly} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Ngày Trả Dự Kiến</Label>
                  <Input type="date" value={estimatedReturnDate} onChange={(e) => setEstimatedReturnDate(e.target.value)} className="mt-2" disabled={readOnly} />
                </div>
                <div>
                  <Label>Ngày Hoàn Thành</Label>
                  <Input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} className="mt-2" disabled={readOnly} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1" disabled={readOnly}>Lưu Cập Nhật</Button>
                <Button variant="outline" onClick={handleDelete} disabled={readOnly}>Xóa Phiếu</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
