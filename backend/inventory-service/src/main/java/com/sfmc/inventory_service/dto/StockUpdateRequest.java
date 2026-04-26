package com.sfmc.inventory_service.dto;

import com.sfmc.inventory_service.entity.MovementType;


public class StockUpdateRequest {

    private MovementType type;  // IN ou OUT
    private Double quantity;
    private String reason;

    public StockUpdateRequest() {}

    public MovementType getType() { return type; }
    public void setType(MovementType type) { this.type = type; }

    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
