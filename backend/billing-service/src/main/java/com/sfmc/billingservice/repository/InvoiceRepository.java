package com.sfmc.billingservice.repository;

import com.sfmc.billingservice.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByOrderId(Long orderId);
    boolean existsByOrderId(Long orderId);
    List<Invoice> findByCustomerEmail(String email);
    List<Invoice> findByClientId(Long clientId);
}
