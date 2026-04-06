# 🚕 SamaTaxi API (Backend)

SamaTaxi est une solution moderne de mise en relation entre chauffeurs et clients à Dakar. Cette API repose sur une architecture géospatiale robuste permettant le tracking en temps réel et le calcul intelligent des tarifs.

[![Laravel Version](https://img.shields.io/badge/Laravel-11.x-red.svg)](https://laravel.com)
[![PHP Version](https://img.shields.io/badge/PHP-8.4-777bb4.svg)](https://php.net)
[![Postgres](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.5-00416a.svg)](https://postgis.net/)

## 🚀 Fonctionnalités Clés

- **Moteur Géospatial (PostGIS)** : Calcul des distances réelles sur la sphère terrestre (SRID 4326).
- **Dispatching Intelligent** : Recherche instantanée du chauffeur disponible le plus proche du client.
- **Tracking Temps Réel** : Mise à jour dynamique de la position GPS des chauffeurs via API.
- **Algorithme de Tarification** : Calcul automatique basé sur la distance (Prise en charge + Prix/KM).
- **Geofencing** : Limitation des services à la zone de Dakar et banlieue (Diamniadio inclus).
- **Sécurité** : Authentification via Laravel Sanctum (en cours).

## 🛠️ Stack Technique

- **Framework :** Laravel 11 (Structure API optimisée)
- **Base de données :** PostgreSQL 16
- **Extension spatiale :** PostGIS 3.5
- **Langage :** PHP 8.4

## 📦 Installation

1. **Cloner le projet**
   ```bash
   git clone [https://github.com/TON_PSEUDO/samataxi-api.git](https://github.com/TON_PSEUDO/samataxi-api.git)
   cd samataxi-api

2. Installer les dépendances
    ```Bash
    composer install

3. Configuration de l'environnement
    ```Bash
    cp .env.example .env
    # Configurez vos accès PostgreSQL dans le .env
    php artisan key:generate

4. Migrations et PostGIS
    Assurez-vous que l'extension PostGIS est disponible sur votre serveur PostgreSQL, puis lancez :

    ```Bash
    php artisan migrate

🛣️ API Endpoints (Exemples)

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/estimate` | Estime le prix et trouve le taxi le plus proche |
| `PATCH` | `/api/driver/{id}/location` | Met à jour la position GPS d'un chauffeur |

    ```Bash
    {
        "distance_km": 15,
        "lat": 14.748,
        "lng": -17.515
    }

🗺️ Zone de Service

    Le système valide actuellement les requêtes dans un rayon de 40km autour de Dakar (Centre). Toute requête hors zone est automatiquement rejetée pour optimiser la flotte.
    📈 Roadmap

    [ ] Intégration du Frontend React (WayTrack Integration).

    [ ] Connexion avec le protocole Traccar pour les balises GPS.

    [ ] Système de notifications Push pour les chauffeurs.
