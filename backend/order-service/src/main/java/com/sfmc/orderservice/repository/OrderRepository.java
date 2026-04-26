package com.sfmc.orderservice.repository;

import com.sfmc.orderservice.model.Order;
import com.sfmc.orderservice.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA pour les commandes
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByClientId(Long clientId);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByClientIdAndStatus(Long clientId, OrderStatus status);

    boolean existsByOrderNumber(String orderNumber);

    List<Order> findByClientEmail(String clientEmail);
}
