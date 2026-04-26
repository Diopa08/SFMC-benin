package com.sfmc.production_service.controller;

import com.sfmc.production_service.dto.ProductionRequest;
import com.sfmc.production_service.entity.ProductionOrder;
import com.sfmc.production_service.entity.ProductionStatus;
import com.sfmc.production_service.service.ProductionService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/production")
public class ProductionController {

    private final ProductionService productionService;

    public ProductionController(ProductionService productionService) {
        this.productionService = productionService;
    }

    // Lister tous les ordres
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<List<ProductionOrder>> getAll() {
        return ResponseEntity.ok(productionService.getAllOrders());
    }

    // Lister par statut
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<List<ProductionOrder>> getByStatus(
            @PathVariable ProductionStatus status) {
        return ResponseEntity.ok(productionService.getByStatus(status));
    }

    // Détail d'un ordre
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<ProductionOrder> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productionService.getById(id));
    }

    // Créer manuellement
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<ProductionOrder> create(
            @RequestBody @Valid ProductionRequest request) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(productionService.createManually(request));
    }

    // Démarrer
    @PutMapping("/{id}/start")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<ProductionOrder> start(@PathVariable Long id) {
        return ResponseEntity.ok(productionService.startProduction(id));
    }

    // Contrôle qualité : IN_PROGRESS → QUALITY_CHECK
    @PutMapping("/{id}/quality-check")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<ProductionOrder> qualityCheck(@PathVariable Long id) {
        return ResponseEntity.ok(productionService.qualityCheck(id));
    }

    // Terminer → publie StockUpdated
    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<ProductionOrder> complete(
            @PathVariable Long id,
            @RequestParam int quantityProduced) {
        return ResponseEntity.ok(
            productionService.completeProduction(id, quantityProduced));
    }

    // Annuler
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<ProductionOrder> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(productionService.cancel(id));
    }
}