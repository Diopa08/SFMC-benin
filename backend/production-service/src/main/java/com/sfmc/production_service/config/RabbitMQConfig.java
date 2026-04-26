package com.sfmc.production_service.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String ORDER_EXCHANGE           = "order.exchange";
    public static final String INVENTORY_EXCHANGE       = "inventory.exchange";
    public static final String PRODUCTION_TRIGGER_QUEUE = "production.trigger.queue";
    public static final String STOCK_UPDATED_QUEUE      = "stock.updated.queue";
    public static final String PRODUCTION_TRIGGER_KEY   = "production.trigger";
    public static final String STOCK_UPDATED_KEY        = "stock.updated";

    @Bean public TopicExchange orderExchange() {
        return new TopicExchange(ORDER_EXCHANGE);
    }
    @Bean public TopicExchange inventoryExchange() {
        return new TopicExchange(INVENTORY_EXCHANGE);
    }
    @Bean public Queue productionTriggerQueue() {
        return QueueBuilder.durable(PRODUCTION_TRIGGER_QUEUE).build();
    }
    @Bean public Queue stockUpdatedQueue() {
        return QueueBuilder.durable(STOCK_UPDATED_QUEUE).build();
    }
    @Bean public Binding productionTriggerBinding() {
        return BindingBuilder.bind(productionTriggerQueue())
            .to(orderExchange()).with(PRODUCTION_TRIGGER_KEY);
    }
    @Bean public Binding stockUpdatedBinding() {
        return BindingBuilder.bind(stockUpdatedQueue())
            .to(inventoryExchange()).with(STOCK_UPDATED_KEY);
    }
    @Bean public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
    @Bean public RabbitTemplate rabbitTemplate(ConnectionFactory cf) {
        RabbitTemplate t = new RabbitTemplate(cf);
        t.setMessageConverter(messageConverter());
        return t;
    }
}