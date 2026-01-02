export interface Promotion {
  id: string
  title: string
  slug: string
  description: string
  image: string
  discount: number
  discountType: "percentage" | "fixed"
  code: string
  startDate: string
  endDate: string
  minPurchase?: number
  maxDiscount?: number
  status: "active" | "upcoming" | "expired"
}

export const promotions: Promotion[] = [
  {
    id: "1",
    title: "Giảm giá 20% toàn bộ Guitar",
    slug: "giam-gia-20-toan-bo-guitar",
    description: "Áp dụng cho tất cả các dòng guitar acoustic và electric. Số lượng có hạn!",
    image: "/guitar-sale-promotion.jpg",
    discount: 20,
    discountType: "percentage",
    code: "GUITAR20",
    startDate: "2024-01-15",
    endDate: "2024-02-15",
    minPurchase: 5000000,
    status: "active",
  },
  {
    id: "2",
    title: "Mua Piano tặng phụ kiện",
    slug: "mua-piano-tang-phu-kien",
    description: "Mua đàn piano điện tử tặng ngay bộ phụ kiện trị giá 2 triệu đồng.",
    image: "/piano-promotion-gift.jpg",
    discount: 2000000,
    discountType: "fixed",
    code: "PIANO2024",
    startDate: "2024-01-20",
    endDate: "2024-02-28",
    minPurchase: 10000000,
    status: "active",
  },
  {
    id: "3",
    title: "Flash Sale cuối tuần",
    slug: "flash-sale-cuoi-tuan",
    description: "Giảm đến 30% cho các sản phẩm được chọn. Chỉ trong 3 ngày!",
    image: "/flash-sale-music.jpg",
    discount: 30,
    discountType: "percentage",
    code: "FLASH30",
    startDate: "2024-02-10",
    endDate: "2024-02-12",
    maxDiscount: 5000000,
    status: "upcoming",
  },
]
