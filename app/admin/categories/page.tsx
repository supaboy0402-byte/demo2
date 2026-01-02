"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Plus, Pencil, Trash2, Search, FolderOpen, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function AdminCategoriesPage() {
  const [categoriesList, setCategoriesList] = useState<Array<{ id: number; name: string; slug?: string | null; description?: string | null; parentId?: number | null; featuredImage?: string | null; sortOrder?: number | null }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const { toast } = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [sortKey, setSortKey] = useState<"sortOrder" | "name" | "slug">("sortOrder")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    featuredImage: "",
    sortOrder: "",
  })

  function slugify(s: string) {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await api("/api/Categories")
        const mapped = Array.isArray(res)
          ? res.map((c: any) => ({
              id: c.categoryId ?? c.CategoryId,
              name: c.categoryName ?? c.CategoryName,
              slug: c.slug ?? c.Slug ?? null,
              description: c.description ?? c.Description ?? null,
              parentId: (c.parentCategoryId ?? c.ParentCategoryId ?? null) as number | null,
              featuredImage: c.featuredImage ?? c.FeaturedImage ?? null,
              sortOrder: (c.sortOrder ?? c.SortOrder ?? null) as number | null,
            }))
          : []
        setCategoriesList(mapped)
      } catch (e: any) {
        setError(typeof e?.message === "string" ? e.message : "Lỗi tải danh mục")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const filteredCategories = categoriesList.filter((category) =>
    category.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
  )
  const sortedCategories = filteredCategories.slice().sort((a, b) => {
    let va: any
    let vb: any
    if (sortKey === "sortOrder") {
      va = typeof a.sortOrder === 'number' ? a.sortOrder : 0
      vb = typeof b.sortOrder === 'number' ? b.sortOrder : 0
    } else if (sortKey === "name") {
      va = a.name
      vb = b.name
    } else {
      va = a.slug || ""
      vb = b.slug || ""
    }
    let cmp = 0
    if (typeof va === "number" && typeof vb === "number") cmp = va - vb
    else cmp = String(va).localeCompare(String(vb))
    return sortDir === "asc" ? cmp : -cmp
  })
  const totalPages = Math.max(1, Math.ceil(sortedCategories.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedCategories = sortedCategories.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize)

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        parentId: category.parentId ? String(category.parentId) : "",
        featuredImage: category.featuredImage || "",
        sortOrder: typeof category.sortOrder === 'number' ? String(category.sortOrder) : "",
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: "",
        slug: "",
        description: "",
        parentId: "",
        featuredImage: "",
        sortOrder: "",
      })
    }
    setIsDialogOpen(true)
  }

  const refresh = async () => {
    try {
      const res = await api("/api/Categories")
      const mapped = Array.isArray(res)
        ? res.map((c: any) => ({
            id: c.categoryId ?? c.CategoryId,
            name: c.categoryName ?? c.CategoryName,
            slug: c.slug ?? c.Slug ?? null,
            description: c.description ?? c.Description ?? null,
            parentId: (c.parentCategoryId ?? c.ParentCategoryId ?? null) as number | null,
            featuredImage: c.featuredImage ?? c.FeaturedImage ?? null,
            sortOrder: (c.sortOrder ?? c.SortOrder ?? null) as number | null,
          }))
        : []
      setCategoriesList(mapped)
    } catch {}
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const nameTrim = formData.name.trim()
      if (!nameTrim) throw new Error("Tên danh mục không hợp lệ")
      const editingId = editingCategory ? (editingCategory.id ?? editingCategory.CategoryId) : null
      const dupName = categoriesList.some((c) => c.name.trim().toLowerCase() === nameTrim.toLowerCase() && c.id !== editingId)
      if (dupName) {
        toast({ title: "Trùng tên", description: "Tên danh mục đã tồn tại" })
        return
      }
      if (editingCategory) {
        const id = editingCategory.id ?? editingCategory.CategoryId
        await api(`/api/Categories/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            CategoryName: formData.name,
            Slug: formData.slug || null,
            Description: formData.description || null,
            ParentCategoryId: !formData.parentId || formData.parentId === 'none' ? null : Number(formData.parentId),
            FeaturedImage: formData.featuredImage || null,
            SortOrder: formData.sortOrder ? Number(formData.sortOrder) : null,
          }),
        })
        toast({ title: "Đã cập nhật danh mục" })
      } else {
        await api(`/api/Categories`, {
          method: "POST",
          body: JSON.stringify({
            CategoryName: formData.name,
            Slug: formData.slug || null,
            Description: formData.description || null,
            ParentCategoryId: !formData.parentId || formData.parentId === 'none' ? null : Number(formData.parentId),
            FeaturedImage: formData.featuredImage || null,
            SortOrder: formData.sortOrder ? Number(formData.sortOrder) : null,
          }),
        })
        toast({ title: "Đã thêm danh mục mới" })
      }
      setIsDialogOpen(false)
      await refresh()
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể lưu danh mục" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id)
      await api(`/api/Categories/${id}`, { method: "DELETE" })
      toast({ title: "Đã xóa danh mục" })
      await refresh()
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể xóa danh mục" })
    } finally {
      setDeletingId(null)
    }
  }

  const openDelete = (id: number) => {
    setPendingDeleteId(id)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (pendingDeleteId != null) {
      await handleDelete(pendingDeleteId)
    }
    setDeleteOpen(false)
    setPendingDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Quản lý danh mục</h1>
          <p className="text-muted-foreground mt-1">Quản lý danh mục sản phẩm</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
              <DialogDescription>Điền thông tin danh mục dưới đây</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên danh mục</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData({
                      ...formData,
                      name: val,
                      slug: formData.slug ? formData.slug : slugify(val),
                    })
                  }}
                  placeholder="Nhập tên danh mục"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="danh-muc-moi"
                />
              </div>
              <div>
                <Label>Danh mục cha</Label>
                <Select value={formData.parentId} onValueChange={(v) => setFormData({ ...formData, parentId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục cha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có</SelectItem>
                    {categoriesList
                      .filter((c) => !editingCategory || c.id !== (editingCategory.id ?? editingCategory.CategoryId))
                      .map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="featuredImage">Ảnh đại diện (URL)</Label>
                  <Input
                    id="featuredImage"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Thứ tự</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về danh mục"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sắp xếp theo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sortOrder">Thứ tự</SelectItem>
                <SelectItem value="name">Tên</SelectItem>
                <SelectItem value="slug">Slug</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Chiều" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Tăng dần</SelectItem>
                <SelectItem value="desc">Giảm dần</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Trang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / trang</SelectItem>
                <SelectItem value="10">10 / trang</SelectItem>
                <SelectItem value="20">20 / trang</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tải lại
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 text-sm text-destructive">{error}</div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên danh mục</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Ảnh</TableHead>
              <TableHead>Danh mục cha</TableHead>
              <TableHead>Thứ tự</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-6 text-center text-muted-foreground">Đang tải...</TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-6 text-center text-muted-foreground">Không có danh mục</TableCell>
              </TableRow>
            ) : (
            pagedCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    {category.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                <TableCell className="text-muted-foreground">
                  {category.featuredImage ? (
                    <img src={category.featuredImage} alt={category.name} className="h-8 w-8 rounded object-cover" />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{typeof category.parentId === 'number' ? (categoriesList.find((c) => c.id === category.parentId)?.name || category.parentId) : "—"}</TableCell>
                <TableCell className="text-muted-foreground">{typeof category.sortOrder === 'number' ? category.sortOrder : "—"}</TableCell>
                <TableCell className="text-muted-foreground">{category.description || "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDelete(category.id)}
                      className="text-destructive hover:text-destructive"
                      disabled={deletingId === category.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">Trang {currentPage}/{totalPages} • Tổng {sortedCategories.length}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Trước</Button>
            <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Sau</Button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deletingId != null}>Xóa</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
