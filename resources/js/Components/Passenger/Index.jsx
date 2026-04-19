import React, { useState, useEffect } from "react";
import axios from "axios";
import Navigation from "./Navigation";
import OrderForm from "./OrderForm";
import RideSearching from "./RideSearching";

const notificationSound = new Audio('/sounds/ride_requested.wav');

function Index({ user }) { // Récupère le user depuis AppLayout
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
    };

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
        setLoading(true);
        try {
            axios.get('/api/rides/current')
                .then(res => {
                    if (res.data.ride) {
                        setCurrentRide(res.data.ride);
                        if (res.data.ride.status === 'requested') setIsSearching(true);
                    }
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.log('Impossible de vérifier la course active', error);
            setLoading(false);
        }
    }, []);

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-white">
            <div className="w-10 h-10 border-4 border-[#F8B803] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="relative h-screen w-full overflow-hidden">
            {/* 1. VUE RECHERCHE (Overlay plein écran avec animation) */}
            {isSearching && currentRide && (
                <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-500">
                    <RideSearching
                        ride={currentRide}
                        onCancel={handleCancelledRide}
                    />
                </div>
            )}

            {/* 2. CONTENU PRINCIPAL */}
            <div className="mx-auto">
                {!currentRide ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Header Minimaliste 2026 */}
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-gray-900 leading-tight tracking-tighter uppercase">
                                Bonjour, <br/> {user?.name?.split(' ')[0] || 'Passager'}
                            </h2>
                            <p className="text-[10px] font-black text-[#F8B803] uppercase tracking-[0.2em]">
                                Dakar est à vous • 2026
                            </p>
                        </div>

                        {/* Formulaire de commande */}
                        <div className="bg-white rounded-[2.5rem] shadow-[0_22px_50px_rgba(0,0,0,0.05)] p-2">
                             <OrderForm onOrderCreated={handleNewOrder} />
                        </div>

                        {/* Suggestions Rapides (Esthétique) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/50 border border-gray-100 p-4 rounded-3xl flex items-center gap-3">
                                <span className="text-xl">🏠</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Maison</span>
                            </div>
                            <div className="bg-white/50 border border-gray-100 p-4 rounded-3xl flex items-center gap-3">
                                <span className="text-xl">💼</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Bureau</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 3. VUE NAVIGATION (Une fois la course acceptée) */
                    <div className="absolute inset-0 w-full animate-in zoom-in-95 duration-500">
                        <Navigation
                            ride={currentRide}
                            onCancelSuccess={() => setCurrentRide(null)}
                            onCompleted={() => setCurrentRide(null)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Index;
