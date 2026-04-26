import api from './client'

export type ProductionStatus = 'PLANNED' | 'IN_PROGRESS' | 'QUALITY_CHECK' | 'COMPLETED' | 'CANCELLED'

export interface ProductionOrder {
  id: number
  referenceNumber: string
  productId: number
  productName: string
  quantityRequired: number
  quantityProduced: number
  status: ProductionStatus
  priority: string
  plannedStartDate?: string
  actualStartDate?: string
  completedDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateProductionRequest {
  productId: number
  productName: string
  quantityRequired: number
  priority?: string
}

export const getProductionOrders = () =>
  api.get<ProductionOrder[]>('/production').then(r => r.data)

export const createProductionOrder = (data: CreateProductionRequest) =>
  api.post<ProductionOrder>('/production', data).then(r => r.data)

export const startProduction = (id: number) =>
  api.put<ProductionOrder>(`/production/${id}/start`).then(r => r.data)

export const qualityCheck = (id: number) =>
  api.put<ProductionOrder>(`/production/${id}/quality-check`).then(r => r.data)

export const completeProduction = (id: number, quantityProduced?: number) =>
  api.put<ProductionOrder>(`/production/${id}/complete`, null, {
    params: { quantityProduced }
  }).then(r => r.data)

export const cancelProduction = (id: number) =>
  api.put<ProductionOrder>(`/production/${id}/cancel`).then(r => r.data)
