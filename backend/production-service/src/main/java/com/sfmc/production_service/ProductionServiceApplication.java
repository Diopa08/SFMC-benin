package com.sfmc.production_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@EnableDiscoveryClient
@EnableMethodSecurity
public class ProductionServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductionServiceApplication.class, args);
    }
}