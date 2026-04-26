package com.sfmc.notificationservice.service;

import com.sfmc.notificationservice.dto.CreateNotificationRequest;
import com.sfmc.notificationservice.model.Notification;
import com.sfmc.notificationservice.model.NotificationType;
import com.sfmc.notificationservice.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@Transactional
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    public Notification create(CreateNotificationRequest request) {
        Notification n = new Notification();
        n.setType(request.getType());
        n.setTitle(request.getTitle());
        n.setMessage(request.getMessage());
        n.setTargetRole(request.getTargetRole() != null ? request.getTargetRole() : "ALL");
        n.setReferenceId(request.getReferenceId());
        n.setReferenceType(request.getReferenceType());
        Notification saved = repository.save(n);
        log.info("Notification créée : [{}] {}", saved.getType(), saved.getTitle());
        return saved;
    }

    // Créé depuis un payload Map (appelé depuis d'autres services)
    public Notification createFromMap(Map<String, Object> payload) {
        Notification n = new Notification();
        n.setType(NotificationType.valueOf((String) payload.get("type")));
        n.setTitle((String) payload.get("title"));
        n.setMessage((String) payload.get("message"));
        n.setTargetRole(payload.getOrDefault("targetRole", "ALL").toString());
        if (payload.get("referenceId") != null) {
            n.setReferenceId(((Number) payload.get("referenceId")).longValue());
        }
        if (payload.get("referenceType") != null) {
            n.setReferenceType((String) payload.get("referenceType"));
        }
        return repository.save(n);
    }

    @Transactional(readOnly = true)
    public List<Notification> getAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Notification> getUnread() {
        return repository.findByReadFalseOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public long countUnread() {
        return repository.countByReadFalse();
    }

    @Transactional(readOnly = true)
    public List<Notification> getForUser(String email, List<String> roles) {
        List<String> targets = new java.util.ArrayList<>(roles);
        targets.add("ALL");
        if (email != null) targets.add(email);
        return repository.findByTargetRoleInOrderByCreatedAtDesc(targets);
    }

    @Transactional(readOnly = true)
    public long countUnreadForUser(String email, List<String> roles) {
        List<String> targets = new java.util.ArrayList<>(roles);
        targets.add("ALL");
        if (email != null) targets.add(email);
        return repository.countByTargetRoleInAndReadFalse(targets);
    }

    public Notification markAsRead(Long id) {
        Notification n = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Notification introuvable : " + id));
        n.setRead(true);
        return repository.save(n);
    }

    public void markAllAsRead() {
        List<Notification> unread = repository.findByReadFalseOrderByCreatedAtDesc();
        unread.forEach(n -> n.setRead(true));
        repository.saveAll(unread);
    }
}
