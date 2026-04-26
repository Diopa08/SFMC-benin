package com.sfmc.auth_service.service;

import com.sfmc.auth_service.dto.UserResponse;
import com.sfmc.auth_service.entity.Role;
import com.sfmc.auth_service.entity.User;
import com.sfmc.auth_service.repository.RoleRepository;
import com.sfmc.auth_service.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Lister tous les utilisateurs
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    // Récupérer un utilisateur par ID
    public UserResponse getUserById(Long id) {
        User user = findUserById(id);
        return toResponse(user);
    }

    // Assigner un rôle à un utilisateur
    @Transactional
    public void assignRole(Long userId, String roleName) {
        User user = findUserById(userId);

        Role role = roleRepository.findByName(roleName)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Rôle introuvable : " + roleName));

        if (user.getRoles().contains(role)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "L'utilisateur a déjà le rôle " + roleName);
        }

        user.getRoles().add(role);
        userRepository.save(user);
    }

    // Retirer un rôle d'un utilisateur
    @Transactional
    public void removeRole(Long userId, String roleName) {
        User user = findUserById(userId);

        Role role = roleRepository.findByName(roleName)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Rôle introuvable : " + roleName));

        if (!user.getRoles().contains(role)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "L'utilisateur n'a pas le rôle " + roleName);
        }

        // Empêcher de retirer le dernier rôle
        if (user.getRoles().size() == 1) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Impossible de retirer le dernier rôle");
        }

        user.getRoles().remove(role);
        userRepository.save(user);
    }

    // Supprimer un utilisateur
    @Transactional
    public void deleteUser(Long userId) {
        User user = findUserById(userId);
        userRepository.delete(user);
    }

    // Créer un utilisateur avec un rôle spécifique
    @Transactional
    public UserResponse createUserWithRole(String email, String password, String roleName) {
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email déjà utilisé");
        }

        Role role = roleRepository.findByName(roleName)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Rôle introuvable : " + roleName));

        User user = new User();
        user.setEmail(email);
        user.setUsername(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRoles(Set.of(role));
        return toResponse(userRepository.save(user));
    }

    // Méthode privée utilitaire
    private User findUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Utilisateur introuvable : " + id));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getRoles().stream()
                .map(Role::getName)
                .toList()
        );
    }
}