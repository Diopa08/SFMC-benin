import client from './client'
import type { Invoice, RecordPaymentRequest, DeclarePaymentRequest } from '../types'

export const getInvoices = () =>
  client.get<Invoice[]>('/invoices').then(r => r.data)

export const getMyInvoices = () =>
  client.get<Invoice[]>('/invoices/my').then(r => r.data)

export const getInvoice = (id: number) =>
  client.get<Invoice>(`/invoices/${id}`).then(r => r.data)

export const getInvoiceByOrder = (orderId: number) =>
  client.get<Invoice>(`/invoices/order/${orderId}`).then(r => r.data)

export const getInvoicesByClient = (clientId: number) =>
  client.get<Invoice[]>(`/invoices/client/${clientId}`).then(r => r.data)

export const recordPayment = (id: number, data: RecordPaymentRequest) =>
  client.post<Invoice>(`/invoices/${id}/pay`, data).then(r => r.data)

export const declarePayment = (id: number, data: DeclarePaymentRequest) =>
  client.post<Invoice>(`/invoices/${id}/declare-payment`, data).then(r => r.data)

export const confirmPayment = (id: number) =>
  client.post<Invoice>(`/invoices/${id}/confirm-payment`).then(r => r.data)

export const cancelInvoice = (id: number) =>
  client.delete<Invoice>(`/invoices/${id}/cancel`).then(r => r.data)

export const verifyFedapayPayment = (id: number, transactionId: string) =>
  client.post<Invoice>(`/invoices/${id}/verify-fedapay`, { transactionId }).then(r => r.data)
