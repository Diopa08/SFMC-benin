package com.sfmc.auth_service.jwt;

import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Set;

@Service
public class JwtService {

    private final RSAPrivateKey privateKey;
    private final RSAPublicKey publicKey;

    public JwtService(RSAPrivateKey privateKey, RSAPublicKey publicKey) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }

    public String generateToken(String email, Set<String> roles) {
        Instant now = Instant.now();

        return Jwts.builder()
            .subject(email)
            .claim("roles", roles)   // ["ROLE_ADMIN", "ROLE_USER"]
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(1, ChronoUnit.HOURS)))
            .signWith(privateKey)
            .compact();
    }

    public RSAPublicKey getPublicKey() {
        return publicKey;
    }
}