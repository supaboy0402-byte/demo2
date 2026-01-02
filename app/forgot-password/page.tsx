"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail, KeyRound, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api("/api/Auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      setIsSubmitted(true)
      toast({
        title: "Đã gửi mã OTP",
        description: "Vui lòng kiểm tra email để nhập mã OTP",
      })
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.message || "Không thể gửi yêu cầu đặt lại mật khẩu",
        variant: "destructive",
      })
    }
  }

  const handleResetWithOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (!otp || otp.length !== 6) {
      toast({ title: "Lỗi", description: "Mã OTP phải gồm 6 chữ số", variant: "destructive" })
      return
    }
    if (password !== confirmPassword) {
      toast({ title: "Lỗi", description: "Mật khẩu xác nhận không khớp", variant: "destructive" })
      return
    }
    if (password.length < 8) {
      toast({ title: "Lỗi", description: "Mật khẩu phải có ít nhất 8 ký tự", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      await api("/api/Auth/reset-password-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword: password }),
      })
      toast({ title: "Thành công", description: "Mật khẩu đã được đặt lại" })
      router.push("/login")
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message || "OTP không hợp lệ hoặc đã hết hạn", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Nhập mã OTP</CardTitle>
            <CardDescription className="text-base">
              Mã OTP đã được gửi tới <strong>{email}</strong>. Vui lòng nhập OTP và mật khẩu mới.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetWithOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Mã OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Mật khẩu phải có ít nhất 8 ký tự</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                Đặt lại mật khẩu
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent"
                  onClick={async () => {
                    try {
                      await api("/api/Auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) })
                      toast({ title: "Đã gửi lại OTP", description: "Vui lòng kiểm tra email" })
                    } catch (err: any) {
                      toast({ title: "Lỗi", description: err?.message || "Không thể gửi lại OTP", variant: "destructive" })
                    }
                  }}
                >
                  Gửi lại OTP
                </Button>
              </div>
              <div className="text-center">
                <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Quên mật khẩu</CardTitle>
          <CardDescription>Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" size="lg" className="w-full">
              Gửi hướng dẫn
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
