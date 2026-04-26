package com.sfmc.billingservice.controller;

import com.sfmc.billingservice.dto.InvoiceDTO.GenerateInvoiceRequest;
import com.sfmc.billingservice.dto.InvoiceDTO.InvoiceResponse;
import com.sfmc.billingservice.dto.InvoiceDTO.RecordPaymentRequest;
import com.sfmc.billingservice.service.InvoiceService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    /** Lister toutes les factures (admin) */
    @GetMapping("/invoices")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<InvoiceResponse>> getAll() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    /** Factures du client connecté (via email injecté par la Gateway) */
    @GetMapping("/invoices/my")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<List<InvoiceResponse>> getMyInvoices(
            @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(invoiceService.getByEmail(email));
    }

    /** Facture par ID */
    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<InvoiceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getById(id));
    }

    /** Facture par commande */
    @GetMapping("/invoices/order/{orderId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<InvoiceResponse> getByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(invoiceService.getByOrderId(orderId));
    }

    /** Factures d'un client (par clientId) */
    @GetMapping("/invoices/client/{clientId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<List<InvoiceResponse>> getByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByClient(clientId));
    }

    /** Générer manuellement une facture */
    @PostMapping("/invoices/generate")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<InvoiceResponse> generate(
            @RequestBody @Valid GenerateInvoiceRequest request) {
        return ResponseEntity.ok(invoiceService.generateInvoice(request));
    }

    /** Enregistrer un paiement */
    @PostMapping("/invoices/{id}/pay")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<InvoiceResponse> recordPayment(
            @PathVariable Long id,
            @RequestBody @Valid RecordPaymentRequest request) {
        return ResponseEntity.ok(invoiceService.recordPayment(id, request));
    }

    /** Annuler une facture */
    @DeleteMapping("/invoices/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<InvoiceResponse> cancelInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.cancelInvoice(id));
    }
}
