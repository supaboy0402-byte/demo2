"use client"

import type React from "react"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { login } from "@/lib/auth"
import { useAuth } from "@/lib/contexts/auth-context"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { refresh, logout, user, setUser } = useAuth()

  useEffect(() => {
    const role = String((user as any)?.roleCode || (user as any)?.roleName || "").toLowerCase()
    const isStaffOrAdmin = role.includes("admin") || role.includes("quản trị viên") || role.includes("staff") || role.includes("nhân viên")
    if (user) {
      const next = searchParams.get("next") || ""
      if (isStaffOrAdmin) {
        const target = next && next.startsWith("/admin") ? next : "/admin/dashboard"
        router.replace(target)
      } else {
        const target = next && !next.startsWith("/admin") ? next : "/"
        router.replace(target)
      }
    }
  }, [user, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const me = await login(email, password, remember)
      setUser(me)
      toast({ title: "Đăng nhập thành công" })
      const next = searchParams.get("next") || ""
      const role = String((me as any)?.roleCode || (me as any)?.roleName || "").toLowerCase()
      const isStaffOrAdmin = role.includes("admin") || role.includes("quản trị viên") || role.includes("staff") || role.includes("nhân viên")
      if (isStaffOrAdmin) {
        const target = next && next.startsWith("/admin") ? next : "/admin/dashboard"
        router.push(target)
      } else {
        const target = next && !next.startsWith("/admin") ? next : "/"
        router.push(target)
      }
    } catch (err: any) {
      toast({ title: "Đăng nhập thất bại", description: err?.message || "Vui lòng kiểm tra thông tin" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-serif font-bold text-center">Đăng nhập</CardTitle>
          <CardDescription className="text-center">Nhập email và mật khẩu để tiếp tục</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ten@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
            <Label htmlFor="remember" className="text-sm text-muted-foreground">Ghi nhớ đăng nhập</Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Đăng nhập
          </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Đăng ký ngay
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
