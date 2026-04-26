package com.sfmc.notificationservice.repository;

import com.sfmc.notificationservice.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByOrderByCreatedAtDesc();
    List<Notification> findByReadFalseOrderByCreatedAtDesc();
    long countByReadFalse();
    List<Notification> findByTargetRoleInOrderByCreatedAtDesc(List<String> roles);
    long countByTargetRoleInAndReadFalse(List<String> roles);
}
