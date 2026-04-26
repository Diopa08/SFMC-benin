package com.sfmc.orderservice;

import com.sfmc.orderservice.dto.OrderDTO.*;
import com.sfmc.orderservice.event.BillingServiceClient;
import com.sfmc.orderservice.exception.OrderException.*;
import com.sfmc.orderservice.model.Order;
import com.sfmc.orderservice.model.OrderItem;
import com.sfmc.orderservice.model.OrderStatus;
import com.sfmc.orderservice.repository.OrderRepository;
import com.sfmc.orderservice.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires du OrderService
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private BillingServiceClient billingServiceClient;

    @InjectMocks
    private OrderService orderService;

    private Order mockOrder;

    @BeforeEach
    void setUp() {
        OrderItem item = new OrderItem();
        item.setId(1L);
        item.setProductId(10L);
        item.setProductName("Ciment CEM I");
        item.setQuantity(50);
        item.setUnitPrice(5000.0);

        mockOrder = new Order();
        mockOrder.setId(1L);
        mockOrder.setOrderNumber("CMD-20240101-0001");
        mockOrder.setClientId(100L);
        mockOrder.setStatus(OrderStatus.PENDING);
        mockOrder.setTotalAmount(250000.0);
        mockOrder.setItems(List.of(item));
    }

    // ─── Test : Création d'une commande ──────────────────────────────────────
    @Test
    @DisplayName("Devrait créer une commande avec succès")
    void createOrder_success() {
        OrderItemRequest itemReq = new OrderItemRequest(10L, "Ciment CEM I", 50, 5000.0);
        CreateOrderRequest request = new CreateOrderRequest(100L, List.of(itemReq), "Cotonou", null, "client@test.com");

        when(orderRepository.count()).thenReturn(0L);
        when(orderRepository.save(any(Order.class))).thenReturn(mockOrder);

        OrderResponse response = orderService.createOrder(request);

        assertThat(response).isNotNull();
        assertThat(response.getClientId()).isEqualTo(100L);
        assertThat(response.getStatus()).isEqualTo(OrderStatus.PENDING);
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    // ─── Test : Validation d'une commande PENDING ────────────────────────────
    @Test
    @DisplayName("Devrait valider une commande en statut PENDING")
    void validateOrder_success() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = orderService.validateOrder(1L);

        assertThat(response.getStatus()).isEqualTo(OrderStatus.VALIDATED);
    }

    // ─── Test : Validation d'une commande déjà validée (doit échouer) ────────
    @Test
    @DisplayName("Devrait lever une exception si la commande n'est pas PENDING")
    void validateOrder_alreadyValidated_throwsException() {
        mockOrder.setStatus(OrderStatus.VALIDATED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));

        assertThatThrownBy(() -> orderService.validateOrder(1L))
            .isInstanceOf(InvalidStatusTransitionException.class)
            .hasMessageContaining("VALIDATED");
    }

    // ─── Test : Changement d'état valide ─────────────────────────────────────
    @Test
    @DisplayName("Devrait changer le statut VALIDATED → SHIPPED")
    void updateStatus_validTransition() {
        mockOrder.setStatus(OrderStatus.VALIDATED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateStatusRequest req = new UpdateStatusRequest(OrderStatus.SHIPPED, null);
        OrderResponse response = orderService.updateOrderStatus(1L, req);

        assertThat(response.getStatus()).isEqualTo(OrderStatus.SHIPPED);
    }

    // ─── Test : Transition d'état invalide ───────────────────────────────────
    @Test
    @DisplayName("Devrait rejeter une transition d'état invalide PENDING → DELIVERED")
    void updateStatus_invalidTransition_throwsException() {
        mockOrder.setStatus(OrderStatus.PENDING);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(mockOrder));

        UpdateStatusRequest req = new UpdateStatusRequest(OrderStatus.DELIVERED, null);

        assertThatThrownBy(() -> orderService.updateOrderStatus(1L, req))
            .isInstanceOf(InvalidStatusTransitionException.class);
    }

    // ─── Test : Commande non trouvée ─────────────────────────────────────────
    @Test
    @DisplayName("Devrait lever OrderNotFoundException si la commande n'existe pas")
    void getOrderById_notFound() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrderById(999L))
            .isInstanceOf(OrderNotFoundException.class)
            .hasMessageContaining("999");
    }

    // ─── Test : Récupérer les commandes d'un client ──────────────────────────
    @Test
    @DisplayName("Devrait retourner les commandes d'un client")
    void getOrdersByClient_success() {
        when(orderRepository.findByClientId(100L)).thenReturn(List.of(mockOrder));

        List<OrderResponse> orders = orderService.getOrdersByClient(100L);

        assertThat(orders).hasSize(1);
        assertThat(orders.get(0).getClientId()).isEqualTo(100L);
    }
}
