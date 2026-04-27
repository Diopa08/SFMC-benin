package com.sfmc.billingservice.service;

import com.sfmc.billingservice.client.NotificationClient;
import com.sfmc.billingservice.dto.InvoiceDTO.DeclarePaymentRequest;
import com.sfmc.billingservice.dto.InvoiceDTO.GenerateInvoiceRequest;
import com.sfmc.billingservice.dto.InvoiceDTO.InvoiceResponse;
import com.sfmc.billingservice.dto.InvoiceDTO.RecordPaymentRequest;
import com.sfmc.billingservice.dto.OrderCreatedEvent;
import com.sfmc.billingservice.exception.BillingException.InvoiceAlreadyExistsException;
import com.sfmc.billingservice.exception.BillingException.InvoiceNotFoundException;
import com.sfmc.billingservice.exception.BillingException.InvoiceNotModifiableException;
import com.sfmc.billingservice.exception.BillingException.InvalidPaymentException;
import com.sfmc.billingservice.model.Invoice;
import com.sfmc.billingservice.model.InvoiceStatus;
import com.sfmc.billingservice.repository.InvoiceRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InvoiceService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);

    /** TVA appliquée au Bénin : 18 % */
    private static final double TAX_RATE = 0.18;

    private final InvoiceRepository invoiceRepository;
    private final NotificationClient notificationClient;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          NotificationClient notificationClient) {
        this.invoiceRepository = invoiceRepository;
        this.notificationClient = notificationClient;
    }

    // ─── Création depuis un événement RabbitMQ ───────────────────────────────

    @Transactional
    public Invoice createInvoiceFromOrder(OrderCreatedEvent event) {
        if (invoiceRepository.findByOrderId(event.getOrderId()).isPresent()) {
            log.info("Facture déjà existante pour commande : {}", event.getOrderId());
            return invoiceRepository.findByOrderId(event.getOrderId()).get();
        }

        Invoice invoice = new Invoice();
        invoice.setOrderId(event.getOrderId());
        invoice.setClientId(event.getClientId());
        invoice.setTotalAmount(event.getTotalAmount());
        invoice.setCustomerEmail(event.getEmail());
        invoice.setOrderNumber(event.getOrderNumber());
        invoice.setStatus(InvoiceStatus.UNPAID);

        double tax  = event.getTotalAmount() * TAX_RATE;
        invoice.setTaxAmount(tax);
        invoice.setNetAmount(event.getTotalAmount() - tax);
        invoice.setDueDate(LocalDate.now().plusDays(30));

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Facture créée : #{} pour commande : {}", saved.getId(), event.getOrderId());

        // Notifier l'admin et le client
        try {
            Map<String, Object> notifAdmin = new HashMap<>();
            notifAdmin.put("type", "INVOICE_GENERATED");
            notifAdmin.put("title", "Facture générée – commande #" + event.getOrderId());
            notifAdmin.put("message", "Une facture de " + event.getTotalAmount() + " FCFA (TVA 18% incluse) a été générée pour la commande #" + event.getOrderId());
            notifAdmin.put("targetRole", "ROLE_ADMIN");
            notifAdmin.put("referenceId", saved.getId());
            notifAdmin.put("referenceType", "INVOICE");
            notificationClient.createNotification(notifAdmin);

            if (event.getEmail() != null && !event.getEmail().isBlank()) {
                Map<String, Object> notifUser = new HashMap<>();
                notifUser.put("type", "INVOICE_GENERATED");
                notifUser.put("title", "Votre facture est disponible");
                notifUser.put("message", "Votre facture pour la commande #" + event.getOrderId() + " est disponible. Montant : " + event.getTotalAmount() + " FCFA. Échéance dans 30 jours.");
                // Cibler UNIQUEMENT cet utilisateur par son email
                notifUser.put("targetRole", event.getEmail());
                notifUser.put("referenceId", saved.getId());
                notifUser.put("referenceType", "INVOICE");
                notificationClient.createNotification(notifUser);
            }
        } catch (Exception e) {
            log.warn("Impossible d'envoyer la notification de facture : {}", e.getMessage());
        }

        return saved;
    }

    // ─── Générer une facture manuellement ────────────────────────────────────

    @Transactional
    public InvoiceResponse generateInvoice(GenerateInvoiceRequest request) {
        if (invoiceRepository.existsByOrderId(request.getOrderId())) {
            throw new InvoiceAlreadyExistsException(request.getOrderId());
        }

        double tax  = request.getTotalAmount() * TAX_RATE;
        double net  = request.getTotalAmount() - tax;

        Invoice invoice = new Invoice();
        invoice.setOrderId(request.getOrderId());
        invoice.setOrderNumber(request.getOrderNumber());
        invoice.setClientId(request.getClientId());
        invoice.setTotalAmount(request.getTotalAmount());
        invoice.setTaxAmount(tax);
        invoice.setNetAmount(net);
        invoice.setNotes(request.getNotes());
        invoice.setStatus(InvoiceStatus.UNPAID);
        invoice.setDueDate(LocalDate.now().plusDays(30));
        invoice.setInvoiceNumber(generateInvoiceNumber());

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Facture générée : {}", saved.getInvoiceNumber());
        return toResponse(saved);
    }

    // ─── Enregistrer un paiement ─────────────────────────────────────────────

    @Transactional
    public InvoiceResponse recordPayment(Long id, RecordPaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id));

        if (invoice.getStatus() == InvoiceStatus.PAID
                || invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new InvoiceNotModifiableException(invoice.getStatus().name());
        }

        if (request.getAmountPaid() > invoice.getTotalAmount()) {
            throw new InvalidPaymentException(
                "Le montant payé (" + request.getAmountPaid()
                + ") dépasse le montant de la facture (" + invoice.getTotalAmount() + ")");
        }

        invoice.setPaymentMethod(request.getPaymentMethod());
        if (request.getNotes() != null) invoice.setNotes(request.getNotes());

        if (request.getAmountPaid().equals(invoice.getTotalAmount())) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaidAt(LocalDate.now());
        } else {
            invoice.setStatus(InvoiceStatus.PARTIAL);
        }

        return toResponse(invoiceRepository.save(invoice));
    }

    // ─── Déclaration de paiement par le client ───────────────────────────────

    @Transactional
    public InvoiceResponse declarePayment(Long id, DeclarePaymentRequest request, String clientEmail) {
        Invoice invoice = invoiceRepository.findById(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id));

        // Vérifier que la facture appartient bien à ce client
        if (!clientEmail.equalsIgnoreCase(invoice.getCustomerEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Cette facture ne vous appartient pas.");
        }

        if (invoice.getStatus() == InvoiceStatus.PAID
                || invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new InvoiceNotModifiableException(invoice.getStatus().name());
        }

        invoice.setStatus(InvoiceStatus.PENDING_PAYMENT);
        invoice.setPaymentMethod(request.getPaymentMethod());
        invoice.setPaymentReference(request.getReference());

        // Construire une note résumant la déclaration
        StringBuilder noteBuilder = new StringBuilder();
        noteBuilder.append("Paiement déclaré par ").append(clientEmail);
        noteBuilder.append(" · Montant : ").append(request.getAmountDeclared()).append(" FCFA");
        noteBuilder.append(" · Mode : ").append(request.getPaymentMethod());
        if (request.getReference() != null && !request.getReference().isBlank()) {
            noteBuilder.append(" · Réf : ").append(request.getReference());
        }
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            noteBuilder.append(" · ").append(request.getNotes());
        }
        invoice.setNotes(noteBuilder.toString());

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Paiement déclaré par {} pour facture #{}", clientEmail, saved.getId());

        // Notifier admin + opérateur
        try {
            String msg = "Le client " + clientEmail + " a déclaré un paiement de "
                + request.getAmountDeclared() + " FCFA via "
                + request.getPaymentMethod()
                + (request.getReference() != null && !request.getReference().isBlank()
                    ? " (réf : " + request.getReference() + ")" : "")
                + " pour la facture " + saved.getInvoiceNumber() + ".";

            for (String role : new String[]{"ROLE_ADMIN", "ROLE_OPERATOR"}) {
                Map<String, Object> notif = new HashMap<>();
                notif.put("type",          "PAYMENT_DECLARED");
                notif.put("title",         "Paiement déclaré – " + saved.getInvoiceNumber());
                notif.put("message",       msg);
                notif.put("targetRole",    role);
                notif.put("referenceId",   saved.getId());
                notif.put("referenceType", "INVOICE");
                notificationClient.createNotification(notif);
            }
        } catch (Exception e) {
            log.warn("Impossible d'envoyer la notification de déclaration : {}", e.getMessage());
        }

        return toResponse(saved);
    }

    // ─── Confirmation du paiement par l'admin ────────────────────────────────

    @Transactional
    public InvoiceResponse confirmPayment(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id));

        if (invoice.getStatus() != InvoiceStatus.PENDING_PAYMENT) {
            throw new InvoiceNotModifiableException(
                "Impossible de confirmer : statut actuel = " + invoice.getStatus());
        }

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDate.now());

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Paiement confirmé par admin pour facture #{}", saved.getId());

        // Notifier le client
        try {
            if (saved.getCustomerEmail() != null && !saved.getCustomerEmail().isBlank()) {
                Map<String, Object> notif = new HashMap<>();
                notif.put("type",          "INVOICE_PAID");
                notif.put("title",         "Paiement confirmé ✓");
                notif.put("message",       "Votre paiement pour la facture "
                    + saved.getInvoiceNumber() + " ("
                    + saved.getTotalAmount() + " FCFA) a été confirmé. Merci !");
                notif.put("targetRole",    saved.getCustomerEmail());
                notif.put("referenceId",   saved.getId());
                notif.put("referenceType", "INVOICE");
                notificationClient.createNotification(notif);
            }
        } catch (Exception e) {
            log.warn("Impossible d'envoyer la notification de confirmation : {}", e.getMessage());
        }

        return toResponse(saved);
    }

    // ─── Annuler une facture ─────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse cancelInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new InvoiceNotModifiableException(invoice.getStatus().name());
        }
        invoice.setStatus(InvoiceStatus.CANCELLED);
        return toResponse(invoiceRepository.save(invoice));
    }

    // ─── Lecture ─────────────────────────────────────────────────────────────

    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public InvoiceResponse getById(Long id) {
        return toResponse(invoiceRepository.findById(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id)));
    }

    public InvoiceResponse getByOrderId(Long orderId) {
        return toResponse(invoiceRepository.findByOrderId(orderId)
            .orElseThrow(() -> new InvoiceNotFoundException("Facture introuvable pour commande : " + orderId)));
    }

    public List<InvoiceResponse> getInvoicesByClient(Long clientId) {
        return invoiceRepository.findByClientId(clientId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public List<InvoiceResponse> getByEmail(String email) {
        return invoiceRepository.findByCustomerEmail(email).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────

    private InvoiceResponse toResponse(Invoice i) {
        InvoiceResponse r = new InvoiceResponse();
        r.setId(i.getId());
        r.setInvoiceNumber(i.getInvoiceNumber());
        r.setOrderId(i.getOrderId());
        r.setOrderNumber(i.getOrderNumber());
        r.setClientId(i.getClientId());
        r.setClientEmail(i.getCustomerEmail());
        r.setTotalAmount(i.getTotalAmount());
        r.setTaxAmount(i.getTaxAmount());
        r.setNetAmount(i.getNetAmount());
        r.setStatus(i.getStatus());
        r.setPaymentMethod(i.getPaymentMethod());
        r.setDueDate(i.getDueDate());
        r.setPaidAt(i.getPaidAt());
        r.setNotes(i.getNotes());
        r.setPaymentReference(i.getPaymentReference());
        r.setCreatedAt(i.getCreatedAt());
        r.setUpdatedAt(i.getUpdatedAt());
        return r;
    }

    private String generateInvoiceNumber() {
        return "FACT-" + LocalDateTime.now()
            .format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
    }
}
