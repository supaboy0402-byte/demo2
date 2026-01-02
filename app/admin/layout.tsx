"use client"
import type React from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Bell, LogOut } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    const role = String((user as any)?.roleCode || user?.roleName || "").toLowerCase()
    const isStaffOrAdmin = role.includes("admin") || role.includes("quản trị viên") || role.includes("staff") || role.includes("nhân viên")
    if (!user || !isStaffOrAdmin) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [user, isLoading, router, pathname])
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">Quản trị hệ thống</h1>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.fullName || user?.email || ""}</p>
                <p className="text-xs text-muted-foreground">{user?.roleName || ""}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await logout()
                  router.push("/")
                }}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
