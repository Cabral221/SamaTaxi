import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, useMap, useMapEvents, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function FitRoute({ route }) {
    const map = useMap();

    useEffect(() => {
        if (route && route.length > 0) {
            // Créer un groupe de points pour calculer les limites
            const bounds = L.latLngBounds(route);
            map.fitBounds(bounds, {
                padding: [50, 50], // Marge de 50px sur les bords pour que ce ne soit pas trop serré
                maxZoom: 16        // Évite un zoom trop violent si la distance est minuscule
            });
        }
    }, [route, map]);

    return null;
}

// Sous-composant pour capturer les mouvements de la carte
function MapEvents({ onPickupChange, disabled }) {
    const map = useMapEvents({
        moveend: async () => {
            // Si on a déjà une destination, on bloque le changement de départ par mouvement
            if (disabled) return;

            const center = map.getCenter();
            try {
                // Reverse Geocoding via Photon
                const res = await axios.get(`https://photon.komoot.io/reverse?lon=${center.lng}&lat=${center.lat}`);
                const feature = res.data.features[0]?.properties;
                const address = feature.name || feature.street || "Position sélectionnée";

                onPickupChange({
                    address: address,
                    lat: center.lat,
                    lng: center.lng
                });
            } catch (e) {
                onPickupChange({
                    address: "Position sélectionnée",
                    lat: center.lat,
                    lng: center.lng
                });
            }
        },
    });
    return null;
}

// Recentrage automatique (utile quand on récupère la position GPS initiale)
function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center.lat && center.lng) {
            map.setView([center.lat, center.lng], 16);
        }
    }, [center.lat, center.lng]);
    return null;
}

function LocateControl({ onLocationFound }) {
    const map = useMap();

    const handleClick = () => {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            map.flyTo([latitude, longitude], 16);

            // Reverse geocoding pour mettre à jour l'adresse
            const res = await axios.get(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
            const address = res.data.features[0]?.properties.name || "Ma position";

            onLocationFound({ address, lat: latitude, lng: longitude });
        });
    };

    return (
        <div className="leaflet-top leaflet-right" style={{ marginTop: '80px', marginRight: '10px' }}>
            <button
                onClick={handleClick}
                className="bg-white p-3 rounded-full shadow-lg border border-gray-200 pointer-events-auto active:bg-gray-100"
                title="Ma position"
            >
                <span className="text-xl">🎯</span>
            </button>
        </div>
    );
}

// Prépare des icônes personnalisées (optionnel mais recommandé)
const startIcon = L.divIcon({
    html: `<div class="w-5 h-5 bg-[#000000] border-2 border-[#F8B803] rounded-full"></div>`,
    className: 'custom-div-icon',
    iconSize: [16, 16],
});

const endIcon = L.divIcon({
    html: `<div class="w-5 h-5 bg-[#F8B803] border-2 border-black rounded-full"></div>`,
    className: 'custom-div-icon',
    iconSize: [16, 16],
});

function PassengerMap({ pickup, destination, onPickupChange, rideDetails }) {
    const isLocked = !!destination.lat;
    const positions = [
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng]
    ];

    // const defaultPos = [14.7167, -17.4677];
    const [route, setRoute] = useState([]);

    // AUTO-DETECTION AU CHARGEMENT
    useEffect(() => {
        if (!pickup.lat && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                // Reverse geocoding pour l'adresse initiale
                try {
                    const res = await axios.get(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
                    const address = res.data.features[0]?.properties.name || "Ma position";
                    onPickupChange({ address, lat: latitude, lng: longitude });
                } catch (e) {
                    onPickupChange({ address: "Position actuelle", lat: latitude, lng: longitude });
                }
            });
        }
    }, []); // Une seule fois au montage

    useEffect(() => {
        const getRoute = async () => {
            if (pickup.lat && destination.lat) {
                try {
                    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

                    const response = await fetch(url);
                    const data = await response.json();

                    if (data.routes && data.routes[0]) {
                        const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                        setRoute(coordinates);
                    }
                } catch (e) {
                    console.error("Erreur itinéraire avec fetch:", e);
                    setRoute([[pickup.lat, pickup.lng], [destination.lat, destination.lng]]);
                }
            } else {
                setRoute([]);
            }
        };
        getRoute();
    }, [pickup.lat, pickup.lng, destination.lat, destination.lng]);

    return (
        <MapContainer center={[14.7167, -17.4677]} zoom={14} zoomControl={false} className="h-full w-full">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <FitRoute route={route} />
            {/* 1. MARQUEUR DE DÉPART :
                Il n'apparaît que SI une destination est choisie.
                Sinon, c'est la "sucette" (hors carte) qui fait le job. */}
            {destination.lat && pickup.lat && (
                <Marker position={[pickup.lat, pickup.lng]} icon={startIcon} />
            )}

            {/* 2. MARQUEUR DE DESTINATION :
                On s'assure d'utiliser les bonnes coordonnées de l'état actuel */}
            {destination.lat && (
                <Marker position={[destination.lat, destination.lng]} icon={endIcon}>
                    <Popup>Arrivée : {destination.address}</Popup>
                </Marker>
            )}

            {/* Tracé de l'itinéraire */}
            {route.length > 0 && (
                <>
                    <Polyline
                        positions={route}
                        pathOptions={{
                            color: '#745d20',
                            weight: 6,
                            opacity: 0.8,
                            lineJoin: 'round',
                            dashArray: isLocked ? '1, 0' : '10, 10'
                        }}
                    />
                    {/* Popup de distance au milieu du trajet */}
                    <Popup
                        position={route[Math.floor(route.length / 2)]} // Milieu de la liste des coordonnées
                        closeButton={false}
                        autoPan={false}
                        className="distance-popup"
                    >
                            <div className="bg-black text-white px-3 py-1 rounded-full font-bold text-xs text-center border-2 border-white shadow-lg">
                            {/* On récupère la distance km depuis l'API ou calculée */}
                            {parseFloat(rideDetails.distance / 1000).toFixed(1)} km
                            <div className="text-[#F8B803]">{ rideDetails.price?.toLocaleString() || 0 } CFA</div>
                        </div>
                    </Popup>

                </>
            )}

            <ChangeView center={pickup} />
            {pickup.lat && (
                <MapEvents onPickupChange={onPickupChange} disabled={!!destination.lat} />
            )}
            {/* Bouton Ma Position (LocateControl de l'étape précédente) */}
            <LocateControl onLocationFound={onPickupChange} />

        </MapContainer>
    );
}

export default PassengerMap;
