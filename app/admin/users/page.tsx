"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Edit, Trash2, UserPlus, RefreshCw, Download } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/contexts/auth-context"

export default function AdminUsersPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const roleNameLower = String(user?.roleName || "").trim().toLowerCase()
  const roleCode = String((user as any)?.roleCode || (roleNameLower.includes("admin") || roleNameLower.includes("quản trị viên") ? "admin" : (roleNameLower.includes("staff") || roleNameLower.includes("nhân viên")) ? "staff" : "customer"))
  const canManage = roleCode === "admin"
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string; roleId: number | null; roleName: string; orders: number; totalSpent: number; joinDate: string }>>([])
  const [roles, setRoles] = useState<Array<{ roleId: number; roleName: string }>>([])
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [sortKey, setSortKey] = useState<"name" | "email" | "role" | "orders" | "spent" | "joinDate">("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formRoleId, setFormRoleId] = useState<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    ;(async () => {
      try {
        const [usersRes, rolesRes, ordersRes] = await Promise.all([api("/api/Users"), api("/api/Roles"), api("/api/Orders")])
        const roleMap: Record<number, string> = {}
        const rolesArr: Array<{ roleId: number; roleName: string }> = []
        if (Array.isArray(rolesRes)) {
          for (const r of rolesRes as any[]) {
            const rid = (r as any).roleId ?? (r as any).RoleId
            const rname = (r as any).roleName ?? (r as any).RoleName
            if (typeof rid === "number") {
              roleMap[rid] = String(rname || "")
              rolesArr.push({ roleId: rid, roleName: String(rname || "") })
            }
          }
        }
        setRoles(rolesArr)
        const orderAgg: Record<number, { count: number; sum: number }> = {}
        if (Array.isArray(ordersRes)) {
          for (const o of ordersRes as any[]) {
            const uid = (o as any).userId ?? (o as any).UserId
            if (typeof uid === "number") {
              const total = Number((o as any).totalAmount ?? (o as any).TotalAmount ?? 0)
              const prev = orderAgg[uid] || { count: 0, sum: 0 }
              orderAgg[uid] = { count: prev.count + 1, sum: prev.sum + (Number.isFinite(total) ? total : 0) }
            }
          }
        }
        const mapped = Array.isArray(usersRes)
          ? (usersRes as any[]).map((u) => {
              const id = (u as any).userId ?? (u as any).UserId
              const name = (u as any).fullName ?? (u as any).FullName ?? ""
              const email = (u as any).email ?? (u as any).Email ?? ""
              const roleId = (u as any).roleId ?? (u as any).RoleId
              const created = (u as any).createdAt ?? (u as any).CreatedAt
              const agg = typeof id === "number" && orderAgg[id] ? orderAgg[id] : { count: 0, sum: 0 }
              const rnameRaw = typeof roleId === "number" ? roleMap[roleId] || "" : ""
              const rnameLower = rnameRaw.trim().toLowerCase()
              const resolvedName = String(name || email || "")
              return {
                id: Number(id),
                name: resolvedName,
                email: String(email),
                roleId: typeof roleId === "number" ? roleId : null,
                roleName: rnameLower === "admin" ? "Quản trị viên" : rnameLower === "staff" ? "Nhân viên" : rnameLower === "customer" ? "Khách hàng" : rnameRaw || "",
                orders: agg.count,
                totalSpent: agg.sum,
                joinDate: created ? new Date(created).toISOString() : "",
              }
            })
          : []
        setUsers(mapped)
      } catch (e: any) {
        toast({ title: "Không thể tải dữ liệu", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function roleVariant(u: { roleName: string }) {
    const rn = u.roleName.trim().toLowerCase()
    if (rn === "quản trị viên" || rn === "admin") return "default" as const
    if (rn === "nhân viên" || rn === "staff") return "default" as const
    return "secondary" as const
  }

  const roleFilterMap: Record<string, (u: { roleName: string }) => boolean> = {
    all: () => true,
    admin: (u) => u.roleName.trim().toLowerCase().includes("quản trị viên") || u.roleName.trim().toLowerCase().includes("admin"),
    staff: (u) => u.roleName.trim().toLowerCase().includes("nhân viên") || u.roleName.trim().toLowerCase().includes("staff"),
    customer: (u) => u.roleName.trim().toLowerCase().includes("khách hàng") || u.roleName.trim().toLowerCase().includes("customer"),
  }
  const filtered = users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(debouncedQuery.trim().toLowerCase()) && roleFilterMap[roleFilter](u))
  const sorted = filtered.slice().sort((a, b) => {
    let cmp = 0
    if (sortKey === "name") cmp = String(a.name).localeCompare(String(b.name))
    else if (sortKey === "email") cmp = String(a.email).localeCompare(String(b.email))
    else if (sortKey === "role") cmp = String(a.roleName).localeCompare(String(b.roleName))
    else if (sortKey === "orders") cmp = Number(a.orders) - Number(b.orders)
    else if (sortKey === "spent") cmp = Number(a.totalSpent) - Number(b.totalSpent)
    else cmp = new Date(a.joinDate || 0).getTime() - new Date(b.joinDate || 0).getTime()
    return sortDir === "asc" ? cmp : -cmp
  })
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = sorted.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize)

  async function sha256Hex(text: string) {
    const buf = new TextEncoder().encode(text)
    const hash = await crypto.subtle.digest("SHA-256", buf)
    const arr = Array.from(new Uint8Array(hash))
    return arr.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  function openCreate() {
    if (!canManage) { toast({ title: "Bạn không có quyền thao tác" }); return }
    setFormName("")
    setFormEmail("")
    setFormPassword("")
    setFormPhone("")
    setFormAddress("")
    setFormRoleId(null)
    setCreateOpen(true)
  }

  function openEdit(u: any) {
    if (!canManage) { toast({ title: "Bạn không có quyền thao tác" }); return }
    setEditing(u)
    setFormName(u.name || "")
    setFormEmail(u.email || "")
    setFormPassword("")
    setFormPhone("")
    setFormAddress("")
    setFormRoleId(typeof u.roleId === "number" ? u.roleId : null)
    setEditOpen(true)
  }

  async function reload() {
    try {
      setLoading(true)
      const [usersRes, rolesRes, ordersRes] = await Promise.all([api("/api/Users"), api("/api/Roles"), api("/api/Orders")])
      const roleMap: Record<number, string> = {}
      const rolesArr: Array<{ roleId: number; roleName: string }> = []
      if (Array.isArray(rolesRes)) {
        for (const r of rolesRes as any[]) {
          const rid = (r as any).roleId ?? (r as any).RoleId
          const rname = (r as any).roleName ?? (r as any).RoleName
          if (typeof rid === "number") {
            roleMap[rid] = String(rname || "")
            rolesArr.push({ roleId: rid, roleName: String(rname || "") })
          }
        }
      }
      setRoles(rolesArr)
      const orderAgg: Record<number, { count: number; sum: number }> = {}
      if (Array.isArray(ordersRes)) {
        for (const o of ordersRes as any[]) {
          const uid = (o as any).userId ?? (o as any).UserId
          if (typeof uid === "number") {
            const total = Number((o as any).totalAmount ?? (o as any).TotalAmount ?? 0)
            const prev = orderAgg[uid] || { count: 0, sum: 0 }
            orderAgg[uid] = { count: prev.count + 1, sum: prev.sum + (Number.isFinite(total) ? total : 0) }
          }
        }
      }
      const mapped = Array.isArray(usersRes)
        ? (usersRes as any[]).map((u) => {
            const id = (u as any).userId ?? (u as any).UserId
            const name = (u as any).fullName ?? (u as any).FullName ?? ""
            const email = (u as any).email ?? (u as any).Email ?? ""
            const roleId = (u as any).roleId ?? (u as any).RoleId
            const created = (u as any).createdAt ?? (u as any).CreatedAt
            const agg = typeof id === "number" && orderAgg[id] ? orderAgg[id] : { count: 0, sum: 0 }
            const rnameRaw = typeof roleId === "number" ? roleMap[roleId] || "" : ""
            const rnameLower = rnameRaw.trim().toLowerCase()
            const resolvedName = String(name || email || "")
            return {
              id: Number(id),
              name: resolvedName,
              email: String(email),
              roleId: typeof roleId === "number" ? roleId : null,
              roleName: rnameLower === "admin" ? "Quản trị viên" : rnameLower === "staff" ? "Nhân viên" : rnameLower === "customer" ? "Khách hàng" : rnameRaw || "",
              orders: agg.count,
              totalSpent: agg.sum,
              joinDate: created ? new Date(created).toISOString() : "",
            }
          })
        : []
      setUsers(mapped)
    } catch (e: any) {
      toast({ title: "Không thể tải dữ liệu", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!canManage) { toast({ title: "Bạn không có quyền thao tác" }); return }
    if (!formEmail.trim() || !formPassword.trim()) {
      toast({ title: "Vui lòng nhập Email và Mật khẩu" })
      return
    }
    if (users.some((u) => u.email.trim().toLowerCase() === formEmail.trim().toLowerCase())) {
      toast({ title: "Email đã tồn tại" })
      return
    }
    try {
      const hashed = await sha256Hex(formPassword.trim())
      const created = await api("/api/Users", { method: "POST", body: JSON.stringify({ fullName: formName || null, email: formEmail.trim(), passwordHash: hashed, phone: formPhone || null, address: formAddress || null, roleId: formRoleId || 2 }) })
      const roleMap: Record<number, string> = {}
      for (const r of roles) roleMap[r.roleId] = r.roleName
      const rid = created.roleId ?? created.RoleId
      const rn = typeof rid === "number" ? roleMap[rid] || "" : ""
      const rnl = rn.trim().toLowerCase()
      setUsers((prev) => [{ id: Number(created.userId ?? created.UserId), name: String(created.fullName ?? created.FullName ?? created.email ?? created.Email), email: String(created.email ?? created.Email), roleId: typeof rid === "number" ? rid : null, roleName: rnl === "admin" ? "Quản trị viên" : rnl === "staff" ? "Nhân viên" : rnl === "customer" ? "Khách hàng" : rn, orders: 0, totalSpent: 0, joinDate: created.createdAt ? new Date(created.createdAt).toISOString() : created.CreatedAt ? new Date(created.CreatedAt).toISOString() : "" }, ...prev])
      setCreateOpen(false)
      toast({ title: "Tạo người dùng thành công" })
    } catch (e: any) {
      toast({ title: "Không thể tạo người dùng", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    }
  }

  async function handleUpdate() {
    if (!canManage) { toast({ title: "Bạn không có quyền thao tác" }); return }
    if (!editing) return
    if (!formEmail.trim()) {
      toast({ title: "Vui lòng nhập Email" })
      return
    }
    if (users.some((u) => u.id !== editing.id && u.email.trim().toLowerCase() === formEmail.trim().toLowerCase())) {
      toast({ title: "Email đã tồn tại" })
      return
    }
    try {
      const payload: any = { fullName: formName || null, email: formEmail.trim(), phone: formPhone || null, address: formAddress || null, roleId: formRoleId || null }
      if (formPassword.trim()) payload.passwordHash = await sha256Hex(formPassword.trim())
      await api(`/api/Users/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) })
      const roleMap: Record<number, string> = {}
      for (const r of roles) roleMap[r.roleId] = r.roleName
      const rn = typeof formRoleId === "number" ? roleMap[formRoleId] || editing.roleName : editing.roleName
      const rnl = rn.trim().toLowerCase()
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...u, name: formName || formEmail, email: formEmail.trim(), roleId: typeof formRoleId === "number" ? formRoleId : u.roleId, roleName: rnl === "admin" ? "Quản trị viên" : rnl === "staff" ? "Nhân viên" : rnl === "customer" ? "Khách hàng" : rn } : u)))
      setEditOpen(false)
      setEditing(null)
      toast({ title: "Cập nhật người dùng thành công" })
    } catch (e: any) {
      toast({ title: "Không thể cập nhật người dùng", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    }
  }

  async function applyDelete(id: number) {
    if (!canManage) { toast({ title: "Bạn không có quyền thao tác" }); return }
    try {
      setDeletingId(id)
      await api(`/api/Users/${id}`, { method: "DELETE" })
      setUsers((prev) => prev.filter((u) => u.id !== id))
      toast({ title: "Xóa người dùng thành công" })
    } catch (e: any) {
      toast({ title: "Không thể xóa người dùng", description: typeof e?.message === "string" ? e.message : "Vui lòng thử lại" })
    } finally {
      setDeletingId(null)
      setDeleteOpen(false)
      setPendingDelete(null)
    }
  }

  function handleExport() {
    const rows = [["Name", "Email", "Role", "Orders", "TotalSpent", "JoinDate"], ...sorted.map((u) => [u.name || u.email, u.email, u.roleName, String(u.orders), String(u.totalSpent), u.joinDate ? new Date(u.joinDate).toLocaleString("vi-VN") : ""])]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Quản lý người dùng</h2>
          <p className="text-muted-foreground">Quản lý tài khoản và phân quyền</p>
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
          {canManage && (
          <Button onClick={openCreate}>
            <UserPlus className="h-4 w-4 mr-2" />
            Thêm người dùng
          </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm người dùng..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="customer">Khách hàng</SelectItem>
                <SelectItem value="staff">Nhân viên</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Tên</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="role">Vai trò</SelectItem>
                <SelectItem value="orders">Đơn hàng</SelectItem>
                <SelectItem value="spent">Chi tiêu</SelectItem>
                <SelectItem value="joinDate">Ngày tham gia</SelectItem>
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
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Tổng chi tiêu</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`s-${i}`}>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!loading && paged.map((user) => {
                const variant = roleVariant(user)
                const dateLabel = user.joinDate ? new Date(user.joinDate).toLocaleDateString("vi-VN") : ""
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || user.email}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={variant}>{user.roleName || ""}</Badge>
                    </TableCell>
                    <TableCell>{user.orders}</TableCell>
                    <TableCell>{Number(user.totalSpent || 0).toLocaleString("vi-VN")}đ</TableCell>
                    <TableCell>{dateLabel}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManage && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setPendingDelete(user.id); setDeleteOpen(true) }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
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
            <DialogTitle>Thêm người dùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Họ và tên" value={formName} onChange={(e) => setFormName(e.target.value)} />
            <Input placeholder="Email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            <Input placeholder="Mật khẩu" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
            <Input placeholder="Số điện thoại" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            <Input placeholder="Địa chỉ" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
            <Select value={formRoleId ? String(formRoleId) : ""} onValueChange={(v) => setFormRoleId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.roleId} value={String(r.roleId)}>{r.roleName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <DialogTitle>Cập nhật người dùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Họ và tên" value={formName} onChange={(e) => setFormName(e.target.value)} />
            <Input placeholder="Email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            <Input placeholder="Mật khẩu (để trống nếu giữ nguyên)" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
            <Input placeholder="Số điện thoại" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            <Input placeholder="Địa chỉ" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
            <Select value={formRoleId ? String(formRoleId) : ""} onValueChange={(v) => setFormRoleId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.roleId} value={String(r.roleId)}>{r.roleName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <AlertDialogTitle>Xóa người dùng?</AlertDialogTitle>
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
