"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle } from "lucide-react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

type OrderSearchResult = {
  OrderId: number
  OrderCode: string
  UserId?: number | null
}

type OrderProduct = {
  productId: string
  name: string
  quantity: number
}

export default function CreateWarrantyPage() {
  const router = useRouter()
  const [orderCode, setOrderCode] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<OrderSearchResult | null>(null)
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [issueDescription, setIssueDescription] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [searchAttempted, setSearchAttempted] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [warrantyStatus, setWarrantyStatus] = useState("Pending")
  const [isUnderWarranty, setIsUnderWarranty] = useState(true)
  const [diagnosis, setDiagnosis] = useState("")
  const [extraCost, setExtraCost] = useState<string>("0")
  const [costNote, setCostNote] = useState("")
  const [estimatedReturnDate, setEstimatedReturnDate] = useState("")
  const [staffHandledBy, setStaffHandledBy] = useState<string>("")
  const [relatedTickets, setRelatedTickets] = useState<Array<{ id: number; code: string; status: string; createdAt: string }>>([])
  const [error, setError] = useState("")
  const [productInfo, setProductInfo] = useState<{ image?: string; price?: number; quantity?: number; brand?: string; sku?: string } | null>(null)

  useEffect(() => {
    const code = orderCode.trim()
    if (!code) return
    const t = setTimeout(() => {
      handleOrderSearch()
    }, 400)
    return () => clearTimeout(t)
  }, [orderCode])

  useEffect(() => {
    ;(async () => {
      if (!selectedProduct) {
        setProductInfo(null)
        return
      }
      try {
        const pid = Number(selectedProduct)
        const p = await api(`/api/Products/${pid}`)
        const images = await api(`/api/ProductImages`)
        const mainImage = (Array.isArray(images) ? images : [])
          .filter((im: any) => Number(im.ProductId ?? im.productId) === pid)
          .sort((a: any, b: any) => Number(a.SortOrder ?? a.sortOrder ?? 0) - Number(b.SortOrder ?? b.sortOrder ?? 0))
          .find((im: any) => !!(im.IsMain ?? im.isMain)) || null
        let brandName = ""
        try {
          const bid = Number(p.BrandId ?? p.brandId)
          if (bid) {
            const b = await api(`/api/Brands/${bid}`)
            if (b) brandName = String(b.BrandName ?? b.brandName ?? "")
          }
        } catch {}
        setProductInfo({
          image: mainImage ? String(mainImage.ImageUrl ?? mainImage.imageUrl ?? "") : undefined,
          price: Number(p.DiscountPrice ?? p.discountPrice ?? p.UnitPrice ?? p.unitPrice ?? 0),
          quantity: Number(p.Quantity ?? p.quantity ?? 0),
          brand: brandName || undefined,
          sku: String(p.Sku ?? p.sku ?? "") || undefined,
        })
      } catch {
        setProductInfo(null)
      }
    })()
  }, [selectedProduct])

  const handleOrderSearch = async () => {
    setSelectedOrder(null)
    setOrderProducts([])
    setSelectedProduct("")
    const code = orderCode.trim()
    if (!code) return
    try {
      setSearchAttempted(true)
      let payload: any = null
      try {
        payload = await api(`/api/Orders/by-code/${encodeURIComponent(code)}/items`)
      } catch {}
      if (!payload) {
        const list = await api("/api/Orders")
        const found = (Array.isArray(list) ? list : []).find((o: any) => {
          const oc = String((o.OrderCode ?? o.orderCode ?? "")).trim().toUpperCase()
          return oc === code.toUpperCase()
        })
        if (!found) {
          setSelectedOrder(null)
          return
        }
        payload = {
          OrderId: Number(found.OrderId ?? found.orderId),
          OrderCode: String(found.OrderCode ?? found.orderCode),
          UserId: typeof (found.UserId ?? found.userId) === "number" ? (found.UserId ?? found.userId) : null,
          Items: [],
        }
      }
      const order: OrderSearchResult = {
        OrderId: Number(payload.OrderId ?? payload.orderId),
        OrderCode: String(payload.OrderCode ?? payload.orderCode),
        UserId: typeof (payload.UserId ?? payload.userId) === "number" ? (payload.UserId ?? payload.userId) : null,
      }
      setSelectedOrder(order)
      setCustomerName("")
      if (order.UserId) {
        try {
          const u = await api(`/api/Users/${order.UserId}`)
          setCustomerName(String(u.FullName ?? u.fullName ?? u.Email ?? u.email ?? ""))
        } catch {}
      }
      const baseItems: Array<{ ProductId: number; Quantity: number; ProductName?: string }> = Array.isArray(
        (payload as any).Items ?? (payload as any).items
      )
        ? ((payload as any).Items ?? (payload as any).items)
        : []
      let itemList: any[] = baseItems
      if (!itemList.length) {
        try {
          const shipped = await api(`/api/Orders/by-code/${encodeURIComponent(order.OrderCode)}/shipped-items`)
          const shippedItems = Array.isArray((shipped as any).Items ?? (shipped as any).items)
            ? ((shipped as any).Items ?? (shipped as any).items)
            : []
          if (shippedItems.length) {
            itemList = shippedItems
          }
        } catch {}
        if (!itemList.length) {
          const items = await api("/api/OrderItems")
          itemList = (Array.isArray(items) ? items : []).filter(
            (it: any) => Number(it.OrderId) === order.OrderId
          )
        }
      }
      const products: OrderProduct[] = await Promise.all(
        itemList.map(async (it: any) => {
          let name = String(it.ProductName ?? it.productName ?? it.ProductId ?? it.productId)
          try {
            const p = await api(`/api/Products/${it.ProductId ?? it.productId}`)
            if (p) name = String(p.ProductName ?? p.productName ?? name)
          } catch {}
          return {
            productId: String(it.ProductId ?? it.productId),
            name,
            quantity: Number(it.Quantity ?? it.quantity) || 0,
          }
        })
      )
      setOrderProducts(products)
    } catch {}
  }

  useEffect(() => {
    ;(async () => {
      if (!selectedOrder || !selectedProduct) {
        setRelatedTickets([])
        return
      }
      try {
        const data = await api("/api/WarrantyTickets")
        const list = Array.isArray(data) ? data : []
        const filtered = list
          .filter((t: any) => Number(t.OrderId ?? t.orderId) === selectedOrder.OrderId && Number(t.ProductId ?? t.productId) === Number(selectedProduct))
          .slice(0, 5)
          .map((t: any) => ({
            id: Number(t.WarrantyId ?? t.warrantyId),
            code: String(t.WarrantyCode ?? t.warrantyCode),
            status: String(t.WarrantyStatus ?? t.warrantyStatus ?? "Pending"),
            createdAt: t.CreatedAt ? String(new Date(t.CreatedAt).toISOString().slice(0, 10)) : "",
          }))
        setRelatedTickets(filtered)
      } catch {
        setRelatedTickets([])
      }
    })()
  }, [selectedOrder, selectedProduct])

  const generateWarrantyCode = () => {
    const now = new Date()
    const y = now.getFullYear().toString()
    const m = String(now.getMonth() + 1).padStart(2, "0")
    const d = String(now.getDate()).padStart(2, "0")
    const rnd = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
    return `BH${y}${m}${d}-${rnd}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!selectedOrder) {
      setError("Vui lòng tìm và chọn đơn hàng")
      return
    }
    if (!selectedProduct) {
      setError("Vui lòng chọn sản phẩm cần bảo hành")
      return
    }
    if (!issueDescription.trim()) {
      setError("Vui lòng nhập mô tả vấn đề")
      return
    }
    if (Number(extraCost || "0") < 0) {
      setError("Chi phí phát sinh không hợp lệ")
      return
    }
    try {
      try {
        const resp = await api("/api/WarrantyTickets", {
          method: "POST",
          body: JSON.stringify({
            WarrantyCode: generateWarrantyCode(),
            OrderId: selectedOrder.OrderId,
            ProductId: Number(selectedProduct),
            UserId: selectedOrder.UserId ?? null,
            IssueDescription: issueDescription,
            Diagnosis: diagnosis || null,
            WarrantyStatus: warrantyStatus || "Pending",
            IsUnderWarranty: isUnderWarranty,
            ExtraCost: Number(extraCost || "0"),
            CostNote: costNote || null,
            EstimatedReturnDate: estimatedReturnDate ? new Date(estimatedReturnDate).toISOString() : null,
            StaffHandledBy: staffHandledBy ? Number(staffHandledBy) : null,
          }),
        })
        setSubmitted(true)
        const createdId = Number((resp as any)?.WarrantyId ?? (resp as any)?.warrantyId)
        if (createdId && !Number.isNaN(createdId)) {
          router.push(`/admin/warranty/${createdId}`)
          return
        }
      } catch (err: any) {
        setError(String(err?.message || "Có lỗi xảy ra"))
      }
      setTimeout(() => {
        setOrderCode("")
        setSelectedOrder(null)
        setOrderProducts([])
        setSelectedProduct("")
        setIssueDescription("")
        setDiagnosis("")
        setWarrantyStatus("Pending")
        setIsUnderWarranty(true)
        setExtraCost("0")
        setCostNote("")
        setEstimatedReturnDate("")
        setStaffHandledBy("")
        setCustomerName("")
        setSubmitted(false)
      }, 3000)
    } catch {}
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Tạo Phiếu Bảo Hành</h1>
            <p className="text-muted-foreground mt-1">Nhập mã đơn hàng để bắt đầu tạo phiếu bảo hành</p>
          </div>

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

          {submitted && (
            <Card className="mb-8 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Tạo Phiếu Thành Công</p>
                    <p className="text-sm text-green-800">Phiếu bảo hành đã được tạo và gửi cho khách hàng.</p>
                  </div>
                  {productInfo && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="w-full aspect-video bg-muted rounded overflow-hidden flex items-center justify-center">
                          {productInfo.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={productInfo.image} alt="product" className="object-cover w-full h-full" />
                          ) : (
                            <div className="text-sm text-muted-foreground">Không có ảnh</div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Giá</p>
                          <p className="font-semibold text-foreground">{productInfo.price?.toLocaleString()} đ</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tồn Kho</p>
                          <p className="font-semibold text-foreground">{productInfo.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Hãng</p>
                          <p className="text-foreground">{productInfo.brand || ""}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">SKU</p>
                          <p className="font-mono text-foreground">{productInfo.sku || ""}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Order Search */}
            <Card>
              <CardHeader>
                <CardTitle>Bước 1: Tìm Đơn Hàng</CardTitle>
                <CardDescription>Nhập mã đơn hàng để xem sản phẩm đã mua</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="VD: ORD-2024-001189"
                    value={orderCode}
                    onChange={(e) => {
                      setOrderCode(e.target.value)
                      setSearchAttempted(false)
                      setSelectedOrder(null)
                      setOrderProducts([])
                      setSelectedProduct("")
                      setCustomerName("")
                    }}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleOrderSearch()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleOrderSearch} variant="outline">
                    Tìm Kiếm
                  </Button>
                </div>

                {selectedOrder && (
                  <div className="bg-muted p-4 rounded">
                    <p className="text-sm text-muted-foreground">Đơn hàng tìm thấy:</p>
                    <p className="font-semibold text-foreground">{selectedOrder.OrderCode}</p>
                    {customerName && <p className="text-sm text-muted-foreground">Khách hàng: {customerName}</p>}
                  </div>
                )}

                {searchAttempted && orderCode && !selectedOrder && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">Không tìm thấy đơn hàng với mã "{orderCode}"</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Select Product */}
            {selectedOrder && (
              <Card>
                <CardHeader>
                  <CardTitle>Bước 2: Chọn Sản Phẩm</CardTitle>
                  <CardDescription>Chọn sản phẩm cần bảo hành</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {orderProducts.map((item) => (
                      <label
                        key={item.productId}
                        className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-muted"
                      >
                        <input
                          type="radio"
                          name="product"
                          value={item.productId}
                          checked={selectedProduct === item.productId}
                          onChange={(e) => setSelectedProduct(e.target.value)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Số lượng: {item.quantity}</p>
                        </div>
                      </label>
                    ))}
                    {orderProducts.length === 0 && (
                      <div className="text-sm text-muted-foreground">Không có sản phẩm gắn với đơn này</div>
                    )}
                  </div>
                  {relatedTickets.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Lịch sử phiếu liên quan</p>
                      <div className="space-y-2">
                        {relatedTickets.map((t) => (
                          <div key={t.id} className="flex items-center justify-between text-sm">
                            <span className="font-mono text-foreground">{t.code}</span>
                            <Badge>{t.status}</Badge>
                            <span className="text-muted-foreground">{t.createdAt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Issue Description */}
            {selectedProduct && (
              <Card>
                <CardHeader>
                  <CardTitle>Bước 3: Mô Tả Vấn Đề</CardTitle>
                  <CardDescription>Mô tả chi tiết vấn đề gặp phải</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="issue">Mô Tả Vấn Đề</Label>
                    <Textarea
                      id="issue"
                      placeholder="Mô tả chi tiết vấn đề..."
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      rows={5}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedProduct && (
              <Card>
                <CardHeader>
                  <CardTitle>Bước 4: Thông Tin Bổ Sung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Trạng Thái</Label>
                      <select
                        value={warrantyStatus}
                        onChange={(e) => setWarrantyStatus(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border rounded-md bg-background text-foreground"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <Label>Ngày Trả Dự Kiến</Label>
                      <Input type="date" value={estimatedReturnDate} onChange={(e) => setEstimatedReturnDate(e.target.value)} className="mt-2" />
                    </div>
                  </div>
                  <div>
                    <Label>Chuẩn Đoán</Label>
                    <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={4} className="mt-2" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Trong Hạn Bảo Hành</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <input type="checkbox" checked={isUnderWarranty} onChange={(e) => setIsUnderWarranty(e.target.checked)} />
                        <span className="text-sm text-muted-foreground">Đánh dấu nếu trong hạn</span>
                      </div>
                    </div>
                    <div>
                      <Label>Chi Phí Phát Sinh</Label>
                      <Input type="number" min="0" value={extraCost} onChange={(e) => setExtraCost(e.target.value)} className="mt-2" />
                    </div>
                    <div>
                      <Label>Nhân Viên Xử Lý (User ID)</Label>
                      <Input type="number" min="0" value={staffHandledBy} onChange={(e) => setStaffHandledBy(e.target.value)} className="mt-2" />
                    </div>
                  </div>
                  <div>
                    <Label>Ghi Chú Chi Phí</Label>
                    <Textarea value={costNote} onChange={(e) => setCostNote(e.target.value)} rows={3} className="mt-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            {selectedProduct && issueDescription && (
              <div className="flex gap-3">
                <Button type="submit" size="lg" className="flex-1" disabled={!selectedOrder || !selectedProduct || !issueDescription.trim()}>
                  Tạo Phiếu Bảo Hành
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setOrderCode("")
                    setSelectedOrder(null)
                    setSelectedProduct("")
                    setIssueDescription("")
                    setDiagnosis("")
                    setWarrantyStatus("Pending")
                    setIsUnderWarranty(true)
                    setExtraCost("0")
                    setCostNote("")
                    setEstimatedReturnDate("")
                    setStaffHandledBy("")
                  }}
                >
                  Hủy
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}
