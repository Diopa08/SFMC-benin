package com.sfmc.production_service.repository;

import com.sfmc.production_service.entity.ProductionOrder;
import com.sfmc.production_service.entity.ProductionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductionOrderRepository
        extends JpaRepository<ProductionOrder, Long> {
    List<ProductionOrder> findByStatus(ProductionStatus status);
    List<ProductionOrder> findByProductId(Long productId);
    List<ProductionOrder> findByOrderId(Long orderId);
}