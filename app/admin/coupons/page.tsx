"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminCouponsPage() {
  const [list, setList] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "upcoming" | "expired">("all")

  const [formData, setFormData] = useState({
    code: "",
    discountType: "percent",
    discountValue: "",
    startDate: "",
    endDate: "",
    isActive: true,
    quantity: "",
  })

  function formatDate(d: any) {
    try {
      const dt = typeof d === "string" ? new Date(d) : d instanceof Date ? d : null
      if (!dt || isNaN(dt.getTime())) return ""
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, "0")
      const dd = String(dt.getDate()).padStart(2, "0")
      return `${y}-${m}-${dd}`
    } catch {
      return ""
    }
  }

  function stateOf(c: any): "active" | "upcoming" | "expired" {
    const today = new Date().toISOString().slice(0, 10)
    const s = c.startDate
    const e = c.endDate
    if (s && s > today) return "upcoming"
    if (e && e < today) return "expired"
    return "active"
  }

  const refresh = async () => {
    try {
      setLoading(true)
      const res = await api("/api/Coupons")
      const mapped = Array.isArray(res)
        ? res.map((c: any) => ({
            id: c.couponId ?? c.CouponId,
            code: c.code ?? c.Code ?? "",
            discountType: c.discountType ?? c.DiscountType ?? "percent",
            discountValue: Number(c.discountValue ?? c.DiscountValue ?? 0),
            startDate: formatDate(c.startDate ?? c.StartDate),
            endDate: formatDate(c.endDate ?? c.EndDate),
            isActive: Boolean(c.isActive ?? c.IsActive ?? true),
            quantity: c.quantity ?? c.Quantity ?? null,
          }))
        : []
      setList(mapped)
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể tải mã giảm giá" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      await refresh()
    })()
  }, [])

  const filtered = list
    .filter((x) => x.code.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((x) => (statusFilter === "all" ? true : stateOf(x) === statusFilter))

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditing(item)
      setFormData({
        code: item.code || "",
        discountType: item.discountType || "percent",
        discountValue: String(item.discountValue ?? ""),
        startDate: item.startDate || "",
        endDate: item.endDate || "",
        isActive: !!item.isActive,
        quantity: item.quantity != null ? String(item.quantity) : "",
      })
    } else {
      setEditing(null)
      setFormData({
        code: "",
        discountType: "percent",
        discountValue: "",
        startDate: "",
        endDate: "",
        isActive: true,
        quantity: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const codeTrim = formData.code.trim()
      if (!codeTrim) throw new Error("Mã giảm giá không hợp lệ")
      const dt = (formData.discountType || "percent").toLowerCase()
      if (!(dt === "percent" || dt === "amount")) throw new Error("Loại giảm giá phải là percent hoặc amount")
      const val = Number(formData.discountValue)
      if (!isFinite(val) || val <= 0) throw new Error("Giá trị giảm không hợp lệ")

      const startStr = formData.startDate ? `${formData.startDate}T00:00:00` : undefined
      const endStr = formData.endDate ? `${formData.endDate}T23:59:59` : undefined
      if (formData.startDate && formData.endDate) {
        const sd = new Date(formData.startDate)
        const ed = new Date(formData.endDate)
        if (!isNaN(sd.getTime()) && !isNaN(ed.getTime()) && ed.getTime() < sd.getTime()) {
          throw new Error("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu")
        }
      }

      if (editing) {
        const id = editing.id
        await api(`/api/Coupons/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            CouponId: id,
            Code: codeTrim,
            DiscountType: dt,
            DiscountValue: val,
            StartDate: startStr ?? undefined,
            EndDate: endStr ?? undefined,
            IsActive: !!formData.isActive,
            Quantity: formData.quantity ? Number(formData.quantity) : null,
          }),
        })
        toast({ title: "Đã cập nhật mã giảm giá" })
      } else {
        await api(`/api/Coupons`, {
          method: "POST",
          body: JSON.stringify({
            Code: codeTrim,
            DiscountType: dt,
            DiscountValue: val,
            StartDate: startStr ?? `${new Date().toISOString().slice(0,10)}T00:00:00`,
            EndDate: endStr ?? null,
            IsActive: !!formData.isActive,
            Quantity: formData.quantity ? Number(formData.quantity) : null,
          }),
        })
        toast({ title: "Đã thêm mã giảm giá" })
      }
      setIsDialogOpen(false)
      await refresh()
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể lưu mã giảm giá" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api(`/api/Coupons/${id}`, { method: "DELETE" })
      toast({ title: "Đã xóa mã giảm giá" })
      await refresh()
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể xóa mã giảm giá" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Quản lý mã giảm giá</h1>
          <p className="text-muted-foreground mt-1">Tạo và quản lý các coupon áp dụng cho đơn hàng</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm mã giảm giá
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Chỉnh sửa mã giảm giá" : "Thêm mã giảm giá mới"}</DialogTitle>
              <DialogDescription>Điền thông tin mã giảm giá dưới đây</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Mã</Label>
                <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="WELCOME10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Loại giảm</Label>
                  <Select value={formData.discountType} onValueChange={(v) => setFormData({ ...formData, discountType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Phần trăm (%)</SelectItem>
                      <SelectItem value="amount">Số tiền (₫)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">Giá trị</Label>
                  <Input id="value" type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} placeholder="10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Ngày bắt đầu</Label>
                  <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="endDate">Ngày kết thúc</Label>
                  <Input id="endDate" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: !!v && v !== 'indeterminate' })} />
                  <Label>Kích hoạt</Label>
                </div>
                <div>
                  <Label htmlFor="quantity">Số lượng (tùy chọn)</Label>
                  <Input id="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="100" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm theo mã..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <div className="w-56">
            <Label>Lọc trạng thái</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hiệu lực</SelectItem>
                <SelectItem value="upcoming">Sắp diễn ra</SelectItem>
                <SelectItem value="expired">Đã kết thúc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && (
          <div className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
            <Loader2 className="h-4 w-4 animate-spin" />Đang tải...
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Kết thúc</TableHead>
              <TableHead>Kích hoạt</TableHead>
              <TableHead>Số lượng</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.code}</TableCell>
                <TableCell><Badge variant="secondary">{c.discountType === 'amount' ? 'Số tiền' : 'Phần trăm'}</Badge></TableCell>
                <TableCell>{c.discountType === 'amount' ? `${c.discountValue.toLocaleString()} ₫` : `${c.discountValue}%`}</TableCell>
                <TableCell className="text-muted-foreground">{c.startDate || ""}</TableCell>
                <TableCell className="text-muted-foreground">{c.endDate || ""}</TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Bật" : "Tắt"}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.quantity ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">Không có mã giảm giá</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

