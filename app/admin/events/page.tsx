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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Search, Calendar, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminEventsPage() {
  const [eventsList, setEventsList] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    date: "",
    time: "",
    endDate: "",
    endTime: "",
    location: "",
    status: "1",
    image: "",
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

  function formatTime(d: any) {
    try {
      const dt = typeof d === "string" ? new Date(d) : d instanceof Date ? d : null
      if (!dt || isNaN(dt.getTime())) return ""
      const hh = String(dt.getHours()).padStart(2, "0")
      const mm = String(dt.getMinutes()).padStart(2, "0")
      return `${hh}:${mm}`
    } catch {
      return ""
    }
  }

  const refresh = async () => {
    try {
      setLoading(true)
      const res = await api("/api/Events")
      const mapped = Array.isArray(res)
        ? res.map((c: any) => ({
            id: c.eventId ?? c.EventId,
            title: c.title ?? c.Title ?? "",
            slug: c.slug ?? c.Slug ?? "",
            description: c.description ?? c.Description ?? "",
            date: formatDate(c.startDate ?? c.StartDate ?? c.createdAt ?? c.CreatedAt),
            time: formatTime(c.startDate ?? c.StartDate),
            endDate: formatDate(c.endDate ?? c.EndDate),
            endTime: formatTime(c.endDate ?? c.EndDate),
            location: c.location ?? c.Location ?? "",
            price: 0,
            image: c.featuredImage ?? c.FeaturedImage ?? "",
            status: c.status ?? c.Status ?? 0,
            createdAt: c.createdAt ?? c.CreatedAt,
          }))
        : []
      setEventsList(mapped)
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể tải sự kiện" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      await refresh()
    })()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  function slugify(s: string) {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function makeUniqueSlug(base: string) {
    let s = base
    const exists = (slug: string) => eventsList.some((e) => String(e.slug || '').toLowerCase() === slug.toLowerCase())
    if (!exists(s)) return s
    for (let i = 2; i < 200; i++) {
      const candidate = `${base}-${i}`
      if (!exists(candidate)) return candidate
    }
    return `${base}-${Date.now()}`
  }

  function normalizeTime(v?: string) {
    if (!v) return undefined
    const s = String(v).trim().toLowerCase().replace(/\s+/g, '')
      .replace('h', ':')
    const m = s.match(/^(\d{1,2})(?::(\d{1,2}))?(am|pm)?$/)
    if (!m) return undefined
    let hh = parseInt(m[1], 10)
    let mm = m[2] != null ? parseInt(m[2], 10) : 0
    const ampm = m[3]
    if (ampm === 'pm' && hh < 12) hh += 12
    if (ampm === 'am' && hh === 12) hh = 0
    if (isNaN(hh) || isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return undefined
    const hhStr = String(hh).padStart(2, '0')
    const mmStr = String(mm).padStart(2, '0')
    return `${hhStr}:${mmStr}`
  }

  const filteredEvents = eventsList.filter(
    (event) =>
      event.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(debouncedQuery.toLowerCase()),
  )

  const handleOpenDialog = (event?: any) => {
    if (event) {
      setEditingEvent(event)
      setFormData({
        title: event.title,
        slug: event.slug,
        description: event.description,
        date: event.date,
        time: event.time,
        endDate: event.endDate || "",
        endTime: event.endTime || "",
        location: event.location,
        status: typeof event.status === 'number' ? String(event.status) : (event.status || "1"),
        image: event.image,
      })
    } else {
      setEditingEvent(null)
      setFormData({
        title: "",
        slug: "",
        description: "",
        date: "",
        time: "",
        endDate: "",
        endTime: "",
        location: "",
        status: "1",
        image: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const titleTrim = formData.title.trim()
      if (!titleTrim) throw new Error("Tên sự kiện không hợp lệ")
      let baseSlug = formData.slug || slugify(titleTrim)
      if (!editingEvent) baseSlug = makeUniqueSlug(baseSlug)

      const startTime = normalizeTime(formData.time)
      const endTime = normalizeTime(formData.endTime)
      if (formData.time && !startTime) throw new Error("Giờ bắt đầu không hợp lệ")
      if (formData.endTime && !endTime) throw new Error("Giờ kết thúc không hợp lệ")
      const dateStr = formData.date ? `${formData.date}T${startTime || '00:00'}:00` : undefined
      const endStr = formData.endDate ? `${formData.endDate}T${endTime || '23:59'}:59` : undefined

      if (dateStr && endStr) {
        const s = new Date(dateStr)
        const e = new Date(endStr)
        if (s.getTime() > e.getTime()) throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu")
      }

      if (editingEvent) {
        const id = editingEvent.id
        await api(`/api/Events/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            EventId: id,
            Title: formData.title,
            Slug: baseSlug || null,
            Description: formData.description || null,
            Location: formData.location || null,
            FeaturedImage: formData.image || null,
            StartDate: dateStr ?? undefined,
            EndDate: endStr ?? undefined,
            Status: formData.status ? Number(formData.status) : (typeof editingEvent.status === 'number' ? editingEvent.status : 1),
            CreatedAt: editingEvent.createdAt ? new Date(editingEvent.createdAt).toISOString() : new Date().toISOString(),
          }),
        })
        toast({ title: "Đã cập nhật sự kiện" })
      } else {
        await api(`/api/Events`, {
          method: "POST",
          body: JSON.stringify({
            Title: formData.title,
            Slug: baseSlug || null,
            Description: formData.description || null,
            Location: formData.location || null,
            FeaturedImage: formData.image || null,
            StartDate: dateStr ?? `${new Date().toISOString().slice(0,10)}T00:00:00`,
            EndDate: endStr ?? null,
            Status: formData.status ? Number(formData.status) : 1,
          }),
        })
        toast({ title: "Đã thêm sự kiện mới" })
      }
      setIsDialogOpen(false)
      await refresh()
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể lưu sự kiện" })
    }
  }

  const applyDelete = async () => {
    if (!pendingDeleteId) return
    try {
      await api(`/api/Events/${pendingDeleteId}`, { method: "DELETE" })
      toast({ title: "Đã xóa sự kiện" })
      setDeleteOpen(false)
      setPendingDeleteId(null)
      await refresh()
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể xóa sự kiện" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Quản lý sự kiện</h1>
          <p className="text-muted-foreground mt-1">Quản lý các sự kiện và workshop</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm sự kiện
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Chỉnh sửa sự kiện" : "Thêm sự kiện mới"}</DialogTitle>
              <DialogDescription>Điền thông tin sự kiện dưới đây</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Tên sự kiện</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tên sự kiện"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endDate">Ngày kết thúc</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">Giờ kết thúc</Label>
                  <Input
                    id="endTime"
                    type="time"
                    step="60"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    placeholder="21:00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="su-kien-moi"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Ngày</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Giờ bắt đầu</Label>
                  <Input
                    id="time"
                    type="time"
                    step="60"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="19:00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Địa điểm</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Nhập địa điểm"
                />
              </div>
              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Hiển thị</SelectItem>
                    <SelectItem value="0">Ẩn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về sự kiện"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="image">URL hình ảnh</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="/image.jpg"
                />
              </div>
              {formData.image && (
                <div>
                  <img src={formData.image} alt="preview" className="w-full max-h-48 object-cover rounded" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sự kiện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => refresh()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên sự kiện</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Kết thúc</TableHead>
              <TableHead>Địa điểm</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">Đang tải dữ liệu...</TableCell>
              </TableRow>
            ) : null}
            {filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{event.date}</span>
                    {event.time && <span className="text-muted-foreground">, {event.time}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{event.endDate || ""}</span>
                    {event.endTime && <span className="text-muted-foreground">, {event.endTime}</span>}
                  </div>
                </TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>
                  <Badge variant={Number(event.status) === 1 ? "default" : "secondary"}>{Number(event.status) === 1 ? "Hiển thị" : "Ẩn"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(event)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setPendingDeleteId(event.id); setDeleteOpen(true) }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sự kiện?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={applyDelete}>Xóa</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
