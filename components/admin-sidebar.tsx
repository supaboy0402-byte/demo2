"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import { LayoutDashboard, Package, ShoppingCart, FileText, Calendar, Tag, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const menuItems = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/admin/brands", label: "Thương hiệu", icon: Tag },
  { href: "/admin/categories", label: "Thể loại", icon: ShoppingCart },
  
  { href: "/admin/blog", label: "Bài viết", icon: FileText },
  { href: "/admin/events", label: "Sự kiện", icon: Calendar },
  { href: "/admin/promotions", label: "Khuyến mãi", icon: Tag },
  { href: "/admin/coupons", label: "Mã giảm giá", icon: Tag },
  { href: "/admin/stock", label: "Tồn kho", icon: Tag },
  { href: "/admin/warranty", label: "Bảo hành", icon: Tag },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/roles", label: "Vai trò", icon: Users },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const role = String((user as any)?.roleCode || user?.roleName || "").toLowerCase()
  const staffAllowed = new Set([
    "/admin/dashboard",
    "/admin/orders",
    "/admin/stock",
    "/admin/warranty",
    "/admin/products",
    "/admin/brands",
  ])
  const visibleItems = role === "staff" ? menuItems.filter((m) => staffAllowed.has(m.href)) : menuItems

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0">
      <div className="p-6">
        <Link href="/admin/dashboard" className="flex items-center space-x-2 mb-8">
          <div className="text-2xl font-serif font-bold text-foreground">Harmony</div>
        </Link>

        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
