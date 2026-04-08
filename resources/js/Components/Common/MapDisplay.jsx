import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction pour les icônes par défaut de Leaflet (bug classique avec Webpack/Vite)
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Petit sous-composant pour recentrer la carte quand les coordonnées changent
function ChangeView({ center }) {
    const map = useMap();
    map.setView(center, map.getZoom());
    return null;
}

function MapDisplay({ center, rides = [] }) {
    const position = [center.lat, center.lng];

    return (
        <MapContainer
            center={position}
            zoom={13}
            style={{ height: '400px', width: '100%', borderRadius: '10px' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <ChangeView center={position} />

            {/* Marqueur du Chauffeur (Modou) */}
            {center && center.lat && (
                <Marker position={[center.lat, center.lng]}>
                    <Popup>Vous êtes ici (Modou)</Popup>
                </Marker>
            )}

            {/* Marqueurs des courses disponibles */}
            {rides.map((ride) => {
                // 🛡️ SÉCURITÉ : On vérifie si les coordonnées existent avant de créer le Marker
                const lat = ride.pickup_lat || ride.lat;
                const lng = ride.pickup_lng || ride.lng;

                if (!lat || !lng) {
                    console.warn("Course ignorée sur la carte (coordonnées manquantes) :", ride);
                    return null;
                }

                return (
                    <Marker
                        key={ride.id}
                        position={[lat, lng]}
                    >
                        <Popup>
                            <strong>Client:</strong> {ride.passenger?.user?.name || 'Inconnu'} <br />
                            <strong>Prix:</strong> {ride.estimated_price} XOF
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}

export default MapDisplay;
