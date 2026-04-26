package com.sfmc.auth_service.controller;

import com.sfmc.auth_service.dto.CreateUserRequest;
import com.sfmc.auth_service.dto.RoleRequest;
import com.sfmc.auth_service.dto.UserResponse;
import com.sfmc.auth_service.service.UserService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Créer un utilisateur avec rôle spécifique — ADMIN seulement
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> createUser(
            @RequestBody @Valid CreateUserRequest request) {
        UserResponse created = userService.createUserWithRole(
            request.email(), request.password(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Lister tous les utilisateurs — ADMIN seulement
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // Récupérer un utilisateur — ADMIN seulement
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // Assigner un rôle — ADMIN seulement
    @PostMapping("/{userId}/roles")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> assignRole(
            @PathVariable Long userId,
            @RequestBody @Valid RoleRequest request) {
        userService.assignRole(userId, request.roleName());
        return ResponseEntity.ok().build();
    }

    // Retirer un rôle — ADMIN seulement
    @DeleteMapping("/{userId}/roles/{roleName}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> removeRole(
            @PathVariable Long userId,
            @PathVariable String roleName) {
        userService.removeRole(userId, roleName);
        return ResponseEntity.ok().build();
    }

    // Supprimer un utilisateur — ADMIN seulement
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}