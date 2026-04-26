package com.sfmc.production_service.service;

import com.sfmc.production_service.config.RabbitMQConfig;
import com.sfmc.production_service.dto.ProductionTriggerEvent;
import com.sfmc.production_service.dto.ProductionRequest;
import com.sfmc.production_service.dto.StockUpdatedEvent;
import com.sfmc.production_service.entity.ProductionOrder;
import com.sfmc.production_service.entity.ProductionStatus;
import com.sfmc.production_service.repository.ProductionOrderRepository;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProductionService {

    private final ProductionOrderRepository repository;
    private final RabbitTemplate rabbitTemplate;

    public ProductionService(ProductionOrderRepository repository,
                              RabbitTemplate rabbitTemplate) {
        this.repository = repository;
        this.rabbitTemplate = rabbitTemplate;
    }

    // ✅ Créer depuis un event RabbitMQ
    @Transactional
    public ProductionOrder createProductionOrder(ProductionTriggerEvent event) {
        ProductionOrder order = new ProductionOrder(); // ✅ constructeur vide

        // ✅ getters au lieu de record accessors
        order.setOrderId(event.getOrderId());
        order.setProductId(event.getProductId());
        order.setQuantityRequired(event.getQuantityNeeded());
        order.setPriority(event.getPriority());
        return repository.save(order);
    }

    // ✅ Créer manuellement depuis le controller
    @Transactional
    public ProductionOrder createManually(ProductionRequest request) {
        ProductionOrder order = new ProductionOrder(); // ✅ constructeur vide

        // ✅ getters au lieu de record accessors
        order.setProductId(request.getProductId());
        order.setProductName(request.getProductName());
        order.setQuantityRequired(request.getQuantityRequired());
        order.setPriority(
            request.getPriority() != null ? request.getPriority() : "NORMAL"
        );
        return repository.save(order);
    }

    // Démarrer la production
    @Transactional
    public ProductionOrder startProduction(Long id) {
        ProductionOrder order = findById(id);

        if (order.getStatus() != ProductionStatus.PLANNED) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Impossible de démarrer — statut actuel : " + order.getStatus());
        }

        order.setStatus(ProductionStatus.IN_PROGRESS);
        order.setStartedAt(LocalDateTime.now());
        return repository.save(order);
    }

    // Passer en contrôle qualité : IN_PROGRESS → QUALITY_CHECK
    @Transactional
    public ProductionOrder qualityCheck(Long id) {
        ProductionOrder order = findById(id);

        if (order.getStatus() != ProductionStatus.IN_PROGRESS) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Impossible — statut actuel : " + order.getStatus());
        }

        order.setStatus(ProductionStatus.QUALITY_CHECK);
        return repository.save(order);
    }

    // Terminer la production → publier StockUpdated
    @Transactional
    public ProductionOrder completeProduction(Long id, int quantityProduced) {
        ProductionOrder order = findById(id);

        if (order.getStatus() != ProductionStatus.IN_PROGRESS
                && order.getStatus() != ProductionStatus.QUALITY_CHECK) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La production n'est pas en cours (statut : " + order.getStatus() + ")");
        }

        order.setStatus(ProductionStatus.COMPLETED);
        order.setQuantityProduced(quantityProduced);
        order.setCompletedAt(LocalDateTime.now());
        ProductionOrder saved = repository.save(order);

        // ✅ Publier StockUpdated → inventory-service
        StockUpdatedEvent event = new StockUpdatedEvent(
            order.getProductId(),
            quantityProduced,
            "IN",
            quantityProduced,
            Instant.now().toString()
        );

        rabbitTemplate.convertAndSend(
            RabbitMQConfig.INVENTORY_EXCHANGE,
            RabbitMQConfig.STOCK_UPDATED_KEY,
            event
        );

        System.out.println("StockUpdated publié → produit "
            + order.getProductId()
            + " +" + quantityProduced + " unités");

        return saved;
    }

    // Annuler
    @Transactional
    public ProductionOrder cancel(Long id) {
        ProductionOrder order = findById(id);

        if (order.getStatus() == ProductionStatus.COMPLETED) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Impossible d'annuler une production terminée");
        }

        order.setStatus(ProductionStatus.CANCELLED);
        return repository.save(order);
    }

    public List<ProductionOrder> getAllOrders() {
        return repository.findAll();
    }

    public List<ProductionOrder> getByStatus(ProductionStatus status) {
        return repository.findByStatus(status);
    }

    public ProductionOrder getById(Long id) {
        return findById(id);
    }

    private ProductionOrder findById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Ordre de production introuvable : " + id));
    }
}