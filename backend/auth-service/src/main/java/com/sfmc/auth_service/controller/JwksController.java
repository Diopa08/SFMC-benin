package com.sfmc.auth_service.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.interfaces.RSAPublicKey;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
public class JwksController {

    private final RSAPublicKey publicKey;

    public JwksController(RSAPublicKey publicKey) {
        this.publicKey = publicKey;
    }

    @GetMapping("/oauth2/jwks")
    public Map<String, Object> jwks() {
        return Map.of("keys", List.of(Map.of(
            "kty", "RSA",
            "use", "sig",
            "alg", "RS256",
            "kid", "sfmc-key-1",
            "n", Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(publicKey.getModulus().toByteArray()),
            "e", Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(publicKey.getPublicExponent().toByteArray())
        )));
    }
}