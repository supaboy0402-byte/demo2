import { Card, CardContent } from "@/components/ui/card"
import { Music, Award, Users, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-6">Về Harmony Music Store</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Chúng tôi là cửa hàng nhạc cụ chuyên nghiệp với hơn 10 năm kinh nghiệm, mang đến những sản phẩm chất lượng cao
          và dịch vụ tận tâm cho người yêu âm nhạc.
        </p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          {
            icon: Music,
            title: "Đam mê âm nhạc",
            description: "Chúng tôi yêu âm nhạc và muốn chia sẻ niềm đam mê này với mọi người",
          },
          {
            icon: Award,
            title: "Chất lượng hàng đầu",
            description: "Chỉ cung cấp những sản phẩm chính hãng từ các thương hiệu uy tín",
          },
          {
            icon: Users,
            title: "Tư vấn chuyên nghiệp",
            description: "Đội ngũ nhân viên giàu kinh nghiệm, sẵn sàng hỗ trợ bạn",
          },
          {
            icon: Heart,
            title: "Khách hàng là trung tâm",
            description: "Sự hài lòng của bạn là ưu tiên hàng đầu của chúng tôi",
          },
        ].map((value, index) => (
          <Card key={index}>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <value.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Story */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
          Câu chuyện của chúng tôi
        </h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            Harmony Music Store được thành lập vào năm 2014 với mục tiêu mang đến những nhạc cụ chất lượng cao cho cộng
            đồng yêu âm nhạc tại Việt Nam. Bắt đầu từ một cửa hàng nhỏ, chúng tôi đã không ngừng phát triển và mở rộng
            để phục vụ ngày càng nhiều khách hàng.
          </p>
          <p>
            Với đội ngũ nhân viên giàu kinh nghiệm và đam mê âm nhạc, chúng tôi không chỉ bán nhạc cụ mà còn là người
            bạn đồng hành trong hành trình âm nhạc của bạn. Chúng tôi cung cấp dịch vụ tư vấn chuyên nghiệp, giúp bạn
            tìm được nhạc cụ phù hợp nhất với nhu cầu và ngân sách.
          </p>
          <p>
            Hôm nay, Harmony Music Store tự hào là một trong những cửa hàng nhạc cụ uy tín nhất tại TP. Hồ Chí Minh, với
            hàng ngàn sản phẩm từ các thương hiệu hàng đầu thế giới như Yamaha, Fender, Roland, Pearl và nhiều thương
            hiệu khác.
          </p>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-muted rounded-2xl p-8 md:p-12 text-center">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
          Ghé thăm cửa hàng của chúng tôi
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Đến trực tiếp cửa hàng để trải nghiệm và thử các nhạc cụ. Đội ngũ của chúng tôi luôn sẵn sàng tư vấn và hỗ trợ
          bạn.
        </p>
        <div className="text-foreground space-y-2">
          <p className="font-semibold">Địa chỉ: 123 Đường Âm Nhạc, Quận 1, TP. Hồ Chí Minh</p>
          <p>Điện thoại: 0123 456 789</p>
          <p>Email: info@harmony.vn</p>
          <p>Giờ mở cửa: 9:00 - 21:00 (Thứ 2 - Chủ nhật)</p>
        </div>
      </div>
    </div>
  )
}
