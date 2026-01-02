export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  items: {
    productId: string
    productName: string
    price: number
    quantity: number
    image: string
  }[]
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentMethod: string
  paymentStatus: "pending" | "paid" | "failed"
  shippingAddress: {
    fullName: string
    phone: string
    address: string
    city: string
    district: string
    ward: string
  }
  createdAt: string
  updatedAt: string
}

export const orders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2024-001234",
    customerId: "user1",
    customerName: "Nguyễn Văn A",
    customerEmail: "nguyenvana@email.com",
    items: [
      {
        productId: "1",
        productName: "Yamaha FG800 Acoustic Guitar",
        price: 5500000,
        quantity: 1,
        image: "/yamaha-acoustic-guitar.jpg",
      },
    ],
    subtotal: 5500000,
    shipping: 100000,
    tax: 0,
    discount: 0,
    total: 5600000,
    status: "delivered",
    paymentMethod: "COD",
    paymentStatus: "paid",
    shippingAddress: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Đường ABC",
      city: "Hà Nội",
      district: "Quận Ba Đình",
      ward: "Phường Điện Biên",
    },
    createdAt: "2024-01-10T10:30:00",
    updatedAt: "2024-01-15T14:20:00",
  },
  {
    id: "2",
    orderNumber: "ORD-2024-001235",
    customerId: "user2",
    customerName: "Trần Thị B",
    customerEmail: "tranthib@email.com",
    items: [
      {
        productId: "2",
        productName: "Fender Player Stratocaster",
        price: 18500000,
        quantity: 1,
        image: "/fender-stratocaster-electric-guitar.jpg",
      },
    ],
    subtotal: 18500000,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 18500000,
    status: "processing",
    paymentMethod: "Bank Transfer",
    paymentStatus: "paid",
    shippingAddress: {
      fullName: "Trần Thị B",
      phone: "0912345678",
      address: "456 Đường XYZ",
      city: "TP. Hồ Chí Minh",
      district: "Quận 1",
      ward: "Phường Bến Nghé",
    },
    createdAt: "2024-01-15T09:15:00",
    updatedAt: "2024-01-15T10:00:00",
  },
  {
    id: "3",
    orderNumber: "ORD-2024-001102",
    customerId: "user3",
    customerName: "Lê Văn C",
    customerEmail: "levanc@email.com",
    items: [
      {
        productId: "3",
        productName: "Roland FP-30X Digital Piano",
        price: 15900000,
        quantity: 1,
        image: "/roland-digital-piano.jpg",
      },
      {
        productId: "6",
        productName: "Casio CDP-S110 Digital Piano",
        price: 8900000,
        quantity: 1,
        image: "/casio-digital-piano.jpg",
      },
    ],
    subtotal: 24800000,
    shipping: 0,
    tax: 0,
    discount: 500000,
    total: 24300000,
    status: "shipped",
    paymentMethod: "Credit Card",
    paymentStatus: "paid",
    shippingAddress: {
      fullName: "Lê Văn C",
      phone: "0923456789",
      address: "789 Đường DEF",
      city: "Đà Nẵng",
      district: "Quận Hải Châu",
      ward: "Phường Hải Châu 1",
    },
    createdAt: "2024-01-05T14:20:00",
    updatedAt: "2024-01-12T09:30:00",
  },
  {
    id: "4",
    orderNumber: "ORD-2024-001103",
    customerId: "user1",
    customerName: "Nguyễn Văn A",
    customerEmail: "nguyenvana@email.com",
    items: [
      {
        productId: "4",
        productName: "Pearl Export Series Drum Kit",
        price: 22000000,
        quantity: 1,
        image: "/pearl-drum-kit.jpg",
      },
    ],
    subtotal: 22000000,
    shipping: 200000,
    tax: 0,
    discount: 0,
    total: 22200000,
    status: "pending",
    paymentMethod: "COD",
    paymentStatus: "pending",
    shippingAddress: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Đường ABC",
      city: "Hà Nội",
      district: "Quận Ba Đình",
      ward: "Phường Điện Biên",
    },
    createdAt: "2024-01-18T11:45:00",
    updatedAt: "2024-01-18T11:45:00",
  },
  {
    id: "5",
    orderNumber: "ORD-2024-001189",
    customerId: "user4",
    customerName: "Phạm Thị D",
    customerEmail: "phamthid@email.com",
    items: [
      {
        productId: "5",
        productName: "Ibanez RG Series Electric Guitar",
        price: 12500000,
        quantity: 1,
        image: "/ibanez-electric-guitar.jpg",
      },
    ],
    subtotal: 12500000,
    shipping: 100000,
    tax: 0,
    discount: 0,
    total: 12600000,
    status: "delivered",
    paymentMethod: "Bank Transfer",
    paymentStatus: "paid",
    shippingAddress: {
      fullName: "Phạm Thị D",
      phone: "0934567890",
      address: "321 Đường GHI",
      city: "Cần Thơ",
      district: "Quận Ninh Kiều",
      ward: "Phường Tân An",
    },
    createdAt: "2024-01-08T15:30:00",
    updatedAt: "2024-01-14T10:15:00",
  },
]
