package com.sfmc.orderservice.service;

import com.sfmc.orderservice.client.InventoryClient;
import com.sfmc.orderservice.client.NotificationClient;
import com.sfmc.orderservice.dto.OrderDTO.*;
import com.sfmc.orderservice.event.*;
import com.sfmc.orderservice.exception.OrderException.*;
import com.sfmc.orderservice.model.Order;
import com.sfmc.orderservice.model.OrderItem;
import com.sfmc.orderservice.model.OrderStatus;
import com.sfmc.orderservice.repository.OrderRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log =
        LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    private final OrderEventPublisher eventPublisher;
    private final BillingServiceClient billingServiceClient;
    private final NotificationClient notificationClient;

    public OrderService(OrderRepository orderRepository,
                        InventoryClient inventoryClient,
                        OrderEventPublisher eventPublisher,
                        BillingServiceClient billingServiceClient,
                        NotificationClient notificationClient) {
        this.orderRepository = orderRepository;
        this.inventoryClient = inventoryClient;
        this.eventPublisher = eventPublisher;
        this.billingServiceClient = billingServiceClient;
        this.notificationClient = notificationClient;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        log.info("Création commande client : {} ({})", request.getClientId(), request.getClientEmail());

        // 1. Vérifier stock pour chaque item
        for (OrderItemRequest item : request.getItems()) {
            boolean available = inventoryClient.isAvailable(
                item.getProductId(), item.getQuantity()
            );
            if (!available) {
                eventPublisher.publishProductionTrigger(
                    null, item.getProductId(), item.getProductName(), item.getQuantity()
                );
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Stock insuffisant pour produit "
                        + item.getProductId()
                        + " — production déclenchée"
                );
            }
        }

        // 2. Réserver le stock
        for (OrderItemRequest item : request.getItems()) {
            inventoryClient.reserve(item.getProductId(), item.getQuantity());
        }

        // 3. Construire la commande
        Order order = new Order();
        order.setClientId(request.getClientId());
        order.setClientEmail(request.getClientEmail());
        order.setShippingAddress(request.getShippingAddress());
        order.setNotes(request.getNotes());
        order.setStatus(OrderStatus.PENDING);
        order.setOrderNumber(generateOrderNumber());

        List<OrderItem> items = request.getItems().stream()
            .map(itemReq -> {
                OrderItem item = new OrderItem();
                item.setProductId(itemReq.getProductId());
                item.setProductName(itemReq.getProductName());
                item.setQuantity(itemReq.getQuantity());
                item.setUnitPrice(itemReq.getUnitPrice());
                item.setOrder(order);
                return item;
            }).collect(Collectors.toList());

        order.setItems(items);
        order.setTotalAmount(
            items.stream()
                .mapToDouble(i -> i.getUnitPrice() * i.getQuantity())
                .sum()
        );

        Order saved = orderRepository.save(order);

        // 4. Publier OrderCreated via RabbitMQ
        List<OrderItemEvent> itemEvents = items.stream()
            .map(i -> new OrderItemEvent(
                i.getProductId(), i.getProductName(),
                i.getQuantity(), i.getUnitPrice()
            )).collect(Collectors.toList());

        eventPublisher.publishOrderCreated(
            saved.getId(), saved.getOrderNumber(), saved.getClientId(),
            itemEvents, saved.getTotalAmount(),
            request.getClientEmail()
        );

        log.info("Commande créée : {}", saved.getOrderNumber());

        // 5. Notifier les admins/opérateurs
        try {
            Map<String, Object> notifAdmin = new HashMap<>();
            notifAdmin.put("type", "ORDER_CREATED");
            notifAdmin.put("title", "Nouvelle commande " + saved.getOrderNumber());
            notifAdmin.put("message", "Une nouvelle commande de " + saved.getTotalAmount() + " FCFA a été passée par " + saved.getClientEmail());
            notifAdmin.put("targetRole", "ROLE_ADMIN");
            notifAdmin.put("referenceId", saved.getId());
            notifAdmin.put("referenceType", "ORDER");
            notificationClient.createNotification(notifAdmin);

            Map<String, Object> notifOp = new HashMap<>(notifAdmin);
            notifOp.put("targetRole", "ROLE_OPERATOR");
            notificationClient.createNotification(notifOp);

            // Notifier le client lui-même (ciblé par son email)
            if (saved.getClientEmail() != null && !saved.getClientEmail().isBlank()) {
                Map<String, Object> notifClient = new HashMap<>();
                notifClient.put("type", "ORDER_CREATED");
                notifClient.put("title", "Commande confirmée");
                notifClient.put("message", "Votre commande " + saved.getOrderNumber() + " de " + saved.getTotalAmount() + " FCFA a bien été reçue. Vous serez notifié(e) à chaque étape.");
                notifClient.put("targetRole", saved.getClientEmail()); // email = seul ce client voit
                notifClient.put("referenceId", saved.getId());
                notifClient.put("referenceType", "ORDER");
                notificationClient.createNotification(notifClient);
            }
        } catch (Exception e) {
            log.warn("Impossible d'envoyer la notification de commande : {}", e.getMessage());
        }

        return toResponse(saved);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public OrderResponse getOrderById(Long id) {
        return toResponse(findById(id));
    }

    public List<OrderResponse> getOrdersByClient(Long clientId) {
        return orderRepository.findByClientId(clientId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse validateOrder(Long id) {
        Order order = findById(id);
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new InvalidStatusTransitionException(
                order.getStatus().name(), "VALIDATED");
        }
        order.setStatus(OrderStatus.VALIDATED);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, UpdateStatusRequest request) {
        Order order = findById(id);
        OrderStatus newStatus = request.getNewStatus(); // ✅ déjà OrderStatus
        validateTransition(order.getStatus(), newStatus);
        order.setStatus(newStatus);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse cancelOrder(Long id, String reason) {
        Order order = findById(id);
        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new InvalidStatusTransitionException(
                order.getStatus().name(), "CANCELLED");
        }
        order.setStatus(OrderStatus.CANCELLED);
        if (reason != null) order.setNotes(reason);
        return toResponse(orderRepository.save(order));
    }

    private void validateTransition(OrderStatus current, OrderStatus next) {
        boolean valid = switch (current) {
            case PENDING       -> next == OrderStatus.VALIDATED
                                   || next == OrderStatus.CANCELLED;
            case VALIDATED     -> next == OrderStatus.IN_PRODUCTION
                                   || next == OrderStatus.SHIPPED
                                   || next == OrderStatus.CANCELLED;
            case IN_PRODUCTION -> next == OrderStatus.SHIPPED;
            case SHIPPED       -> next == OrderStatus.DELIVERED;
            default            -> false;
        };
        if (!valid) {
            throw new InvalidStatusTransitionException(
                current.name(), next.name());
        }
    }

    private String generateOrderNumber() {
        return "ORD-" + LocalDateTime.now()
            .format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
    }

    private Order findById(Long id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new OrderNotFoundException(id));
    }

    private OrderResponse toResponse(Order order) {
        OrderResponse res = new OrderResponse();
        res.setId(order.getId());
        res.setOrderNumber(order.getOrderNumber());
        res.setClientId(order.getClientId());
        res.setClientEmail(order.getClientEmail());
        res.setStatus(order.getStatus());
        res.setTotalAmount(order.getTotalAmount());
        res.setShippingAddress(order.getShippingAddress());
        res.setNotes(order.getNotes());
        res.setCreatedAt(order.getCreatedAt());
        res.setUpdatedAt(order.getUpdatedAt());
        res.setItems(order.getItems().stream()
            .map(item -> {
                OrderItemResponse ir = new OrderItemResponse();
                ir.setId(item.getId());
                ir.setProductId(item.getProductId());
                ir.setProductName(item.getProductName());
                ir.setQuantity(item.getQuantity());
                ir.setUnitPrice(item.getUnitPrice());
                ir.setSubtotal(item.getUnitPrice() * item.getQuantity());
                return ir;
            }).collect(Collectors.toList()));
        return res;
    }
    
    public List<OrderResponse> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public List<OrderResponse> getOrdersByEmail(String email) {
        return orderRepository.findByClientEmail(email)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
}