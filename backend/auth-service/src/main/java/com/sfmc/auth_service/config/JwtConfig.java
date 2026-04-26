package com.sfmc.auth_service.config;

import java.security.KeyPair;
import java.security.KeyPairGenerator;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;

@Configuration
public class JwtConfig {

    @Bean
    public JWKSource<SecurityContext> jwkSource()
            throws Exception {

        KeyPairGenerator generator =
                KeyPairGenerator.getInstance("RSA");

        generator.initialize(2048);

        KeyPair keyPair =
                generator.generateKeyPair();

        RSAKey rsaKey =
                new RSAKey.Builder(
                        (java.security.interfaces.RSAPublicKey)
                                keyPair.getPublic())
                        .privateKey(
                                (java.security.interfaces.RSAPrivateKey)
                                        keyPair.getPrivate())
                        .build();

        return (selector, context) ->
                selector.select(
                        new com.nimbusds.jose.jwk.JWKSet(rsaKey));
    }
}