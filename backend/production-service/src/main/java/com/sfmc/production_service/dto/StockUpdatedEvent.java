package com.sfmc.production_service.dto;

public class StockUpdatedEvent {

    private Long productId;
    private int quantityChanged;
    private String type;
    private int newQuantity;
    private String timestamp;

    public StockUpdatedEvent() {}

    public StockUpdatedEvent(Long productId, int quantityChanged,
                              String type, int newQuantity, String timestamp) {
        this.productId = productId;
        this.quantityChanged = quantityChanged;
        this.type = type;
        this.newQuantity = newQuantity;
        this.timestamp = timestamp;
    }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public int getQuantityChanged() { return quantityChanged; }
    public void setQuantityChanged(int q) { this.quantityChanged = q; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getNewQuantity() { return newQuantity; }
    public void setNewQuantity(int q) { this.newQuantity = q; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}