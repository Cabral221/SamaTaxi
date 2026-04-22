import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import MapDisplay from '../Common/MapDisplay';
import Navigation from './Navigation';
import RideCard from '../Common/RideCard';
import DriverProfile from './DriverProfile';

const notificationSound = new Audio('/sounds/ride_requested.wav');

function Radar({ user, currentView, setCurrentView }) {
    const [newRides, setNewRides] = useState([]);
    const [activeRide, setActiveRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [coords, setCoords] = useState(null);
    const [distanceToPickup, setDistanceToPickup] = useState(null);
    const lastUpdateRef = useRef(0);

    // --- LOGIQUE AUDIO & GPS (Inchangée mais optimisée) ---
    useEffect(() => {
        const unlockAudio = () => {
            notificationSound.play().then(() => {
                notificationSound.pause();
                notificationSound.currentTime = 0;
            }).catch(() => {});
            document.removeEventListener('click', unlockAudio);
        };
        document.addEventListener('click', unlockAudio);

        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
                    setCoords(newPos);
                    const now = Date.now();
                    if (now - lastUpdateRef.current > 5000 && navigator.onLine) {
                        lastUpdateRef.current = now;
                        axios.post('/api/driver/location', newPos)
                            .then(res => {
                                if (res.data.active_ride_context) {
                                    setDistanceToPickup(res.data.active_ride_context.distance_to_pickup);
                                }
                            });
                    }
                },
                (error) => console.error(error),
                { enableHighAccuracy: true }
            );
            return () => {
                navigator.geolocation.clearWatch(watchId);
                document.removeEventListener('click', unlockAudio);
            };
        }
    }, []);

    // --- LOGIQUE WEBSOCKET & INITIAL FETCH (Sync avec ton backend) ---
    useEffect(() => {
        if (!coords) return;

        axios.get('/api/drivers/available-rides', { params: coords })
            .then(res => { if(res.data.success) setNewRides(res.data.available_rides); })
            .finally(() => setLoading(false));

        const channel = window.Echo.channel('available-rides');
        channel.listen('.ride.created', (e) => {
            notificationSound.play().catch(() => {});
            setNewRides(prev => prev.find(r => r.id === e.ride.id) ? prev : [e.ride, ...prev]);
        });

        channel.listen('.ride.accepted', (e) => {
            setNewRides(prev => prev.filter(ride => ride.id !== e.ride.id));
            if (user && Number(e.ride.driver.user.id) === Number(user.id)) {
                setActiveRide(e.ride);
            }
        });

        return () => window.Echo.leave('available-rides');
    }, [coords, user]);

    // --- CHECK ACTIVE RIDE ON LOAD (Pour gérer les cas de rafraîchissement) ---
    useEffect(() => {
        const checkActiveRide = async () => {
            setLoading(true);
            try {
                const response = await axios.get('/api/rides/current');
                if (response.data.ride) {
                    setActiveRide(response.data.ride);
                    // Si la course est encore en attente, on active la vue recherche
                    if (response.data.ride.status === 'accepted') {
                        // console.log("isSearching :", isSearching);
                        console.log("accepted Etat :", response.data.ride);
                        // setIsSearching(true);
                        // console.log("isSearching Bas :", isSearching);
                    } else if (response.data.ride.status === 'in_progress') {
                        console.log("in_progress Etat :", response.data.ride);
                    }
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de la course active", error);
            } finally {
                setLoading(false);
            }
        };

        checkActiveRide();
    }, []);

    const handleAccept = async (rideId) => {
        try {
            const response = await axios.post(`/api/rides/${rideId}/accept`);
            if (response.data.success) setActiveRide(response.data.ride);
        } catch (error) {
            alert("Cette course n'est plus disponible.");
        }
    };

    const renderContent = () => {
        // 1. La priorité ABSOLUE : Si l'utilisateur veut voir son profil ou l'historique
        // On vérifie currentView AVANT activeRide
        if (currentView === 'PROFILE') {
            // console.log("Affichage du profil pour l'utilisateur :", user);
            return (
                <div className="relative h-full w-full overflow-y-auto bg-gray-50">
                    <DriverProfile
                        user={user}
                        driverData={user.driver_data || {}}
                        onBack={(view) => setCurrentView(view)}
                    />
                </div>
            );
        }

        if (currentView === 'HISTORY') {
            return <div className="pt-24 px-6">Historique (Bientôt disponible)</div>;
        }

        // 2. Priorité SECONDAIRE : Si une course est en cours, on montre la Navigation
        if (activeRide) {
            return (
                <Navigation
                    driverCoords={coords}
                    ride={activeRide}
                    onCancel={() => setActiveRide(null)}
                    distanceRemaining={distanceToPickup}
                    setCurrentView={setCurrentView}
                />
            );
        }

        // 3. PAR DÉFAUT : On montre le Radar
        return (
            <>
                {/* 1. MAP BACKGROUND */}
                <div className="absolute inset-0 z-0">
                    <MapDisplay center={coords} rides={newRides} />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-white/80 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-[300px] h-[300px] border border-yellow-400/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-yellow-400/10 rounded-full animate-[ping_5s_linear_infinite]"></div>
                    </div>
                </div>

                {/* 2. TOP STATUS BAR (Radar Only) */}
                <div className="absolute top-24 left-6 right-6 z-10">
                    <div className="bg-slate-900/95 backdrop-blur-2xl p-4 rounded-[2.5rem] shadow-2xl border border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-4 ml-2">
                            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
                                <span className="animate-spin-slow text-lg">📡</span>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xs font-black text-white uppercase tracking-[0.2em] leading-none">Radar Actif</h1>
                            <p className="text-[9px] text-yellow-400/80 font-bold uppercase mt-1">Dakar • Live</p>
                        </div>
                    </div>

                    <div className="bg-white/10 px-5 py-2 rounded-2xl border border-white/5">
                        <span className="text-xs font-black text-white">{newRides.length} OFFRES</span>
                    </div>
                </div>
                {/* </div> */}

                {/* 3. LISTE DES COURSES (Radar Only) */}
                <div className="absolute bottom-8 left-0 right-0 z-10 px-6">
                    {/* ... Ton code actuel pour mapper les RideCards ... */}
                    {newRides.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-white text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            Scanning Area...
                        </p>
                    </div>
                    ) : (
                    <div className="flex flex-col gap-5 max-h-[55vh] overflow-y-auto no-scrollbar pb-10">
                        {newRides.map((ride, index) => (
                        <div
                            key={ride.id}
                            className="animate-in fade-in slide-in-from-bottom-10 duration-700 fill-mode-both"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            <RideCard ride={ride} onAccept={handleAccept} />
                        </div>
                        ))}
                    </div>
                    )}
                </div>

                {/* CSS pour cacher la scrollbar proprement */}
                <style dangerouslySetInnerHTML={{__html: `
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .animate-spin-slow { animation: spin-slow 8s linear infinite; }
                `}} />
            </>
        );

    }

    if (loading || !coords) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
            <div className="w-12 h-12 border-4 border-[#F8B803] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium animate-pulse">Initialisation du Radar...</p>
        </div>
    );

    return renderContent();
}


export default Radar;
