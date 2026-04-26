package com.sfmc.orderservice.exception;

public class OrderException {

    public static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(Long id) {
            super("Commande introuvable avec l'ID: " + id);
        }
    }

    public static class InvalidStatusTransitionException extends RuntimeException {
        public InvalidStatusTransitionException(String from, String to) {
            super("Transition invalide: " + from + " -> " + to + " n'est pas autorisee");
        }
    }
}