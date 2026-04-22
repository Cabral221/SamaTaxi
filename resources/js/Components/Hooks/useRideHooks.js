import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useRideHooks = (ride, onExit) => {
    const [status, setStatus] = useState(ride.status);
    const [isLoading, setIsLoading] = useState(false);

    // 1. Synchronisation initiale
    useEffect(() => {
        setStatus(ride.status);
    }, [ride.status]);

    useEffect(() => {
        if (!ride.id) return;

        const channel = window.Echo.private(`rides.${ride.id}`);

        // Écoute universelle du changement de statut
        channel.listen('.ride.started', () => setStatus('in_progress'));
        channel.listen('.ride.canceled', (e) => {
            const msg = e.canceledBy === 'driver' ? "Le chauffeur a annulé la course." : "Course annulée par le client.";
            alert(msg);
            onExit(); // On ferme la vue
        });

        return () => window.Echo.leave(`rides.${ride.id}`);
    }, [ride.id, onExit]);

    // 2. Heartbeat (Sécurité Serveur)
    useEffect(() => {
        const heartbeat = setInterval(async () => {
            if (navigator.onLine) {
                try {
                    const response = await axios.get('/api/rides/current');
                    // Si la course n'est plus là, on sort
                    if (!response.data.ride && ride.id) {
                        onExit('La course a été interrompue ou annulée.');
                    }
                } catch (error) {
                    console.error("Heartbeat fail", error);
                }
            }
        }, 30000);

        return () => clearInterval(heartbeat);
    }, [ride.id, onExit]);

    // 3. Actions API (Start, Complete, Cancel)
    const performAction = async (actionType) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`/api/rides/${ride.id}/${actionType}`);
            if (response.data.success) {
                if (actionType === 'start') setStatus('in_progress');
                if (actionType === 'complete') {
                    setStatus('completed');
                    return { success: true, reload: true };
                }
                if (actionType === 'cancel') onExit();
            }
            return { success: true };
        } catch (error) {
            alert(`Erreur lors de l'action : ${actionType}`);
            return { success: false };
        } finally {
            setIsLoading(false);
        }
    };

    return { status, setStatus, isLoading, setIsLoading, performAction };
};
