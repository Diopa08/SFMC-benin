package com.sfmc.orderservice.controller;

import com.sfmc.orderservice.dto.OrderDTO.*;
import com.sfmc.orderservice.model.OrderStatus;
import com.sfmc.orderservice.service.OrderService;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger log =
        LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // ✅ Créer une commande
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_USER','ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        log.info("POST /orders - client: {}", request.getClientId());
        OrderResponse order = orderService.createOrder(request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success(
                "Commande " + order.getOrderNumber() + " créée", order));
    }

    // ✅ Lister toutes les commandes
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {
        List<OrderResponse> orders = orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success(
            orders.size() + " commande(s)", orders));
    }

    // ✅ Récupérer une commande par ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_USER','ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
            "Commande trouvée", orderService.getOrderById(id)));
    }

    // ✅ Commandes de l'utilisateur connecté (via JWT)
    @GetMapping("/my")
    @PreAuthorize("hasAnyAuthority('ROLE_USER','ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(
            Authentication authentication) {
        String email = authentication.getName();
        List<OrderResponse> orders = orderService.getOrdersByEmail(email);
        return ResponseEntity.ok(ApiResponse.success(
            orders.size() + " commande(s)", orders));
    }

    // ✅ Commandes d'un client
    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USER','ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersByClient(
            @PathVariable Long clientId) {
        List<OrderResponse> orders = orderService.getOrdersByClient(clientId);
        return ResponseEntity.ok(ApiResponse.success(
            orders.size() + " commande(s) pour client " + clientId, orders));
    }

    // ✅ Valider une commande PENDING → VALIDATED
    @PutMapping("/{id}/validate")
    @PreAuthorize("hasAnyAuthority('ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> validateOrder(
            @PathVariable Long id) {
        log.info("PUT /orders/{}/validate", id);
        OrderResponse order = orderService.validateOrder(id);
        return ResponseEntity.ok(ApiResponse.success(
            "Commande " + order.getOrderNumber() + " validée", order));
    }

    // ✅ Changer le statut
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        log.info("PUT /orders/{}/status → {}", id, request.getNewStatus());
        OrderResponse order = orderService.updateOrderStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(
            "Statut → " + order.getStatus(), order));
    }

    // ✅ Annuler une commande
    @DeleteMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('ROLE_USER','ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        OrderResponse order = orderService.cancelOrder(id, reason);
        return ResponseEntity.ok(ApiResponse.success(
            "Commande " + order.getOrderNumber() + " annulée", order));
    }

    // ✅ Commandes par statut
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyAuthority('ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getByStatus(
            @PathVariable OrderStatus status) {
        List<OrderResponse> orders = orderService.getOrdersByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(
            orders.size() + " commande(s) avec statut " + status, orders));
    }
}