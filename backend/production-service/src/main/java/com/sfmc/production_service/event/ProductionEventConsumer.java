package com.sfmc.production_service.event;

import com.sfmc.production_service.config.RabbitMQConfig;
import com.sfmc.production_service.dto.ProductionTriggerEvent;
import com.sfmc.production_service.service.ProductionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class ProductionEventConsumer {

    private static final Logger log =
        LoggerFactory.getLogger(ProductionEventConsumer.class);

    private final ProductionService productionService;

    public ProductionEventConsumer(ProductionService productionService) {
        this.productionService = productionService;
    }

    @RabbitListener(queues = RabbitMQConfig.PRODUCTION_TRIGGER_QUEUE)
    public void handleProductionTrigger(ProductionTriggerEvent event) {
        try {
            log.info("ProductionTrigger reçu → produit {} quantité {}",
                event.getProductId(), event.getQuantityNeeded());
            productionService.createProductionOrder(event);
        } catch (Exception e) {
            log.error("Erreur ProductionTrigger : {}", e.getMessage(), e);
        }
    }
}