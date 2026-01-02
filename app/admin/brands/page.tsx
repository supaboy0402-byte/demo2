"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, Pencil, Trash2, RefreshCw, Download, Upload, GitMerge } from "lucide-react"
import { api } from "@/lib/api"

export default function AdminBrandsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [brands, setBrands] = useState<Array<{ brandId: number; brandName: string; country?: string | null; description?: string | null }>>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [countryFilter, setCountryFilter] = useState<string>("all")
  const [sortKey, setSortKey] = useState<"name" | "country">("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [formName, setFormName] = useState("")
  const [formCountry, setFormCountry] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [productCountByBrandId, setProductCountByBrandId] = useState<Record<number, number>>({})
  const [mergeOpen, setMergeOpen] = useState(false)
  const [sourceBrandId, setSourceBrandId] = useState<number | null>(null)
  const [destBrandId, setDestBrandId] = useState<number | null>(null)
  const [merging, setMerging] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importRows, setImportRows] = useState<any[]>([])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    ;(async () => {
      try {
        const [brandsRes, productsRes] = await Promise.all([
          api("/api/Brands"),
          api("/api/Products"),
        ])
        setBrands(Array.isArray(brandsRes) ? brandsRes : [])
        const counts: Record<number, number> = {}
        if (Array.isArray(productsRes)) {
          for (const p of productsRes as any[]) {
            const bid = (p as any).brandId ?? (p as any).BrandId
            if (typeof bid === "number") counts[bid] = (counts[bid] || 0) + 1
          }
        }
        setProductCountByBrandId(counts)
      } catch (e: any) {
        toast({ title: "Không thể tải dữ liệu", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const countryOptions = Array.from(new Set(brands.map((b) => b.country).filter((c): c is string => !!c && c.trim() !== ""))).sort()
  const filtered = brands.filter((b) => {
    const matchesText = `${b.brandName} ${b.country || ""}`.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
    const matchesCountry = countryFilter === "all" || (b.country || "").toLowerCase() === countryFilter.toLowerCase()
    return matchesText && matchesCountry
  })
  const sorted = filtered.slice().sort((a, b) => {
    let cmp = 0
    if (sortKey === "name") cmp = String(a.brandName).localeCompare(String(b.brandName))
    else cmp = String(a.country || "").localeCompare(String(b.country || ""))
    return sortDir === "asc" ? cmp : -cmp
  })
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = sorted.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize)

  function openCreate() {
    setFormName("")
    setFormCountry("")
    setFormDescription("")
    setCreateOpen(true)
  }

  function openEdit(b: any) {
    setEditing(b)
    setFormName(b.brandName || "")
    setFormCountry(b.country || "")
    setFormDescription(b.description || "")
    setEditOpen(true)
  }

  function openMerge() {
    setSourceBrandId(null)
    setDestBrandId(null)
    setMergeOpen(true)
  }

  function openImport() {
    setImportFile(null)
    setImportRows([])
    setImportOpen(true)
  }

  async function handleCreate() {
    if (!formName.trim()) {
      toast({ title: "Vui lòng nhập tên thương hiệu" })
      return
    }
    if (brands.some((b) => b.brandName.trim().toLowerCase() === formName.trim().toLowerCase())) {
      toast({ title: "Tên thương hiệu đã tồn tại" })
      return
    }
    try {
      const created = await api("/api/Brands", { method: "POST", body: JSON.stringify({ brandName: formName.trim(), country: formCountry || null, description: formDescription || null }) })
      setBrands((prev) => [created, ...prev])
      setCreateOpen(false)
      toast({ title: "Tạo thương hiệu thành công" })
    } catch (e: any) {
      toast({ title: "Không thể tạo thương hiệu", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    }
  }

  async function handleUpdate() {
    if (!editing) return
    if (!formName.trim()) {
      toast({ title: "Vui lòng nhập tên thương hiệu" })
      return
    }
    if (brands.some((b) => b.brandId !== editing.brandId && b.brandName.trim().toLowerCase() === formName.trim().toLowerCase())) {
      toast({ title: "Tên thương hiệu đã tồn tại" })
      return
    }
    try {
      await api(`/api/Brands/${editing.brandId}`, { method: "PUT", body: JSON.stringify({ brandName: formName.trim(), country: formCountry || null, description: formDescription || null }) })
      setBrands((prev) => prev.map((b) => (b.brandId === editing.brandId ? { ...b, brandName: formName.trim(), country: formCountry || null, description: formDescription || null } : b)))
      setEditOpen(false)
      setEditing(null)
      toast({ title: "Cập nhật thương hiệu thành công" })
    } catch (e: any) {
      toast({ title: "Không thể cập nhật thương hiệu", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    }
  }

  async function applyDelete(id: number) {
    try {
      setDeletingId(id)
      await api(`/api/Brands/${id}`, { method: "DELETE" })
      setBrands((prev) => prev.filter((b) => b.brandId !== id))
      setProductCountByBrandId((prev) => { const next = { ...prev }; delete next[id]; return next })
      toast({ title: "Xóa thương hiệu thành công" })
    } catch (e: any) {
      toast({ title: "Không thể xóa thương hiệu", description: typeof e?.message === "string" ? e.message : "Thương hiệu có thể đang được sử dụng" })
    } finally {
      setDeletingId(null)
      setDeleteOpen(false)
      setPendingDelete(null)
    }
  }

  function handleExport() {
    const rows = [
      ["BrandName", "Country", "Description", "ProductCount"],
      ...sorted.map((b) => [
        b.brandName,
        b.country || "",
        b.description || "",
        String(productCountByBrandId[b.brandId] || 0),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `brands-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function applyMerge() {
    if (!sourceBrandId || !destBrandId) {
      toast({ title: "Vui lòng chọn đủ thương hiệu nguồn và đích" })
      return
    }
    if (sourceBrandId === destBrandId) {
      toast({ title: "Nguồn và đích không được trùng nhau" })
      return
    }
    try {
      setMerging(true)
      const productsRes = await api("/api/Products")
      const toMove = Array.isArray(productsRes) ? (productsRes as any[]).filter((p) => {
        const bid = (p as any).brandId ?? (p as any).BrandId
        return typeof bid === "number" && bid === sourceBrandId
      }) : []
      for (const p of toMove) {
        await api(`/api/Products/${(p as any).productId ?? (p as any).ProductId}`, { method: "PUT", body: JSON.stringify({ brandId: destBrandId }) })
      }
      setProductCountByBrandId((prev) => {
        const next = { ...prev }
        const count = toMove.length
        next[sourceBrandId] = Math.max(0, (next[sourceBrandId] || 0) - count)
        next[destBrandId] = (next[destBrandId] || 0) + count
        return next
      })
      setMergeOpen(false)
      setSourceBrandId(null)
      setDestBrandId(null)
      toast({ title: "Gộp thương hiệu thành công" })
    } catch (e: any) {
      toast({ title: "Không thể gộp thương hiệu", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    } finally {
      setMerging(false)
    }
  }

  function downloadCsvTemplate() {
    const rows = [
      ["BrandName", "Country", "Description"],
      ["Yamaha", "Japan", "Worldwide musical instruments brand"],
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "brands-template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function parseCsvText(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length === 0) return { header: [], rows: [] }
    const header = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase())
    const idxName = header.indexOf("brandname")
    const idxCountry = header.indexOf("country")
    const idxDesc = header.indexOf("description")
    return {
      header,
      idxName,
      idxCountry,
      idxDesc,
      rows: lines.slice(1).map((line) => {
        const cols = line.match(/("[^"]*(""[^"]*)*"|[^,]+)/g)?.map((c) => c.replace(/^"|"$/g, "")) || []
        const name = (cols[idxName] || "").trim()
        const country = idxCountry >= 0 ? (cols[idxCountry] || "").trim() : ""
        const description = idxDesc >= 0 ? (cols[idxDesc] || "").trim() : ""
        return { name, country, description }
      }),
    }
  }

  async function onSelectImportFile(file: File | null) {
    setImportFile(file)
    setImportRows([])
    if (!file) return
    try {
      const text = await file.text()
      const parsed = parseCsvText(text)
      if (parsed.idxName === -1) {
        toast({ title: "CSV cần cột BrandName" })
        return
      }
      const seen = new Set<string>()
      const next = parsed.rows.map((r) => {
        const errors: string[] = []
        const nameLower = r.name.trim().toLowerCase()
        if (!r.name.trim()) errors.push("Thiếu BrandName")
        if (r.name.length > 150) errors.push("BrandName quá dài (>150)")
        if (r.country && r.country.length > 100) errors.push("Country quá dài (>100)")
        if (r.description && r.description.length > 500) errors.push("Description quá dài (>500)")
        if (brands.some((b) => b.brandName.trim().toLowerCase() === nameLower)) errors.push("Tên đã tồn tại")
        if (seen.has(nameLower)) errors.push("Tên trùng trong CSV")
        if (nameLower) seen.add(nameLower)
        return {
          name: r.name.trim(),
          country: (r.country || "").trim(),
          description: (r.description || "").trim(),
          errors,
          valid: errors.length === 0,
        }
      })
      setImportRows(next)
    } catch (e: any) {
      toast({ title: "Không thể đọc CSV", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    }
  }

  async function applyImport() {
    const rows = importRows.length > 0 ? importRows : []
    if (rows.length === 0) {
      if (!importFile) { toast({ title: "Vui lòng chọn tệp CSV" }); return }
      try {
        setImporting(true)
        const text = await importFile.text()
        const parsed = parseCsvText(text)
        if (parsed.idxName === -1) { toast({ title: "CSV cần cột BrandName" }); return }
        const seen = new Set<string>()
        const prepared = parsed.rows.map((r) => {
          const errors: string[] = []
          const nameLower = r.name.trim().toLowerCase()
          if (!r.name.trim()) errors.push("Thiếu BrandName")
          if (r.name.length > 150) errors.push("BrandName quá dài (>150)")
          if (r.country && r.country.length > 100) errors.push("Country quá dài (>100)")
          if (r.description && r.description.length > 500) errors.push("Description quá dài (>500)")
          if (brands.some((b) => b.brandName.trim().toLowerCase() === nameLower)) errors.push("Tên đã tồn tại")
          if (seen.has(nameLower)) errors.push("Tên trùng trong CSV")
          if (nameLower) seen.add(nameLower)
          return { name: r.name.trim(), country: (r.country || "").trim(), description: (r.description || "").trim(), valid: errors.length === 0 }
        })
        setImportRows(prepared)
      } finally {
        setImporting(false)
      }
      return
    }
    try {
      setImporting(true)
      let success = 0, failed = 0
      for (const r of rows) {
        if (!r.valid) continue
        try {
          const created = await api("/api/Brands", { method: "POST", body: JSON.stringify({ brandName: r.name, country: r.country || null, description: r.description || null }) })
          setBrands((prev) => [created, ...prev])
          success++
        } catch {
          failed++
        }
      }
      setImportOpen(false)
      setImportFile(null)
      setImportRows([])
      toast({ title: "Nhập CSV hoàn tất", description: `Thành công: ${success}, Lỗi: ${failed}` })
    } catch (e: any) {
      toast({ title: "Không thể nhập CSV", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Quản lý thương hiệu</h2>
          <p className="text-muted-foreground">Thêm, sửa, xóa các hãng sản xuất</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openImport}>
            <Upload className="h-4 w-4 mr-2" />
            Nhập CSV
          </Button>
          <Button variant="outline" onClick={openMerge}>
            <GitMerge className="h-4 w-4 mr-2" />
            Gộp thương hiệu
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Xuất CSV
          </Button>
          <Button variant="outline" onClick={() => { setLoading(true); (async () => { try { const [brandsRes, productsRes] = await Promise.all([ api("/api/Brands"), api("/api/Products") ]); setBrands(Array.isArray(brandsRes) ? brandsRes : []); const counts: Record<number, number> = {}; if (Array.isArray(productsRes)) { for (const p of productsRes as any[]) { const bid = (p as any).brandId ?? (p as any).BrandId; if (typeof bid === "number") counts[bid] = (counts[bid] || 0) + 1 } } setProductCountByBrandId(counts) } catch (e: any) { toast({ title: "Không thể tải dữ liệu", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" }) } finally { setLoading(false) } })(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tải lại
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm thương hiệu
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm thương hiệu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Quốc gia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {countryOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Tên</SelectItem>
                <SelectItem value="country">Quốc gia</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Thứ tự" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Tăng dần</SelectItem>
                <SelectItem value="desc">Giảm dần</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên thương hiệu</TableHead>
                <TableHead>Quốc gia</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={`s-${i}`}>
                    <TableCell><Skeleton className="h-4 w-[140px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : (
                paged.map((b, idx) => (
                  <TableRow key={b.brandId ?? idx}>
                    <TableCell className="font-medium">{b.brandName}</TableCell>
                    <TableCell>{b.country || ""}</TableCell>
                    <TableCell>{productCountByBrandId[b.brandId] || 0}</TableCell>
                    <TableCell className="max-w-[400px] truncate">{b.description || ""}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if ((productCountByBrandId[b.brandId] || 0) > 0) { toast({ title: "Không thể xóa", description: "Thương hiệu đang có sản phẩm" }); return } setPendingDelete(b.brandId); setDeleteOpen(true) }} disabled={(productCountByBrandId[b.brandId] || 0) > 0}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Trang {currentPage}/{totalPages} • Tổng {sorted.length} thương hiệu</div>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm thương hiệu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Tên thương hiệu" value={formName} onChange={(e) => setFormName(e.target.value)} />
            <Input placeholder="Quốc gia" value={formCountry} onChange={(e) => setFormCountry(e.target.value)} />
            <Input placeholder="Mô tả" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
              <Button onClick={handleCreate}>Tạo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gộp thương hiệu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={sourceBrandId ? String(sourceBrandId) : ""} onValueChange={(v) => setSourceBrandId(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn thương hiệu nguồn" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.brandId} value={String(b.brandId)}>{b.brandName} ({productCountByBrandId[b.brandId] || 0})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={destBrandId ? String(destBrandId) : ""} onValueChange={(v) => setDestBrandId(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn thương hiệu đích" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.brandId} value={String(b.brandId)}>{b.brandName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMergeOpen(false)}>Hủy</Button>
              <Button onClick={applyMerge} disabled={merging}>Gộp</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhập CSV thương hiệu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input type="file" accept=".csv,text/csv" onChange={(e) => onSelectImportFile(e.target.files?.[0] || null)} />
            <div className="text-sm text-muted-foreground">Định dạng cột: BrandName, Country, Description</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={downloadCsvTemplate}>Tải mẫu CSV</Button>
            </div>
            {importRows.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm">Tổng {importRows.length} dòng • Hợp lệ {importRows.filter((r) => r.valid).length} • Không hợp lệ {importRows.filter((r) => !r.valid).length}</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Quốc gia</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importRows.slice(0, 10).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.country}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{r.description}</TableCell>
                        <TableCell>{r.valid ? "Hợp lệ" : r.errors.join(", ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-xs text-muted-foreground">Chỉ hiển thị 10 dòng đầu</div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportOpen(false)}>Hủy</Button>
              <Button onClick={applyImport} disabled={importing || importRows.filter((r) => r.valid).length === 0}>Nhập dòng hợp lệ</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật thương hiệu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Tên thương hiệu" value={formName} onChange={(e) => setFormName(e.target.value)} />
            <Input placeholder="Quốc gia" value={formCountry} onChange={(e) => setFormCountry(e.target.value)} />
            <Input placeholder="Mô tả" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Hủy</Button>
              <Button onClick={handleUpdate} disabled={!editing}>Lưu</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa thương hiệu</AlertDialogTitle>
            <AlertDialogDescription>Thao tác này sẽ xóa thương hiệu.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setDeleteOpen(false); setPendingDelete(null) }}>Hủy</Button>
              <Button onClick={() => { if (pendingDelete) applyDelete(pendingDelete) }} disabled={!pendingDelete || deletingId === pendingDelete}>Xác nhận</Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
