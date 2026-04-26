package com.sfmc.inventory_service.service;

import com.sfmc.inventory_service.dto.StockUpdatedEvent;
import com.sfmc.inventory_service.entity.Stock;
import com.sfmc.inventory_service.entity.StockMovement;
import com.sfmc.inventory_service.repository.StockMovementRepository;
import com.sfmc.inventory_service.repository.StockRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class InventoryService {

    private final StockRepository stockRepository;
    private final StockMovementRepository movementRepository;

    public InventoryService(StockRepository stockRepository,
                             StockMovementRepository movementRepository) {
        this.stockRepository = stockRepository;
        this.movementRepository = movementRepository;
    }

    // ─── Créer une nouvelle ligne de stock ───────────────────────────────────
    @Transactional
    public Stock createStock(Long productId, String productName,
                             Long warehouseId, int quantity, int threshold) {
        // Refuser si une ligne existe déjà pour ce produit+entrepôt
        if (stockRepository.findByProductId(productId).isPresent()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Un stock existe déjà pour le produit " + productId);
        }

        Stock stock = new Stock();
        stock.setProductId(productId);
        stock.setProductName(productName != null ? productName : "Produit #" + productId);
        stock.setWarehouseId(warehouseId != null ? warehouseId : 1L);
        stock.setQuantity(quantity);
        stock.setThreshold(threshold);

        Stock saved = stockRepository.save(stock);

        if (quantity > 0) {
            saveMovement(saved, "IN", quantity, "Stock initial");
        }
        return saved;
    }

    // ─── Vérifier disponibilité (appelé par order-service via Feign) ─────────
    public boolean isAvailable(Long productId, int quantity) {
        return stockRepository.findByProductId(productId)
            .map(stock -> stock.getQuantity() >= quantity)
            .orElse(false);
    }

    // ─── Réserver du stock (appelé par order-service via Feign) ─────────────
    @Transactional
    public void reserve(Long productId, int quantity) {
        Stock stock = stockRepository.findByProductId(productId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Produit introuvable en stock : " + productId));

        if (stock.getQuantity() < quantity) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stock insuffisant");
        }

        stock.setQuantity(stock.getQuantity() - quantity);
        stockRepository.save(stock);
        saveMovement(stock, "OUT", quantity, "Vente / commande client");

        if (stock.isCritical()) {
            System.out.println("⚠️ ALERTE : Stock critique produit "
                + productId + " → " + stock.getQuantity() + " unités");
        }
    }

    // ─── Ajouter du stock manuellement ───────────────────────────────────────
    @Transactional
    public Stock addStock(Long productId, int quantity, String reason) {
        Stock stock = stockRepository.findByProductId(productId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Aucun stock trouvé pour le produit " + productId
                + ". Créez d'abord une ligne de stock."));

        stock.setQuantity(stock.getQuantity() + quantity);
        stockRepository.save(stock);
        saveMovement(stock, "IN", quantity, reason != null ? reason : "Ajout manuel");
        return stock;
    }

    // ─── Mise à jour depuis RabbitMQ (production terminée) ──────────────────
    @Transactional
    public void updateStockFromEvent(StockUpdatedEvent event) {
        Stock stock = stockRepository.findByProductId(event.productId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Produit introuvable : " + event.productId()));

        if ("IN".equals(event.type())) {
            stock.setQuantity(stock.getQuantity() + event.quantityChanged());
        } else {
            stock.setQuantity(stock.getQuantity() - event.quantityChanged());
        }

        stockRepository.save(stock);
        saveMovement(stock, event.type(), event.quantityChanged(), "Production");
        System.out.println("Stock mis à jour produit "
            + event.productId() + " → " + stock.getQuantity() + " unités");
    }

    // ─── Lecture ─────────────────────────────────────────────────────────────

    public List<Stock> getAllStocks() {
        return stockRepository.findAll();
    }

    public List<Stock> getCriticalStocks() {
        return stockRepository.findAll().stream()
            .filter(Stock::isCritical)
            .toList();
    }

    public List<StockMovement> getMovements(Long productId) {
        return movementRepository.findByProductIdOrderByDateDesc(productId);
    }

    // ─── Utilitaire ──────────────────────────────────────────────────────────

    private void saveMovement(Stock stock, String type, int quantity, String reason) {
        StockMovement movement = new StockMovement();
        movement.setProductId(stock.getProductId());
        movement.setStock(stock);
        movement.setType(type);
        movement.setQuantity(quantity);
        movement.setReason(reason);
        movementRepository.save(movement);
    }
}
