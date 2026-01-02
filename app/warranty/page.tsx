"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { warrantyPolicies } from "@/lib/data/warranty"
import { CheckCircle, XCircle, Clock } from "lucide-react"

export default function WarrantyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Chính Sách Bảo Hành</h1>
          <p className="text-lg text-muted-foreground">
            Chúng tôi cam kết chất lượng sản phẩm và dịch vụ bảo hành tốt nhất
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Duration Card */}
          <Card className="border-l-4 border-l-amber-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Thời Hạn Bảo Hành
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600 mb-2">{warrantyPolicies.duration}</p>
              <p className="text-sm text-muted-foreground">Từ ngày mua hàng</p>
            </CardContent>
          </Card>

          {/* Coverage Card */}
          <Card className="border-l-4 border-l-green-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Bao Gồm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {warrantyPolicies.coverage.map((item, idx) => (
                  <li key={idx} className="text-sm text-foreground flex gap-2">
                    <span className="text-green-600">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Not Covered Card */}
          <Card className="border-l-4 border-l-red-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Không Bao Gồm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {warrantyPolicies.notCovered.map((item, idx) => (
                  <li key={idx} className="text-sm text-foreground flex gap-2">
                    <span className="text-red-600">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Process */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Quy Trình Bảo Hành</CardTitle>
            <CardDescription>Các bước để gửi sản phẩm bảo hành</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {warrantyPolicies.process.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-foreground font-medium">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/warranty/check">
            <Button size="lg" className="w-full sm:w-auto">
              Kiểm Tra Trạng Thái Bảo Hành
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
              Liên Hệ Hỗ Trợ
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
