export interface WarrantyTicket {
  id: string
  warrantyCode: string
  orderCode: string
  productId: string
  productName: string
  customerName: string
  customerEmail: string
  issueDescription: string
  diagnosis?: string
  status: "Pending" | "In Progress" | "Completed" | "Rejected"
  isUnderWarranty: boolean
  extraCost?: number
  estimatedReturnDate?: string
  completedDate?: string
  createdAt: string
  staffHandledBy?: string
}

export const warrantyTickets: WarrantyTicket[] = [
  {
    id: "1",
    warrantyCode: "BH2025-0001",
    orderCode: "ORD-2024-001189",
    productId: "1",
    productName: "Yamaha F310 Acoustic Guitar",
    customerName: "Nguyễn Văn A",
    customerEmail: "customer@shop.test",
    issueDescription: "Máy phát tiếng rè sau 2 ngày sử dụng",
    diagnosis: "Dây đàn bị lỏng, cần căng lại",
    status: "Completed",
    isUnderWarranty: true,
    extraCost: 0,
    estimatedReturnDate: "2025-01-25",
    completedDate: "2025-01-23",
    createdAt: "2025-01-20",
    staffHandledBy: "Nhân Viên Kho",
  },
  {
    id: "2",
    warrantyCode: "BH2025-0002",
    orderCode: "ORD-2024-001234",
    productId: "2",
    productName: "Roland GO:KEYS 61",
    customerName: "Trần Thị B",
    customerEmail: "customer2@shop.test",
    issueDescription: "Phím số 5 không phản ứng",
    diagnosis: undefined,
    status: "In Progress",
    isUnderWarranty: true,
    extraCost: 0,
    estimatedReturnDate: "2025-01-28",
    createdAt: "2025-01-22",
    staffHandledBy: "Nhân Viên Kho",
  },
  {
    id: "3",
    warrantyCode: "BH2025-0003",
    orderCode: "ORD-2024-001102",
    productId: "3",
    productName: "Casio CDP-S110 Digital Piano",
    customerName: "Lê Văn C",
    customerEmail: "customer3@shop.test",
    issueDescription: "Loa không phát âm thanh",
    diagnosis: undefined,
    status: "Pending",
    isUnderWarranty: true,
    extraCost: 0,
    estimatedReturnDate: "2025-01-30",
    createdAt: "2025-01-23",
  },
]

export const warrantyPolicies = {
  duration: "12 tháng",
  coverage: ["Lỗi kỹ thuật do nhà sản xuất", "Hư hỏng linh kiện điện tử", "Lỗi âm thanh và hiệu suất"],
  notCovered: [
    "Hư hỏng do va đập hoặc rơi",
    "Hư hỏng do nước hoặc ẩm ướt",
    "Hư hỏng do sử dụng không đúng cách",
    "Hư hỏng do bảo dưỡng không đúng",
  ],
  process: [
    "Liên hệ cửa hàng với mã đơn hàng",
    "Mô tả chi tiết vấn đề gặp phải",
    "Nhân viên sẽ tạo phiếu bảo hành",
    "Gửi sản phẩm đến trung tâm bảo hành",
    "Nhận sản phẩm sau khi sửa chữa",
  ],
}
