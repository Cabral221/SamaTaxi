import React from 'react';
import { useEffect, useState } from 'react';

function Radar() {
    const [newRides, setNewRides] = useState([]);

    useEffect(() => {
        // On écoute le canal public 'available-rides'
        window.Echo.channel('available-rides')
            .listen('.ride.created', (e) => {
                console.log("🔔 Nouvelle course reçue via WebSocket !", e);
                setNewRides((prev) => [e.ride, ...prev]);
            });

        return () => window.Echo.leave('available-rides');
    }, []);

    return (
        <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
            <h3>🚕 Radar SamaTaxi (Live)</h3>
            {newRides.length === 0 && <p>En attente de commandes à Dakar...</p>}
            <ul>
                {newRides.map((ride, index) => (
                    <li key={index} style={{ marginBottom: '10px', color: 'green' }}>
                        <strong>Nouveau Client :</strong> {ride.passenger.user.name} <br />
                        <strong>Prix :</strong> {ride.estimated_price} XOF
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Radar;
