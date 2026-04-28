package com.sfmc.billingservice.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.sfmc.billingservice.config.GatewayHeaderFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableScheduling
public class BillingConfig {
	
	private final GatewayHeaderFilter gatewayHeaderFilter;
	
	public BillingConfig(GatewayHeaderFilter gatewayHeaderFilter) {
        this.gatewayHeaderFilter = gatewayHeaderFilter;
    }
    @Bean(name = "billingFilterChain")
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/api/**").permitAll()
                .requestMatchers("/error").permitAll()
                .anyRequest().authenticated()
   )
        
            .addFilterBefore(
                gatewayHeaderFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public FilterRegistrationBean<GatewayHeaderFilter> gatewayHeaderFilterRegistration(
            GatewayHeaderFilter filter) {
        FilterRegistrationBean<GatewayHeaderFilter> registration =
                new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
