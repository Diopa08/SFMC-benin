package com.sfmc.billingservice.dto;


public class OrderItemEvent {

    private Long productId;
    private String productName;
    private int quantity;
    private Double unitPrice;

    // ✅ Constructeur vide obligatoire pour Jackson
    public OrderItemEvent() {}

    public OrderItemEvent(Long productId, String productName,
                          int quantity, Double unitPrice) {
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) {
        this.productName = productName;
    }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }
}