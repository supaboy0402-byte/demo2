import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-8">Chính sách bảo mật</h1>

          <div className="prose prose-neutral max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">1. Thu thập thông tin</h2>
              <p className="text-muted-foreground">
                Chúng tôi thu thập thông tin cá nhân của bạn khi bạn đăng ký tài khoản, đặt hàng, hoặc liên hệ với chúng
                tôi. Thông tin có thể bao gồm: họ tên, địa chỉ email, số điện thoại, địa chỉ giao hàng, và thông tin
                thanh toán.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">2. Sử dụng thông tin</h2>
              <p className="text-muted-foreground mb-3">Thông tin của bạn được sử dụng để:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Xử lý và giao hàng đơn hàng của bạn</li>
                <li>Gửi thông báo về đơn hàng và cập nhật sản phẩm</li>
                <li>Cải thiện dịch vụ khách hàng</li>
                <li>Gửi email marketing (nếu bạn đồng ý)</li>
                <li>Phân tích và cải thiện website</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">3. Bảo mật thông tin</h2>
              <p className="text-muted-foreground">
                Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Chúng tôi sử dụng các biện pháp bảo mật tiêu chuẩn
                ngành để bảo vệ dữ liệu khỏi truy cập trái phép, thay đổi, tiết lộ hoặc phá hủy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">4. Chia sẻ thông tin</h2>
              <p className="text-muted-foreground">
                Chúng tôi không bán, trao đổi hoặc chuyển giao thông tin cá nhân của bạn cho bên thứ ba, trừ khi cần
                thiết để cung cấp dịch vụ (như đơn vị vận chuyển) hoặc theo yêu cầu của pháp luật.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">5. Cookie</h2>
              <p className="text-muted-foreground">
                Website của chúng tôi sử dụng cookie để cải thiện trải nghiệm người dùng. Bạn có thể chọn tắt cookie
                trong trình duyệt, nhưng điều này có thể ảnh hưởng đến một số chức năng của website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">6. Quyền của bạn</h2>
              <p className="text-muted-foreground mb-3">Bạn có quyền:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Truy cập và cập nhật thông tin cá nhân</li>
                <li>Yêu cầu xóa thông tin cá nhân</li>
                <li>Từ chối nhận email marketing</li>
                <li>Khiếu nại về việc xử lý dữ liệu</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">7. Liên hệ</h2>
              <p className="text-muted-foreground">
                Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật này, vui lòng liên hệ với chúng tôi qua email:
                privacy@harmonymusic.vn hoặc hotline: 1900-xxxx.
              </p>
            </section>

            <section>
              <p className="text-sm text-muted-foreground italic">
                Chính sách này có hiệu lực từ ngày 01/01/2024 và có thể được cập nhật theo thời gian.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
