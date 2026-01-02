"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Phone, MapPin, Lock, Save } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/contexts/auth-context"
import { api, apiBase } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useRef } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changing, setChanging] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string>("")
  const [zoom, setZoom] = useState<number>(1)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    avatar: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/login?next=/profile")
      return
    }
    ;(async () => {
      try {
        const detail = await api(`/api/Users/${user.userId}`)
        setProfileData((prev) => ({
          ...prev,
          fullName: detail?.fullName || user.fullName || "",
          email: detail?.email || user.email || "",
          phone: detail?.phone || "",
          address: detail?.address || "",
          avatar: detail?.avatar || "",
        }))
      } catch {
        setProfileData((prev) => ({
          ...prev,
          fullName: user.fullName || "",
          email: user.email || "",
        }))
      } finally {
        setLoading(false)
      }
    })()
  }, [user, isLoading, router])

  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleAvatarUpload = async (file: File) => {
    if (!user) return
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const result = await api(`/api/Users/${user.userId}/avatar`, {
        method: "POST",
        body: fd,
      })
      setProfileData((prev) => ({ ...prev, avatar: result?.avatar || prev.avatar }))
      toast({ title: "Ảnh đại diện đã được cập nhật" })
    } catch (err: any) {
      toast({ title: "Cập nhật ảnh thất bại", description: err?.message || "Vui lòng thử lại" })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const frameSize = 300
  const createCroppedBlob = async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const img = imgRef.current
      if (!img) return resolve(null)
      const canvas = document.createElement("canvas")
      canvas.width = frameSize
      canvas.height = frameSize
      const ctx = canvas.getContext("2d")
      if (!ctx) return resolve(null)
      const naturalW = img.naturalWidth
      const naturalH = img.naturalHeight
      const drawW = naturalW * zoom
      const drawH = naturalH * zoom
      const drawX = frameSize / 2 - drawW / 2 + offset.x
      const drawY = frameSize / 2 - drawH / 2 + offset.y
      ctx.clearRect(0, 0, frameSize, frameSize)
      ctx.drawImage(img, drawX, drawY, drawW, drawH)
      canvas.toBlob((blob) => resolve(blob), "image/png", 0.92)
    })
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (saving) return
    setSaving(true)
    try {
      await api(`/api/Users/${user.userId}`, {
        method: "PUT",
        body: JSON.stringify({
          fullName: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
        }),
      })
      toast({ title: "Cập nhật hồ sơ thành công" })
    } catch (err: any) {
      toast({ title: "Cập nhật thất bại", description: err?.message || "Vui lòng thử lại" })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (changing) return
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Mật khẩu không khớp", description: "Vui lòng kiểm tra lại" })
      return
    }
    if (passwordData.newPassword.length < 8) {
      toast({ title: "Mật khẩu quá ngắn", description: "Ít nhất 8 ký tự" })
      return
    }
    setChanging(true)
    try {
      await api("/api/Auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })
      toast({ title: "Đổi mật khẩu thành công" })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err: any) {
      toast({ title: "Đổi mật khẩu thất bại", description: err?.message || "Vui lòng thử lại" })
    } finally {
      setChanging(false)
    }
  }

  return (
    <>
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground">Quản lý thông tin tài khoản của bạn</p>
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground">Đang tải hồ sơ...</div>
        ) : (
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
            <TabsTrigger value="password">Đổi mật khẩu</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>Cập nhật thông tin tài khoản và địa chỉ của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {profileData.avatar ? (
                        <img
                          src={`${apiBase}${profileData.avatar}`}
                          alt="Avatar"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          const reader = new FileReader()
                          reader.onload = () => {
                            const src = String(reader.result || "")
                            setCropSrc(src)
                            setZoom(1)
                            setOffset({ x: 0, y: 0 })
                            setCropOpen(true)
                          }
                          reader.readAsDataURL(f)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Thay đổi ảnh
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">JPG, PNG. Tối đa 2MB</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Thông tin cá nhân</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">
                          Họ và tên <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            value={profileData.fullName}
                            onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="phone">
                          Số điện thoại <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Address Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Địa chỉ</h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Địa chỉ</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="address"
                            value={profileData.address}
                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                            className="pl-10"
                            placeholder="Số nhà, tên đường"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">Tỉnh/Thành phố</Label>
                          <Input
                            id="city"
                            value={profileData.city}
                            onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="district">Quận/Huyện</Label>
                          <Input
                            id="district"
                            value={profileData.district}
                            onChange={(e) => setProfileData({ ...profileData, district: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ward">Phường/Xã</Label>
                          <Input
                            id="ward"
                            value={profileData.ward}
                            onChange={(e) => setProfileData({ ...profileData, ward: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu thay đổi
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Đổi mật khẩu</CardTitle>
                <CardDescription>Cập nhật mật khẩu để bảo mật tài khoản của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">
                      Mật khẩu hiện tại <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      Mật khẩu mới <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">Mật khẩu phải có ít nhất 8 ký tự</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Xác nhận mật khẩu mới <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" disabled={changing}>
                      <Save className="h-4 w-4 mr-2" />
                      Cập nhật mật khẩu
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
    <Dialog open={cropOpen} onOpenChange={setCropOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cắt ảnh đại diện</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className="mx-auto border rounded-md overflow-hidden bg-black"
            style={{ width: frameSize, height: frameSize, touchAction: "none" }}
            onPointerDown={(e) => {
              setDragStart({ x: e.clientX, y: e.clientY })
              setDragOrigin({ ...offset })
            }}
            onPointerMove={(e) => {
              if (!dragStart) return
              const dx = e.clientX - dragStart.x
              const dy = e.clientY - dragStart.y
              setOffset({ x: dragOrigin.x + dx, y: dragOrigin.y + dy })
            }}
            onPointerUp={() => setDragStart(null)}
            onPointerLeave={() => setDragStart(null)}
         >
            {cropSrc && (
              <img
                ref={imgRef}
                src={cropSrc}
                alt="Crop"
                style={{
                  width: "100%",
                  height: "100%",
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  objectFit: "contain",
                }}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Thu phóng</Label>
            <Slider
              min={1}
              max={3}
              step={0.01}
              value={[zoom]}
              onValueChange={(v) => setZoom(v[0] ?? 1)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setCropOpen(false)
              setCropSrc("")
              setOffset({ x: 0, y: 0 })
              setZoom(1)
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={async () => {
              const blob = await createCroppedBlob()
              if (!blob) return
              const file = new File([blob], "avatar.png", { type: "image/png" })
              await handleAvatarUpload(file)
              setCropOpen(false)
              setCropSrc("")
              setOffset({ x: 0, y: 0 })
              setZoom(1)
            }}
            disabled={uploadingAvatar}
          >
            Lưu ảnh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
