import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Truck, Package, MapPin, Clock } from "lucide-react"

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Chính sách vận chuyển</h1>
            <p className="text-lg text-muted-foreground">Thông tin về phí vận chuyển và thời gian giao hàng</p>
          </div>

          <div className="grid gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Phí vận chuyển</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>• Miễn phí vận chuyển cho đơn hàng từ 5.000.000đ</p>
                    <p>• Phí vận chuyển tiêu chuẩn: 50.000đ - 200.000đ tùy khu vực</p>
                    <p>• Phí vận chuyển nhanh: 100.000đ - 300.000đ tùy khu vực</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Thời gian giao hàng</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>• Nội thành Hà Nội, TP.HCM: 1-2 ngày</p>
                    <p>• Các tỉnh thành khác: 3-5 ngày</p>
                    <p>• Vùng xa, hải đảo: 5-7 ngày</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Đóng gói sản phẩm</h3>
                  <p className="text-muted-foreground">
                    Tất cả sản phẩm đều được đóng gói cẩn thận với vật liệu chống sốc chuyên dụng để đảm bảo an toàn
                    trong quá trình vận chuyển. Đặc biệt với nhạc cụ, chúng tôi sử dụng hộp carton 5 lớp và xốp PE foam
                    để bảo vệ tối đa.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Theo dõi đơn hàng</h3>
                  <p className="text-muted-foreground">
                    Sau khi đơn hàng được giao cho đơn vị vận chuyển, bạn sẽ nhận được mã vận đơn qua email và SMS. Bạn
                    có thể theo dõi tình trạng đơn hàng trong mục "Đơn hàng của tôi" hoặc liên hệ hotline để được hỗ
                    trợ.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-muted/50">
            <h3 className="font-semibold text-lg mb-3">Lưu ý quan trọng</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Vui lòng kiểm tra kỹ sản phẩm trước khi nhận hàng</li>
              <li>• Từ chối nhận hàng nếu phát hiện bao bì bị rách, móp méo</li>
              <li>• Quay video khi mở hộp để làm bằng chứng nếu có vấn đề</li>
              <li>• Liên hệ ngay với chúng tôi nếu sản phẩm có vấn đề</li>
            </ul>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
