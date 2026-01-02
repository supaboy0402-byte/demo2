export interface User {
  id: string
  email: string
  name: string
  phone: string
  avatar: string
  role: "customer" | "staff" | "admin"
  status: "active" | "inactive"
  createdAt: string
  totalOrders: number
  totalSpent: number
}

export const users: User[] = [
  {
    id: "user1",
    email: "nguyenvana@email.com",
    name: "Nguyễn Văn A",
    phone: "0901234567",
    avatar: "/male-avatar.png",
    role: "customer",
    status: "active",
    createdAt: "2023-06-15",
    totalOrders: 5,
    totalSpent: 25000000,
  },
  {
    id: "user2",
    email: "tranthib@email.com",
    name: "Trần Thị B",
    phone: "0912345678",
    avatar: "/female-avatar.png",
    role: "customer",
    status: "active",
    createdAt: "2023-08-20",
    totalOrders: 3,
    totalSpent: 18500000,
  },
  {
    id: "admin1",
    email: "admin@harmony.com",
    name: "Admin Harmony",
    phone: "0900000000",
    avatar: "/admin-avatar.png",
    role: "admin",
    status: "active",
    createdAt: "2023-01-01",
    totalOrders: 0,
    totalSpent: 0,
  },
]
