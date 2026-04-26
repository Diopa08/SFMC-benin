package com.sfmc.auth_service.service;

import com.sfmc.auth_service.dto.LoginRequest;
import com.sfmc.auth_service.dto.LoginResponse;
import com.sfmc.auth_service.dto.RegisterRequest;
import com.sfmc.auth_service.entity.Role;
import com.sfmc.auth_service.entity.User;
import com.sfmc.auth_service.jwt.JwtService;
import com.sfmc.auth_service.repository.RoleRepository;
import com.sfmc.auth_service.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect");
        }

        // Extraire les noms des rôles → ["ROLE_ADMIN", "ROLE_USER"]
        Set<String> roles = user.getRoles().stream()
            .map(Role::getName)
            .collect(Collectors.toSet());

        String token = jwtService.generateToken(user.getEmail(), roles);
        return new LoginResponse(token);
    }

    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Email déjà utilisé");
        }

        // Récupérer le rôle ROLE_USER par défaut
        Role defaultRole = roleRepository.findByName("ROLE_USER")
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, "Rôle ROLE_USER introuvable"));

        User user = new User();
        user.setEmail(request.email());
        user.setUsername(request.email()); // ou ajouter username dans RegisterRequest
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of(defaultRole));
        userRepository.save(user);
    }
}