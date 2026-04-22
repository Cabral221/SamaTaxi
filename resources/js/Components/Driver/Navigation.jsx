import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet-routing-machine';
import SamaRouting from '../Common/SamaRouting';
import { useRideHooks } from '../Hooks/useRideHooks';
import { Styles as style } from './NavigationStyle';

const taxiIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17]
});

function Navigation({ driverCoords, ride, onCancel, distanceRemaining }) {
    const { status, isLoading, performAction } = useRideHooks(ride, onCancel);

    // Hooks des handle trans
    const handleStartRide = () => performAction('start');
    const handleCompleteRide = async () => {
        const res = await performAction('complete');
        if(res.reload) window.location.reload();
    };
    const handleCancelRide = () => performAction('cancel');

    // Ecoute la notification d'annulation de la course
    useEffect(() => {
        // On écoute le canal spécifique de la course
        const channel = window.Echo.private(`rides.${ride.id}`);
        channel.listen('.ride.canceled', (e) => {
            console.log("❌ Course annulée par :", e.canceledBy);
            if(e.canceledBy === 'passenger') {
                alert("Le passager a annulé la course. Veuillez nous excuser.");
                onCancel();
            }
        });

        return () => window.Echo.leave(`rides.${ride.id}`);
    }, [ride.id]);

    // Préparation des coordonnées de destination (conversion en float par sécurité)
    // --- LOGIQUE DE VALIDATION CORRIGÉE ---
    const pickupCoords = {
        lat: parseFloat(ride?.pickup_lat),
        lng: parseFloat(ride?.pickup_lng)
    };

    const destCoords = {
        lat: parseFloat(ride?.destination_lat),
        lng: parseFloat(ride?.destination_lng)
    };

    const isValidPickup = !isNaN(pickupCoords.lat) && !isNaN(pickupCoords.lng);
    const isValidDest = !isNaN(destCoords.lat) && !isNaN(destCoords.lng);
    const isValidDriver = !isNaN(driverCoords?.lat) && !isNaN(driverCoords?.lng);

    // Déterminer la cible actuelle du tracé
    const currentDestination = status === 'in_progress' ? destCoords : pickupCoords;

    // Vérification globale avant de tenter d'afficher le tracé
    const canShowRoute = isValidDriver &&
        (status === 'in_progress' ? !isNaN(destCoords.lat) : !isNaN(pickupCoords.lat));

    if (!driverCoords || !driverCoords.lat || !ride || isLoading) {
        return (
            <div className="loader-container">
                <div className="loader"></div>
                <p>Chargement de votre position...</p>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative', backgroundColor: '#f1f2f6' }}>

            {/* 1. OVERLAY DISTANCE (TOP) */}
            <div style={style.distanceOverlay}>
                <div>
                    <p style={{ color: '#aaa', fontSize: '0.7em', margin: 0, textTransform: 'uppercase' }}>Reste à parcourir</p>
                    <p style={{ color: '#F8B803', fontSize: '1.4em', fontWeight: '900', margin: 0 }}>
                        {distanceRemaining
                            ? (distanceRemaining > 1000 ? `${(distanceRemaining / 1000).toFixed(1)} km` : `${distanceRemaining} m`)
                            : '--'
                        }
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#aaa', fontSize: '0.7em', margin: 0, textTransform: 'uppercase' }}>Recette</p>
                    <p style={{ color: 'white', fontSize: '1.4em', fontWeight: '900', margin: 0 }}>
                        {ride.price || ride.estimated_price} <small style={{fontSize: '0.6em'}}>FCFA</small>
                    </p>
                </div>
            </div>

            {/* 2. CARTE (Style Clean Light 2026) */}
            <MapContainer
                center={[driverCoords.lat, driverCoords.lng]}
                zoom={17}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                zoomControl={false}
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

                <Marker position={[driverCoords.lat, driverCoords.lng]} icon={taxiIcon} />
                <Marker position={[pickupCoords.lat, pickupCoords.lng]} />
                {!isNaN(destCoords.lat) && <Marker position={[destCoords.lat, destCoords.lng]} />}

                {canShowRoute && (
                    <SamaRouting from={driverCoords} to={currentDestination} color='#F8B803' />
                )}
            </MapContainer>

            {/* 3. ACTION CARD (BOTTOM) */}
            <div style={style.actionCard}>
                <div style={{ width: '40px', height: '4px', background: '#e0e0e0', margin: '0 auto 20px', borderRadius: '10px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2em', fontWeight: '800' }}>
                            {status === 'in_progress' ? "🚩 Destination" : "👤 Prise en charge"}
                        </h3>
                        <p style={{ margin: 0, color: '#636e72', fontSize: '0.9em' }}>
                            {status === 'in_progress' ? ride.destination_address : ride.passenger?.user?.name}
                        </p>
                    </div>
                    <a href={`tel:${ride.passenger?.user?.phone}`} style={{ padding: '12px', background: '#f1f2f6', borderRadius: '50%', textDecoration: 'none' }}>📞</a>
                </div>

                {/* BOUTON D'ACTION PRINCIPAL */}
                {status !== 'in_progress' ? (
                    <button onClick={handleStartRide} style={style.mainBtn('#2ecc71')}>
                        DÉMARRER LA COURSE
                    </button>
                ) : (
                    <button onClick={handleCompleteRide} style={style.mainBtn('#3498db')}>
                        TERMINER LA COURSE
                    </button>
                )}

                <button onClick={handleCancelRide} style={style.secondaryBtn}>
                    ANNULER
                </button>
            </div>
        </div>
    );
}

export default Navigation;
