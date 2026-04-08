import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// --- TRÈS IMPORTANT POUR VITE/WEBPACK ---
// On s'assure que Leaflet est attaché à window pour le plugin
window.L = L;

// Sous-composant pour gérer l'itinéraire
function Routing({ from, to }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !from || !to) return;

        // 1. Déclarer la fonction utilitaire en premier
        const extractCoord = (obj, latKeys, lngKeys) => {
            const latKey = latKeys.find(key => obj[key] !== undefined && obj[key] !== null);
            const lngKey = lngKeys.find(key => obj[key] !== undefined && obj[key] !== null);

            return {
                lat: latKey ? parseFloat(obj[latKey]) : NaN,
                lng: lngKey ? parseFloat(obj[lngKey]) : NaN
            };
        };

        // 2. Initialisation des variables
        const start = extractCoord(from, ['lat', 'latitude'], ['lng', 'longitude']);
        const end = extractCoord(to, ['pickup_lat', 'lat', 'latitude'], ['pickup_lng', 'lng', 'longitude']);

        // 3. Vérification de sécurité
        if (isNaN(start.lat) || isNaN(start.lng) || isNaN(end.lat) || isNaN(end.lng)) {
            console.warn("📍 Coordonnées en attente ou invalides...", { start, end });
            return;
        }

        // 4. Création du tracé
        console.log("🛣️ Tracé en cours entre :", start, "et", end);

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(start.lat, start.lng),
                L.latLng(end.lat, end.lng)
            ],
            lineOptions: {
                styles: [{ color: '#F8B803', weight: 6, opacity: 0.8 }]
            },
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false,
            createMarker: () => null
        }).addTo(map);

        return () => {
            if (map && routingControl) {
                map.removeControl(routingControl);
            }
        };
    }, [map, from, to]);

    return null;
}

function Navigation({ driverCoords, ride, onCancel }) {
    <button onClick={() => console.log("CONTENU DU RIDE :", ride)}>
        DEBUG DATA
    </button>
    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <div style={{
                position: 'absolute', top: 10, left: 10, right: 10,
                zIndex: 1000, background: 'white', padding: '15px', borderRadius: '10px'
            }}>
                <h4>En route vers {ride.passenger?.user?.name}</h4>
                <button onClick={onCancel} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px' }}>
                    Annuler la course
                </button>
            </div>

            <MapContainer center={[driverCoords.lat, driverCoords.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Routing
                    from={driverCoords}
                    to={{ lat: ride.pickup_lat, lng: ride.pickup_lng }}
                />
            </MapContainer>
        </div>
    );
}

export default Navigation;
