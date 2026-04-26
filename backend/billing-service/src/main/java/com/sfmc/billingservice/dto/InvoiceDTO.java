package com.sfmc.billingservice.dto;

import com.sfmc.billingservice.model.InvoiceStatus;
import com.sfmc.billingservice.model.PaymentMethod;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class InvoiceDTO {

    // ── Request : générer une facture ─────────────────────────────────────────
    public static class GenerateInvoiceRequest {

        @NotNull(message = "L'identifiant commande est obligatoire")
        private Long orderId;

        @NotBlank(message = "Le numéro de commande est obligatoire")
        private String orderNumber;

        @NotNull(message = "L'identifiant client est obligatoire")
        private Long clientId;

        @NotNull(message = "Le montant total est obligatoire")
        @Positive(message = "Le montant doit être positif")
        private Double totalAmount;

        private String notes;

        public GenerateInvoiceRequest() {}

        public GenerateInvoiceRequest(Long orderId, String orderNumber, Long clientId,
                                      Double totalAmount, String notes) {
            this.orderId = orderId;
            this.orderNumber = orderNumber;
            this.clientId = clientId;
            this.totalAmount = totalAmount;
            this.notes = notes;
        }

        public Long getOrderId() { return orderId; }
        public void setOrderId(Long orderId) { this.orderId = orderId; }

        public String getOrderNumber() { return orderNumber; }
        public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }

        public Double getTotalAmount() { return totalAmount; }
        public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    // ── Request : enregistrer un paiement ────────────────────────────────────
    public static class RecordPaymentRequest {

        @NotNull(message = "Le montant payé est obligatoire")
        @Positive(message = "Le montant doit être positif")
        private Double amountPaid;

        @NotNull(message = "La méthode de paiement est obligatoire")
        private PaymentMethod paymentMethod;

        private String reference;
        private String notes;

        public RecordPaymentRequest() {}

        public RecordPaymentRequest(Double amountPaid, PaymentMethod paymentMethod,
                                    String reference, String notes) {
            this.amountPaid = amountPaid;
            this.paymentMethod = paymentMethod;
            this.reference = reference;
            this.notes = notes;
        }

        public Double getAmountPaid() { return amountPaid; }
        public void setAmountPaid(Double amountPaid) { this.amountPaid = amountPaid; }

        public PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

        public String getReference() { return reference; }
        public void setReference(String reference) { this.reference = reference; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    // ── Response ──────────────────────────────────────────────────────────────
    public static class InvoiceResponse {

        private Long id;
        private String invoiceNumber;
        private Long orderId;
        private String orderNumber;
        private Long clientId;
        private Double totalAmount;
        private Double taxAmount;
        private Double netAmount;
        private InvoiceStatus status;
        private PaymentMethod paymentMethod;
        private LocalDate dueDate;
        private LocalDate paidAt;
        private String notes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public InvoiceResponse() {}

        public InvoiceResponse(Long id, String invoiceNumber, Long orderId, String orderNumber,
                                Long clientId, Double totalAmount, Double taxAmount, Double netAmount,
                                InvoiceStatus status, PaymentMethod paymentMethod,
                                LocalDate dueDate, LocalDate paidAt, String notes,
                                LocalDateTime createdAt, LocalDateTime updatedAt) {
            this.id = id;
            this.invoiceNumber = invoiceNumber;
            this.orderId = orderId;
            this.orderNumber = orderNumber;
            this.clientId = clientId;
            this.totalAmount = totalAmount;
            this.taxAmount = taxAmount;
            this.netAmount = netAmount;
            this.status = status;
            this.paymentMethod = paymentMethod;
            this.dueDate = dueDate;
            this.paidAt = paidAt;
            this.notes = notes;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getInvoiceNumber() { return invoiceNumber; }
        public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

        public Long getOrderId() { return orderId; }
        public void setOrderId(Long orderId) { this.orderId = orderId; }

        public String getOrderNumber() { return orderNumber; }
        public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }

        public Double getTotalAmount() { return totalAmount; }
        public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

        public Double getTaxAmount() { return taxAmount; }
        public void setTaxAmount(Double taxAmount) { this.taxAmount = taxAmount; }

        public Double getNetAmount() { return netAmount; }
        public void setNetAmount(Double netAmount) { this.netAmount = netAmount; }

        public InvoiceStatus getStatus() { return status; }
        public void setStatus(InvoiceStatus status) { this.status = status; }

        public PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

        public LocalDate getPaidAt() { return paidAt; }
        public void setPaidAt(LocalDate paidAt) { this.paidAt = paidAt; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }
}
