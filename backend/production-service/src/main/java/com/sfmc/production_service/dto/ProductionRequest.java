package com.sfmc.production_service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class ProductionRequest {

    @NotNull private Long productId;
    @NotNull private String productName;
    @Min(1) private int quantityRequired;
    private String priority;

    public ProductionRequest() {}

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public int getQuantityRequired() { return quantityRequired; }
    public void setQuantityRequired(int q) { this.quantityRequired = q; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
}