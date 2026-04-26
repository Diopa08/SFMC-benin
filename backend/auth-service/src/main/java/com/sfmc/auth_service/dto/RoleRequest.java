package com.sfmc.auth_service.dto;

import jakarta.validation.constraints.NotBlank;

public record RoleRequest(
    @NotBlank String roleName
) {}