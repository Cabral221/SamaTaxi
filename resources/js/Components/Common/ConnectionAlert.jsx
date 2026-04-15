import React, { useState, useEffect } from 'react';

const ConnectionAlert = () => {
    // On initialise l'état avec la valeur actuelle du navigateur
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        // On écoute les changements de réseau
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null; // Ne rien afficher si on est en ligne

    return (
        <div className="offline-alert">
            <span></span>
            Connexion perdue. Tentative de reconnexion...
        </div>
    );
};

export default ConnectionAlert;
