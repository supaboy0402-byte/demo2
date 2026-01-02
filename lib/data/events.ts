export interface Event {
  id: string
  title: string
  slug: string
  description: string
  image: string
  date: string
  time: string
  location: string
  price: number
  capacity: number
  registered: number
  category: string
  status: "upcoming" | "ongoing" | "completed"
}

export const events: Event[] = [
  {
    id: "1",
    title: "Workshop: Kỹ thuật chơi guitar nâng cao",
    slug: "workshop-ky-thuat-choi-guitar-nang-cao",
    description: "Học các kỹ thuật chơi guitar nâng cao từ các nghệ sĩ chuyên nghiệp.",
    image: "/guitar-workshop.jpg",
    date: "2024-02-15",
    time: "14:00 - 17:00",
    location: "Harmony Music Store - Hà Nội",
    price: 500000,
    capacity: 30,
    registered: 18,
    category: "Workshop",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Buổi biểu diễn piano cổ điển",
    slug: "buoi-bieu-dien-piano-co-dien",
    description: "Thưởng thức những tác phẩm piano cổ điển nổi tiếng.",
    image: "/piano-concert.jpg",
    date: "2024-02-20",
    time: "19:00 - 21:00",
    location: "Nhà hát Lớn Hà Nội",
    price: 200000,
    capacity: 200,
    registered: 156,
    category: "Biểu diễn",
    status: "upcoming",
  },
  {
    id: "3",
    title: "Hội chợ nhạc cụ 2024",
    slug: "hoi-cho-nhac-cu-2024",
    description: "Triển lãm và giới thiệu các nhạc cụ mới nhất từ các thương hiệu hàng đầu.",
    image: "/music-instrument-fair.jpg",
    date: "2024-03-01",
    time: "09:00 - 18:00",
    location: "Trung tâm Hội nghị Quốc gia",
    price: 0,
    capacity: 1000,
    registered: 432,
    category: "Triển lãm",
    status: "upcoming",
  },
]
