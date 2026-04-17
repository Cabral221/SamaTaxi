import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import axios from 'axios';

const taxiIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17]
});

function RoutingLayer({ from, to }) {
    const map = useMap();
    const routingControlRef = useRef(null);

    useEffect(() => {
        // AJOUTEZ parseFloat ICI AUSSI pour éviter le bug Leaflet
        // if (!map || !from?.lat || !from?.lng || !to?.lat || !to?.lng) return;
        if (!map || isNaN(parseFloat(from?.lat)) || isNaN(parseFloat(to?.lat))) return;

        const start = L.latLng(parseFloat(from.lat), parseFloat(from.lng));
        const end = L.latLng(parseFloat(to.lat), parseFloat(to.lng));

        try {

            if (routingControlRef.current) {
                routingControlRef.current.setWaypoints([start, end]);
            } else {
                routingControlRef.current = L.Routing.control({
                    waypoints: [start,end],
                    router: L.Routing.osrmv1({
                        serviceUrl: 'https://router.project-osrm.org/route/v1',
                        profile: 'driving',
                        timeout: 30000,
                    }),
                    lineOptions: {
                        styles: [{ color: '#2ecc71', weight: 5, opacity: 0.7 }],
                        extendToWaypoints: false,
                        missingRouteTolerance: 0
                    },
                    addWaypoints: false,
                    draggableWaypoints: false,
                    show: false,
                    createMarker: () => null
                }).addTo(map);
            }

        } catch (err) {
            console.error("Erreur initialisation RoutingControl:", err);
        }

        return () => {
            if (map && routingControlRef.current) {
                try {
                    map.removeControl(routingControlRef.current);
                    routingControlRef.current = null;
                } catch (e) {
                    console.warn("Leaflet cleanup safety catch:", e);
                }
            }
        };
    }, [map, from.lat, from.lng, to.lat, to.lng]);

    useEffect(() => {
        if (routingControlRef.current && from?.lat && to?.lat) {
            try {
                routingControlRef.current.setWaypoints([
                    L.latLng(from.lat, from.lng),
                    L.latLng(to.lat, to.lng)
                ]);
            } catch (e) {
                console.log("Erreur mise à jour waypoints:", e);
            }
        }
    }, [from.lat, from.lng, to.lat, to.lng]);

    return null;
}

function Navigation({ ride, onCancelSuccess, onCompleted }) {
    const [driverPos, setDriverPos] = useState(() => {
        if (ride.driver && ride.driver.lat && ride.driver.lng) {
            return { lat: parseFloat(ride.driver.lat), lng: parseFloat(ride.driver.lng) };
        }
        return null;
    });

    const [info, setInfo] = useState({ distance: 0, time: 0 });
    const [isCancelling, setIsCancelling] = useState(false);
    const [hasNotifiedArrival, setHasNotifiedArrival] = useState(false);
    const [rideStatus, setRideStatus] = useState(ride.status);

    // Calcul dynamique Distance / Temps
    useEffect(() => {
        if (!driverPos || !ride.pickup_lat) return;

        const targetLat = rideStatus === 'in_progress' ? parseFloat(ride.destination_lat) : parseFloat(ride.pickup_lat);
        const targetLng = rideStatus === 'in_progress' ? parseFloat(ride.destination_lng) : parseFloat(ride.pickup_lng);

        if (isNaN(targetLat) || isNaN(targetLng)) return;

        const p1 = L.latLng(driverPos.lat, driverPos.lng);
        const p2 = L.latLng(targetLat, targetLng);
        const distanceMeters = p1.distanceTo(p2);

        setInfo({
            distance: Math.round(distanceMeters),
            time: Math.ceil(distanceMeters / 400)
        });

    }, [driverPos, rideStatus, ride.pickup_lat, ride.destination_lat]);

    useEffect(() => {
        if (!ride.id) return;
        const token = localStorage.getItem('token');
        if (window.Echo.connector.options.auth) {
            window.Echo.connector.options.auth.headers.Authorization = `Bearer ${token}`;
        }
        const channel = window.Echo.private(`rides.${ride.id}`);

        //Ecoute les mouvements du chauffeur pour mettre à jour sa position en temps réel
        channel.listen('.driver.moved', (e) => {
            if (e.lat && e.lng) {
                setDriverPos({ lat: parseFloat(e.lat), lng: parseFloat(e.lng) });
            }
        });

        // Ecoute la notification de démarrage de la course
        channel.listen('.ride.started', (e) => {
            setRideStatus('in_progress');
        });

        // Ecoute la notification d'arrivée à destination du chauffeur
        channel.listen('.ride.completed', (e) => {
            setRideStatus('completed');
            console.log("🏁 Course terminée !", e);
            alert("Vous êtes arrivé à destination. Merci d'avoir choisi SamaTaxi !");
            // C'est ici que tu "décroches" le client
            // En appelant une fonction passée en props par le parent (ex: App.js ou Home.js)
            onCompleted();
        });

        // Ecoute la notification d'annulation de la course
        channel.listen('.ride.canceled', (e) => {
            console.log("❌ Course annulée par :", e.canceledBy);

            const message = e.canceledBy === 'driver'
                ? "Le chauffeur a dû annuler la course. Veuillez nous excuser."
                : "Course annulée.";


            // Appeler la fonction de sortie passée en props (onRideFinished ou onCancelSuccess)
            if (typeof onCancelSuccess === 'function') {
                alert(message);
                onCancelSuccess();
            } else {
                window.location.href = '/';
            }
        });

        return () => window.Echo.leave(`rides.${ride.id}`);
    }, [ride.id]);

    // On crée un intervalle qui vérifie l'état toutes les 30 secondes
    useEffect(() => {
        const heartbeat = setInterval(async () => {
            if (navigator.onLine) {
                try {
                    const response = await axios.get('/api/rides/current');
                    // Si l'application pense qu'on est en course mais que le serveur dit non
                    if (!response.data.ride && ride.id) {
                        console.log("Sync: La course n'existe plus sur le serveur.");
                        alert("La course a été interrompue ou annulée.");
                        onCancelSuccess(); // On appelle la fonction de sortie passée en props
                    }
                } catch (error) {
                    console.error("Heartbeat fail (probablement hors ligne)", error);
                }
            }else {
                console.log("Heartbeat ignoré : Mode hors-ligne détecté.");
            }
        }, 30000); // 30000 ms = 30 secondes

        // Très important : on nettoie l'intervalle quand on quitte le composant
        return () => clearInterval(heartbeat);
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

    // Gestion de l'affichage du prix (Fallback si ride.price est vide)
    const displayPrice = ride.price || ride.estimated_price || "0";

    return (
        <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
            {hasNotifiedArrival && rideStatus !== 'in_progress' && (
                <div style={{ position: 'absolute', top: 140, left: 20, right: 20, zIndex: 2000, background: '#2ecc71', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                    ✨ VOTRE CHAUFFEUR EST ARRIVÉ ! ✨
                </div>
            )}

            <div style={{ position: 'absolute', top: 20, left: 15, right: 15, zIndex: 1000, background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1em' }}>
                        {rideStatus === 'in_progress' ? "🚀 Course en cours" :
                         hasNotifiedArrival ? "🚕 Le chauffeur vous attend" : "⏳ Chauffeur en route"}
                    </h3>
                </div>

                <div style={{ background: rideStatus === 'in_progress' ? '#ebf5ff' : '#f1f9f4', padding: '10px', borderRadius: '8px', marginBottom: '10px', textAlign: 'center', borderLeft: `5px solid ${rideStatus === 'in_progress' ? '#3498db' : '#2ecc71'}` }}>
                    <p style={{ color: rideStatus === 'in_progress' ? '#2980b9' : '#27ae60', fontWeight: 'bold', margin: 0 }}>
                        {rideStatus === 'in_progress' ? "Arrivée prévue dans : " : "Le chauffeur est à : "}
                        <br />
                        {info.distance >= 1000 ? (info.distance / 1000).toFixed(1) + " km" : info.distance + " m"} ({info.time} min)
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85em', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <strong>Départ :</strong> {ride.pickup_address}
                    </div>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <strong>Arrivée :</strong> {ride.destination_address}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontWeight: 'bold' }}>
                        <span>Total : {ride.distance_km} km</span>
                        <span style={{ color: '#2ecc71' }}>{displayPrice} FCFA</span>
                    </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <small style={{ color: '#666' }}>Chauffeur : <strong>{ride.driver?.user?.name || "Assigné"}</strong></small>
                </div>
            </div>

            <MapContainer center={[parseFloat(ride.pickup_lat), parseFloat(ride.pickup_lng)]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <Marker position={[parseFloat(ride.pickup_lat), parseFloat(ride.pickup_lng)]}>
                    <Popup>Départ</Popup>
                </Marker>

                {ride.destination_lat && ride.destination_lng && (
                    <Marker position={[parseFloat(ride.destination_lat), parseFloat(ride.destination_lng)]}>
                        <Popup>Arrivée</Popup>
                    </Marker>
                )}

                {driverPos && driverPos.lat && (
                    <>
                        <Marker position={[driverPos.lat, driverPos.lng]} icon={taxiIcon} />
                        <RoutingLayer
                            from={driverPos}
                            to={rideStatus === 'in_progress'
                                ? { lat: parseFloat(ride.destination_lat), lng: parseFloat(ride.destination_lng) }
                                : { lat: parseFloat(ride.pickup_lat), lng: parseFloat(ride.pickup_lng) }
                            }
                        />
                    </>
                )}
            </MapContainer>

            {rideStatus !== 'in_progress' && (
                <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%' }}>
                    <button onClick={handleCancelRide} disabled={isCancelling} style={{ width: '100%', padding: '15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {isCancelling ? 'Annulation...' : 'ANNULER LA COURSE'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default Navigation;
