import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import axios from 'axios';

const taxiIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17]
});

function Routing({ from, to }) {
    const map = useMap();
    const routingControlRef = useRef(null);

    // 1. Initialisation unique du contrôle
    useEffect(() => {
        if (!map) return;

        try {
            const routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(parseFloat(from.lat), parseFloat(from.lng)),
                    L.latLng(parseFloat(to.lat), parseFloat(to.lng))
                ],
                router: L.Routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1',
                    profile: 'driving',
                    timeout: 10000, // Réduit à 10s pour plus de réactivité
                }),
                lineOptions: {
                    styles: [{ color: '#F8B803', weight: 6, opacity: 0.8 }],
                    extendToWaypoints: false,
                    missingRouteTolerance: 0
                },
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: false,
                show: false,
                createMarker: () => null // On utilise nos propres Markers React
            }).addTo(map);

            routingControlRef.current = routingControl;
            console.log("Routing control initialisé avec succès");
        } catch (err) {
            console.error("Erreur initialisation Routing:", err);
        }

        return () => {
            if (routingControlRef.current && map) {
                try {
                    map.removeControl(routingControlRef.current);
                    routingControlRef.current = null;
                } catch (e) {
                    console.warn("Erreur lors du retrait du contrôle routing:", e);
                }
            }
        };
    }, [map]); // On ne l'initialise qu'une fois quand la map est prête

    // 2. Mise à jour dynamique des waypoints quand 'from' ou 'to' changent
    useEffect(() => {
        if (routingControlRef.current && from?.lat && to?.lat) {
            const start = L.latLng(parseFloat(from.lat), parseFloat(from.lng));
            const end = L.latLng(parseFloat(to.lat), parseFloat(to.lng));

            // Vérification anti-NaN avant de soumettre à Leaflet
            if (!isNaN(start.lat) && !isNaN(end.lat)) {
                routingControlRef.current.setWaypoints([start, end]);

                // Ajustement automatique de la vue
                const bounds = L.latLngBounds([start, end]);
                map.fitBounds(bounds, { padding: [70, 70], maxZoom: 17 });
            }
        }
    }, [from.lat, from.lng, to.lat, to.lng, map]);

    return null;
}

function Navigation({ driverCoords, ride, onCancel, distanceRemaining }) {
    const [status, setStatus] = useState(ride.status);


    // Synchronisation du statut si le parent le change
    useEffect(() => {
        setStatus(ride.status);
    }, [ride.status]);

    if (!driverCoords) return <div style={{padding: '20px'}}>Initialisation du trajet...</div>;

    const handleStartRide = async () => {
        try {
            const response = await axios.post(`/api/rides/${ride.id}/start`);
            if (response.data.success) {
                setStatus('in_progress');
                // Optionnel : re-centrer immédiatement
            }
        } catch (error) {
            console.error("Erreur démarrage:", error);
            alert("Impossible de démarrer la course.");
        }
    };

    // Préparation des coordonnées de destination (conversion en float par sécurité)
    // --- LOGIQUE DE VALIDATION CORRIGÉE ---
    const pickupCoords = {
        lat: parseFloat(ride.pickup_lat),
        lng: parseFloat(ride.pickup_lng)
    };

    const destCoords = {
        lat: parseFloat(ride.destination_lat),
        lng: parseFloat(ride.destination_lng)
    };

    const isValidPickup = !isNaN(pickupCoords.lat) && !isNaN(pickupCoords.lng);
    const isValidDest = !isNaN(destCoords.lat) && !isNaN(destCoords.lng);
    const isValidDriver = !isNaN(driverCoords.lat) && !isNaN(driverCoords.lng);

    // Déterminer la cible actuelle du tracé
    const currentDestination = status === 'in_progress' ? destCoords : pickupCoords;
    const canRenderRouting = isValidDriver && (status === 'in_progress' ? isValidDest : isValidPickup);

    return (
        <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
            <div style={{
                position: 'absolute', bottom: 30, left: 15, right: 15,
                zIndex: 1000, background: 'white', padding: '15px',
                borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                textAlign: 'center'
            }}>
                <h4 style={{ margin: '0 0 5px 0' }}>
                    {status === 'in_progress' ? '🚩 En route vers la destination' : `👤 Client : ${ride.passenger?.user?.name}`}
                </h4>

                {status !== 'in_progress' && (
                    <button onClick={handleStartRide} style={{
                        width: '100%', padding: '15px', background: '#2ecc71', color: 'white',
                        border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer',
                        marginBottom: '10px', fontSize: '1.1em'
                    }}>
                        DÉMARRER LA COURSE
                    </button>
                )}

                <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#F8B803', margin: '5px 0' }}>
                    📍 {distanceRemaining
                            ? (distanceRemaining > 1000 ? `${(distanceRemaining / 1000).toFixed(1)} km` : `${distanceRemaining} m`)
                            : 'Calcul...'
                        }
                </p>
                <p style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#333', margin: '5px 0' }}>
                    Prix : {ride.estimated_price || ride.price} FCFA
                </p>

                <button onClick={onCancel} style={{
                    background: '#ff4d4d', color: 'white', border: 'none',
                    padding: '12px', borderRadius: '8px', width: '100%', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px'
                }}>
                    Annuler la course
                </button>
            </div>

            <MapContainer center={[driverCoords.lat, driverCoords.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* 1. Toujours afficher le chauffeur */}
                <Marker position={[driverCoords.lat, driverCoords.lng]} icon={taxiIcon}>
                    <Popup>Votre position</Popup>
                </Marker>

                {/* 2. Marqueur Client : On l'affiche TOUJOURS si valide,
                   mais on change son texte selon le statut */}
                {isValidPickup && (
                    <Marker position={[pickupCoords.lat, pickupCoords.lng]}>
                        <Popup>{status === 'in_progress' ? "Lieu de prise en charge (Passé)" : "Client à récupérer"}</Popup>
                    </Marker>
                )}

                {/* 3. Marqueur Destination : On l'affiche dès qu'il est valide,
                   même si la course n'a pas commencé, pour que le chauffeur sache où il va */}
                {isValidDest && (
                    <Marker position={[destCoords.lat, destCoords.lng]}>
                        <Popup>Destination finale</Popup>
                    </Marker>
                )}

                {/* 4. Le Routing : On force la persistance */}
                {isValidDriver && (isValidPickup || isValidDest) && (
                    <Routing
                        key={status} // FORCE le rafraîchissement propre du tracé lors du changement de statut
                        from={driverCoords}
                        to={status === 'in_progress' ? (isValidDest ? destCoords : pickupCoords) : pickupCoords}
                    />
                )}
            </MapContainer>
        </div>
    );
}

export default Navigation;
