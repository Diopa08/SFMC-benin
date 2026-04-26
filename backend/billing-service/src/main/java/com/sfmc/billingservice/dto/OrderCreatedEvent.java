package com.sfmc.billingservice.dto;


import java.util.List;

public class OrderCreatedEvent {

    private Long orderId;
    private Long clientId;
    private List<OrderItemEvent> items;
    private Double totalAmount;
    private String email;
    private String timestamp;

    // ✅ Constructeur vide obligatoire pour Jackson
    public OrderCreatedEvent() {}

    public OrderCreatedEvent(Long orderId, Long clientId,
                              List<OrderItemEvent> items,
                              Double totalAmount, String email,
                              String timestamp) {
        this.orderId = orderId;
        this.clientId = clientId;
        this.items = items;
        this.totalAmount = totalAmount;
        this.email = email;
        this.timestamp = timestamp;
    }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public List<OrderItemEvent> getItems() { return items; }
    public void setItems(List<OrderItemEvent> items) { this.items = items; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}