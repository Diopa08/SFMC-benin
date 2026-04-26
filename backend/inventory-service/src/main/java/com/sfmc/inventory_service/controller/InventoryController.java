package com.sfmc.inventory_service.controller;



import com.sfmc.inventory_service.entity.Stock;
import com.sfmc.inventory_service.entity.StockMovement;
import com.sfmc.inventory_service.service.InventoryService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    // ✅ Appelé par order-service via Feign
    @GetMapping("/check/{productId}")
    public ResponseEntity<Boolean> isAvailable(
            @PathVariable Long productId,
            @RequestParam int quantity) {
        return ResponseEntity.ok(
            inventoryService.isAvailable(productId, quantity));
    }

    // ✅ Appelé par order-service via Feign
    @PutMapping("/reserve/{productId}")
    public ResponseEntity<Void> reserve(
            @PathVariable Long productId,
            @RequestParam int quantity) {
        inventoryService.reserve(productId, quantity);
        return ResponseEntity.ok().build();
    }

    // Créer une nouvelle ligne de stock
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<Stock> createStock(@RequestBody Map<String, Object> body) {
        Long   productId   = Long.valueOf(body.get("productId").toString());
        Long   warehouseId = body.containsKey("warehouseId")
                             ? Long.valueOf(body.get("warehouseId").toString()) : 1L;
        int    quantity    = body.containsKey("quantity")
                             ? Integer.parseInt(body.get("quantity").toString()) : 0;
        int    threshold   = body.containsKey("threshold")
                             ? Integer.parseInt(body.get("threshold").toString()) : 10;
        String productName = body.containsKey("productName")
                             ? body.get("productName").toString() : null;

        Stock created = inventoryService.createStock(productId, productName,
                                                     warehouseId, quantity, threshold);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Lister tous les stocks
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<List<Stock>> getAllStocks() {
        return ResponseEntity.ok(inventoryService.getAllStocks());
    }

    // Stocks critiques
    @GetMapping("/critical")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<List<Stock>> getCriticalStocks() {
        return ResponseEntity.ok(inventoryService.getCriticalStocks());
    }

    // Historique mouvements
    @GetMapping("/{productId}/movements")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<List<StockMovement>> getMovements(
            @PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getMovements(productId));
    }

    // Ajouter stock manuellement
    @PostMapping("/{productId}/add")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<Stock> addStock(
            @PathVariable Long productId,
            @RequestParam int quantity,
            @RequestParam String reason) {
        return ResponseEntity.ok(
            inventoryService.addStock(productId, quantity, reason));
    }
}