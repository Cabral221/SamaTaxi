import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 1. Fonction pour récupérer l'estimation officielle du serveur
const getServerEstimation = async (distance) => {
    try {
        const response = await axios.get('/api/rides/estimate', {
            params: {
                distance_km: distance / 1000,
                lat: points.pickup.lat,
                lng: points.pickup.lng
            }
        });
        if (response.data.success) {
            setDetails({
                distance: distance,
                price: response.data.estimation.price // Le prix vient du Laravel !
            });
        }
    } catch (error) {
        alert(error.response?.data?.message || "Erreur d'estimation");
    }
};


function OrderForm({ onOrderCreated }) {
    const [points, setPoints] = useState({
        pickup: { address: '', lat: null, lng: null },
        destination: { address: '', lat: null, lng: null }
    });
    const [details, setDetails] = useState({ distance: 0, price: 0 });
    const [loading, setLoading] = useState(false);

    // DEPLACE LA FONCTION ICI pour qu'elle accède aux "points"
    const getServerEstimation = async (distance) => {
        try {
            const response = await axios.get('/api/rides/estimate', {
                params: {
                    distance_km: distance / 1000,
                    lat: points.pickup.lat,
                    lng: points.pickup.lng
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

    const searchAddress = async (type, query) => {
        if (query.length < 3) return;
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
            if (res.data[0]) {
                const { lat, lon, display_name } = res.data[0];
                setPoints(prev => ({
                    ...prev,
                    [type]: { address: display_name, lat: parseFloat(lat), lng: parseFloat(lon) }
                }));
            }
        } catch (e) { console.error("Erreur GPS", e); }
    };

    useEffect(() => {
        // On ne lance l'estimation QUE si on a les deux points
        if (points.pickup.lat && points.destination.lat) {
            const simulatedDistance = 5000;
            getServerEstimation(simulatedDistance);
        }
    }, [points.pickup.lat, points.destination.lat]);

    const handleOrder = () => {
        // SECURITE : On vérifie si le prix est chargé avant d'envoyer
        if (details.price === 0) {
            alert("Veuillez attendre l'estimation du prix...");
            return;
        }

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
        }).finally(() => setLoading(false));
    };

    return (
        <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '15px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center' }}>Où allez-vous ? 🚗</h2>

            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Lieu de départ (ex: Dakar Plateau)"
                    onBlur={(e) => searchAddress('pickup', e.target.value)}
                    style={inputStyle}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Destination (ex: Almadies)"
                    onBlur={(e) => searchAddress('destination', e.target.value)}
                    style={inputStyle}
                />
            </div>

            {/* AFFICHER LE PRIX SEULEMENT S'IL EST > 0 */}
            {details.price > 0 && (
                <div style={infoBoxStyle}>
                    <p>Distance estimée : <strong>{(details.distance / 1000).toFixed(1)} km</strong></p>
                    <p>Prix estimé : <strong style={{ color: '#27ae60', fontSize: '1.2em' }}>{details.price} FCFA</strong></p>
                </div>
            )}

            <button
                onClick={handleOrder}
                // LE BOUTON RESTE GRIS TANT QUE LE PRIX N'EST PAS ARRIVÉ DU SERVEUR
                disabled={!points.destination.lat || details.price === 0 || loading}
                style={{
                    ...buttonStyle,
                    background: (points.destination.lat && details.price > 0) ? '#2ecc71' : '#bdc3c7'
                }}
            >
                {loading ? 'Recherche de chauffeur...' : 'COMMANDER MAINTENANT'}
            </button>
        </div>
    );
}

// Styles rapides pour l'ergonomie
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const infoBoxStyle = { background: '#fff', padding: '10px', borderRadius: '8px', marginBottom: '15px', borderLeft: '5px solid #2ecc71' };
const buttonStyle = { width: '100%', padding: '15px', color: '#white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };

export default OrderForm;
