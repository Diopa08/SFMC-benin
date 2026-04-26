package com.sfmc.auth_service.config;

import java.util.UUID;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;

import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;

@Configuration
public class OAuth2ClientConfig {

    @Bean
    public RegisteredClientRepository registeredClientRepository(
            PasswordEncoder passwordEncoder) {

        RegisteredClient registeredClient =
                RegisteredClient.withId(
                        UUID.randomUUID().toString())

                        .clientId("gateway-client")

                        .clientSecret(
                                passwordEncoder.encode("secret"))

                        .clientAuthenticationMethod(
                                ClientAuthenticationMethod.CLIENT_SECRET_BASIC)

                        .authorizationGrantType(
                                AuthorizationGrantType.CLIENT_CREDENTIALS)

                        .scope("read")
                        .scope("write")

                        .build();

        return new InMemoryRegisteredClientRepository(
                registeredClient);
    }
}