package com.sfmc.notificationservice.model;

public enum NotificationType {
    ORDER_CREATED,
    ORDER_VALIDATED,
    ORDER_SHIPPED,
    ORDER_DELIVERED,
    ORDER_CANCELLED,
    STOCK_LOW,
    STOCK_UPDATED,
    PRODUCTION_STARTED,
    PRODUCTION_COMPLETED,
    INVOICE_GENERATED,
    INVOICE_PAID,
    SYSTEM
}
