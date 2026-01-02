import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PackageX, RefreshCw, Clock, CheckCircle2 } from "lucide-react"

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Chính sách đổi trả</h1>
            <p className="text-lg text-muted-foreground">
              Chúng tôi cam kết mang đến trải nghiệm mua sắm tốt nhất cho khách hàng
            </p>
          </div>

          <div className="grid gap-6 mb-12">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <RefreshCw className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Đổi trả trong 30 ngày</h3>
                  <p className="text-muted-foreground">
                    Sản phẩm có thể đổi trả trong vòng 30 ngày kể từ ngày nhận hàng nếu còn nguyên vẹn, chưa qua sử
                    dụng.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <PackageX className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Điều kiện đổi trả</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Sản phẩm còn nguyên tem, nhãn mác</li>
                    <li>Đầy đủ phụ kiện, hộp đựng ban đầu</li>
                    <li>Không có dấu hiệu sử dụng hoặc hư hỏng</li>
                    <li>Có hóa đơn mua hàng</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Quy trình xử lý</h3>
                  <p className="text-muted-foreground mb-3">
                    Sau khi nhận được yêu cầu đổi trả, chúng tôi sẽ xử lý trong vòng 3-5 ngày làm việc.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Bước 1: Gửi yêu cầu đổi trả</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Bước 2: Xác nhận và kiểm tra sản phẩm</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Bước 3: Hoàn tiền hoặc đổi sản phẩm mới</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-2xl font-serif font-bold mb-6">Gửi yêu cầu đổi trả</h2>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Mã đơn hàng *</Label>
                  <Input id="orderNumber" placeholder="ORD-2024-001234" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="email@example.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Lý do đổi trả *</Label>
                <Textarea
                  id="reason"
                  placeholder="Vui lòng mô tả lý do bạn muốn đổi trả sản phẩm..."
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full md:w-auto">
                Gửi yêu cầu
              </Button>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
