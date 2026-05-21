import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import MapDisplay from '../Common/MapDisplay';
import Navigation from './Navigation';
import RideCard from '../Common/RideCard';
import DriverProfile from './DriverProfile';
import DriverHistory from './DriverHistory';
import PendingReview from './PendingReview';

const notificationSound = new Audio('/sounds/ride_requested.wav');

function Radar({ user, currentView, setCurrentView }) {
    // BARRIÈRE FLASH : Si l'objet user ou driver_data est en cours de chargement/absent, on attend.
    const hasUserData = user && user.id && user.driver_data;
    const isPending = hasUserData && user.driver_data.account_status === 'pending';

    const [newRides, setNewRides] = useState([]);
    const [activeRide, setActiveRide] = useState(null);
    // On force un état de chargement strict par défaut
    const [loading, setLoading] = useState(true);
    const [coords, setCoords] = useState(null);
    const [distanceToPickup, setDistanceToPickup] = useState(null);
    const lastUpdateRef = useRef(0);

    // Effet de synchronisation immédiat au changement d'utilisateur
    useEffect(() => {
        setNewRides([]);
        setActiveRide(null);
        setCoords(null);
        setDistanceToPickup(null);
        lastUpdateRef.current = 0;

        if (hasUserData) {
            setLoading(isPending ? false : true);
        }
    }, [user?.id, isPending, hasUserData]);

    // --- 1. LOGIQUE AUDIO & GPS ---
    useEffect(() => {
        if (!hasUserData || isPending) return;

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
                        axios.post('/api/v1/driver/location', newPos).catch(() => {});
                    }
                },
                (error) => {
                    console.error("Erreur GPS:", error);
                    setLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
            return () => {
                navigator.geolocation.clearWatch(watchId);
                document.removeEventListener('click', unlockAudio);
            };
        } else {
            setLoading(false);
        }
    }, [isPending, hasUserData]);

    // --- 2. LOGIQUE WEBSOCKET & INITIAL FETCH ---
    useEffect(() => {
        if (!hasUserData || isPending || !coords) return;

        axios.get('/api/v1/driver/available-rides', { params: coords })
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
    }, [coords, user?.id, isPending, hasUserData]);

    // --- 3. CHECK ACTIVE RIDE ON LOAD ---
    useEffect(() => {
        if (!hasUserData || isPending) return;

        const checkActiveRide = async () => {
            try {
                const response = await axios.get('/api/v1/driver/rides/current');
                if (response.data.ride) {
                    setActiveRide(response.data.ride);
                }
            } catch (error) {
                console.error("Erreur course active", error);
            }
        };

        checkActiveRide();
    }, [isPending, hasUserData]);

    const handleAccept = async (rideId) => {
        try {
            const response = await axios.post(`/api/v1/driver/rides/${rideId}/accept`);
            if (response.data.success) setActiveRide(response.data.ride);
        } catch (error) {
            alert("Cette course n'est plus disponible.");
        }
    };

    // =================================================================
    // --- 4. GESTION DES RENDUS CONDITIONNELS ---
    // =================================================================

    // SÉCURITÉ ABSOLUE : Si l'user change et que l'objet n'est pas prêt, on affiche un loader neutre
    if (!hasUserData) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Chargement du profil chauffeur...</p>
            </div>
        );
    }

    // PRIORITÉ 1 : Vues Profil / Historique
    if (currentView === 'PROFILE') {
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
        return (<DriverHistory onBack={() => setCurrentView('RADAR')} />);
    }

    // PRIORITÉ 2 : Si le compte est en pending, redirection immédiate vers le tampon
    if (isPending) {
        return <PendingReview user={user} />;
    }

    // PRIORITÉ 3 : Fix GPS (Pour les comptes validés)
    if (loading || !coords) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-[#F8B803] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium animate-pulse">Initialisation du Radar / Fix GPS...</p>
            </div>
        );
    }

    // PRIORITÉ 4 : Course active
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

    // PAR DÉFAUT : Le Radar actif
    return (
        <>
            <div className="absolute inset-0 z-0">
                <MapDisplay center={coords} rides={newRides} />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-white/80 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-[300px] h-[300px] border border-yellow-400/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-yellow-400/10 rounded-full animate-[ping_5s_linear_infinite]"></div>
                </div>
            </div>

            <div className="absolute top-24 left-6 right-6 z-10">
                <div className="bg-slate-900/95 backdrop-blur-2xl p-4 rounded-[2.5rem] shadow-2xl border border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-4 ml-2">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-[0_0_20px_rgba(248,184,3,0.5)]">
                                <span className="animate-spin-slow text-lg">📡</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xs font-black text-white uppercase tracking-[0.2em] leading-none">
                            Système Radar
                        </h1>
                        <p className="text-[9px] text-yellow-400/80 font-bold uppercase mt-1 tracking-widest">Recherche active • Dakar</p>
                    </div>
                </div>

                <div className="bg-white/10 px-5 py-2 rounded-2xl border border-white/5 mt-2 inline-block">
                    <span className="text-xs font-black text-white">
                        {newRides.length} <span className="text-yellow-400">DISPO</span>
                    </span>
                </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 z-10 px-6">
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

            <style dangerouslySetInnerHTML={{__html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            `}} />
        </>
    );
}

export default Radar;
