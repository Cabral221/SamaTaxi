import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

const taxiIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17]
});

function RoutingLayer({ from, to }) {
    const map = useMap();
    const routingControlRef = useRef(null);

    useEffect(() => {
        if (!map || !from || !to) return;

        const routingControl = L.Routing.control({
            waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
            lineOptions: { styles: [{ color: '#2ecc71', weight: 5, opacity: 0.7 }] },
            addWaypoints: false,
            draggableWaypoints: false,
            show: false,
            createMarker: () => null
        }).addTo(map);

        routingControlRef.current = routingControl;

        return () => {
            if (map && routingControlRef.current) map.removeControl(routingControlRef.current);
        };
    }, [map, from, to]);

    useEffect(() => {
        if (routingControlRef.current && from) {
            routingControlRef.current.setWaypoints([
                L.latLng(from.lat, from.lng),
                L.latLng(to.lat, to.lng)
            ]);
        }
    }, [from.lat, from.lng]);

    return null;
}

function Navigation({ ride, onCancelSuccess }) {
    // Initialisation intelligente : on prend la position du chauffeur dans l'objet ride
    const [driverPos, setDriverPos] = useState(() => {
        if (ride.driver && ride.driver.lat && ride.driver.lng) {
            return { lat: parseFloat(ride.driver.lat), lng: parseFloat(ride.driver.lng) };
        }
        return null;
    });

    const [info, setInfo] = useState({ distance: '...', time: '...' });
    const [isCancelling, setIsCancelling] = useState(false);

    // Calcul de la distance initiale dès que driverPos est connu
    useEffect(() => {
        if (driverPos && ride.pickup_lat) {
            const p1 = L.latLng(driverPos.lat, driverPos.lng);
            const p2 = L.latLng(ride.pickup_lat, ride.pickup_lng);
            const dist = Math.round(p1.distanceTo(p2));
            setInfo({
                distance: dist,
                time: Math.ceil(dist / 300)
            });
        }
    }, [driverPos, ride.pickup_lat]);

    // Écoute temps réel
    useEffect(() => {
        if (!ride.id) return;

        // Mise à jour du header auth pour Echo
        const token = localStorage.getItem('token');
        if (window.Echo.connector.options.auth) {
            window.Echo.connector.options.auth.headers.Authorization = `Bearer ${token}`;
        }

        const channel = window.Echo.private(`rides.${ride.id}`);
        channel.listen('.driver.moved', (e) => {
            console.log("✅ Live GPS Chauffeur :", e);
            setDriverPos({ lat: e.lat, lng: e.lng });
            if (e.distance_to_pickup) {
                setInfo({
                    distance: Math.round(e.distance_to_pickup),
                    time: Math.ceil(e.distance_to_pickup / 300)
                });
            }
        });

        return () => window.Echo.leave(`rides.${ride.id}`);
    }, [ride.id]);

    const handleCancelRide = async () => {
        if (!window.confirm("Voulez-vous vraiment annuler votre course ?")) return;
        setIsCancelling(true);
        try {
            const response = await axios.post(`/api/rides/${ride.id}/cancel`);
            if (response.data.success) onCancelSuccess();
        } catch (error) {
            alert("Erreur lors de l'annulation.");
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
            <div style={{
                position: 'absolute', top: 20, left: 15, right: 15, zIndex: 1000,
                background: 'white', padding: '15px', borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textAlign: 'center'
            }}>
                <h3 style={{ margin: 0 }}>Votre chauffeur arrive ! 🚕</h3>
                <p style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '1.1em', margin: '5px 0' }}>
                    📍 {info.distance} m ({info.time} min)
                </p>
                <small>Chauffeur : {ride.driver?.user?.name || "En route"}</small>
            </div>

            <MapContainer center={[ride.pickup_lat, ride.pickup_lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[ride.pickup_lat, ride.pickup_lng]}>
                    <Popup>Ma position</Popup>
                </Marker>
                {driverPos && (
                    <>
                        <Marker position={[driverPos.lat, driverPos.lng]} icon={taxiIcon} />
                        <RoutingLayer from={driverPos} to={{ lat: ride.pickup_lat, lng: ride.pickup_lng }} />
                    </>
                )}
            </MapContainer>

            <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%' }}>
                <button onClick={handleCancelRide} disabled={isCancelling} style={{
                    width: '100%', padding: '15px', background: '#e74c3c', color: 'white',
                    border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'
                }}>
                    {isCancelling ? 'Annulation...' : 'ANNULER LA COURSE'}
                </button>
            </div>
        </div>
    );
}

export default Navigation;
