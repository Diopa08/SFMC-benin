package com.sfmc.inventory_service.dto;


public record StockUpdatedEvent(
    Long productId,
    int quantityChanged,
    String type,        // "IN" ou "OUT"
    int newQuantity,
    String timestamp
) {}