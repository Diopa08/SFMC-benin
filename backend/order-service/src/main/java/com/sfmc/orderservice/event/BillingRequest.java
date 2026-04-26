package com.sfmc.orderservice.event;

public class BillingRequest {

    private Long orderId;
    private Long clientId;
    private double totalAmount;
    private String clientEmail;

    public BillingRequest() {}

    public BillingRequest(Long orderId, Long clientId,
                          double totalAmount, String clientEmail) {
        this.orderId = orderId;
        this.clientId = clientId;
        this.totalAmount = totalAmount;
        this.clientEmail = clientEmail;
    }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }
}