package com.sfmc.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "inventory-service")
public interface InventoryClient {

    @GetMapping("/api/inventory/check/{productId}")
    boolean isAvailable(@PathVariable Long productId,
                        @RequestParam int quantity);

    @PutMapping("/api/inventory/reserve/{productId}")
    void reserve(@PathVariable Long productId,
                 @RequestParam int quantity);
}