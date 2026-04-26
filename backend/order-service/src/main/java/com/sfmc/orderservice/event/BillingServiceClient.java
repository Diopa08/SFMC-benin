package com.sfmc.orderservice.event;



import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

// Feign client vers billing-service si appel synchrone nécessaire
@FeignClient(name = "billing-service")
public interface BillingServiceClient {

    @PostMapping("/billing/invoices/manual")
    void createInvoice(@RequestBody BillingRequest request);
}