import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-8">Điều khoản sử dụng</h1>

          <div className="prose prose-neutral max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">1. Chấp nhận điều khoản</h2>
              <p className="text-muted-foreground">
                Bằng việc truy cập và sử dụng website Harmony Music Store, bạn đồng ý tuân thủ các điều khoản và điều
                kiện sử dụng được nêu dưới đây. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng không sử dụng
                website của chúng tôi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">2. Tài khoản người dùng</h2>
              <p className="text-muted-foreground mb-3">Khi tạo tài khoản, bạn cam kết:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Cung cấp thông tin chính xác và đầy đủ</li>
                <li>Bảo mật thông tin đăng nhập của bạn</li>
                <li>Chịu trách nhiệm về mọi hoạt động dưới tài khoản của bạn</li>
                <li>Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">3. Đặt hàng và thanh toán</h2>
              <p className="text-muted-foreground">
                Khi đặt hàng, bạn xác nhận rằng bạn có đủ quyền pháp lý để thực hiện giao dịch. Chúng tôi có quyền từ
                chối hoặc hủy đơn hàng nếu phát hiện thông tin không chính xác hoặc gian lận. Giá cả và tình trạng sản
                phẩm có thể thay đổi mà không cần thông báo trước.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">4. Sở hữu trí tuệ</h2>
              <p className="text-muted-foreground">
                Tất cả nội dung trên website bao gồm văn bản, hình ảnh, logo, và thiết kế đều thuộc quyền sở hữu của
                Harmony Music Store. Bạn không được sao chép, phân phối, hoặc sử dụng nội dung này cho mục đích thương
                mại mà không có sự cho phép bằng văn bản.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">5. Hành vi cấm</h2>
              <p className="text-muted-foreground mb-3">Bạn không được:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Sử dụng website cho mục đích bất hợp pháp</li>
                <li>Gửi spam hoặc nội dung độc hại</li>
                <li>Can thiệp vào hoạt động của website</li>
                <li>Thu thập thông tin người dùng khác</li>
                <li>Giả mạo danh tính hoặc nguồn gốc</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">6. Giới hạn trách nhiệm</h2>
              <p className="text-muted-foreground">
                Chúng tôi không chịu trách nhiệm về bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên, hoặc hậu quả phát
                sinh từ việc sử dụng hoặc không thể sử dụng website. Sản phẩm được cung cấp "nguyên trạng" và chúng tôi
                không đảm bảo rằng website sẽ hoạt động liên tục hoặc không có lỗi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">7. Thay đổi điều khoản</h2>
              <p className="text-muted-foreground">
                Chúng tôi có quyền thay đổi các điều khoản này bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được
                đăng tải trên website. Việc bạn tiếp tục sử dụng website sau khi có thay đổi đồng nghĩa với việc bạn
                chấp nhận các điều khoản mới.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">8. Luật áp dụng</h2>
              <p className="text-muted-foreground">
                Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết
                tại tòa án có thẩm quyền tại Việt Nam.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold mb-4">9. Liên hệ</h2>
              <p className="text-muted-foreground">
                Nếu bạn có câu hỏi về các điều khoản này, vui lòng liên hệ: support@harmonymusic.vn hoặc hotline:
                1900-xxxx.
              </p>
            </section>

            <section>
              <p className="text-sm text-muted-foreground italic">Điều khoản này có hiệu lực từ ngày 01/01/2024.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
