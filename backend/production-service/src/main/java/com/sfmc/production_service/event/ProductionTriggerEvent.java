package com.sfmc.production_service.event;

public record ProductionTriggerEvent(
	    Long orderId,
	    Long productId,
	    int quantityNeeded,
	    String priority,    // "HIGH", "NORMAL", "LOW"
	    String timestamp
	) {}
