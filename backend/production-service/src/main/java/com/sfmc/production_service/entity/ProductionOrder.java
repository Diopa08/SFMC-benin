package com.sfmc.production_service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "production_orders")
public class ProductionOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String referenceNumber;

    private Long orderId;
    private Long productId;
    private String productName;
    private int quantityRequired;
    private int quantityProduced;

    @Enumerated(EnumType.STRING)
    private ProductionStatus status;

    private String priority;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    public ProductionOrder() {}

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.status = ProductionStatus.PLANNED;
        // Référence générée avant l'insert — sera affinée avec l'id dans le service
        if (this.referenceNumber == null) {
            String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
            this.referenceNumber = "PROD-" + ts + "-TMP";
        }
    }

    public Long getId() { return id; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public int getQuantityRequired() { return quantityRequired; }
    public void setQuantityRequired(int q) { this.quantityRequired = q; }
    public int getQuantityProduced() { return quantityProduced; }
    public void setQuantityProduced(int q) { this.quantityProduced = q; }
    public ProductionStatus getStatus() { return status; }
    public void setStatus(ProductionStatus status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime t) { this.startedAt = t; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime t) { this.completedAt = t; }
}