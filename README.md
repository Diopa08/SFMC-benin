# SFMC Bénin — Plateforme Microservices de Gestion Industrielle

> SFMC (Système de Gestion des Matériaux de Construction) est une plateforme web intégrée destinée aux entreprises béninoises du secteur BTP. Elle digitalise l'ensemble de la chaîne : de la commande client jusqu'à la livraison, en passant par la production et la facturation.

---

##  Problème résolu

Avant cette plateforme, la SFMC Bénin fonctionnait avec des processus **partiellement manuels** et des systèmes **hétérogènes non connectés**, ce qui entraînait :

-  Faible traçabilité des stocks et des mouvements
-  Erreurs fréquentes dans la gestion des inventaires
-  Aucune visibilité globale sur la production et les commandes
-  Délais dans la prise de décision faute de données en temps réel

Cette plateforme centralise et automatise les processus clés : **production → stock → commande → facturation → notification**, avec une architecture résiliente capable d'évoluer indépendamment par domaine métier.

---

##  Architecture du système         

La plateforme repose sur une **architecture microservices** basée sur le principe DDD (Domain-Driven Design). Chaque service est autonome, possède sa propre base de données et communique via REST (synchrone) ou événements (asynchrone via RabbitMQ).

```
                        ┌──────────────┐
                        │   Frontend   │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │  API Gateway │  ← Point d'entrée unique
                        └──────┬───────┘
                               │
          ┌────────────────────┼───────────────────────┐
          │                    │                       │
   ┌──────▼──────┐   ┌─────────▼──────┐   ┌───────────▼────────┐
   │ Auth Service│   │  User Service  │   │  Product Service   │
   └─────────────┘   └────────────────┘   └────────────────────┘
          │                    │                        │
   ┌──────▼──────┐   ┌─────────▼──────┐   ┌───────────▼────────┐
   │Order Service│   │Inventory Servic│   │Production Service  │
   └─────────────┘   └────────────────┘   └────────────────────┘
          │                    │                        │
   ┌──────▼──────┐   ┌─────────▼──────┐   ┌───────────▼────────┐
   │Billing Svc  │   │Notification Svc│   │Discovery Server    │
   └─────────────┘   └────────────────┘   └────────────────────┘
```

---

## Acteurs de la plateforme

Les 3 rôles utilisateurs
|************|******************************************************************************************************
| **Rôle**	 |                      **Uses cases**
|************|******************************************************************************************************
| ADMIN	     |          Gestionnaire	Tout : valider commandes, gérer stocks, production, facturation, livraisons
|************|******************************************************************************************************
| OPERATOR	 |          Employé	Opérations courantes : stocks, production, livraisons
|************|******************************************************************************************************
| USER	     |          Client	Passer commandes, voir ses factures, payer en ligne
|************|******************************************************************************************************

---

## Services disponibles

| Service | Description | Port |
|
| `api-gateway`         | Point d'entrée, routage et sécurité centralisée | `8080` |
| `auth-service`        | Authentification JWT/OAuth2, gestion des tokens | `8081` |
| `user-service`        | CRUD utilisateurs, gestion des rôles (RBAC) | `8082` |
| `product-service`     | Catalogue produits (ciment, fer, briques...) | `8083` |
| `inventory-service`   | Stocks multi-entrepôts, mouvements, seuils critiques | `8084` |
| `order-service`       | Cycle de vie des commandes (pending → validated → shipped) | `8085` |
| `production-service`  | Planification et suivi en temps réel de la fabrication | `8086` |
| `billing-service`     | Facturation, paiements, historique financier | `8087` |
| `notification-service`| Alertes email/SMS lors d'événements métier | `8088` |
| `discovery-server`    | Enregistrement dynamique des services (Eureka/Consul) | `8761` |
| `frontend`            | Interface utilisateur web | `3000` |

---

##  Prérequis

Avant de lancer le projet, assure-toi d'avoir installé :

- [Docker](https://www.docker.com/) `>= 20.x`
- [Docker Compose](https://docs.docker.com/compose/) `>= 2.x`
- [Java JDK](https://adoptium.net/) `>= 17` *(si lancement sans Docker)*
- [Node.js](https://nodejs.org/) `>= 18.x` *(pour le frontend uniquement)*
- [Maven](https://maven.apache.org/) `>= 3.8` *(si lancement sans Docker)*
- [Xamp](https://www.apachefriends.org)*(si lancement sans Docker)*

---

## Lancement rapide (Docker Compose)

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd SFMCMain
```

### 2. Configurer les variables d'environnement

Copie et adapte le fichier d'exemple si disponible, ou vérifie les variables dans `docker-compose.yml` :

```bash
# Variables typiques à vérifier
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
JWT_SECRET
KAFKA_BROKER (ou RABBITMQ_HOST)
SMTP_HOST, SMTP_PORT (pour les notifications)
```

### 3. Démarrer tous les services

```bash
docker-compose up --build
```

> **Note :** Le `discovery-server` doit démarrer en premier. Docker Compose gère les dépendances via `depends_on`, mais prévoir ~30 secondes pour que tous les services s'enregistrent.

### 4. Vérifier que tout tourne

```bash
docker-compose ps
```

Tous les services doivent afficher l'état `Up`.

### 5. Accéder à la plateforme

| Interface | URL |
|---|---|
| Frontend | [http://localhost:3000](http://localhost:3000) |
| API Gateway | [http://localhost:8080](http://localhost:8080) |
| Discovery Server (Eureka) | [http://localhost:8761](http://localhost:8761) |

---

## Arrêter les services

```bash
# Arrêter sans supprimer les volumes
docker-compose down

# Arrêter ET supprimer les données (reset complet)
docker-compose down -v
```

---

## Lancement en développement (sans Docker)

Si tu veux lancer un service individuellement pour le développer :

```bash
# Exemple pour order-service
cd order-service
mvn spring-boot:run
```

```bash
# Exemple pour le frontend
cd frontend
npm install
npm run dev
```

---

##  Sécurité

- Authentification via **JWT** (stateless) et **OAuth2** pour les intégrations externes
- Contrôle d'accès basé sur les rôles : **RBAC** (Admin, Opérateur, Client)
- Toutes les communications passent par l'**API Gateway sécurisée**
- Protection contre XSS, CSRF et injections SQL
- HTTPS obligatoire en production

---

##  Communication inter-services

| Mode | Protocole | Exemple |
|---|---|---|
| **Synchrone** | REST API (HTTP) | `Order Service → Inventory Service` (vérif stock) |
| **Asynchrone** | Événements (Kafka/RabbitMQ) | `OrderCreated`, `StockUpdated`, `ProductionFinished` |

---

##  Exigences non fonctionnelles

| Critère | Objectif |
|---|---|
| Performance | Temps de réponse < 2 secondes |
| Disponibilité | 99.9% uptime |
| Scalabilité | Horizontale (chaque service scale indépendamment) |
| Sécurité | Conforme aux standards OWASP |
| Maintenabilité | Services indépendants, déploiements isolés |

---

##  Structure du projet

```
SfmcApp/
│
├──  frontend/                      # Interface utilisateur web (React / Vue)
│   ├── src/
│   │   ├── components/               # Composants réutilisables
│   │   ├── pages/                    # Pages de l'application
│   │   ├── services/                 # Appels API vers le gateway
│   │   └── store/                    # Gestion d'état global
│   └── package.json
│
├──  backend/                        # Ensemble des microservices Java/Spring
│   │
│   ├──  auth-service/              # Authentification JWT & OAuth2
│   ├──  user-service/              # CRUD utilisateurs & gestion des rôles
│   ├──  product-service/           # Catalogue produits (ciment, fer, briques...)
│   ├──  production-service/        # Planification & suivi de fabrication
│   ├──  inventory-service/         # Stocks multi-entrepôts & mouvements
│   ├──  order-service/             # Cycle de vie des commandes
│   ├──  billing-service/           # Facturation & paiements
│   ├──  notification-service/      # Alertes email/SMS
│   ├──  api-gateway/               # Point d'entrée unique & routage
│   └──  discovery-server/          # Enregistrement dynamique (Eureka)
│
├── docker-compose.yml                # Orchestration de tous les services
├── .gitignore
└── README.md
```
Liens du rapport : https://docs.google.com/document/d/17S4_JvhPU2-dZUueA2ZTpJ8fp2G9xX56MmfoZ23UgsM/edit?tab=t.0


