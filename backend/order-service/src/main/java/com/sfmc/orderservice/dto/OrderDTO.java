package com.sfmc.orderservice.dto;

import com.sfmc.orderservice.model.OrderStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public class OrderDTO {

    // ═══════════════════════════════════════════
    // REQUEST : Créer une commande
    // ═══════════════════════════════════════════
    public static class CreateOrderRequest {

        private Long clientId;

        @NotEmpty(message = "La commande doit contenir au moins un article")
        @Valid
        private List<OrderItemRequest> items;

        @NotBlank(message = "L'adresse de livraison est obligatoire")
        private String shippingAddress;

        private String notes;

        // ✅ Email du client pour les events RabbitMQ
        private String clientEmail;

        public CreateOrderRequest() {}

        public CreateOrderRequest(Long clientId,
                                   List<OrderItemRequest> items,
                                   String shippingAddress,
                                   String notes,
                                   String clientEmail) {
            this.clientId = clientId;
            this.items = items;
            this.shippingAddress = shippingAddress;
            this.notes = notes;
            this.clientEmail = clientEmail;
        }

        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }

        public List<OrderItemRequest> getItems() { return items; }
        public void setItems(List<OrderItemRequest> items) { this.items = items; }

        public String getShippingAddress() { return shippingAddress; }
        public void setShippingAddress(String shippingAddress) {
            this.shippingAddress = shippingAddress;
        }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public String getClientEmail() { return clientEmail; }
        public void setClientEmail(String clientEmail) {
            this.clientEmail = clientEmail;
        }
    }

    // ═══════════════════════════════════════════
    // REQUEST : Item d'une commande
    // ═══════════════════════════════════════════
    public static class OrderItemRequest {

        @NotNull(message = "L'ID produit est obligatoire")
        private Long productId;

        @NotBlank(message = "Le nom du produit est obligatoire")
        private String productName;

        @Min(value = 1, message = "La quantité doit être au moins 1")
        private int quantity;

        @DecimalMin(value = "0.0", message = "Le prix unitaire doit être positif")
        private double unitPrice;

        public OrderItemRequest() {}

        public OrderItemRequest(Long productId, String productName,
                                 int quantity, double unitPrice) {
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

        public double getUnitPrice() { return unitPrice; }
        public void setUnitPrice(double unitPrice) { this.unitPrice = unitPrice; }
    }

    // ═══════════════════════════════════════════
    // REQUEST : Mettre à jour le statut
    // ═══════════════════════════════════════════
    public static class UpdateStatusRequest {

        @NotNull(message = "Le nouveau statut est obligatoire")
        private OrderStatus newStatus;

        private String reason;

        public UpdateStatusRequest() {}

        public UpdateStatusRequest(OrderStatus newStatus, String reason) {
            this.newStatus = newStatus;
            this.reason = reason;
        }

        public OrderStatus getNewStatus() { return newStatus; }
        public void setNewStatus(OrderStatus newStatus) {
            this.newStatus = newStatus;
        }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    // ═══════════════════════════════════════════
    // RESPONSE : Commande complète
    // ═══════════════════════════════════════════
    public static class OrderResponse {

        private Long id;
        private String orderNumber;
        private Long clientId;
        private String clientEmail;
        private OrderStatus status;
        private List<OrderItemResponse> items;
        private double totalAmount;
        private String shippingAddress;
        private String notes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public OrderResponse() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getOrderNumber() { return orderNumber; }
        public void setOrderNumber(String orderNumber) {
            this.orderNumber = orderNumber;
        }

        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }

        public String getClientEmail() { return clientEmail; }
        public void setClientEmail(String clientEmail) {
            this.clientEmail = clientEmail;
        }

        public OrderStatus getStatus() { return status; }
        public void setStatus(OrderStatus status) { this.status = status; }

        public List<OrderItemResponse> getItems() { return items; }
        public void setItems(List<OrderItemResponse> items) {
            this.items = items;
        }

        public double getTotalAmount() { return totalAmount; }
        public void setTotalAmount(double totalAmount) {
            this.totalAmount = totalAmount;
        }

        public String getShippingAddress() { return shippingAddress; }
        public void setShippingAddress(String shippingAddress) {
            this.shippingAddress = shippingAddress;
        }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }
    }

    // ═══════════════════════════════════════════
    // RESPONSE : Item d'une commande
    // ═══════════════════════════════════════════
    public static class OrderItemResponse {

        private Long id;
        private Long productId;
        private String productName;
        private int quantity;
        private double unitPrice;
        private double subtotal;

        public OrderItemResponse() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }

        public String getProductName() { return productName; }
        public void setProductName(String productName) {
            this.productName = productName;
        }

        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }

        public double getUnitPrice() { return unitPrice; }
        public void setUnitPrice(double unitPrice) {
            this.unitPrice = unitPrice;
        }

        public double getSubtotal() { return subtotal; }
        public void setSubtotal(double subtotal) { this.subtotal = subtotal; }
    }

    // ═══════════════════════════════════════════
    // RESPONSE : Résumé commande (liste)
    // ═══════════════════════════════════════════
    public static class OrderSummaryResponse {

        private Long id;
        private String orderNumber;
        private Long clientId;
        private OrderStatus status;
        private double totalAmount;
        private int itemCount;
        private LocalDateTime createdAt;

        public OrderSummaryResponse() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getOrderNumber() { return orderNumber; }
        public void setOrderNumber(String orderNumber) {
            this.orderNumber = orderNumber;
        }

        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }

        public OrderStatus getStatus() { return status; }
        public void setStatus(OrderStatus status) { this.status = status; }

        public double getTotalAmount() { return totalAmount; }
        public void setTotalAmount(double totalAmount) {
            this.totalAmount = totalAmount;
        }

        public int getItemCount() { return itemCount; }
        public void setItemCount(int itemCount) { this.itemCount = itemCount; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }

    // ═══════════════════════════════════════════
    // RESPONSE : Wrapper API standard
    // ═══════════════════════════════════════════
    public static class ApiResponse<T> {

        private boolean success;
        private String message;
        private T data;

        public ApiResponse() {}

        public ApiResponse(boolean success, String message, T data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }

        // ✅ Méthodes factory
        public static <T> ApiResponse<T> success(String message, T data) {
            return new ApiResponse<>(true, message, data);
        }

        public static <T> ApiResponse<T> error(String message) {
            return new ApiResponse<>(false, message, null);
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public T getData() { return data; }
        public void setData(T data) { this.data = data; }
    }
}