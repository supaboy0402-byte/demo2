"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, AlertCircle } from "lucide-react"
import { useEffect } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function StockOutPage() {
  const [products, setProducts] = useState<Array<{ id: string; name: string; quantity: number }>>([])
  const [items, setItems] = useState<Array<{ productId: string; quantity: string }>>([
    { productId: "", quantity: "" },
  ])
  const [referenceCode, setReferenceCode] = useState("")
  const [referenceType, setReferenceType] = useState("Order")
  const [note, setNote] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api("/api/Products").catch(() => [])
        const list = Array.isArray(res)
          ? res.map((p: any) => ({
              id: String(p.productId ?? p.ProductId ?? ""),
              name: String(p.productName ?? p.ProductName ?? ""),
              quantity: Number(p.quantity ?? p.Quantity ?? 0),
            }))
          : []
        setProducts(list)
      } catch {}
    })()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validDetails = items
      .map((it) => ({ productId: it.productId, quantity: Number.parseInt(it.quantity || "0") }))
      .filter((d) => d.productId && d.quantity && d.quantity > 0)
    if (!validDetails.length || !referenceCode) {
      setError("Vui lòng điền đầy đủ thông tin")
      return
    }

    const agg = validDetails.reduce<Record<string, number>>((acc, d) => {
      acc[d.productId] = (acc[d.productId] || 0) + d.quantity
      return acc
    }, {})
    for (const pid of Object.keys(agg)) {
      const p = products.find((x) => x.id === pid)
      if (!p) {
        setError("Sản phẩm không tồn tại")
        return
      }
      if (agg[pid] > p.quantity) {
        setError(`Tổng số lượng xuất của sản phẩm vượt quá tồn kho (${p.quantity})`)
        return
      }
    }

    ;(async () => {
      try {
        setError("")
        await api("/api/StockMovements/apply", {
          method: "POST",
          body: JSON.stringify({
            movementType: "OUT",
            referenceType,
            referenceId: null,
            referenceCode,
            note,
            createdBy: null,
            details: validDetails.map((d) => ({ productId: Number(d.productId), quantity: d.quantity, unitCost: null, note })),
          }),
        })
        setSubmitted(true)
        setTimeout(() => {
          setItems([{ productId: "", quantity: "" }])
          setReferenceCode("")
          setReferenceType("Order")
          setNote("")
          setSubmitted(false)
        }, 3000)
      } catch (err: any) {
        setError(String(err?.message || "Có lỗi xảy ra"))
      }
    })()
  }

  const selectedProductData = undefined

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Phiếu Xuất Kho</h1>
            <p className="text-muted-foreground mt-1">Tạo phiếu xuất hàng từ kho</p>
          </div>

          {submitted && (
            <Card className="mb-8 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Xuất Kho Thành Công</p>
                    <p className="text-sm text-green-800">Phiếu xuất kho đã được tạo và cập nhật tồn kho.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="mb-8 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Sản phẩm xuất</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((it, idx) => {
                  const pd = products.find((p) => p.id === it.productId)
                  return (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <Label>Sản phẩm</Label>
                        <select
                          value={it.productId}
                          onChange={(e) => {
                            const v = e.target.value
                            setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, productId: v } : x)))
                          }}
                          className="w-full mt-2 px-3 py-2 border rounded-md bg-background text-foreground"
                        >
                          <option value="">-- Chọn sản phẩm --</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} (Tồn: {product.quantity})
                            </option>
                          ))}
                        </select>
                        {pd && (
                          <div className="mt-2 text-xs text-muted-foreground">Tồn hiện tại: {pd.quantity}</div>
                        )}
                      </div>
                      <div>
                        <Label>Số lượng</Label>
                        <Input
                          type="number"
                          min="1"
                          max={pd?.quantity || 0}
                          value={it.quantity}
                          onChange={(e) => {
                            const v = e.target.value
                            setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, quantity: v } : x)))
                          }}
                          placeholder="Nhập số lượng"
                          className="mt-2"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={items.length <= 1}
                        >
                          Xóa dòng
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setItems((prev) => [...prev, { productId: "", quantity: "" }])}
                        >
                          Thêm dòng
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            

            {/* Reference */}
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Tham Chiếu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="refType">Loại Tham Chiếu</Label>
                  <select
                    id="refType"
                    value={referenceType}
                    onChange={(e) => setReferenceType(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="Order">Đơn Hàng</option>
                    <option value="Warranty">Bảo Hành</option>
                    <option value="Damage">Hàng Hỏng</option>
                    <option value="Return">Trả Hàng</option>
                    <option value="Manual">Điều Chỉnh Thủ Công</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="reference">Mã Tham Chiếu</Label>
                  <Input
                    id="reference"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    placeholder="VD: ORD-2024-001189"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="note">Ghi Chú</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú thêm (tùy chọn)"
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={!items.some((it) => it.productId && Number.parseInt(it.quantity || "0") > 0) || !referenceCode}
              >
                Tạo Phiếu Xuất Kho
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  router.push("/admin/stock")
                }}
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
