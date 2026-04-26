package com.sfmc.auth_service.config;

import com.sfmc.auth_service.entity.Role;
import com.sfmc.auth_service.entity.User;
import com.sfmc.auth_service.repository.RoleRepository;
import com.sfmc.auth_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // Créer les rôles
        for (String roleName : new String[]{"ROLE_USER", "ROLE_ADMIN", "ROLE_OPERATOR"}) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                roleRepository.save(new Role(roleName));
                System.out.println("Rôle créé : " + roleName);
            }
        }

        // Créer l'admin par défaut
        if (userRepository.findByUsername("adminP").isEmpty()) {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseThrow();

            User admin = new User();
            admin.setUsername("adminP");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setEmail("adminP@test.com");
            admin.setRoles(Set.of(adminRole));

            userRepository.save(admin);
            System.out.println("Admin créé : adminP@test.com / admin123");
        }
    }
}