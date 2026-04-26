package com.sfmc.auth_service.config;

import org.bouncycastle.util.io.pem.PemReader;  // ← import Bouncy Castle
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.InputStreamReader;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;

@Configuration
public class RsaKeyConfig {

    @Bean
    public RSAPrivateKey privateKey() throws Exception {
        try (var reader = new PemReader(
                new InputStreamReader(
                    getClass().getResourceAsStream("/private.pem")))) {
            byte[] content = reader.readPemObject().getContent();
            KeyFactory kf = KeyFactory.getInstance("RSA");
            return (RSAPrivateKey) kf.generatePrivate(new PKCS8EncodedKeySpec(content));
        }
    }

    @Bean
    public RSAPublicKey publicKey() throws Exception {
        try (var reader = new PemReader(
                new InputStreamReader(
                    getClass().getResourceAsStream("/public.pem")))) {
            byte[] content = reader.readPemObject().getContent();
            KeyFactory kf = KeyFactory.getInstance("RSA");
            return (RSAPublicKey) kf.generatePublic(new X509EncodedKeySpec(content));
        }
    }
}