package com.sfmc.orderservice.controller;

import com.sfmc.orderservice.dto.OrderDTO.ApiResponse;
import com.sfmc.orderservice.model.Delivery;
import com.sfmc.orderservice.service.DeliveryService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<Delivery>>> getAllDeliveries() {
        List<Delivery> deliveries = deliveryService.getAllDeliveries();
        return ResponseEntity.ok(ApiResponse.success(
            deliveries.size() + " livraison(s)", deliveries));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyAuthority('ROLE_USER','ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Delivery>> getByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(
            "Livraison trouvée", deliveryService.getDeliveryByOrder(orderId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Delivery>> createDelivery(
            @RequestBody Map<String, Object> body) {
        Long orderId = Long.valueOf(body.get("orderId").toString());
        String deliveryAddress = body.containsKey("deliveryAddress")
            ? body.get("deliveryAddress").toString() : null;
        String deliveryAgent = body.containsKey("deliveryAgent") && body.get("deliveryAgent") != null
            ? body.get("deliveryAgent").toString() : null;
        String scheduledDate = body.containsKey("scheduledDate") && body.get("scheduledDate") != null
            ? body.get("scheduledDate").toString() : null;
        String notes = body.containsKey("notes") && body.get("notes") != null
            ? body.get("notes").toString() : null;

        Delivery delivery = deliveryService.createDelivery(
            orderId, deliveryAddress, deliveryAgent, scheduledDate, notes);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Livraison " + delivery.getDeliveryNumber() + " créée", delivery));
    }

    @PutMapping("/{id}/start")
    @PreAuthorize("hasAnyAuthority('ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Delivery>> startTransit(@PathVariable Long id) {
        Delivery delivery = deliveryService.startTransit(id);
        return ResponseEntity.ok(ApiResponse.success(
            "Livraison en transit", delivery));
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasAnyAuthority('ROLE_OPERATOR','ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Delivery>> confirmDelivery(@PathVariable Long id) {
        Delivery delivery = deliveryService.confirmDelivery(id);
        return ResponseEntity.ok(ApiResponse.success(
            "Livraison confirmée", delivery));
    }
}
