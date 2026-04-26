package com.sfmc.billingservice;

import com.sfmc.billingservice.dto.InvoiceDTO.GenerateInvoiceRequest;
import com.sfmc.billingservice.dto.InvoiceDTO.InvoiceResponse;
import com.sfmc.billingservice.dto.InvoiceDTO.RecordPaymentRequest;
import com.sfmc.billingservice.exception.BillingException.InvoiceAlreadyExistsException;
import com.sfmc.billingservice.exception.BillingException.InvoiceNotModifiableException;
import com.sfmc.billingservice.exception.BillingException.InvalidPaymentException;
import com.sfmc.billingservice.model.Invoice;
import com.sfmc.billingservice.model.InvoiceStatus;
import com.sfmc.billingservice.model.PaymentMethod;
import com.sfmc.billingservice.repository.InvoiceRepository;
import com.sfmc.billingservice.service.InvoiceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private InvoiceService billingService;

    private Invoice mockInvoice;

    @BeforeEach
    void setUp() {
        mockInvoice = new Invoice();
        mockInvoice.setId(1L);
        mockInvoice.setInvoiceNumber("FACT-20240101-0001");
        mockInvoice.setOrderId(1L);
        mockInvoice.setOrderNumber("CMD-20240101-0001");
        mockInvoice.setClientId(100L);
        mockInvoice.setTotalAmount(250000.0);
        mockInvoice.setTaxAmount(45000.0);
        mockInvoice.setNetAmount(205000.0);
        mockInvoice.setStatus(InvoiceStatus.UNPAID);
        mockInvoice.setDueDate(LocalDate.now().plusDays(30));
        mockInvoice.setCreatedAt(LocalDateTime.now());
        mockInvoice.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Devrait générer une facture avec succès")
    void generateInvoice_success() {
        GenerateInvoiceRequest request = new GenerateInvoiceRequest(
            1L, "CMD-20240101-0001", 100L, 250000.0, null);

        when(invoiceRepository.existsByOrderId(1L)).thenReturn(false);
        when(invoiceRepository.count()).thenReturn(0L);
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(mockInvoice);

        InvoiceResponse response = billingService.generateInvoice(request);

        assertThat(response).isNotNull();
        assertThat(response.getOrderId()).isEqualTo(1L);
        assertThat(response.getStatus()).isEqualTo(InvoiceStatus.UNPAID);
        assertThat(response.getTotalAmount()).isEqualTo(250000.0);
        verify(invoiceRepository, times(1)).save(any(Invoice.class));
    }

    @Test
    @DisplayName("Devrait lever une exception si une facture existe déjà pour cette commande")
    void generateInvoice_alreadyExists_throwsException() {
        GenerateInvoiceRequest request = new GenerateInvoiceRequest(
            1L, "CMD-20240101-0001", 100L, 250000.0, null);

        when(invoiceRepository.existsByOrderId(1L)).thenReturn(true);

        assertThatThrownBy(() -> billingService.generateInvoice(request))
            .isInstanceOf(InvoiceAlreadyExistsException.class)
            .hasMessageContaining("1");
    }

    @Test
    @DisplayName("Devrait marquer la facture comme PAID après paiement complet")
    void recordPayment_full_marksAsPaid() {
        RecordPaymentRequest payRequest = new RecordPaymentRequest(
            250000.0, PaymentMethod.MOBILE_MONEY, "TXN-001", null);

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(mockInvoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

        InvoiceResponse response = billingService.recordPayment(1L, payRequest);

        assertThat(response.getStatus()).isEqualTo(InvoiceStatus.PAID);
        assertThat(response.getPaidAt()).isEqualTo(LocalDate.now());
    }

    @Test
    @DisplayName("Devrait marquer la facture comme PARTIAL si paiement incomplet")
    void recordPayment_partial_marksAsPartial() {
        RecordPaymentRequest payRequest = new RecordPaymentRequest(
            100000.0, PaymentMethod.CASH, null, null);

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(mockInvoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

        InvoiceResponse response = billingService.recordPayment(1L, payRequest);

        assertThat(response.getStatus()).isEqualTo(InvoiceStatus.PARTIAL);
    }

    @Test
    @DisplayName("Devrait rejeter un paiement sur une facture déjà payée")
    void recordPayment_alreadyPaid_throwsException() {
        mockInvoice.setStatus(InvoiceStatus.PAID);
        RecordPaymentRequest payRequest = new RecordPaymentRequest(
            250000.0, PaymentMethod.CASH, null, null);

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(mockInvoice));

        assertThatThrownBy(() -> billingService.recordPayment(1L, payRequest))
            .isInstanceOf(InvoiceNotModifiableException.class);
    }

    @Test
    @DisplayName("Devrait rejeter un paiement supérieur au montant de la facture")
    void recordPayment_excessiveAmount_throwsException() {
        RecordPaymentRequest payRequest = new RecordPaymentRequest(
            999999.0, PaymentMethod.BANK_TRANSFER, null, null);

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(mockInvoice));

        assertThatThrownBy(() -> billingService.recordPayment(1L, payRequest))
            .isInstanceOf(InvalidPaymentException.class)
            .hasMessageContaining("dépasse");
    }

    @Test
    @DisplayName("Devrait annuler une facture non payée")
    void cancelInvoice_success() {
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(mockInvoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

        InvoiceResponse response = billingService.cancelInvoice(1L);

        assertThat(response.getStatus()).isEqualTo(InvoiceStatus.CANCELLED);
    }

    @Test
    @DisplayName("Devrait retourner les factures d'un client")
    void getInvoicesByClient_success() {
        when(invoiceRepository.findByClientId(100L)).thenReturn(List.of(mockInvoice));

        List<InvoiceResponse> invoices = billingService.getInvoicesByClient(100L);

        assertThat(invoices).hasSize(1);
        assertThat(invoices.get(0).getClientId()).isEqualTo(100L);
    }
}
