package com.sfmc.production_service.dto;

public class ProductionTriggerEvent {

    private Long orderId;
    private Long productId;
    private int quantityNeeded;
    private String priority;
    private String timestamp;

    public ProductionTriggerEvent() {}

    public ProductionTriggerEvent(Long orderId, Long productId,
                                   int quantityNeeded, String priority,
                                   String timestamp) {
        this.orderId = orderId;
        this.productId = productId;
        this.quantityNeeded = quantityNeeded;
        this.priority = priority;
        this.timestamp = timestamp;
    }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public int getQuantityNeeded() { return quantityNeeded; }
    public void setQuantityNeeded(int q) { this.quantityNeeded = q; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}