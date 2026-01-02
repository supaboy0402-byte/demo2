"use client"

import Link from "next/link"
import { ShoppingCart, User, Menu, Search, Heart, FileSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { useCart } from "@/lib/contexts/cart-context"
import { useWishlist } from "@/lib/contexts/wishlist-context"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/contexts/auth-context"
import { useRouter } from "next/navigation"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string; parentId: number | null }>>([])
  const { totalItems } = useCart()
  const { items: wishlistItems } = useWishlist()
  const { user, logout } = useAuth()
  const router = useRouter()
  const role = String((user as any)?.roleCode || user?.roleName || "").toLowerCase()
  const isStaffOrAdmin = role.includes("admin") || role.includes("staff") || role.includes("nhân viên")

  useEffect(() => {
    ;(async () => {
      try {
        const cats = await api("/api/Categories")
        const list = Array.isArray(cats)
          ? (cats as any[]).map((c: any) => {
              const id = c.categoryId ?? c.CategoryId
              const name = c.categoryName ?? c.CategoryName ?? ""
              const slugRaw = c.slug ?? c.Slug ?? ""
              const slug = slugRaw || String(name).toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")
              const parentId = c.parentCategoryId ?? c.ParentCategoryId ?? null
              return { id: Number(id), name: String(name), slug, parentId: typeof parentId === "number" ? parentId : null }
            })
          : []
        setCategories(list)
      } catch {}
    })()
  }, [])

  const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/shop", label: "Cửa hàng" },
    { href: "/blog", label: "Tin tức" },
    { href: "/events", label: "Sự kiện" },
    { href: "/promotions", label: "Khuyến mãi" },
    { href: "/warranty", label: "Bảo hành" },
    { href: "/about", label: "Giới thiệu" },
    { href: "/contact", label: "Liên hệ" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-serif font-bold text-foreground">Harmony</div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              if (link.href === "/shop") {
                return (
                  <HoverCard key={link.href} openDelay={50} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </HoverCardTrigger>
                    <HoverCardContent align="start" sideOffset={8} className="w-[720px] p-4">
                      {(() => {
                        const byParent: Record<number, Array<{ id: number; name: string; slug: string }>> = {}
                        for (const c of categories) {
                          const pid = c.parentId
                          if (pid == null || pid === 0) continue
                          const arr = byParent[pid] || []
                          arr.push({ id: c.id, name: c.name, slug: c.slug })
                          byParent[pid] = arr
                        }
                        const roots = categories.filter((c) => c.parentId == null || c.parentId === 0)
                        if (roots.length === 0) {
                          return <div className="text-sm text-muted-foreground">Đang tải danh mục...</div>
                        }
                        return (
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                            {roots.map((r) => {
                              const children = byParent[r.id] || []
                              return (
                                <div key={r.slug} className="space-y-2">
                                  <Link
                                    href={`/category/${r.slug}`}
                                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                                  >
                                    {r.name}
                                  </Link>
                                  {children.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-1">
                                      {children.map((ch) => (
                                        <Link
                                          key={ch.slug}
                                          href={`/category/${ch.slug}`}
                                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                          {ch.name}
                                        </Link>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </HoverCardContent>
                  </HoverCard>
                )
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              )
            })}
            
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
              <Link href="/search">
                <Search className="h-5 w-5" />
                <span className="sr-only">Tìm kiếm</span>
              </Link>
            </Button>

            <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
              <Link href="/orders/check">
                <FileSearch className="h-5 w-5" />
                <span className="sr-only">Tra cứu đơn hàng</span>
              </Link>
            </Button>

            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
                <span className="sr-only">Yêu thích</span>
              </Button>
            </Link>

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
                <span className="sr-only">Giỏ hàng</span>
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Tài khoản</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 text-sm">
                    <div className="font-medium text-foreground">{user.fullName || user.email}</div>
                    <div className="text-muted-foreground">{user.roleName}</div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Hồ sơ</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">Đơn hàng</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isStaffOrAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard">Quản trị</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await logout()
                      router.push("/")
                    }}
                  >
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" className="hidden md:flex">
                <Link href="/login">Đăng nhập</Link>
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/orders/check"
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Tra cứu đơn hàng
                  </Link>
                  {!user ? (
                    <>
                      <Link href="/login" onClick={() => setIsOpen(false)} className="text-lg font-medium text-primary">
                        Đăng nhập
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-medium text-primary"
                      >
                        Đăng ký
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/profile" onClick={() => setIsOpen(false)} className="text-lg font-medium">
                        Hồ sơ
                      </Link>
                      <Link href="/orders" onClick={() => setIsOpen(false)} className="text-lg font-medium">
                        Đơn hàng
                      </Link>
                      {isStaffOrAdmin && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="text-lg font-medium"
                        >
                          Quản trị
                        </Link>
                      )}
                      <button
                        onClick={async () => {
                          await logout()
                          setIsOpen(false)
                          router.push("/")
                        }}
                        className="text-left text-lg font-medium text-destructive"
                      >
                        Đăng xuất
                      </button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
