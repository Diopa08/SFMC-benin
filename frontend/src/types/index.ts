// ─── Auth ─────────────────────────────────────────────
export interface LoginRequest { email: string; password: string }
export interface LoginResponse { token: string }

// ─── Product ──────────────────────────────────────────
export interface Product {
  id: number
  name: string
  description: string
  category: string
  unitPrice: number
  unit: string
}
export interface ProductRequest {
  name: string
  description: string
  category: string
  unitPrice: number
  unit: string
}

// ─── Stock / Inventory ────────────────────────────────
export interface Stock {
  id: number
  productId: number
  warehouseId: number
  quantity: number
  threshold: number
}
export interface StockRequest {
  productId: number
  warehouseId: number
  quantity: number
  threshold: number
}
export interface StockUpdateRequest {
  quantity: number
  reason: string
  type: 'IN' | 'OUT'
}
export interface StockCheckResponse {
  available: boolean
  currentQuantity: number
  requestedQuantity: number
}
export interface StockMovement {
  id: number
  stockId: number
  type: 'IN' | 'OUT'
  quantity: number
  reason: string
  date: string
}

// ─── Order ────────────────────────────────────────────
export type OrderStatus = 'PENDING' | 'VALIDATED' | 'IN_PRODUCTION' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export interface OrderItem {
  id?: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal?: number
}
export interface Order {
  id: number
  orderNumber: string
  clientId: number
  clientEmail?: string
  clientName?: string
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  shippingAddress: string
  notes?: string
  createdAt: string
  updatedAt: string
}
export interface CreateOrderRequest {
  clientId?: number
  clientEmail?: string
  shippingAddress: string
  notes?: string
  items: Omit<OrderItem, 'id' | 'subtotal'>[]
}

// ─── Delivery ─────────────────────────────────────────
export type DeliveryStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED'

export interface Delivery {
  id: number
  deliveryNumber: string
  orderId: number
  orderNumber: string
  status: DeliveryStatus
  deliveryAddress: string
  deliveryAgent?: string
  scheduledDate?: string
  deliveredDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateDeliveryRequest {
  orderId: number
  deliveryAddress: string
  deliveryAgent?: string
  scheduledDate?: string
  notes?: string
}

// ─── Invoice / Billing ────────────────────────────────
export type InvoiceStatus = 'UNPAID' | 'PAID' | 'PARTIAL' | 'PENDING_PAYMENT' | 'OVERDUE' | 'CANCELLED'
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_MONEY'

export interface Invoice {
  id: number
  invoiceNumber: string
  orderId: number
  orderNumber: string
  clientId: number
  clientEmail?: string
  totalAmount: number
  netAmount: number
  taxAmount: number
  status: InvoiceStatus
  paymentMethod?: PaymentMethod
  paymentReference?: string
  dueDate?: string
  paidAt?: string
  notes?: string
  createdAt: string
  updatedAt?: string
}
export interface RecordPaymentRequest {
  amountPaid: number
  paymentMethod: PaymentMethod
  notes?: string
}
export interface DeclarePaymentRequest {
  amountDeclared: number
  paymentMethod: PaymentMethod
  reference?: string
  notes?: string
}

// ─── API Generic ──────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
