"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Search, Plus, Pencil, Trash2, RefreshCw, Download } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"

export default function AdminRolesPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const roleNameLower = String(user?.roleName || "").trim().toLowerCase()
  const roleCode = String((user as any)?.roleCode || (roleNameLower.includes("admin") || roleNameLower.includes("quản trị viên") ? "admin" : (roleNameLower.includes("staff") || roleNameLower.includes("nhân viên")) ? "staff" : "customer"))
  const isAdmin = roleCode === "admin"
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Array<{ roleId: number; roleName: string }>>([])
  const [users, setUsers] = useState<Array<{ id: number; roleId: number | null }>>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortKey, setSortKey] = useState<"name" | "count">("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [formName, setFormName] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    ;(async () => {
      try {
        const [rolesRes, usersRes] = await Promise.all([api("/api/Roles"), api("/api/Users")])
        const nextRoles: Array<{ roleId: number; roleName: string }> = []
        if (Array.isArray(rolesRes)) {
          for (const r of rolesRes as any[]) {
            const rid = (r as any).roleId ?? (r as any).RoleId
            const rname = (r as any).roleName ?? (r as any).RoleName
            if (typeof rid === "number") nextRoles.push({ roleId: rid, roleName: String(rname || "") })
          }
        }
        setRoles(nextRoles)
        const nextUsers: Array<{ id: number; roleId: number | null }> = []
        if (Array.isArray(usersRes)) {
          for (const u of usersRes as any[]) {
            const id = (u as any).userId ?? (u as any).UserId
            const rid = (u as any).roleId ?? (u as any).RoleId
            if (typeof id === "number") nextUsers.push({ id, roleId: typeof rid === "number" ? rid : null })
          }
        }
        setUsers(nextUsers)
      } catch (e: any) {
        toast({ title: "Không thể tải dữ liệu", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const countByRoleId: Record<number, number> = {}
  for (const u of users) {
    if (typeof u.roleId === "number") countByRoleId[u.roleId] = (countByRoleId[u.roleId] || 0) + 1
  }

  const filtered = roles.filter((r) => r.roleName.toLowerCase().includes(debouncedQuery.trim().toLowerCase()))
  const sorted = filtered.slice().sort((a, b) => {
    let cmp = 0
    if (sortKey === "name") cmp = String(a.roleName).localeCompare(String(b.roleName))
    else cmp = (countByRoleId[a.roleId] || 0) - (countByRoleId[b.roleId] || 0)
    return sortDir === "asc" ? cmp : -cmp
  })
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = sorted.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize)

  async function reload() {
    try {
      setLoading(true)
      const [rolesRes, usersRes] = await Promise.all([api("/api/Roles"), api("/api/Users")])
      const nextRoles: Array<{ roleId: number; roleName: string }> = []
      if (Array.isArray(rolesRes)) {
        for (const r of rolesRes as any[]) {
          const rid = (r as any).roleId ?? (r as any).RoleId
          const rname = (r as any).roleName ?? (r as any).RoleName
          if (typeof rid === "number") nextRoles.push({ roleId: rid, roleName: String(rname || "") })
        }
      }
      setRoles(nextRoles)
      const nextUsers: Array<{ id: number; roleId: number | null }> = []
      if (Array.isArray(usersRes)) {
        for (const u of usersRes as any[]) {
          const id = (u as any).userId ?? (u as any).UserId
          const rid = (u as any).roleId ?? (u as any).RoleId
          if (typeof id === "number") nextUsers.push({ id, roleId: typeof rid === "number" ? rid : null })
        }
      }
      setUsers(nextUsers)
    } catch (e: any) {
      toast({ title: "Không thể tải dữ liệu", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    if (!isAdmin) { toast({ title: "Bạn không có quyền thao tác" }); return }
    setFormName("")
    setCreateOpen(true)
  }

  function openEdit(r: any) {
    if (!isAdmin) { toast({ title: "Bạn không có quyền thao tác" }); return }
    setEditing(r)
    setFormName(r.roleName || "")
    setEditOpen(true)
  }

  function handleExport() {
    const rows = [["RoleName", "UserCount"], ...sorted.map((r) => [r.roleName, String(countByRoleId[r.roleId] || 0)])]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `roles-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleCreate() {
    if (!isAdmin) { toast({ title: "Bạn không có quyền thao tác" }); return }
    const name = formName.trim()
    if (!name) { toast({ title: "Vui lòng nhập tên vai trò" }); return }
    if (name.length > 50) { toast({ title: "Tên vai trò quá dài (>50)" }); return }
    if (roles.some((r) => r.roleName.trim().toLowerCase() === name.toLowerCase())) { toast({ title: "Tên vai trò đã tồn tại" }); return }
    try {
      const created = await api("/api/Roles", { method: "POST", body: JSON.stringify({ roleName: name }) })
      setRoles((prev) => [{ roleId: Number(created.roleId ?? created.RoleId), roleName: String(created.roleName ?? created.RoleName) }, ...prev])
      setCreateOpen(false)
      toast({ title: "Tạo vai trò thành công" })
    } catch (e: any) {
      toast({ title: "Không thể tạo vai trò", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    }
  }

  async function handleUpdate() {
    if (!isAdmin) { toast({ title: "Bạn không có quyền thao tác" }); return }
    if (!editing) return
    const name = formName.trim()
    if (!name) { toast({ title: "Vui lòng nhập tên vai trò" }); return }
    if (name.length > 50) { toast({ title: "Tên vai trò quá dài (>50)" }); return }
    if (roles.some((r) => r.roleId !== editing.roleId && r.roleName.trim().toLowerCase() === name.toLowerCase())) { toast({ title: "Tên vai trò đã tồn tại" }); return }
    try {
      await api(`/api/Roles/${editing.roleId}`, { method: "PUT", body: JSON.stringify({ roleName: name }) })
      setRoles((prev) => prev.map((r) => (r.roleId === editing.roleId ? { ...r, roleName: name } : r)))
      setEditOpen(false)
      setEditing(null)
      toast({ title: "Cập nhật vai trò thành công" })
    } catch (e: any) {
      toast({ title: "Không thể cập nhật vai trò", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    }
  }

  async function applyDelete(id: number) {
    if (!isAdmin) { toast({ title: "Bạn không có quyền thao tác" }); return }
    try {
      setDeletingId(id)
      await api(`/api/Roles/${id}`, { method: "DELETE" })
      setRoles((prev) => prev.filter((r) => r.roleId !== id))
      toast({ title: "Xóa vai trò thành công" })
    } catch (e: any) {
      toast({ title: "Không thể xóa vai trò", description: typeof e?.message === "string" ? e.message : "Vai trò có thể đang được sử dụng" })
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
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Quản lý vai trò</h2>
          <p className="text-muted-foreground">Thêm, sửa, xóa các vai trò người dùng</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={reload}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tải lại
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Xuất CSV
          </Button>
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm vai trò
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm vai trò..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Tên</SelectItem>
                <SelectItem value="count">Số người dùng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Chiều" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Tăng dần</SelectItem>
                <SelectItem value="desc">Giảm dần</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(pageSize)} onValueChange={(v) => { const n = Number(v); setPageSize(Number.isFinite(n) && n > 0 ? n : 10); setPage(1) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Trang/size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
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
                <TableHead>Tên vai trò</TableHead>
                <TableHead>Số người dùng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`s-${i}`}>
                  <TableCell><Skeleton className="h-4 w-[160px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!loading && paged.map((r) => (
                <TableRow key={r.roleId}>
                  <TableCell className="font-medium">{r.roleName}</TableCell>
                  <TableCell>{countByRoleId[r.roleId] || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setPendingDelete(r.roleId); setDeleteOpen(true) }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Trang {currentPage}/{totalPages}, tổng {sorted.length}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</Button>
          <Button variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</Button>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm vai trò</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Tên vai trò" value={formName} onChange={(e) => setFormName(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
              <Button onClick={handleCreate}>Tạo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật vai trò</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Tên vai trò" value={formName} onChange={(e) => setFormName(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Hủy</Button>
              <Button onClick={handleUpdate}>Lưu</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vai trò?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" disabled={deletingId !== null} onClick={() => pendingDelete && applyDelete(pendingDelete)}>Xóa</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
