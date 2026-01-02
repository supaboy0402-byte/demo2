"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import Link from "next/link"
import { Search, AlertCircle } from "lucide-react"

export default function CheckWarrantyPage() {
  const [code, setCode] = useState("")
  const [result, setResult] = useState<{
    warrantyCode: string
    orderCode: string
    productName: string
    issueDescription: string
    diagnosis?: string
    status: string
    isUnderWarranty: boolean
    extraCost?: number
    estimatedReturnDate?: string
    completedDate?: string
    createdAt: string
  } | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
    setResult(null)
    const input = code.trim().toLowerCase()
    if (!input) return
    try {
      const data = await api("/api/WarrantyTickets")
      const foundRaw = (Array.isArray(data) ? data : []).find(
        (t: any) => String(t.WarrantyCode ?? t.warrantyCode ?? "").trim().toLowerCase() === input
      )
      if (!foundRaw) {
        setResult(null)
        return
      }
      const oid = Number(foundRaw.OrderId ?? foundRaw.orderId)
      const pid = Number(foundRaw.ProductId ?? foundRaw.productId)
      let productName = ""
      try {
        if (Number.isFinite(pid) && pid > 0) {
          const p = await api(`/api/Products/${pid}`)
          if (p) productName = String(p.ProductName ?? p.productName ?? String(pid))
        } else if (Number.isFinite(oid) && oid > 0) {
          const allItems = await api(`/api/OrderItems`)
          const items = (Array.isArray(allItems) ? allItems : []).filter(
            (it: any) => Number(it.OrderId ?? it.orderId) === oid
          )
          const names: string[] = []
          for (const it of items) {
            const ip = Number(it.ProductId ?? it.productId)
            if (!Number.isFinite(ip) || ip <= 0) continue
            try {
              const p = await api(`/api/Products/${ip}`)
              if (p) names.push(String(p.ProductName ?? p.productName ?? String(ip)))
            } catch {}
          }
          if (names.length === 1) productName = names[0]
          else if (names.length > 1) productName = `${names[0]} + ${names.length - 1} sản phẩm`
        }
      } catch {}
      let orderCode = ""
      try {
        if (Number.isFinite(oid) && oid > 0) {
          const order = await api(`/api/Orders/${oid}`)
          if (order) orderCode = String(order.OrderCode ?? order.orderCode ?? "")
        }
      } catch {}
      const createdAtRaw = foundRaw.CreatedAt ?? foundRaw.createdAt
      const createdAt = createdAtRaw ? new Date(createdAtRaw).toISOString().slice(0, 10) : ""
      const wcRaw = foundRaw.WarrantyCode ?? foundRaw.warrantyCode
      const warrantyCode = typeof wcRaw === "string" ? wcRaw.trim() : ""
      const status = String(foundRaw.WarrantyStatus ?? foundRaw.warrantyStatus ?? "Pending")
      const issueDescription = String(foundRaw.IssueDescription ?? foundRaw.issueDescription ?? "")
      const diagnosisVal = foundRaw.Diagnosis ?? foundRaw.diagnosis
      const estimatedReturnDateRaw = foundRaw.EstimatedReturnDate ?? foundRaw.estimatedReturnDate
      const estimatedReturnDate = estimatedReturnDateRaw
        ? new Date(estimatedReturnDateRaw).toISOString().slice(0, 10)
        : undefined
      const completedDateRaw = foundRaw.CompletedDate ?? foundRaw.completedDate
      const completedDate = completedDateRaw ? new Date(completedDateRaw).toISOString().slice(0, 10) : undefined
      const extraCostNum = Number(foundRaw.ExtraCost ?? foundRaw.extraCost ?? 0)
      const isUnderWarranty = !!(foundRaw.IsUnderWarranty ?? foundRaw.isUnderWarranty)
      setResult({
        warrantyCode,
        orderCode,
        productName,
        issueDescription,
        diagnosis: diagnosisVal || undefined,
        status,
        isUnderWarranty,
        extraCost: Number.isFinite(extraCostNum) ? extraCostNum : 0,
        estimatedReturnDate,
        completedDate,
        createdAt,
      })
    } catch {
      setResult(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Kiểm Tra Trạng Thái Bảo Hành</h1>
            <p className="text-muted-foreground">Nhập mã phiếu bảo hành để xem trạng thái</p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Tìm Kiếm Phiếu Bảo Hành</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Nhập mã phiếu bảo hành (VD: BH2025-0001)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="gap-2">
                  <Search className="w-4 h-4" />
                  Tìm Kiếm
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {searched && (
            <>
              {result ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Chi Tiết Phiếu Bảo Hành</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Mã Phiếu Bảo Hành</p>
                        <p className="font-semibold text-foreground">{result.warrantyCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mã Đơn Hàng</p>
                        <p className="font-semibold text-foreground">{result.orderCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sản Phẩm</p>
                        <p className="font-semibold text-foreground">{result.productName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ngày Tạo</p>
                        <p className="font-semibold text-foreground">{result.createdAt}</p>
                      </div>
                    </div>

                    {/* Issue Description */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Mô Tả Vấn Đề</p>
                      <p className="text-foreground bg-muted p-3 rounded">{result.issueDescription}</p>
                    </div>

                    {/* Diagnosis */}
                    {result.diagnosis && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Chẩn Đoán</p>
                        <p className="text-foreground bg-muted p-3 rounded">{result.diagnosis}</p>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Dự Kiến Hoàn Thành</p>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-600"></div>
                        <p className="text-foreground">{result.estimatedReturnDate}</p>
                      </div>
                      {result.completedDate && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-600"></div>
                          <p className="text-foreground">Hoàn Thành: {result.completedDate}</p>
                        </div>
                      )}
                    </div>

                    {/* Extra Cost */}
                    {result.extraCost && result.extraCost > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-800">
                          Chi phí bảo hành ngoài:{" "}
                          <span className="font-bold">{result.extraCost.toLocaleString()} VND</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900">Không Tìm Thấy</p>
                        <p className="text-sm text-red-800">Mã phiếu bảo hành "{code}" không tồn tại trong hệ thống.</p>
                        <p className="text-sm text-red-800 mt-2">
                          Vui lòng kiểm tra lại mã hoặc{" "}
                          <Link href="/contact" className="underline font-semibold">
                            liên hệ hỗ trợ
                          </Link>
                          .
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
