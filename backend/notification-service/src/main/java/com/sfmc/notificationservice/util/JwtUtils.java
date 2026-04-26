package com.sfmc.notificationservice.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class JwtUtils {

    private static final Logger log = LoggerFactory.getLogger(JwtUtils.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    public static String extractEmail(HttpServletRequest request) {
        Map<String, Object> payload = decodePayload(request);
        if (payload == null) return null;
        Object sub = payload.get("sub");
        return sub != null ? sub.toString() : null;
    }

    @SuppressWarnings("unchecked")
    public static List<String> extractRoles(HttpServletRequest request) {
        Map<String, Object> payload = decodePayload(request);
        if (payload == null) return Collections.emptyList();
        Object roles = payload.get("roles");
        if (roles instanceof List) return (List<String>) roles;
        return Collections.emptyList();
    }

    private static Map<String, Object> decodePayload(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        try {
            String[] parts = header.substring(7).split("\\.");
            if (parts.length < 2) return null;
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = mapper.readValue(decoded, Map.class);
            return payload;
        } catch (Exception e) {
            log.warn("Erreur décodage JWT: {}", e.getMessage());
            return null;
        }
    }
}
