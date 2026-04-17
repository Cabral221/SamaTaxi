import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import MapDisplay from '../Common/MapDisplay';
import Navigation from './Navigation';
import RideCard from '../Common/RideCard';

const notificationSound = new Audio('/sounds/ride_requested.wav');

function Radar({ user }) {
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

    const handleAccept = async (rideId) => {
        try {
            const response = await axios.post(`/api/rides/${rideId}/accept`);
            if (response.data.success) setActiveRide(response.data.ride);
        } catch (error) {
            alert("Cette course n'est plus disponible.");
        }
    };

    if (activeRide) return <Navigation driverCoords={coords} ride={activeRide} onCancel={() => setActiveRide(null)} distanceRemaining={distanceToPickup} />;

    if (loading || !coords) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
            <div className="w-12 h-12 border-4 border-[#F8B803] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium animate-pulse">Initialisation du Radar...</p>
        </div>
    );

    return (
        <div className="relative h-screen w-full bg-slate-900 overflow-hidden">
            {/* CARTE EN BACKGROUND - Full Screen */}
            <div className="absolute inset-0 z-0">
                <MapDisplay center={coords} rides={newRides} />
            </div>

            {/* HEADER OVERLAY */}
            <div className="absolute top-4 left-4 right-4 z-10">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 flex justify-between items-center">
                    <div>
                        <h1 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            RADAR LIVE
                        </h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">SamaTaxi Chauffeur</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-sm font-black text-[#F8B803]">{newRides.length}</span>
                        <span className="text-[10px] text-gray-400 font-bold">DISPONIBLES</span>
                    </div>
                </div>
            </div>

            {/* LISTE DES COURSES - Horizontal Scroll ou Stack */}
            <div className="absolute bottom-8 left-0 right-0 z-10 px-4 flex flex-col gap-3">
                {newRides.length === 0 ? (
                    <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl text-white text-center text-sm border border-white/10">
                        En attente de nouvelles demandes dans votre zone...
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto no-scrollbar">
                        {newRides.map((ride) => (
                            <RideCard key={ride.id} ride={ride} onAccept={handleAccept} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


export default Radar;
