package com.sfmc.billingservice.event;



import com.sfmc.billingservice.config.RabbitMQConfig;
import com.sfmc.billingservice.dto.OrderCreatedEvent;
import com.sfmc.billingservice.service.InvoiceService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class OrderEventConsumer {

    private static final Logger log =
        LoggerFactory.getLogger(OrderEventConsumer.class);

    private final InvoiceService invoiceService;

    public OrderEventConsumer(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @RabbitListener(queues = RabbitMQConfig.ORDER_CREATED_QUEUE)
    public void handleOrderCreated(OrderCreatedEvent event) {
        try {
            log.info("Event reçu : OrderCreated → commande {}",
                event.getOrderId());
            invoiceService.createInvoiceFromOrder(event);
            log.info("Facture créée pour commande {}", event.getOrderId());
        } catch (Exception e) {
            // ✅ Log l'erreur sans crasher le service
            log.error("Erreur traitement OrderCreated pour commande {} : {}",
                event.getOrderId(), e.getMessage(), e);
        }
    }
}