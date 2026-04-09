import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Icône spéciale pour le chauffeur (Taxi)
const taxiIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17]
});

function Routing({ from, to }) {
    const map = useMap();
    const routingControlRef = useRef(null);

    useEffect(() => {
        if (!map || !from || !to) return;

        const routingControl = L.Routing.control({
            waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
            lineOptions: { styles: [{ color: '#F8B803', weight: 6, opacity: 0.8 }] },
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: false, // On gère le fitBounds manuellement pour plus de contrôle
            show: false,
            createMarker: () => null
        }).addTo(map);

        routingControlRef.current = routingControl;

        return () => {
            if (routingControlRef.current && map) map.removeControl(routingControlRef.current);
        };
    }, [map]);

    useEffect(() => {
        if (routingControlRef.current && from && to) {
            routingControlRef.current.setWaypoints([
                L.latLng(from.lat, from.lng),
                L.latLng(to.lat, to.lng)
            ]);

            // Centrage auto pour que le chauffeur voie toujours le client
            const bounds = L.latLngBounds([[from.lat, from.lng], [to.lat, to.lng]]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [from.lat, from.lng, to.lat, to.lng]);

    return null;
}

function Navigation({ driverCoords, ride, onCancel, distanceRemaining }) {
    // Si driverCoords est null au démarrage, on évite le crash
    if (!driverCoords) return <div style={{padding: '20px'}}>Initialisation du trajet...</div>;

    return (
        <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
            <div style={{
                position: 'absolute', bottom: 30, left: 15, right: 15,
                zIndex: 1000, background: 'white', padding: '15px',
                borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                textAlign: 'center'
            }}>
                <h4 style={{ margin: '0 0 5px 0' }}>Client : {ride.passenger?.user?.name || 'Client SamaTaxi'}</h4>
                <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#F8B803', margin: '5px 0' }}>
                    📍 {distanceRemaining ? `${distanceRemaining} mètres` : 'Calcul...'}
                </p>
                <p style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#333', margin: '5px 0' }}>
                    Prix : {ride.estimated_price} FCFA
                </p>
                <button onClick={onCancel} style={{
                    background: '#ff4d4d', color: 'white', border: 'none',
                    padding: '12px', borderRadius: '8px', width: '100%', fontWeight: 'bold', cursor: 'pointer'
                }}>
                    Annuler la course
                </button>
            </div>

            <MapContainer center={[driverCoords.lat, driverCoords.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[driverCoords.lat, driverCoords.lng]} icon={taxiIcon}>
                    <Popup>Vous êtes ici</Popup>
                </Marker>
                <Marker position={[ride.pickup_lat, ride.pickup_lng]}>
                    <Popup>Point de prise en charge</Popup>
                </Marker>
                <Routing from={driverCoords} to={{ lat: ride.pickup_lat, lng: ride.pickup_lng }} />
            </MapContainer>
        </div>
    );
}

export default Navigation;
