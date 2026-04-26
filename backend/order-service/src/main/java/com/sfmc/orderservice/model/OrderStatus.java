package com.sfmc.orderservice.model;

/**
 * États du cycle de vie d'une commande
 * Selon le cahier des charges SFMC
 */
public enum OrderStatus {
    PENDING,      // En attente - commande créée, pas encore validée
    VALIDATED,    // Validée - stock confirmé, prête pour traitement
    IN_PRODUCTION,// En production - si stock insuffisant
    SHIPPED,      // Expédiée - en cours de livraison
    DELIVERED,    // Livrée - commande complète
    CANCELLED     // Annulée
}
