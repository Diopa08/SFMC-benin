package com.sfmc.orderservice.service;

import com.sfmc.orderservice.model.Delivery;
import com.sfmc.orderservice.model.DeliveryStatus;
import com.sfmc.orderservice.model.Order;
import com.sfmc.orderservice.repository.DeliveryRepository;
import com.sfmc.orderservice.repository.OrderRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;

    public DeliveryService(DeliveryRepository deliveryRepository,
                           OrderRepository orderRepository) {
        this.deliveryRepository = deliveryRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public Delivery createDelivery(Long orderId, String deliveryAddress,
                                    String deliveryAgent, String scheduledDate,
                                    String notes) {
        if (deliveryRepository.existsByOrderId(orderId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Une livraison existe déjà pour la commande " + orderId);
        }

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Commande introuvable : " + orderId));

        Delivery delivery = new Delivery();
        delivery.setDeliveryNumber("DEL-" + LocalDateTime.now()
            .format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")));
        delivery.setOrderId(orderId);
        delivery.setOrderNumber(order.getOrderNumber());
        delivery.setDeliveryAddress(
            deliveryAddress != null ? deliveryAddress : order.getShippingAddress());
        delivery.setDeliveryAgent(deliveryAgent);
        delivery.setNotes(notes);
        if (scheduledDate != null && !scheduledDate.isBlank()) {
            try { delivery.setScheduledDate(LocalDate.parse(scheduledDate)); }
            catch (Exception ignored) {}
        }
        delivery.setStatus(DeliveryStatus.PENDING);

        return deliveryRepository.save(delivery);
    }

    public List<Delivery> getAllDeliveries() {
        return deliveryRepository.findAllByOrderByCreatedAtDesc();
    }

    public Delivery getDeliveryByOrder(Long orderId) {
        return deliveryRepository.findByOrderId(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Aucune livraison pour la commande " + orderId));
    }

    public Delivery getDeliveryById(Long id) {
        return deliveryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Livraison introuvable : " + id));
    }

    @Transactional
    public Delivery startTransit(Long id) {
        Delivery delivery = getDeliveryById(id);
        if (delivery.getStatus() != DeliveryStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La livraison n'est pas en statut PENDING");
        }
        delivery.setStatus(DeliveryStatus.IN_TRANSIT);
        return deliveryRepository.save(delivery);
    }

    @Transactional
    public Delivery confirmDelivery(Long id) {
        Delivery delivery = getDeliveryById(id);
        if (delivery.getStatus() != DeliveryStatus.IN_TRANSIT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La livraison n'est pas en transit");
        }
        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveredDate(LocalDate.now());
        return deliveryRepository.save(delivery);
    }
}
