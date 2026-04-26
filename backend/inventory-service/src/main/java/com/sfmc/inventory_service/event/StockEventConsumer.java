package com.sfmc.inventory_service.event;


import com.sfmc.inventory_service.config.RabbitMQConfig;
import com.sfmc.inventory_service.dto.StockUpdatedEvent;
import com.sfmc.inventory_service.service.InventoryService;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class StockEventConsumer {

    private final InventoryService inventoryService;

    public StockEventConsumer(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    // ✅ Déclenché quand production-service termine une production
    @RabbitListener(queues = RabbitMQConfig.STOCK_UPDATED_QUEUE)
    public void handleStockUpdated(StockUpdatedEvent event) {
        System.out.println("Event reçu : StockUpdated → produit "
            + event.productId() + " +" + event.quantityChanged());
        inventoryService.updateStockFromEvent(event);
    }
}