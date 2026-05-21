import React, { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';
import AddressInput from '../Common/AddressInput';
import { useToast } from '../Context/ToastContext';

function OrderForm({ onOrderCreated, points, setPoints, setRideDetails, rideDetails }) {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const getServerEstimation = async (distance, pickup) => {
        try {
            const response = await axios.get('/api/v1/rides/estimate', {
                params: {
                    distance_km: distance / 1000,
                    lat: pickup.lat,
                    lng: pickup.lng
                }
            });
            if (response.data.success) {
                setRideDetails({
                    distance: distance,
                    price: response.data.estimation.price
                });
            }
        } catch (error) {
            console.error("Erreur d'estimation", error);
        }
    };

    // Calcul de l'estimation quand les deux points sont présents
    useEffect(() => {
        // 1. Si l'un des deux points essentiels est manquant, on stoppe TOUT immédiatement
        if (!points.pickup?.lat || !points.destination?.lat) {
            setRideDetails({ distance: 0, price: 0 });
            return; // On sort direct, on ne cherche même pas à évaluer la suite
        }

        // 2. Si on a les deux points, on calcule la distance et on appelle le serveur
        const p1 = L.latLng(points.pickup.lat, points.pickup.lng);
        const p2 = L.latLng(points.destination.lat, points.destination.lng);
        const realDistance = Math.round(p1.distanceTo(p2) * 1.3);

        getServerEstimation(realDistance, points.pickup);

    }, [points.pickup?.lat, points.destination?.lat, setRideDetails]);

    const handleOrder = () => {
        if (rideDetails.price === 0) return;
        setLoading(true);
        axios.post('/api/v1/passenger/rides', {
            pickup_lat: points.pickup.lat,
            pickup_lng: points.pickup.lng,
            destination_lat: points.destination.lat,
            destination_lng: points.destination.lng,
            pickup_address: points.pickup.address,
            destination_address: points.destination.address,
            price: rideDetails.price,
            distance_km: rideDetails.distance / 1000
        }).then(res => {
            showToast("Course créée avec succès !", "success");
            onOrderCreated(res.data.ride);
        }).catch(err => {
            showToast("Erreur lors de la commande.", "error");
            console.error(err);
        }).finally(() => setLoading(false));
    };

    return (
        <div className="p-4 space-y-4">
            {/* Input Départ - On peut le laisser en lecture seule si on bouge la map */}
            <div className="relative">
                 <AddressInput
                    label="Départ"
                    placeholder="Point de départ..."
                    value={points.pickup.address}
                    onSelect={(coords) => setPoints(prev => ({ ...prev, pickup: { address: coords.label, lat: coords.lat, lng: coords.lng } }))}
                />
            </div>

            {/* Input Destination */}
            <div className="relative">
                <AddressInput
                    label="Destination"
                    placeholder="Où allez-vous ?"
                    onSelect={(coords) => setPoints(prev => ({ ...prev, destination: { address: coords.label, lat: coords.lat, lng: coords.lng } }))}
                />
            </div>

            {rideDetails.price > 0 && points.destination?.lat && (
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-3xl border border-gray-100 animate-in zoom-in-95">
                    <div>
                        <span className="block text-[8px] text-gray-400 uppercase font-black tracking-widest">Distance</span>
                        <span className="font-bold text-gray-900">{(rideDetails.distance / 1000).toFixed(1)} km</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-[8px] text-gray-400 uppercase font-black tracking-widest">Prix Fixe</span>
                        <span className="font-black text-[#F8B803] text-xl">{rideDetails.price.toLocaleString()} <small className="text-[10px]">CFA</small></span>
                    </div>
                </div>
            )}

            <button
                onClick={handleOrder}
                disabled={!points.destination.lat || rideDetails.price === 0 || loading}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 shadow-lg ${
                    !points.destination.lat ? 'bg-gray-100 text-gray-400' : 'bg-[#F8B803] text-black shadow-[#F8B803]/20 active:scale-95'
                }`}
            >
                {loading ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Traitement...
                    </div>
                ) : 'CONFIRMER LA COURSE'}
            </button>
        </div>
    );
}

export default OrderForm;
