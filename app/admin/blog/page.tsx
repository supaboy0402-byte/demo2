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
import { Plus, Pencil, Trash2, Search, RefreshCw } from "lucide-react"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden">("all")

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    author: "Admin",
    image: "",
    publishedDate: "",
    status: "1",
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

  const refresh = async () => {
    try {
      setLoading(true)
      const res = await api("/api/BlogPosts")
      const mapped = Array.isArray(res)
        ? res.map((c: any) => ({
            id: c.blogId ?? c.BlogId,
            title: c.title ?? c.Title,
            slug: c.slug ?? c.Slug ?? "",
            excerpt: c.metaDescription ?? c.MetaDescription ?? "",
            content: c.content ?? c.Content ?? "",
            category: "Tin tức",
            author:
              c.author && (c.author.fullName ?? c.author.FullName)
                ? (c.author.fullName ?? c.author.FullName)
                : (c.authorId ?? c.AuthorId ?? "—"),
            image: c.featuredImage ?? c.FeaturedImage ?? "",
            date: formatDate(c.publishedDate ?? c.PublishedDate ?? c.createdAt ?? c.CreatedAt),
            status: (c.status ?? c.Status ?? 0) as number,
          }))
        : []
      setPosts(mapped)
      setError(null)
    } catch (e: any) {
      setError(typeof e?.message === "string" ? e.message : "Lỗi tải bài viết")
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

  const filteredPosts = posts.filter((post) => {
    const q = debouncedQuery.toLowerCase()
    const matchesQuery = post.title.toLowerCase().includes(q) || post.category.toLowerCase().includes(q)
    const matchesStatus = statusFilter === "all" ? true : statusFilter === "visible" ? post.status === 1 : post.status !== 1
    return matchesQuery && matchesStatus
  })

  function slugify(s: string) {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleOpenDialog = (post?: any) => {
    if (post) {
      setEditingPost(post)
      setFormData({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        author: post.author,
        image: post.image,
        publishedDate: post.date ? post.date : "",
        status: typeof post.status === 'number' ? String(post.status) : "1",
      })
    } else {
      setEditingPost(null)
      setFormData({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        category: "",
        author: "Admin",
        image: "",
        publishedDate: "",
        status: "1",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const titleTrim = formData.title.trim()
      if (!titleTrim) throw new Error("Tiêu đề không hợp lệ")
      if (editingPost) {
        const id = editingPost.id
        await api(`/api/BlogPosts/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            Title: formData.title,
            Slug: formData.slug || null,
            Content: formData.content,
            FeaturedImage: formData.image || null,
            MetaDescription: formData.excerpt || null,
            PublishedDate: formData.publishedDate ? new Date(formData.publishedDate).toISOString() : undefined,
            Status: formData.status ? Number(formData.status) : undefined,
          }),
        })
        toast({ title: "Đã cập nhật bài viết" })
      } else {
        let base = (formData.slug || slugify(titleTrim)) || ""
        let finalSlug = base
        for (let i = 2; i < 100; i++) {
          try {
            await api(`/api/BlogPosts/slug/${finalSlug}`)
            finalSlug = `${base}-${i}`
          } catch {
            break
          }
        }

        await api(`/api/BlogPosts`, {
          method: "POST",
          body: JSON.stringify({
            Title: formData.title,
            Slug: finalSlug || null,
            Content: formData.content,
            FeaturedImage: formData.image || null,
            AuthorId: null,
            PublishedDate: formData.publishedDate ? new Date(formData.publishedDate).toISOString() : new Date().toISOString(),
            Status: formData.status ? Number(formData.status) : 1,
            MetaDescription: formData.excerpt || null,
          }),
        })
        toast({ title: "Đã thêm bài viết mới" })
      }
      setIsDialogOpen(false)
      await refresh()
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể lưu bài viết" })
    }
  }

  const applyDelete = async (id: number) => {
    try {
      await api(`/api/BlogPosts/${id}`, { method: "DELETE" })
      toast({ title: "Đã xóa bài viết" })
      await refresh()
    } catch (e: any) {
      toast({ title: "Lỗi", description: typeof e?.message === "string" ? e.message : "Không thể xóa bài viết" })
    }
  }

  const openDelete = (id: number) => {
    setPendingDeleteId(id)
    setDeleteOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Quản lý bài viết</h1>
          <p className="text-muted-foreground mt-1">Quản lý nội dung blog của cửa hàng</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm bài viết
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}</DialogTitle>
              <DialogDescription>Điền thông tin bài viết dưới đây</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData({
                      ...formData,
                      title: val,
                      slug: formData.slug ? formData.slug : slugify(val),
                    })
                  }}
                  placeholder="Nhập tiêu đề bài viết"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="bai-viet-moi"
                />
              </div>
              <div>
                <Label htmlFor="category">Danh mục</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hướng dẫn">Hướng dẫn</SelectItem>
                    <SelectItem value="Đánh giá">Đánh giá</SelectItem>
                    <SelectItem value="Tin tức">Tin tức</SelectItem>
                    <SelectItem value="Kiến thức">Kiến thức</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="excerpt">Mô tả ngắn</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Mô tả ngắn về bài viết"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="content">Nội dung</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Nội dung chi tiết bài viết"
                  rows={6}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="publishedDate">Ngày đăng</Label>
                  <Input
                    id="publishedDate"
                    type="date"
                    value={formData.publishedDate}
                    onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Ẩn</SelectItem>
                      <SelectItem value="1">Hiển thị</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-40">
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="visible">Hiển thị</SelectItem>
                <SelectItem value="hidden">Ẩn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tải lại
          </Button>
        </div>

        {error ? <div className="mb-4 text-sm text-destructive">{error}</div> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Ngày đăng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-6 text-center text-muted-foreground">Đang tải...</TableCell>
              </TableRow>
            ) : filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-6 text-center text-muted-foreground">Không có bài viết</TableCell>
              </TableRow>
            ) : (
            filteredPosts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{post.category}</Badge>
                </TableCell>
                <TableCell>{post.author}</TableCell>
                <TableCell>{post.date}</TableCell>
                <TableCell>{post.status === 1 ? <Badge variant="default">Hiển thị</Badge> : <Badge variant="secondary">Ẩn</Badge>}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(post)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/blog/${post.slug}`} target="_blank">Xem</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDelete(Number(post.id))}
                      className="text-destructive hover:text-destructive"
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
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bài viết</AlertDialogTitle>
            <AlertDialogDescription>Thao tác này sẽ xóa bài viết.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setDeleteOpen(false); setPendingDeleteId(null) }}>Hủy</Button>
              <Button onClick={() => { if (pendingDeleteId != null) applyDelete(pendingDeleteId) }} disabled={pendingDeleteId == null}>Xác nhận</Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
