import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Fix icônes Leaflet par défaut
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Icône spéciale pour le chauffeur (Taxi)
const taxiIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', // Exemple d'icône taxi
    iconSize: [35, 35],
    iconAnchor: [17, 17]
});

function Routing({ from, to }) {
    const map = useMap();
    const routingControlRef = useRef(null);

    // --- A. INITIALISATION UNIQUE ---
    useEffect(() => {
        if (!map) return;

        // On crée l'instance UNE SEULE FOIS
        const routingControl = L.Routing.control({
            waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
            lineOptions: {
                styles: [{ color: '#F8B803', weight: 6, opacity: 0.8 }]
            },
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true, // Pour le premier chargement
            show: false,
            createMarker: () => null
        }).addTo(map);

        routingControlRef.current = routingControl;

        // Nettoyage propre au démontage du composant
        return () => {
            if (routingControlRef.current && map) {
                try {
                    map.removeControl(routingControlRef.current);
                } catch (e) {
                    console.log("Nettoyage silencieux du routing");
                }
            }
        };
    }, [map]); // S'exécute seulement quand la map est prête

    // --- B. MISE À JOUR SANS CLIGNOTEMENT ---
    useEffect(() => {
        if (routingControlRef.current && from && to) {
            // Au lieu de recréer, on change juste les points de passage
            // Cela évite l'effet de "flash" jaune
            routingControlRef.current.setWaypoints([
                L.latLng(from.lat, from.lng),
                L.latLng(to.lat, to.lng)
            ]);

            // --- C. CENTRAGE AUTOMATIQUE ---
            // On force la carte à montrer les deux points (Chauffeur + Client)
            const bounds = L.latLngBounds([
                [from.lat, from.lng],
                [to.lat, to.lng]
            ]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [from.lat, from.lng, to.lat, to.lng]); // On surveille les changements de coordonnées

    return null;
}

function Navigation({ driverCoords, ride, onCancel, distanceRemaining }) {
    return (
        <div style={{ height: '100vh', width: '100%', position: 'relative' }}>

            {/* BANDEAU INFOS EN BAS */}
            <div style={{
                position: 'absolute', bottom: 30, left: 15, right: 15,
                zIndex: 1000, background: 'white', padding: '15px',
                borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                textAlign: 'center'
            }}>
                <h4 style={{ margin: '0 0 5px 0' }}>Client : {ride.passenger?.user?.name}</h4>

                {/* Affichage de la distance dynamique (reçue du parent via ton API) */}
                <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#F8B803', margin: '5px 0' }}>
                    📍 {distanceRemaining ? `${distanceRemaining} mètres` : 'Calcul...'}
                </p>

                <button onClick={onCancel} style={{
                    background: '#ff4d4d', color: 'white', border: 'none',
                    padding: '10px', borderRadius: '8px', width: '100%', fontWeight: 'bold'
                }}>
                    Annuler la course
                </button>
            </div>

            <MapContainer center={[driverCoords.lat, driverCoords.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* MARQUEUR CHAUFFEUR */}
                <Marker position={[driverCoords.lat, driverCoords.lng]} icon={taxiIcon}>
                    <Popup>Vous êtes ici</Popup>
                </Marker>

                {/* MARQUEUR CLIENT */}
                <Marker position={[ride.pickup_lat, ride.pickup_lng]}>
                    <Popup>Point de prise en charge</Popup>
                </Marker>

                <Routing
                    from={driverCoords}
                    to={{ lat: ride.pickup_lat, lng: ride.pickup_lng }}
                />
            </MapContainer>
        </div>
    );
}

export default Navigation;
