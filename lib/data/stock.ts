export interface StockMovement {
  id: string
  movementType: "IN" | "OUT" | "ADJUST"
  productId: string
  productName: string
  quantity: number
  referenceType: string
  referenceCode: string
  note?: string
  createdBy: string
  createdAt: string
}

export interface StockSummary {
  productId: string
  productName: string
  sku: string
  currentStock: number
  minStock: number
  maxStock: number
  lastMovement: string
}

export const stockMovements: StockMovement[] = [
  {
    id: "1",
    movementType: "IN",
    productId: "1",
    productName: "Yamaha F310 Acoustic Guitar",
    quantity: 10,
    referenceType: "InitialStock",
    referenceCode: "INIT-001",
    note: "Nhập hàng ban đầu",
    createdBy: "Nhân Viên Kho",
    createdAt: "2025-01-01",
  },
  {
    id: "2",
    movementType: "OUT",
    productId: "1",
    productName: "Yamaha F310 Acoustic Guitar",
    quantity: 1,
    referenceType: "Order",
    referenceCode: "ORD-2024-001189",
    note: "Bán hàng",
    createdBy: "Hệ thống",
    createdAt: "2025-01-15",
  },
  {
    id: "3",
    movementType: "IN",
    productId: "1",
    productName: "Yamaha F310 Acoustic Guitar",
    quantity: 5,
    referenceType: "Purchase",
    referenceCode: "PO-2025-001",
    note: "Nhập hàng từ nhà cung cấp",
    createdBy: "Nhân Viên Kho",
    createdAt: "2025-01-20",
  },
  {
    id: "4",
    movementType: "IN",
    productId: "2",
    productName: "Roland GO:KEYS 61",
    quantity: 5,
    referenceType: "InitialStock",
    referenceCode: "INIT-001",
    note: "Nhập hàng ban đầu",
    createdBy: "Nhân Viên Kho",
    createdAt: "2025-01-01",
  },
  {
    id: "5",
    movementType: "OUT",
    productId: "2",
    productName: "Roland GO:KEYS 61",
    quantity: 1,
    referenceType: "Order",
    referenceCode: "ORD-2024-001234",
    note: "Bán hàng",
    createdBy: "Hệ thống",
    createdAt: "2025-01-18",
  },
  {
    id: "6",
    movementType: "ADJUST",
    productId: "2",
    productName: "Roland GO:KEYS 61",
    quantity: -1,
    referenceType: "Damage",
    referenceCode: "DMG-2025-001",
    note: "Hàng bị hỏng trong kho",
    createdBy: "Nhân Viên Kho",
    createdAt: "2025-01-22",
  },
]

export const stockSummary: StockSummary[] = [
  {
    productId: "1",
    productName: "Yamaha F310 Acoustic Guitar",
    sku: "YAM-F310",
    currentStock: 14,
    minStock: 5,
    maxStock: 20,
    lastMovement: "2025-01-20",
  },
  {
    productId: "2",
    productName: "Roland GO:KEYS 61",
    sku: "ROL-GO61",
    currentStock: 3,
    minStock: 3,
    maxStock: 10,
    lastMovement: "2025-01-22",
  },
  {
    productId: "3",
    productName: "Casio CDP-S110 Digital Piano",
    sku: "CAS-CDP110",
    currentStock: 2,
    minStock: 2,
    maxStock: 8,
    lastMovement: "2025-01-10",
  },
]
