import React, { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';
import AddressInput from '../Common/AddressInput';

function OrderForm({ onOrderCreated }) {
    const [points, setPoints] = useState({
        pickup: { address: '', lat: null, lng: null },
        destination: { address: '', lat: null, lng: null }
    });
    const [details, setDetails] = useState({ distance: 0, price: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await axios.get(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
                    const address = res.data.features[0]?.properties.name || "Ma position actuelle";
                    setPoints(prev => ({
                        ...prev,
                        pickup: { address, lat: latitude, lng: longitude }
                    }));
                } catch (e) {
                    setPoints(prev => ({
                        ...prev,
                        pickup: { address: "Ma position", lat: latitude, lng: longitude }
                    }));
                }
            });
        }
    }, []);

    const getServerEstimation = async (distance, pickup) => {
        try {
            const response = await axios.get('/api/rides/estimate', {
                params: {
                    distance_km: distance / 1000,
                    lat: pickup.lat,
                    lng: pickup.lng
                }
            });
            if (response.data.success) {
                setDetails({
                    distance: distance,
                    price: response.data.estimation.price
                });
            }
        } catch (error) {
            console.error("Erreur d'estimation", error);
        }
    };

    useEffect(() => {
        if (points.pickup.lat && points.destination.lat) {
            const p1 = L.latLng(points.pickup.lat, points.pickup.lng);
            const p2 = L.latLng(points.destination.lat, points.destination.lng);
            const realDistance = Math.round(p1.distanceTo(p2) * 1.3);
            getServerEstimation(realDistance, points.pickup);
        }
    }, [points.pickup.lat, points.destination.lat]);

    const handleOrder = () => {
        if (details.price === 0) return;
        setLoading(true);
        axios.post('/api/rides', {
            pickup_lat: points.pickup.lat,
            pickup_lng: points.pickup.lng,
            destination_lat: points.destination.lat,
            destination_lng: points.destination.lng,
            pickup_address: points.pickup.address,
            destination_address: points.destination.address,
            price: details.price,
            distance_km: details.distance / 1000
        }).then(res => {
            onOrderCreated(res.data.ride);
        }).catch(err => {
            alert("Erreur lors de la commande.");
        }).finally(() => setLoading(false));
    };

    return (
        <div className="order-form-container">
            <h2 className="text-xl font-extrabold text-center mb-6 text-gray-800">Où allez-vous ? 🚕</h2>

            <AddressInput
                label="Départ"
                placeholder={points.pickup.address || "Point de départ..."}
                defaultValue={points.pickup.address}
                onSelect={(coords) => setPoints(prev => ({ ...prev, pickup: { address: coords.label, lat: coords.lat, lng: coords.lng } }))}
            />

            <AddressInput
                label="Destination"
                placeholder="Entrez votre destination..."
                onSelect={(coords) => setPoints(prev => ({ ...prev, destination: { address: coords.label, lat: coords.lat, lng: coords.lng } }))}
            />

            {details.price > 0 && (
                <div className="info-card">
                    <div>
                        <span className="block text-xs text-gray-400 uppercase font-bold">Distance</span>
                        <span className="font-bold text-gray-700">{(details.distance / 1000).toFixed(1)} km</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-xs text-gray-400 uppercase font-bold">Prix estimé</span>
                        <span className="font-black text-[#F8B803] text-xl">{details.price} FCFA</span>
                    </div>
                </div>
            )}

            <button
                onClick={handleOrder}
                disabled={!points.destination.lat || details.price === 0 || loading}
                className="btn-primary-taxi"
            >
                {loading ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Recherche...
                    </div>
                ) : 'COMMANDER SAMA TAXI'}
            </button>
        </div>
    );
}

export default OrderForm;
