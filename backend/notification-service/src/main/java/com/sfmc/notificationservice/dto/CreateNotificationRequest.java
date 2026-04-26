package com.sfmc.notificationservice.dto;

import com.sfmc.notificationservice.model.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateNotificationRequest {

    @NotNull(message = "Le type est obligatoire")
    private NotificationType type;

    @NotBlank(message = "Le titre est obligatoire")
    private String title;

    @NotBlank(message = "Le message est obligatoire")
    private String message;

    private String targetRole = "ALL";
    private Long referenceId;
    private String referenceType;

    // Getters & Setters
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }

    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }
}
