export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  image: string
  images: string[]
  category: string
  brand: string
  stock: number
  isFeatured: boolean
  isNew: boolean
  specifications: Record<string, string>
  rating: number
  reviewCount: number
}

export const products: Product[] = [
  {
    id: "1",
    name: "Yamaha FG800 Acoustic Guitar",
    slug: "yamaha-fg800-acoustic-guitar",
    description:
      "Guitar acoustic chất lượng cao với âm thanh ấm áp và cân bằng. Phù hợp cho người mới bắt đầu và trung cấp.",
    price: 5500000,
    originalPrice: 6500000,
    image: "/yamaha-acoustic-guitar.jpg",
    images: ["/yamaha-acoustic-guitar.jpg", "/yamaha-acoustic-guitar-front.jpg"],
    category: "Guitar",
    brand: "Yamaha",
    stock: 15,
    isFeatured: true,
    isNew: false,
    specifications: {
      Loại: "Acoustic",
      "Chất liệu mặt": "Solid Spruce",
      "Chất liệu lưng/hông": "Nato/Okume",
      "Cần đàn": "Nato",
      "Số phím": "20",
    },
    rating: 4.8,
    reviewCount: 124,
  },
  {
    id: "2",
    name: "Fender Player Stratocaster",
    slug: "fender-player-stratocaster",
    description:
      "Guitar điện huyền thoại với âm thanh đa dạng và thiết kế iconic. Lựa chọn hoàn hảo cho mọi thể loại nhạc.",
    price: 18500000,
    image: "/fender-stratocaster-electric-guitar.jpg",
    images: ["/fender-stratocaster-electric-guitar.jpg"],
    category: "Guitar",
    brand: "Fender",
    stock: 8,
    isFeatured: true,
    isNew: true,
    specifications: {
      Loại: "Electric",
      Pickup: "3 Single-Coil",
      "Cần đàn": "Maple",
      "Số phím": "22",
      Tremolo: "2-Point Synchronized",
    },
    rating: 4.9,
    reviewCount: 89,
  },
  {
    id: "3",
    name: "Roland FP-30X Digital Piano",
    slug: "roland-fp-30x-digital-piano",
    description:
      "Đàn piano điện tử cao cấp với âm thanh chân thực và bàn phím cảm ứng tốt. Thiết kế nhỏ gọn, dễ di chuyển.",
    price: 15900000,
    originalPrice: 17900000,
    image: "/roland-digital-piano.jpg",
    images: ["/roland-digital-piano.jpg"],
    category: "Piano",
    brand: "Roland",
    stock: 12,
    isFeatured: false,
    isNew: true,
    specifications: {
      Loại: "Digital Piano",
      "Số phím": "88",
      "Bàn phím": "PHA-4 Standard",
      "Âm thanh": "SuperNATURAL Piano",
      Loa: "2 x 11W",
    },
    rating: 4.7,
    reviewCount: 67,
  },
  {
    id: "4",
    name: "Pearl Export Series Drum Kit",
    slug: "pearl-export-drum-kit",
    description: "Bộ trống acoustic chuyên nghiệp với âm thanh mạnh mẽ và độ bền cao. Bao gồm đầy đủ phụ kiện.",
    price: 22000000,
    image: "/pearl-drum-kit.jpg",
    images: ["/pearl-drum-kit.jpg"],
    category: "Drum",
    brand: "Pearl",
    stock: 5,
    isFeatured: true,
    isNew: false,
    specifications: {
      Loại: "Acoustic Drum Kit",
      "Cấu hình": "5-Piece",
      "Chất liệu": "Poplar/Asian Mahogany",
      "Bass Drum": '22"',
      Snare: '14"',
    },
    rating: 4.6,
    reviewCount: 45,
  },
  {
    id: "5",
    name: "Ibanez RG Series Electric Guitar",
    slug: "ibanez-rg-electric-guitar",
    description: "Guitar điện thiết kế hiện đại với âm thanh sắc nét. Lý tưởng cho rock và metal.",
    price: 12500000,
    image: "/ibanez-electric-guitar.jpg",
    images: ["/ibanez-electric-guitar.jpg"],
    category: "Guitar",
    brand: "Ibanez",
    stock: 10,
    isFeatured: false,
    isNew: false,
    specifications: {
      Loại: "Electric",
      Pickup: "HSH Configuration",
      "Cần đàn": "Wizard III Maple",
      "Số phím": "24",
      Bridge: "Edge-Zero II Tremolo",
    },
    rating: 4.5,
    reviewCount: 78,
  },
  {
    id: "6",
    name: "Casio CDP-S110 Digital Piano",
    slug: "casio-cdp-s110-digital-piano",
    description: "Đàn piano điện tử nhỏ gọn với giá cả phải chăng. Phù hợp cho người mới học và không gian nhỏ.",
    price: 8900000,
    originalPrice: 10500000,
    image: "/casio-digital-piano.jpg",
    images: ["/casio-digital-piano.jpg"],
    category: "Piano",
    brand: "Casio",
    stock: 20,
    isFeatured: false,
    isNew: false,
    specifications: {
      Loại: "Digital Piano",
      "Số phím": "88",
      "Bàn phím": "Scaled Hammer Action",
      "Âm thanh": "AiR Sound Source",
      Loa: "2 x 8W",
    },
    rating: 4.4,
    reviewCount: 156,
  },
  {
    id: "7",
    name: "Taylor 214ce Acoustic Guitar",
    slug: "taylor-214ce-acoustic-guitar",
    description: "Guitar acoustic-electric cao cấp với âm thanh trong trẻo và thiết kế đẹp mắt.",
    price: 24500000,
    image: "/taylor-acoustic-guitar.jpg",
    images: ["/taylor-acoustic-guitar.jpg"],
    category: "Guitar",
    brand: "Taylor",
    stock: 6,
    isFeatured: true,
    isNew: true,
    specifications: {
      Loại: "Acoustic-Electric",
      "Chất liệu mặt": "Solid Sitka Spruce",
      "Chất liệu lưng/hông": "Layered Rosewood",
      Electronics: "ES2",
      "Số phím": "20",
    },
    rating: 4.9,
    reviewCount: 52,
  },
  {
    id: "8",
    name: "Yamaha P-125 Digital Piano",
    slug: "yamaha-p125-digital-piano",
    description: "Đàn piano điện tử phổ biến với âm thanh chất lượng và tính năng đa dạng.",
    price: 16500000,
    image: "/yamaha-p125-digital-piano.jpg",
    images: ["/yamaha-p125-digital-piano.jpg"],
    category: "Piano",
    brand: "Yamaha",
    stock: 14,
    isFeatured: true,
    isNew: false,
    specifications: {
      Loại: "Digital Piano",
      "Số phím": "88",
      "Bàn phím": "GHS (Graded Hammer Standard)",
      "Âm thanh": "Pure CF Sound Engine",
      Loa: "2 x 7W",
    },
    rating: 4.8,
    reviewCount: 203,
  },
]

export const categories = [
  { id: "guitar", name: "Guitar", slug: "guitar", description: "Acoustic, Electric, Classical" },
  { id: "piano", name: "Piano & Keyboard", slug: "piano", description: "Grand Piano, Digital Piano, Keyboard" },
  { id: "drum", name: "Drum & Percussion", slug: "drum", description: "Acoustic Drum, Electronic Drum, Percussion" },
  { id: "accessories", name: "Phụ kiện", slug: "accessories", description: "Dây đàn, Pick, Bao đựng, Chân đế" },
]

export const brands = ["Yamaha", "Fender", "Roland", "Pearl", "Ibanez", "Casio", "Taylor", "Gibson", "Korg"]
