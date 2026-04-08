import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MapDisplay from '../Common/MapDisplay';
import Navigation from './Navigation';

function Radar() {
    const [newRides, setNewRides] = useState([]);
    const [activeRide, setActiveRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [coords, setCoords] = useState(null);

    // Initialisation du son (chargé une seule fois)
    const notificationSound = new Audio('/sounds/ride_requested.wav');
    const playNotification = () => {
        // .play() retourne une promesse pour gérer les blocages navigateurs
        notificationSound.play().catch(error => {
            console.warn("L'audio n'a pas pu être lu (attente d'une interaction utilisateur) :", error);
        });
    };

    useEffect(() => {
        // --- A. GEOLOCALISATION ---
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur");
            return;
        }

        // On suit la position en temps réel
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setCoords(newPos);
                // Optionnel : Envoyer la position au backend pour que les clients voient le chauffeur
                // On informe le serveur pour le tracking passager
                axios.post('/api/driver/location', newPos).catch(e => console.log("DB Update failed"));
            },
            (error) => console.error("Erreur GPS:", error),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        if (!coords) return; // On attend d'avoir les coordonnées avant de charger les courses

        // --- 1. CHARGEMENT INITIAL (Les courses déjà en attente) ---
        const fetchExistingRides = async () => {
            try {
                // On récupère le token (soit depuis le localStorage, soit depuis ta variable globale de test)
                const token = window.authToken || localStorage.getItem('token');

                const response = await axios.get('/api/drivers/available-rides', {
                    params: coords,
                    headers: {
                        'Authorization': `Bearer ${token}`, // Ajout du token ici
                        'Accept': 'application/json'
                    }
                });

                if (response.data.success) {
                    console.log(`📍 Position: ${coords.lat}, ${coords.lng} | 🚕 Courses trouvées:`, response.data.available_rides.length);
                    setNewRides(response.data.available_rides);
                }
            } catch (error) {
                console.error("Erreur chargement initial:", error.response?.status);
            } finally {
                setLoading(false);
            }
        };

        fetchExistingRides();

        // --- 2. ÉCOUTE TEMPS RÉEL (WebSockets) ---
        const channel = window.Echo.channel('available-rides');

        // Nouvelle course créée
        channel.listen('.ride.created', (e) => {
            console.log("🔔 WebSocket : Nouvelle course !", e);
            // 🔥 ON JOUE LE SON ICI
            playNotification();
            setNewRides((prev) => [e.ride, ...prev]);
        });
        // Course acceptée par quelqu'un d'autre
        channel.listen('.ride.accepted', (e) => {
            console.log("🔕 WebSocket : Course acceptée par un collègue", e);
            setNewRides((prev) => prev.filter(ride => ride.id !== e.ride.id));
        });

        return () => window.Echo.leave('available-rides');
    }, [coords]); // On recharge si la position change significativement

    // Action pour accepter une course
    const handleAccept = async (rideId) => {
        try {
            const response = await axios.post(`/api/rides/${rideId}/accept`, {});
            if (response.data.success) {
                // On récupère les détails de la course acceptée
                setActiveRide(response.data.ride);
            }
        } catch (error) {
            alert("Trop tard ! La course a été prise.");
        }
    };

    // 🔀 AIGUILLAGE DE VUE
    if (activeRide) {
        return (
            activeRide && (
                <Navigation
                driverCoords={coords}
                ride={activeRide}
                onCancel={() => setActiveRide(null)}
                />
            )
        );
    }


    if (!coords) return <div>Activation du GPS SamaTaxi...</div>;
    if (loading) return <div>Recherche des clients à proximité...</div>;

    return (
        <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
            <h3>🚕 Radar SamaTaxi (Live)</h3>

            {/* LA CARTE EST ICI */}
            <div style={{ height: '400px'}}>
                <MapDisplay center={coords} rides={newRides} />
            </div>

            {newRides.length === 0 && <p>Aucune course à proximité pour le moment...</p>}

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {newRides.map((ride) => (
                    <li key={ride.id} style={{
                        marginBottom: '10px',
                        padding: '15px',
                        background: '#fff',
                        borderRadius: '10px',
                        borderLeft: '5px solid #F8B803',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <strong>Client :</strong> {ride.passenger?.user?.name || 'Inconnu'} <br />
                        <strong>Prix :</strong> {ride.estimated_price} XOF <br />
                        {ride.distance_to_pickup && (
                            <small>📍 À {(ride.distance_to_pickup / 1000).toFixed(1)} km de vous</small>
                        )}
                        <br />
                        <button
                            onClick={() => handleAccept(ride.id)}
                            style={{
                                marginTop: '10px',
                                background: 'green',
                                color: 'white',
                                border: 'none',
                                padding: '8px 15px',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Accepter
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Radar;
