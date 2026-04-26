package com.sfmc.billingservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class BillingException {

    // ── Facture non trouvée ───────────────────────────────────────────────────
    public static class InvoiceNotFoundException extends RuntimeException {
        public InvoiceNotFoundException(Long id) {
            super("Facture non trouvée avec l'ID : " + id);
        }
        public InvoiceNotFoundException(String message) {
            super(message);
        }
    }

    // ── Facture déjà existante pour cette commande ────────────────────────────
    public static class InvoiceAlreadyExistsException extends RuntimeException {
        public InvoiceAlreadyExistsException(Long orderId) {
            super("Une facture existe déjà pour la commande ID : " + orderId);
        }
    }

    // ── Paiement invalide ─────────────────────────────────────────────────────
    public static class InvalidPaymentException extends RuntimeException {
        public InvalidPaymentException(String message) {
            super(message);
        }
    }

    // ── Facture non modifiable ────────────────────────────────────────────────
    public static class InvoiceNotModifiableException extends RuntimeException {
        public InvoiceNotModifiableException(String status) {
            super("Impossible de modifier une facture avec le statut : " + status);
        }
    }

    // ── Gestionnaire global ───────────────────────────────────────────────────
    @RestControllerAdvice
    public static class GlobalExceptionHandler {

        @ExceptionHandler(InvoiceNotFoundException.class)
        public ResponseEntity<Map<String, Object>> handleNotFound(InvoiceNotFoundException ex) {
            return buildError(HttpStatus.NOT_FOUND, ex.getMessage());
        }

        @ExceptionHandler(InvoiceAlreadyExistsException.class)
        public ResponseEntity<Map<String, Object>> handleAlreadyExists(InvoiceAlreadyExistsException ex) {
            return buildError(HttpStatus.CONFLICT, ex.getMessage());
        }

        @ExceptionHandler(InvalidPaymentException.class)
        public ResponseEntity<Map<String, Object>> handleInvalidPayment(InvalidPaymentException ex) {
            return buildError(HttpStatus.BAD_REQUEST, ex.getMessage());
        }

        @ExceptionHandler(InvoiceNotModifiableException.class)
        public ResponseEntity<Map<String, Object>> handleNotModifiable(InvoiceNotModifiableException ex) {
            return buildError(HttpStatus.FORBIDDEN, ex.getMessage());
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
            Map<String, Object> errors = new HashMap<>();
            errors.put("timestamp", LocalDateTime.now().toString());
            errors.put("status", HttpStatus.BAD_REQUEST.value());
            Map<String, String> fieldErrors = new HashMap<>();
            ex.getBindingResult().getFieldErrors().forEach(err ->
                fieldErrors.put(err.getField(), err.getDefaultMessage()));
            errors.put("errors", fieldErrors);
            return ResponseEntity.badRequest().body(errors);
        }

        private ResponseEntity<Map<String, Object>> buildError(HttpStatus status, String message) {
            Map<String, Object> body = new HashMap<>();
            body.put("timestamp", LocalDateTime.now().toString());
            body.put("status", status.value());
            body.put("error", status.getReasonPhrase());
            body.put("message", message);
            return ResponseEntity.status(status).body(body);
        }
    }
}
