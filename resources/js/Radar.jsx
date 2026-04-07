import React, { useEffect, useState } from 'react';
import axios from 'axios';

// CONFIGURATION GLOBALE D'AXIOS
const token = window.authToken || localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
axios.defaults.headers.common['Accept'] = 'application/json';

function Radar() {
    const [newRides, setNewRides] = useState([]);
    const [loading, setLoading] = useState(true);

    // Coordonnées de test (Dakar Plateau)
    const testLocation = { lat: 14.6681, lng: -17.4344 };

    useEffect(() => {
        // --- 1. CHARGEMENT INITIAL (Les courses déjà en attente) ---
        const fetchExistingRides = async () => {
            try {
                // On récupère le token (soit depuis le localStorage, soit depuis ta variable globale de test)
                const token = window.authToken || localStorage.getItem('token');

                const response = await axios.get('/api/drivers/available-rides', {
                    params: testLocation,
                    headers: {
                        'Authorization': `Bearer ${token}`, // Ajout du token ici
                        'Accept': 'application/json'
                    }
                });

                if (response.data.success) {
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
            setNewRides((prev) => [e.ride, ...prev]);
        });

        // Course acceptée par quelqu'un d'autre
        channel.listen('.ride.accepted', (e) => {
            console.log("🔕 WebSocket : Course acceptée par un collègue", e);
            setNewRides((prev) => prev.filter(ride => ride.id !== e.ride.id));
        });

        return () => window.Echo.leave('available-rides');
    }, []);

    // Action pour accepter une course
    const handleAccept = async (rideId) => {
        try {
            // On récupère le token (soit depuis le localStorage, soit depuis ta variable globale de test)
            const token = window.authToken || localStorage.getItem('token');

            const response = await axios.post(`/api/rides/${rideId}/accept`, {}, { // {} pour le body vide
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            alert("Course acceptée ! En route.");
            // On la retire localement
            setNewRides((prev) => prev.filter(r => r.id !== rideId));
        } catch (error) {
            alert(error.response?.data?.message || "Erreur lors de l'acceptation");
        }
    };

    if (loading) return <div>Chargement du radar...</div>;

    return (
        <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
            <h3>🚕 Radar SamaTaxi (Live)</h3>

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
