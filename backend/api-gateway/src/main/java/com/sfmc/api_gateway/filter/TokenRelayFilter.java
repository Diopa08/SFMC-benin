package com.sfmc.api_gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class TokenRelayFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
            .map(ctx -> ctx.getAuthentication())
            .filter(auth -> auth != null && auth.getPrincipal() instanceof Jwt)
            .map(auth -> (Jwt) auth.getPrincipal())
            .flatMap(jwt -> {
                String email = jwt.getSubject();

                // Extraire les rôles du token
                List<String> roles = jwt.getClaimAsStringList("roles");
                String rolesHeader = roles != null ? String.join(",", roles) : "";

                // ✅ Ajouter email et rôles en headers pour les microservices
                ServerWebExchange modifiedExchange = exchange.mutate()
                    .request(r -> r
                        .header("X-User-Email", email)
                        .header("X-User-Roles", rolesHeader)
                    )
                    .build();

                return chain.filter(modifiedExchange);
            })
            // Si pas de token (route publique), laisser passer
            .switchIfEmpty(chain.filter(exchange));
    }

    @Override
    public int getOrder() {
        return -1; // s'exécute avant tous les autres filtres
    }
}