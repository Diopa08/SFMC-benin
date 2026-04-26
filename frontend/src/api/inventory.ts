import client from './client'
import type { Stock, StockMovement, StockRequest } from '../types'

export const getStocks = () =>
  client.get<Stock[]>('/inventory').then(r => r.data)

export const getCriticalStocks = () =>
  client.get<Stock[]>('/inventory/critical').then(r => r.data)

export const getMovements = (productId: number) =>
  client.get<StockMovement[]>(`/inventory/${productId}/movements`).then(r => r.data)

/** Créer une nouvelle ligne de stock (produit + entrepôt + quantité initiale + seuil) */
export const createStock = (data: StockRequest) =>
  client.post<Stock>('/inventory', data).then(r => r.data)

/** Ajouter/retirer du stock sur une ligne existante */
export const updateStock = (productId: number, data: { quantity: number; reason: string; type: 'IN' | 'OUT' }) => {
  const qty = data.type === 'OUT' ? -data.quantity : data.quantity
  return client.post<Stock>(
    `/inventory/${productId}/add`,
    null,
    { params: { quantity: qty, reason: data.reason } }
  ).then(r => r.data)
}

export const addStock = (productId: number, quantity: number, reason: string) =>
  client.post<Stock>(`/inventory/${productId}/add`, null, { params: { quantity, reason } }).then(r => r.data)

export const checkAvailability = (productId: number, quantity: number) =>
  client.get<boolean>(`/inventory/check/${productId}`, { params: { quantity } }).then(r => r.data)
