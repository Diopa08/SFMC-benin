package com.sfmc.inventory_service.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final GatewayHeaderFilter gatewayHeaderFilter;

    public SecurityConfig(GatewayHeaderFilter gatewayHeaderFilter) {
        this.gatewayHeaderFilter = gatewayHeaderFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                // ✅ Ces endpoints sont appelés par Feign depuis order-service
                // sans passer par la Gateway — ils doivent être publics
                .requestMatchers(
                    "/api/inventory/**",
                    "/error"          // ← Spring Boot error forwarding
                ).permitAll()
                // Le reste nécessite une authentification
                .anyRequest().authenticated()
            )
            .addFilterBefore(
                gatewayHeaderFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    /**
     * Empêche Spring Boot d'enregistrer automatiquement le filtre dans la chaîne
     * servlet principale. Sans ça, OncePerRequestFilter le marque comme "déjà exécuté"
     * et il ne s'exécute plus dans la chaîne Spring Security → SecurityContextHolder vide → 403.
     */
    @Bean
    public FilterRegistrationBean<GatewayHeaderFilter> gatewayHeaderFilterRegistration(
            GatewayHeaderFilter filter) {
        FilterRegistrationBean<GatewayHeaderFilter> registration =
                new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}