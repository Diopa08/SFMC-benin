package com.sfmc.inventory_service.repository;



import com.sfmc.inventory_service.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findByProductId(Long productId);
    List<Stock> findByWarehouseId(Long warehouseId);

    // ✅ Stocks sous le seuil critique
    List<Stock> findByQuantityLessThanEqual(int threshold);
}