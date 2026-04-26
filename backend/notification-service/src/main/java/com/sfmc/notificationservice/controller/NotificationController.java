package com.sfmc.notificationservice.controller;

import com.sfmc.notificationservice.dto.CreateNotificationRequest;
import com.sfmc.notificationservice.model.Notification;
import com.sfmc.notificationservice.service.NotificationService;
import com.sfmc.notificationservice.util.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    // Endpoint utilisé par les autres microservices pour créer des notifications
    @PostMapping
    public ResponseEntity<Notification> create(@RequestBody Object payload) {
        if (payload instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) payload;
            return ResponseEntity.status(HttpStatus.CREATED).body(service.createFromMap(map));
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/typed")
    public ResponseEntity<Notification> createTyped(@RequestBody @Valid CreateNotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @GetMapping
    public List<Notification> getAll(HttpServletRequest httpRequest) {
        List<String> roles = JwtUtils.extractRoles(httpRequest);
        String email = JwtUtils.extractEmail(httpRequest);
        // L'admin voit toutes les notifications (vision globale)
        if (roles.isEmpty() || roles.contains("ROLE_ADMIN")) return service.getAll();
        return service.getForUser(email, roles);
    }

    @GetMapping("/unread")
    public List<Notification> getUnread(HttpServletRequest httpRequest) {
        List<String> roles = JwtUtils.extractRoles(httpRequest);
        String email = JwtUtils.extractEmail(httpRequest);
        if (roles.isEmpty() || roles.contains("ROLE_ADMIN")) return service.getUnread();
        return service.getForUser(email, roles).stream()
            .filter(n -> !n.isRead()).toList();
    }

    @GetMapping("/unread/count")
    public Map<String, Long> countUnread(HttpServletRequest httpRequest) {
        List<String> roles = JwtUtils.extractRoles(httpRequest);
        String email = JwtUtils.extractEmail(httpRequest);
        if (roles.isEmpty() || roles.contains("ROLE_ADMIN")) return Map.of("count", service.countUnread());
        return Map.of("count", service.countUnreadForUser(email, roles));
    }

    @PutMapping("/{id}/read")
    public Notification markAsRead(@PathVariable Long id) {
        return service.markAsRead(id);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        service.markAllAsRead();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Notification Service OK");
    }
}
