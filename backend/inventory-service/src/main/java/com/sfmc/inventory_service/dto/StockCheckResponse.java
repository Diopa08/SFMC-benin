package com.sfmc.inventory_service.dto;


public class StockCheckResponse {

    private boolean available;
    private Double availableQuantity;
    private boolean thresholdAlert;
    private String message;

    public StockCheckResponse() {}

    public StockCheckResponse(boolean available, Double availableQuantity, boolean thresholdAlert, String message) {
        this.available = available;
        this.availableQuantity = availableQuantity;
        this.thresholdAlert = thresholdAlert;
        this.message = message;
    }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public Double getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(Double availableQuantity) { this.availableQuantity = availableQuantity; }

    public boolean isThresholdAlert() { return thresholdAlert; }
    public void setThresholdAlert(boolean thresholdAlert) { this.thresholdAlert = thresholdAlert; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
