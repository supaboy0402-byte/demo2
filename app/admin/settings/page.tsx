"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Save } from "lucide-react"
import { api } from "@/lib/api"

export default function AdminSettingsPage() {
  const { toast } = useToast()

  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Harmony Music Store",
    siteDescription: "Cửa hàng nhạc cụ chất lượng cao",
    contactEmail: "contact@harmonymusic.vn",
    contactPhone: "0123 456 789",
    address: "123 Đường Âm Nhạc, Quận 1, TP.HCM",
  })

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: "10000000",
    standardShippingFee: "200000",
    expressShippingFee: "350000",
  })

  const [paymentSettings, setPaymentSettings] = useState({
    enableCOD: true,
    enableBankTransfer: true,
    enableCreditCard: false,
    enableMomo: true,
  })

  const [settingsIndex, setSettingsIndex] = useState<Record<string, any>>({})

  function getVal(map: Record<string, any>, key: string, fallback: string) {
    const s = map[key]
    const v = s ? (s.settingValue ?? s.SettingValue) : undefined
    return typeof v === "string" ? v : fallback
  }

  function toBool(v: any) {
    if (typeof v === "boolean") return v
    const s = String(v ?? "").toLowerCase().trim()
    return s === "true" || s === "1" || s === "yes"
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api("/api/Settings")
        const list = Array.isArray(res) ? res : []
        const map: Record<string, any> = {}
        for (const s of list as any[]) {
          const k = (s as any).settingKey ?? (s as any).SettingKey
          if (k) map[String(k)] = s
        }
        setSettingsIndex(map)
        setGeneralSettings((prev) => ({
          siteName: getVal(map, "siteName", prev.siteName),
          siteDescription: getVal(map, "siteDescription", prev.siteDescription),
          contactEmail: getVal(map, "contactEmail", prev.contactEmail),
          contactPhone: getVal(map, "contactPhone", prev.contactPhone),
          address: getVal(map, "address", prev.address),
        }))
        setShippingSettings((prev) => ({
          freeShippingThreshold: getVal(map, "freeShippingThreshold", prev.freeShippingThreshold),
          standardShippingFee: getVal(map, "standardShippingFee", prev.standardShippingFee),
          expressShippingFee: getVal(map, "expressShippingFee", prev.expressShippingFee),
        }))
        setPaymentSettings((prev) => ({
          enableCOD: toBool(getVal(map, "enableCOD", String(prev.enableCOD))),
          enableBankTransfer: toBool(getVal(map, "enableBankTransfer", String(prev.enableBankTransfer))),
          enableCreditCard: toBool(getVal(map, "enableCreditCard", String(prev.enableCreditCard))),
          enableMomo: toBool(getVal(map, "enableMomo", String(prev.enableMomo))),
        }))
      } catch (err: any) {
        toast({ title: "Không thể tải cài đặt", description: String(err?.message || err) })
      }
    })()
  }, [])

  async function upsertSetting(group: string, key: string, value: string) {
    const existing = settingsIndex[key]
    if (existing) {
      const id = (existing.settingId ?? existing.SettingId) as number
      const payload: any = {
        settingId: id,
        settingKey: key,
        settingValue: value,
        settingGroup: group,
        updatedAt: new Date().toISOString(),
      }
      await api(`/api/Settings/${id}`, { method: "PUT", body: JSON.stringify(payload) })
    } else {
      const payload: any = {
        settingKey: key,
        settingValue: value,
        settingGroup: group,
      }
      const created = await api(`/api/Settings`, { method: "POST", body: JSON.stringify(payload) })
      const k = (created?.settingKey ?? created?.SettingKey) as string
      if (k) setSettingsIndex((prev) => ({ ...prev, [k]: created }))
    }
  }

  const handleSaveGeneral = async () => {
    try {
      await Promise.all([
        upsertSetting("general", "siteName", String(generalSettings.siteName)),
        upsertSetting("general", "siteDescription", String(generalSettings.siteDescription)),
        upsertSetting("general", "contactEmail", String(generalSettings.contactEmail)),
        upsertSetting("general", "contactPhone", String(generalSettings.contactPhone)),
        upsertSetting("general", "address", String(generalSettings.address)),
      ])
      toast({ title: "Đã lưu cài đặt chung" })
    } catch (err: any) {
      toast({ title: "Lưu thất bại", description: String(err?.message || err) })
    }
  }

  const handleSaveShipping = async () => {
    try {
      await Promise.all([
        upsertSetting("shipping", "freeShippingThreshold", String(shippingSettings.freeShippingThreshold)),
        upsertSetting("shipping", "standardShippingFee", String(shippingSettings.standardShippingFee)),
        upsertSetting("shipping", "expressShippingFee", String(shippingSettings.expressShippingFee)),
      ])
      toast({ title: "Đã lưu cài đặt vận chuyển" })
    } catch (err: any) {
      toast({ title: "Lưu thất bại", description: String(err?.message || err) })
    }
  }

  const handleSavePayment = async () => {
    try {
      await Promise.all([
        upsertSetting("payment", "enableCOD", String(paymentSettings.enableCOD)),
        upsertSetting("payment", "enableBankTransfer", String(paymentSettings.enableBankTransfer)),
        upsertSetting("payment", "enableCreditCard", String(paymentSettings.enableCreditCard)),
        upsertSetting("payment", "enableMomo", String(paymentSettings.enableMomo)),
      ])
      toast({ title: "Đã lưu cài đặt thanh toán" })
    } catch (err: any) {
      toast({ title: "Lưu thất bại", description: String(err?.message || err) })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Cài đặt</h1>
        <p className="text-muted-foreground mt-1">Quản lý cài đặt hệ thống</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Chung</TabsTrigger>
          <TabsTrigger value="shipping">Vận chuyển</TabsTrigger>
          <TabsTrigger value="payment">Thanh toán</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Thông tin chung</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Tên cửa hàng</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="siteDescription">Mô tả</Label>
                  <Textarea
                    id="siteDescription"
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                    rows={3}
                  />
                </div>
                <Separator />
                <div>
                  <Label htmlFor="contactEmail">Email liên hệ</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Số điện thoại</Label>
                  <Input
                    id="contactPhone"
                    value={generalSettings.contactPhone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Textarea
                    id="address"
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveGeneral}>
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shipping">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Cài đặt vận chuyển</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="freeShippingThreshold">Miễn phí vận chuyển cho đơn hàng trên (VNĐ)</Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    value={shippingSettings.freeShippingThreshold}
                    onChange={(e) =>
                      setShippingSettings({ ...shippingSettings, freeShippingThreshold: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="standardShippingFee">Phí vận chuyển tiêu chuẩn (VNĐ)</Label>
                  <Input
                    id="standardShippingFee"
                    type="number"
                    value={shippingSettings.standardShippingFee}
                    onChange={(e) => setShippingSettings({ ...shippingSettings, standardShippingFee: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expressShippingFee">Phí vận chuyển nhanh (VNĐ)</Label>
                  <Input
                    id="expressShippingFee"
                    type="number"
                    value={shippingSettings.expressShippingFee}
                    onChange={(e) => setShippingSettings({ ...shippingSettings, expressShippingFee: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveShipping}>
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payment">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Phương thức thanh toán</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableCOD" className="text-base">
                      Thanh toán khi nhận hàng (COD)
                    </Label>
                    <p className="text-sm text-muted-foreground">Cho phép khách hàng thanh toán khi nhận hàng</p>
                  </div>
                  <Switch
                    id="enableCOD"
                    checked={paymentSettings.enableCOD}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enableCOD: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableBankTransfer" className="text-base">
                      Chuyển khoản ngân hàng
                    </Label>
                    <p className="text-sm text-muted-foreground">Thanh toán qua chuyển khoản ngân hàng</p>
                  </div>
                  <Switch
                    id="enableBankTransfer"
                    checked={paymentSettings.enableBankTransfer}
                    onCheckedChange={(checked) =>
                      setPaymentSettings({ ...paymentSettings, enableBankTransfer: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableCreditCard" className="text-base">
                      Thẻ tín dụng/Ghi nợ
                    </Label>
                    <p className="text-sm text-muted-foreground">Thanh toán bằng thẻ tín dụng hoặc ghi nợ</p>
                  </div>
                  <Switch
                    id="enableCreditCard"
                    checked={paymentSettings.enableCreditCard}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enableCreditCard: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableMomo" className="text-base">
                      Ví MoMo
                    </Label>
                    <p className="text-sm text-muted-foreground">Thanh toán qua ví điện tử MoMo</p>
                  </div>
                  <Switch
                    id="enableMomo"
                    checked={paymentSettings.enableMomo}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, enableMomo: checked })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSavePayment}>
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
