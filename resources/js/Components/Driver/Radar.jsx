import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import MapDisplay from '../Common/MapDisplay';
import Navigation from './Navigation';

// En dehors ou au début du composant
const notificationSound = new Audio('/sounds/ride_requested.wav');

function Radar({ user }) {
    const [newRides, setNewRides] = useState([]);
    const [activeRide, setActiveRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [coords, setCoords] = useState(null);
    // 🔥 AJOUT : État pour la distance dynamique
    const [distanceToPickup, setDistanceToPickup] = useState(null);
    // Crée une variable useRef pour stocker le dernier envoi
    const lastUpdateRef = useRef(0);

    // 🔥 FONCTION POUR DÉBLOQUER L'AUDIO
    const unlockAudio = () => {
        notificationSound.play().then(() => {
            notificationSound.pause(); // On le lance et on le coupe direct
            notificationSound.currentTime = 0;
            console.log("🔊 Audio débloqué pour les notifications");
        }).catch(e => console.log("Attente d'interaction..."));

        // On retire l'écouteur après le premier clic pour ne pas polluer
        document.removeEventListener('click', unlockAudio);
    };

    useEffect(() => {
        document.addEventListener('click', unlockAudio);
        return () => document.removeEventListener('click', unlockAudio);
    }, []);

    const playNotification = () => {
        notificationSound.currentTime = 0; // On repart du début
        notificationSound.play().catch(error => {
            console.warn("Lecture bloquée :", error);
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


                // Limite les mises à jour à une toutes les 5 secondes
                const now = Date.now();
                if (now - lastUpdateRef.current > 5000) { // On n'envoie que toutes les 5 secondes
                    lastUpdateRef.current = now;
                    // axios.post('/api/driver/location', newPos)...

                    // 🔥 MODIFICATION : On récupère la distance renvoyée par ton API enrichie
                    axios.post('/api/driver/location', newPos)
                    .then(res => {
                        if (res.data.active_ride_context) {
                            setDistanceToPickup(res.data.active_ride_context.distance_to_pickup);
                        }
                    })
                    .catch(e => console.log("DB Update failed"));
                }
            },
            (error) => console.error("Erreur GPS:", error),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        if (!coords) return;

        // --- 1. CHARGEMENT INITIAL (Les courses déjà en attente) ---
        const fetchExistingRides = async () => {
            try {
                const token = window.authToken || localStorage.getItem('token');

                const response = await axios.get('/api/drivers/available-rides', {
                    params: coords,
                    headers: {
                        'Authorization': `Bearer ${token}`,
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

        channel.listen('.ride.created', (e) => {
            console.log("🔔 WebSocket : Nouvelle course !", e);
            playNotification();
            setNewRides((prev) => {
                // Vérifier si la course est déjà dans la liste (par son ID)
                const exists = prev.find(r => r.id === e.ride.id);
                if (exists) return prev; // Si elle existe, on ne change rien

                return [e.ride, ...prev]; // Sinon on l'ajoute
            });

        });

        channel.listen('.ride.accepted', (e) => {
            console.log("🔕 WebSocket : Course acceptée", e);

            // 1. On prépare l'objet enrichi
            const enrichedRide = {
                ...e.ride,
                driver: {
                    ...e.ride.driver,
                    lat: e.driverPosition?.lat,
                    lng: e.driverPosition?.lng
                }
            };

            // 2. On nettoie le radar pour tout le monde
            setNewRides((prev) => prev.filter(ride => ride.id !== e.ride.id));
            // 3. MISE À JOUR : On vérifie si c'est NOTRE ID (via le user)
            // Ici, je suppose que vous avez accès à l'utilisateur connecté
            if (user && Number(e.ride.driver.user.id) === Number(user.id)) {
                console.log("C'est ma course !", user);
                setActiveRide(enrichedRide);
            }
        });

        return () => window.Echo.leave('available-rides');
    }, [coords, user]);

    // Action pour accepter une course
    const handleAccept = async (rideId) => {
        try {
            const response = await axios.post(`/api/rides/${rideId}/accept`, {});
            if (response.data.success) {
                setActiveRide(response.data.ride);
            }
        } catch (error) {
            alert("Trop tard ! La course a été prise.");
        }
    };

    // 🔀 AIGUILLAGE DE VUE
    if (activeRide) {
        return (
            <Navigation
                driverCoords={coords}
                ride={activeRide}
                onCancel={() => setActiveRide(null)}
                distanceRemaining={distanceToPickup} // 🔥 ON PASSE LA DISTANCE ICI
            />
        );
    }


    if (!coords) return <div>Activation du GPS SamaTaxi...</div>;
    if (loading) return <div>Recherche des clients à proximité...</div>;

    return (
        <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
            <h3>🚕 Radar SamaTaxi (Live)</h3>

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
