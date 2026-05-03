import React, { useState, useEffect } from "react";
import axios from "axios";
import Navigation from "./Navigation";
import OrderForm from "./OrderForm";
import RideSearching from "./RideSearching";
import PassengerProfile from "./PassengerProfile";
import PassengerMap from "./PassengerMap";
import RideHistory from "./RideHistory";

const notificationSound = new Audio('/sounds/ride_requested.wav');

function Index({ user, activeView, onViewChange }) { // Récupère le user depuis AppLayout
    const [view, setView] = useState('HOME');

    const [currentRide, setCurrentRide] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [points, setPoints] = useState({
        pickup: { address: 'Localisation...', lat: 14.7167, lng: -17.4677 }, // Dakar par défaut
        destination: { address: '', lat: null, lng: null }
    });
    const [rideDetails, setRideDetails] = useState({ distance: 0, price: 0 });

    const handlePickupFromMap = (coords) => {
        setPoints(prev => ({
            ...prev,
            pickup: coords
        }));
    };

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

    // IMPORTANT : Synchronise la vue quand on clique dans le Header
    useEffect(() => {
        if (activeView) {
            setView(activeView);
        }
    }, [activeView]);

    // Géolocalisation initiale (une seule fois au montage de l'Index)
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await axios.get(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
                    const address = res.data.features[0]?.properties.name || "Ma position";
                    setPoints(prev => ({
                        ...prev,
                        pickup: { address, lat: latitude, lng: longitude }
                    }));
                } catch (e) {
                    setPoints(prev => ({ ...prev, pickup: { address: "Ma position", lat: latitude, lng: longitude } }));
                }
            });
        }
    }, []);

    // useEffet pour l'activation de l'audio
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
                    setCurrentRide(e.ride);
                    setIsSearching(false);
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
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
                    // console.log("Vérification de la course active au chargement :", res.data);
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

    // On modifie le rendu pour intercepter la vue PROFILE
    if (view === 'PROFILE') {
        return <PassengerProfile user={user} passenger={user.passenger_data} onBack={() => {
            setView('HOME');
            onViewChange('HOME'); // Notifie AppLayout pour remettre le scroll/état à zéro
        }} />;
    }else if (view === 'HISTORY') {
        return <RideHistory onBack={() => {
            setView('HOME');
            onViewChange('HOME'); // Pour synchroniser avec AppLayout
        }} />;
    }

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
                    <div className="relative h-screen w-full overflow-hidden bg-slate-50">
                        {/* LA CARTE (Prend tout l'espace en arrière-plan) */}
                        <div className="absolute inset-0 z-0">
                            <PassengerMap
                                pickup={points.pickup}
                                destination={points.destination}
                                onPickupChange={handlePickupFromMap} // Mise à jour quand on bouge la carte
                                rideDetails={rideDetails}
                            />
                        </div>

                        {/* HEADER FLOTTANT (Bonjour, Nom...) */}
                        <div className="absolute top-6 left-6 right-6 z-20 pointer-events-none">
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-4 duration-700">
                                <h2 className="text-3xl font-black text-gray-900 leading-tight tracking-tighter uppercase drop-shadow-sm">
                                    Bonjour, <br/> {user?.name?.split(' ')[0] || 'Passager'}
                                </h2>
                                <p className="text-[10px] font-black text-[#F8B803] uppercase tracking-[0.2em] bg-white/60 backdrop-blur-md px-2 py-1 rounded-lg inline-block">
                                    Dakar est à vous • 2026
                                </p>
                            </div>
                        </div>

                        {/* LE MARQUEUR "SUCETTE" FIXE AU CENTRE */}
                        {!points.destination.lat && (
                            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-full z-20 pointer-events-none flex flex-col items-center">
                                {/* Le cercle (bonbon) */}
                                <div className="w-10 h-10 bg-[#F8B803] border-4 border-black rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.3)] flex items-center justify-center animate-bounce">
                                    <div className="w-2 h-2 bg-black rounded-full"></div>
                                </div>
                                {/* La barre */}
                                <div className="w-1.5 h-8 bg-black -mt-1 rounded-b-full"></div>
                            </div>
                        )}

                        {/* FORMULAIRE FLOTTANT EN BAS */}
                        <div className="absolute bottom-6 left-6 right-6 z-20">
                            <div className="max-w-md mx-auto space-y-4">
                                {/* Formulaire de commande ultra-compact */}
                                <div className="bg-white rounded-[2.5rem] shadow-[0_22px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-2 animate-in slide-in-from-bottom-8 duration-700">
                                    <OrderForm
                                        points={points}
                                        setPoints={setPoints}
                                        onOrderCreated={handleNewOrder}
                                        setRideDetails={setRideDetails}
                                        rideDetails={rideDetails}
                                    />
                                </div>

                                {/* Suggestions en bas (Optionnel, tu peux les garder ou les masquer pour gagner de la place) */}
                                <div className="grid grid-cols-2 gap-3 opacity-90 animate-in fade-in duration-1000">
                                    <button className="bg-black text-white p-4 rounded-3xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                                        <span className="text-sm">🏠</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Maison</span>
                                    </button>
                                    <button className="bg-white text-black border border-gray-100 p-4 rounded-3xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                                        <span className="text-sm">💼</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Bureau</span>
                                    </button>
                                </div>
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
