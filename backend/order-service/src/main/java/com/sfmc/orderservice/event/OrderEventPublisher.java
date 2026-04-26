package com.sfmc.orderservice.event;

import com.sfmc.orderservice.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class OrderEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public OrderEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    // ✅ Publier OrderCreated → billing-service
    public void publishOrderCreated(Long orderId, Long clientId,
                                     List<OrderItemEvent> items,
                                     double totalAmount, String email) {
        OrderCreatedEvent event = new OrderCreatedEvent(
            orderId, clientId, items,
            totalAmount, email,
            Instant.now().toString()
        );

        rabbitTemplate.convertAndSend(
            RabbitMQConfig.ORDER_EXCHANGE,
            RabbitMQConfig.ORDER_CREATED_KEY,
            event
        );

        System.out.println("Event publié : OrderCreated → commande " + orderId);
    }

    // ✅ Publier ProductionTrigger → production-service
    public void publishProductionTrigger(Long orderId, Long productId,
                                          int quantity) {
        ProductionTriggerEvent event = new ProductionTriggerEvent(
            orderId, productId, quantity, "HIGH",
            Instant.now().toString()
        );

        rabbitTemplate.convertAndSend(
            RabbitMQConfig.ORDER_EXCHANGE,
            RabbitMQConfig.PRODUCTION_TRIGGER_KEY,
            event
        );

        System.out.println("Event publié : ProductionTrigger → produit " + productId);
    }
}