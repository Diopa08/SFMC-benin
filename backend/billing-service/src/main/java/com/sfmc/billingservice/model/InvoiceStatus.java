package com.sfmc.billingservice.model;

public enum InvoiceStatus {
    UNPAID,
    PARTIAL,
    PENDING_PAYMENT,   // Paiement déclaré par le client, en attente de confirmation admin
    PAID,
    OVERDUE,
    CANCELLED
}
