package com.sfmc.orderservice.repository;

import com.sfmc.orderservice.model.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    Optional<Delivery> findByOrderId(Long orderId);
    List<Delivery> findAllByOrderByCreatedAtDesc();
    boolean existsByOrderId(Long orderId);
}
