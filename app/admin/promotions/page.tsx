"use client"

import { useEffect, useState } from "react"
import { api, apiBase } from "@/lib/api"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Trash2, Search, Loader2, Wand2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminPromotionsPage() {
  const [promoList, setPromoList] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<any>(null)
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "ongoing" | "upcoming" | "expired">("all")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [originalSelectedIds, setOriginalSelectedIds] = useState<number[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brandFilter, setBrandFilter] = useState<number | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all")
  const [onlyDiscounted, setOnlyDiscounted] = useState(false)
  const [onlySelected, setOnlySelected] = useState(false)
  const [imageMap, setImageMap] = useState<Record<number, string>>({})
  const [promoCounts, setPromoCounts] = useState<Record<number, number>>({})

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "1",
    image: "",
  })
  const [uploadingImage, setUploadingImage] = useState(false)

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

  const refresh = async () => {
    try {
      setLoading(true)
      const res = await api("/api/Promotions")
      const mapped = Array.isArray(res)
        ? res.map((c: any) => ({
            id: c.promotionId ?? c.PromotionId,
            title: c.title ?? c.Title ?? "",
            slug: c.slug ?? c.Slug ?? "",
            description: c.description ?? c.Description ?? "",
            startDate: formatDate(c.startDate ?? c.StartDate),
            endDate: formatDate(c.endDate ?? c.EndDate),
            status: c.status ?? c.Status ?? 1,
            image: c.featuredImage ?? c.FeaturedImage ?? "",
            createdAt: c.createdAt ?? c.CreatedAt,
          }))
        : []
      setPromoList(mapped)
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể tải khuyến mãi" })
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
    ;(async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          brands.length === 0 ? api('/api/Brands') : Promise.resolve(brands),
          categories.length === 0 ? api('/api/Categories') : Promise.resolve(categories),
        ])
        if (brands.length === 0 && Array.isArray(bRes)) setBrands(bRes)
        if (categories.length === 0 && Array.isArray(cRes)) setCategories(cRes)
      } catch {}
    })()
  }, [])

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
    const exists = (slug: string) => promoList.some((e) => String(e.slug || '').toLowerCase() === slug.toLowerCase())
    if (!exists(s)) return s
    for (let i = 2; i < 200; i++) {
      const candidate = `${base}-${i}`
      if (!exists(candidate)) return candidate
    }
    return `${base}-${Date.now()}`
  }

  function generateSlugFromTitle() {
    const s = slugify(formData.title || "")
    setFormData((prev) => ({ ...prev, slug: s }))
  }

  function promoState(p: any): "ongoing" | "upcoming" | "expired" {
    const todayStr = new Date().toISOString().slice(0, 10)
    const s = p.startDate
    const e = p.endDate
    if (s && s > todayStr) return "upcoming"
    if (e && e < todayStr) return "expired"
    return "ongoing"
  }

  const baseFiltered = promoList.filter(
    (promo) =>
      promo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(promo.slug || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const filteredPromos = baseFiltered.filter((p) => {
    if (statusFilter === "all") return true
    return promoState(p) === statusFilter
  })
  const totalPages = Math.max(1, Math.ceil(filteredPromos.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIdx = (currentPage - 1) * pageSize
  const pagedPromos = filteredPromos.slice(startIdx, startIdx + pageSize)

  useEffect(() => {
    ;(async () => {
      try {
        await Promise.all(
          pagedPromos.map(async (pm) => {
            const id = pm.id
            if (promoCounts[id] != null) return
            try {
              const res = await api(`/api/Promotions/${id}/products/count`)
              const count = (res && (res.count ?? res.Count)) ?? 0
              setPromoCounts((prev) => ({ ...prev, [id]: Number(count) }))
            } catch {}
          })
        )
      } catch {}
    })()
  }, [pagedPromos])

  const handleOpenDialog = (promo?: any) => {
    if (promo) {
      setEditingPromo(promo)
      setFormData({
        title: promo.title,
        slug: promo.slug,
        description: promo.description,
        startDate: promo.startDate || "",
        endDate: promo.endDate || "",
        status: typeof promo.status === 'number' ? String(promo.status) : (promo.status || "1"),
        image: promo.image,
      })
      ;(async () => {
        try {
          const [prods, mapped, imgs, bRes, cRes] = await Promise.all([
            allProducts.length === 0 ? api('/api/Products') : Promise.resolve(allProducts),
            api(`/api/Promotions/${promo.id}/products`),
            api('/api/ProductImages'),
            brands.length === 0 ? api('/api/Brands') : Promise.resolve(brands),
            categories.length === 0 ? api('/api/Categories') : Promise.resolve(categories),
          ])
          if (allProducts.length === 0) setAllProducts(Array.isArray(prods) ? prods : [])
          const ids = Array.isArray(mapped) ? mapped.map((p: any) => p.productId ?? p.ProductId).filter((x: any) => x != null) : []
          setSelectedProductIds(ids)
          setOriginalSelectedIds(ids)
          if (Array.isArray(imgs)) {
            const byProduct: Record<number, { url: string; sort?: number; main?: boolean }> = {}
            for (const it of imgs as any[]) {
              const pid = it.productId ?? it.ProductId
              const url = it.imageUrl ?? it.ImageUrl
              const main = !!(it.isMain ?? it.IsMain)
              const sort = it.sortOrder ?? it.SortOrder ?? 0
              if (pid == null || !url) continue
              const existing = byProduct[pid]
              if (!existing) byProduct[pid] = { url, sort, main }
              else {
                const isBetter = main || (!existing.main && (sort ?? 0) < (existing.sort ?? 0))
                if (isBetter) byProduct[pid] = { url, sort, main }
              }
            }
            const map: Record<number, string> = {}
            for (const k of Object.keys(byProduct)) {
              const pid = Number(k)
              map[pid] = byProduct[pid].url
            }
            setImageMap(map)
          }
          if (brands.length === 0 && Array.isArray(bRes)) setBrands(bRes)
          if (categories.length === 0 && Array.isArray(cRes)) setCategories(cRes)
        } catch {}
      })()
    } else {
      setEditingPromo(null)
      setFormData({
        title: "",
        slug: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "1",
        image: "",
      })
      setSelectedProductIds([])
      setOriginalSelectedIds([])
      ;(async () => {
        try {
          const [prods, imgs, bRes, cRes] = await Promise.all([
            allProducts.length === 0 ? api('/api/Products') : Promise.resolve(allProducts),
            api('/api/ProductImages'),
            brands.length === 0 ? api('/api/Brands') : Promise.resolve(brands),
            categories.length === 0 ? api('/api/Categories') : Promise.resolve(categories),
          ])
          if (allProducts.length === 0) setAllProducts(Array.isArray(prods) ? prods : [])
          if (Array.isArray(imgs)) {
            const byProduct: Record<number, { url: string; sort?: number; main?: boolean }> = {}
            for (const it of imgs as any[]) {
              const pid = it.productId ?? it.ProductId
              const url = it.imageUrl ?? it.ImageUrl
              const main = !!(it.isMain ?? it.IsMain)
              const sort = it.sortOrder ?? it.SortOrder ?? 0
              if (pid == null || !url) continue
              const existing = byProduct[pid]
              if (!existing) byProduct[pid] = { url, sort, main }
              else {
                const isBetter = main || (!existing.main && (sort ?? 0) < (existing.sort ?? 0))
                if (isBetter) byProduct[pid] = { url, sort, main }
              }
            }
            const map: Record<number, string> = {}
            for (const k of Object.keys(byProduct)) {
              const pid = Number(k)
              map[pid] = byProduct[pid].url
            }
            setImageMap(map)
          }
          if (brands.length === 0 && Array.isArray(bRes)) setBrands(bRes)
          if (categories.length === 0 && Array.isArray(cRes)) setCategories(cRes)
        } catch {}
      })()
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const titleTrim = formData.title.trim()
      if (!titleTrim) throw new Error("Tiêu đề khuyến mãi không hợp lệ")
      let baseSlug = formData.slug || slugify(titleTrim)
      if (!editingPromo) baseSlug = makeUniqueSlug(baseSlug)

      const startStr = formData.startDate ? `${formData.startDate}T00:00:00` : undefined
      const endStr = formData.endDate ? `${formData.endDate}T23:59:59` : undefined

      if (formData.startDate && formData.endDate) {
        const sd = new Date(formData.startDate)
        const ed = new Date(formData.endDate)
        if (!isNaN(sd.getTime()) && !isNaN(ed.getTime()) && ed.getTime() < sd.getTime()) {
          throw new Error("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu")
        }
      }

      if (editingPromo) {
        const id = editingPromo.id
        await api(`/api/Promotions/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            PromotionId: id,
            Title: formData.title,
            Slug: baseSlug || null,
            Description: formData.description || null,
            FeaturedImage: formData.image || null,
            StartDate: startStr ?? undefined,
            EndDate: endStr ?? undefined,
            Status: formData.status ? Number(formData.status) : (typeof editingPromo.status === 'number' ? editingPromo.status : 1),
            CreatedAt: editingPromo.createdAt ? new Date(editingPromo.createdAt).toISOString() : new Date().toISOString(),
          }),
        })
        if (Array.isArray(selectedProductIds)) {
          await api(`/api/Promotions/${id}/products/map`, {
            method: 'POST',
            body: JSON.stringify(selectedProductIds),
          })
          const toRemove = originalSelectedIds.filter((pid) => !selectedProductIds.includes(pid))
          await Promise.all(toRemove.map((pid) => api(`/api/Promotions/${id}/products/${pid}`, { method: 'DELETE' })))
        }
        toast({ title: "Đã cập nhật khuyến mãi" })
      } else {
        const created = await api(`/api/Promotions`, {
          method: "POST",
          body: JSON.stringify({
            Title: formData.title,
            Slug: baseSlug || null,
            Description: formData.description || null,
            FeaturedImage: formData.image || null,
            StartDate: startStr ?? `${new Date().toISOString().slice(0,10)}T00:00:00`,
            EndDate: endStr ?? null,
            Status: formData.status ? Number(formData.status) : 1,
          }),
        })
        const newId = created?.PromotionId ?? created?.promotionId
        if (newId && Array.isArray(selectedProductIds) && selectedProductIds.length > 0) {
          await api(`/api/Promotions/${newId}/products/map`, {
            method: 'POST',
            body: JSON.stringify(selectedProductIds),
          })
        }
        toast({ title: "Đã thêm khuyến mãi mới" })
      }
      setIsDialogOpen(false)
      await refresh()
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể lưu khuyến mãi" })
    }
    finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api(`/api/Promotions/${id}`, { method: "DELETE" })
      toast({ title: "Đã xóa khuyến mãi" })
      await refresh()
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể xóa khuyến mãi" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Quản lý khuyến mãi</h1>
          <p className="text-muted-foreground mt-1">Quản lý các chương trình khuyến mãi và mã giảm giá</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm khuyến mãi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPromo ? "Chỉnh sửa khuyến mãi" : "Thêm khuyến mãi mới"}</DialogTitle>
              <DialogDescription>Điền thông tin khuyến mãi dưới đây</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề khuyến mãi"
                />
              </div>
              <div>
                <Label>Sản phẩm áp dụng</Label>
                <div className="flex items-center gap-2 mt-2 mb-2">
                  <Input
                    placeholder="Tìm sản phẩm..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">Đã chọn: {selectedProductIds.length}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const ids = allProducts
                        .filter((p) => {
                          const q = productSearch.toLowerCase()
                          const name = String(p.productName ?? p.ProductName ?? '').toLowerCase()
                          const slug = String(p.slug ?? p.Slug ?? '').toLowerCase()
                          if (!(name.includes(q) || slug.includes(q))) return false
                          if (brandFilter !== 'all' && Number(p.brandId ?? p.BrandId) !== brandFilter) return false
                          if (categoryFilter !== 'all' && Number(p.categoryId ?? p.CategoryId) !== categoryFilter) return false
                          if (onlySelected) {
                            const pid = p.productId ?? p.ProductId
                            if (!selectedProductIds.includes(pid)) return false
                          }
                          if (onlyDiscounted) {
                            const unit = Number(p.unitPrice ?? p.UnitPrice ?? 0)
                            const discVal = p.discountPrice ?? p.DiscountPrice
                            const disc = discVal != null ? Number(discVal) : undefined
                            if (!(disc != null && disc < unit)) return false
                          }
                          return true
                        })
                        .map((p) => p.productId ?? p.ProductId)
                        .filter((x: any) => x != null)
                      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...ids])))
                    }}
                  >
                    Chọn tất cả
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedProductIds([])}>
                    Bỏ chọn tất cả
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <Label>Thương hiệu</Label>
                    <Select value={String(brandFilter)} onValueChange={(v) => setBrandFilter(v === 'all' ? 'all' : Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thương hiệu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        {brands.map((b) => (
                          <SelectItem key={b.brandId ?? b.BrandId} value={String(b.brandId ?? b.BrandId)}>{b.brandName ?? b.BrandName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Danh mục</Label>
                    <Select value={String(categoryFilter)} onValueChange={(v) => setCategoryFilter(v === 'all' ? 'all' : Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.categoryId ?? c.CategoryId} value={String(c.categoryId ?? c.CategoryId)}>{c.categoryName ?? c.CategoryName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={onlySelected} onCheckedChange={(v) => setOnlySelected(!!v && v !== 'indeterminate')} />
                    <span className="text-sm">Chỉ hiển thị đã chọn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={onlyDiscounted} onCheckedChange={(v) => setOnlyDiscounted(!!v && v !== 'indeterminate')} />
                    <span className="text-sm">Chỉ sản phẩm đang giảm giá</span>
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto border rounded-md p-2 space-y-2">
                  {allProducts
                    .filter((p) => {
                      const q = productSearch.toLowerCase()
                      const name = String(p.productName ?? p.ProductName ?? '').toLowerCase()
                      const slug = String(p.slug ?? p.Slug ?? '').toLowerCase()
                      if (!(name.includes(q) || slug.includes(q))) return false
                      if (brandFilter !== 'all' && Number(p.brandId ?? p.BrandId) !== brandFilter) return false
                      if (categoryFilter !== 'all' && Number(p.categoryId ?? p.CategoryId) !== categoryFilter) return false
                      if (onlySelected) {
                        const pid = p.productId ?? p.ProductId
                        if (!selectedProductIds.includes(pid)) return false
                      }
                      if (onlyDiscounted) {
                        const unit = Number(p.unitPrice ?? p.UnitPrice ?? 0)
                        const discVal = p.discountPrice ?? p.DiscountPrice
                        const disc = discVal != null ? Number(discVal) : undefined
                        if (!(disc != null && disc < unit)) return false
                      }
                      return true
                    })
                    .map((p) => {
                      const pid = p.productId ?? p.ProductId
                      const checked = selectedProductIds.includes(pid)
                      const imgUrl = imageMap[pid]
                      return (
                        <div key={pid} className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const isChecked = !!v && v !== 'indeterminate'
                              setSelectedProductIds((prev) => {
                                const set = new Set(prev)
                                if (isChecked) set.add(pid)
                                else set.delete(pid)
                                return Array.from(set)
                              })
                            }}
                          />
                          {imgUrl && <img src={`${apiBase}${imgUrl}`} alt="Ảnh" className="h-8 w-8 rounded object-cover border" />}
                          <span className="text-sm">{p.productName ?? p.ProductName}</span>
                        </div>
                      )
                    })}
                  {allProducts.length === 0 && <div className="text-sm text-muted-foreground">Đang tải danh sách sản phẩm...</div>}
                </div>
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="khuyen-mai-moi"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generateSlugFromTitle}>
                    <Wand2 className="h-4 w-4 mr-1" />Tạo
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Ngày bắt đầu</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Ngày kết thúc</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
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
                <Label htmlFor="validUntil">Có hiệu lực đến</Label>
                <Input id="validUntil" value={formData.endDate} readOnly placeholder="Chọn ngày kết thúc ở trên" />
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về chương trình khuyến mãi"
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
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      setUploadingImage(true)
                      try {
                        const fd = new FormData()
                        fd.append("file", f)
                        const res = await api("/api/Promotions/upload-image", { method: "POST", body: fd })
                        const url = (res && (res.url ?? res.Url)) || ""
                        if (url) setFormData((prev) => ({ ...prev, image: url }))
                      } catch {}
                      finally {
                        setUploadingImage(false)
                        if (e.target) e.target.value = ""
                      }
                    }}
                  />
                  {uploadingImage && <span className="text-xs text-muted-foreground">Đang tải lên...</span>}
                </div>
                {(() => {
                  const u = String(formData.image || "").trim()
                  const preview = u ? (u.startsWith("http://") || u.startsWith("https://") ? u : `${apiBase}${u}`) : ""
                  return preview ? <img src={preview} alt="Xem trước" className="mt-2 h-24 w-auto rounded-md border" /> : null
                })()}
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
            <Input
              placeholder="Tìm kiếm khuyến mãi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-56">
            <Label htmlFor="filter">Lọc trạng thái</Label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1) }}>
              <SelectTrigger id="filter">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="ongoing">Đang diễn ra</SelectItem>
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
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>SP áp dụng</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedPromos.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell className="font-medium">{promo.title}</TableCell>
                <TableCell className="text-muted-foreground">{promo.startDate || ""}</TableCell>
                <TableCell className="text-muted-foreground">{promo.endDate || ""}</TableCell>
                <TableCell>
                  <Badge variant={Number(promo.status) === 1 ? "default" : "secondary"}>{Number(promo.status) === 1 ? "Hiển thị" : "Ẩn"}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{promoCounts[promo.id] ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="icon" disabled={!promo.slug} title="Xem trên website">
                      <a href={promo.slug ? `/promotions/${promo.slug}` : undefined} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(promo)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(promo.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pagedPromos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">Không có khuyến mãi</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Trang {currentPage}/{totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
