import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet-routing-machine';
import SamaRouting from '../Common/SamaRouting';
import { useRideHooks } from '../Hooks/useRideHooks';
import { navStyles as style } from './NavigationStyle';


const taxiIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17]
});

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
    // const [status, setStatus] = useState(ride.status);
    const { status, setStatus, isLoading, setIsLoading, performAction } = useRideHooks(ride, onCancelSuccess);

    // Calcul dynamique Distance / Temps
    useEffect(() => {
        if (!driverPos || !ride.pickup_lat) return;

        const targetLat = status === 'in_progress' ? parseFloat(ride.destination_lat) : parseFloat(ride.pickup_lat);
        const targetLng = status === 'in_progress' ? parseFloat(ride.destination_lng) : parseFloat(ride.pickup_lng);

        if (isNaN(targetLat) || isNaN(targetLng)) return;

        const p1 = L.latLng(driverPos.lat, driverPos.lng);
        const p2 = L.latLng(targetLat, targetLng);
        const distanceMeters = p1.distanceTo(p2);

        setInfo({
            distance: Math.round(distanceMeters),
            time: Math.ceil(distanceMeters / 400)
        });

    }, [driverPos, status, ride.pickup_lat, ride.destination_lat]);

    // useEffect pour les Echos
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

        // Ecoute la notification d'arrivée à destination du chauffeur
        channel.listen('.ride.completed', (e) => {
            setStatus('completed');
            console.log("🏁 Course terminée !", e);
            alert("Vous êtes arrivé à destination. Merci d'avoir choisi SamaTaxi !");
            // C'est ici que tu "décroches" le client
            // En appelant une fonction passée en props par le parent (ex: App.js ou Home.js)
            onCompleted();
        });

        return () => window.Echo.leave(`rides.${ride.id}`);
    }, [ride.id]);

    const handleCancelRide = async () => {
        if (window.confirm("Voulez-vous vraiment annuler la course ?")) performAction('cancel');
    };

    // Gestion de l'affichage du prix (Fallback si ride.price est vide)
    const displayPrice = ride.price || ride.estimated_price || "0";

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative', backgroundColor: '#f8f9fa' }}>

            {/* 1. NOTIFICATION ARRIVÉE (Overlay discret mais clair) */}
            {hasNotifiedArrival && status !== 'in_progress' && (
                <div style={style.arrivalBadge}>
                    <span style={{ fontSize: '1.2em' }}>🚕</span>
                    <span>Votre chauffeur est arrivé !</span>
                </div>
            )}

            {/* 2. HEADER INFO (Flottant en haut) */}
            <div style={style.headerCard}>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.8em', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {status === 'in_progress' ? "Destination" : "Le chauffeur arrive"}
                    </p>
                    <p style={{ margin: 0, fontWeight: '800', fontSize: '1.1em', color: '#2d3436' }}>
                        {info.distance >= 1000 ? (info.distance / 1000).toFixed(1) + " km" : info.distance + " m"}
                        <span style={{ color: '#2ecc71', marginLeft: '8px' }}>• {info.time} min</span>
                    </p>
                </div>
                <div style={style.priceBadge}>
                    {displayPrice} <small>FCFA</small>
                </div>
            </div>

            {/* 3. CARTE (Pleine page) */}
            <MapContainer
                center={[parseFloat(ride.pickup_lat), parseFloat(ride.pickup_lng)]}
                zoom={15}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                zoomControl={false} // On cache pour le look épuré
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                {/* ^ Utilisation d'un style de carte plus "Clean/Light" pour 2026 */}

                <Marker position={[parseFloat(ride.pickup_lat), parseFloat(ride.pickup_lng)]} />
                {ride.destination_lat && <Marker position={[parseFloat(ride.destination_lat), parseFloat(ride.destination_lng)]} />}

                {driverPos?.lat && (
                    <>
                        <Marker position={[driverPos.lat, driverPos.lng]} icon={taxiIcon} />
                        <SamaRouting
                            from={driverPos}
                            to={{
                                lat: status === 'in_progress' ? parseFloat(ride.destination_lat) : parseFloat(ride.pickup_lat),
                                lng: status === 'in_progress' ? parseFloat(ride.destination_lng) : parseFloat(ride.pickup_lng)
                            }}
                            color='#2ecc71'
                        />
                    </>
                )}
            </MapContainer>

            {/* 4. BOTTOM ACTION CARD (La pièce maîtresse) */}
            <div style={style.bottomCard}>
                <div style={style.dragHandle} />

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={style.driverAvatar}>
                        {ride.driver?.user?.name?.charAt(0) || "T"}
                    </div>
                    <div style={{ marginLeft: '12px' }}>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '1em' }}>{ride.driver?.user?.name || "Chauffeur"}</p>
                        <p style={{ margin: 0, fontSize: '0.85em', color: '#636e72' }}>Toyota Corolla • 4.8 ⭐</p>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <a href={`tel:${ride.driver?.user?.phone}`} style={style.phoneBtn}>📞</a>
                    </div>
                </div>

                <div style={style.addressBox}>
                    <div style={style.addressLine}>
                        <div style={{...style.dot, background: '#2ecc71'}} />
                        <span style={style.addressText}>{ride.pickup_address}</span>
                    </div>
                    <div style={{...style.addressLine, marginTop: '8px'}}>
                        <div style={{...style.dot, background: '#e74c3c'}} />
                        <span style={style.addressText}>{ride.destination_address}</span>
                    </div>
                </div>

                {status !== 'in_progress' && (
                    <button
                        onClick={handleCancelRide}
                        disabled={isCancelling}
                        style={style.cancelButton}
                    >
                        {isCancelling ? 'ANNULATION...' : 'ANNULER LA COURSE'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default Navigation;
