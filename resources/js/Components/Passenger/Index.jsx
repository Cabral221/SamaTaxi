import React, { useState, useEffect } from "react";
import axios from "axios";
import Navigation from "./Navigation";
import OrderForm from "./OrderForm";
import RideSearching from "./RideSearching"; // Import du nouveau composant

// En dehors ou au début du composant
const notificationSound = new Audio('/sounds/ride_requested.wav');

// Index.jsx du passager
function Index() {
    const [currentRide, setCurrentRide] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);

    const handleNewOrder = (ride) => {
        setCurrentRide(ride);
        setIsSearching(true); // On active l'écran d'attente
    };

    const handleCancelledRide = async () => {
        try {
            const response = await axios.post(`/api/rides/${currentRide.id}/cancel`);
            if (response.data.success) {
                setCurrentRide(null);
                setIsSearching(false);
            }
        } catch (error) {
            console.error("Erreur lors de l'annulation.", error);
        }
    }

    // Gestion Audio
    const playNotification = () => {
        notificationSound.currentTime = 0;
        notificationSound.play().catch(e => console.warn("Lecture bloquée"));
    };

    useEffect(() => {
        const unlockAudio = () => {
            notificationSound.play().then(() => {
                notificationSound.pause();
                notificationSound.currentTime = 0;
            }).catch(() => {});
            document.removeEventListener('click', unlockAudio);
        };
        document.addEventListener('click', unlockAudio);
        return () => document.removeEventListener('click', unlockAudio);
    }, []);

    // Echo Listeners
    useEffect(() => {
        if (currentRide && isSearching) {
            const channel = window.Echo.private(`rides.${currentRide.id}`)
                .listen('.ride.accepted', (e) => {
                    playNotification();
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                    setCurrentRide(e.ride);
                    setIsSearching(false);
                });
            return () => channel.stopListening('.ride.accepted');
        }
    }, [currentRide, isSearching]);

    // Check course active au chargement
    useEffect(() => {
        axios.get('/api/rides/current')
            .then(res => {
                if (res.data.ride) {
                    setCurrentRide(res.data.ride);
                    if (res.data.ride.status === 'requested') setIsSearching(true);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;

    return (
        <div className="max-w-[500px] mx-auto min-h-screen bg-white">
            {/* VUE RECHERCHE (Overlay) */}
            {isSearching && currentRide && (
                <RideSearching
                    ride={currentRide}
                    onCancel={handleCancelledRide}
                />
            )}

            {/* VUE PRINCIPALE */}
            {!currentRide ? (
                <OrderForm onOrderCreated={handleNewOrder} />
            ) : (
                <Navigation
                    ride={currentRide}
                    onCancelSuccess={() => setCurrentRide(null)}
                    onCompleted={() => setCurrentRide(null)}
                />
            )}
        </div>
    );
}

export default Index;
