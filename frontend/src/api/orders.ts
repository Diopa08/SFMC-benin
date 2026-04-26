import client from './client'
import type { Order, CreateOrderRequest, ApiResponse, Delivery, CreateDeliveryRequest } from '../types'

// Retourne toutes les commandes (ADMIN/OPERATOR) ou les siennes (USER — filtrage côté backend)
export const getOrders = () => client.get<ApiResponse<Order[]>>('/orders').then(r => r.data.data)

// Retourne uniquement les commandes de l'utilisateur connecté
export const getMyOrders = () => client.get<ApiResponse<Order[]>>('/orders/my').then(r => r.data.data)

export const getOrder = (id: number) => client.get<ApiResponse<Order>>(`/orders/${id}`).then(r => r.data.data)
export const getOrdersByClient = (clientId: number) => client.get<ApiResponse<Order[]>>(`/orders/client/${clientId}`).then(r => r.data.data)
export const createOrder = (data: CreateOrderRequest) => client.post<ApiResponse<Order>>('/orders', data).then(r => r.data.data)
export const validateOrder = (id: number) => client.put<ApiResponse<Order>>(`/orders/${id}/validate`).then(r => r.data.data)
export const updateOrderStatus = (id: number, newStatus: string, reason?: string) =>
  client.put<ApiResponse<Order>>(`/orders/${id}/status`, { newStatus, reason }).then(r => r.data.data)
export const cancelOrder = (id: number, reason: string) =>
  client.delete<ApiResponse<Order>>(`/orders/${id}/cancel`, { params: { reason } }).then(r => r.data.data)

// ── Livraisons ────────────────────────────────────────────────────────────────
export const getAllDeliveries = () => client.get<ApiResponse<Delivery[]>>('/deliveries').then(r => r.data.data)
export const getDeliveryByOrder = (orderId: number) => client.get<ApiResponse<Delivery>>(`/deliveries/order/${orderId}`).then(r => r.data.data)
export const createDelivery = (data: CreateDeliveryRequest) => client.post<ApiResponse<Delivery>>('/deliveries', data).then(r => r.data.data)
export const startDeliveryTransit = (id: number) => client.put<ApiResponse<Delivery>>(`/deliveries/${id}/start`).then(r => r.data.data)
export const confirmDelivery = (id: number) => client.put<ApiResponse<Delivery>>(`/deliveries/${id}/confirm`).then(r => r.data.data)
