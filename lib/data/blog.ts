export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  image: string
  author: string
  authorAvatar: string
  category: string
  publishedAt: string
  readTime: string
  views: number
}

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Hướng dẫn chọn guitar acoustic cho người mới bắt đầu",
    slug: "huong-dan-chon-guitar-acoustic-cho-nguoi-moi-bat-dau",
    excerpt: "Những điều cần biết khi chọn mua cây guitar acoustic đầu tiên của bạn.",
    content: "Nội dung chi tiết về cách chọn guitar acoustic...",
    image: "/acoustic-guitar-beginner-guide.jpg",
    author: "Nguyễn Văn A",
    authorAvatar: "/diverse-avatars.png",
    category: "Hướng dẫn",
    publishedAt: "2024-01-15",
    readTime: "5 phút",
    views: 1234,
  },
  {
    id: "2",
    title: "Top 5 đàn piano điện tử tốt nhất năm 2024",
    slug: "top-5-dan-piano-dien-tu-tot-nhat-nam-2024",
    excerpt: "Đánh giá chi tiết các mẫu piano điện tử được yêu thích nhất hiện nay.",
    content: "Nội dung chi tiết về top piano điện tử...",
    image: "/digital-piano-review-2024.jpg",
    author: "Trần Thị B",
    authorAvatar: "/diverse-avatars.png",
    category: "Đánh giá",
    publishedAt: "2024-01-12",
    readTime: "8 phút",
    views: 2156,
  },
  {
    id: "3",
    title: "Cách bảo quản nhạc cụ đúng cách",
    slug: "cach-bao-quan-nhac-cu-dung-cach",
    excerpt: "Hướng dẫn chi tiết cách bảo quản và vệ sinh nhạc cụ để kéo dài tuổi thọ.",
    content: "Nội dung chi tiết về bảo quản nhạc cụ...",
    image: "/musical-instrument-care-maintenance.jpg",
    author: "Lê Văn C",
    authorAvatar: "/diverse-avatars.png",
    category: "Bảo quản",
    publishedAt: "2024-01-10",
    readTime: "6 phút",
    views: 987,
  },
]
