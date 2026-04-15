import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Radar from '../Driver/Radar';
import Index from '../Passenger/Index';
import ConnectionAlert from '../Common/ConnectionAlert';

function AppLayout({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // On récupère l'identité de celui qui est connecté
        axios.get('/api/user')
            .then(res => {
                setUser(res.data);
                setLoading(false);
            })
            .catch(() => {
                setUser(null);
                setLoading(false);
            });
    }, []);

    console.log("Utilisateur connecté :", user);

    if (loading){
        return (
            <div className="loader-container">
                <div className="loader"></div>
                <p>Synchronisation de votre session...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Alerte de connexion */}
            <ConnectionAlert />

            {/* Ton Entête / Navbar ici */}
            <header className="bg-yellow-500 p-4 shadow-md">
                <h1 className="text-white font-bold">SamaTaxi - {user?.name}</h1>
            </header>

            <main className="p-4">
                {user ? (
                    <>
                        {/* 🚕 Cas Chauffeur */}
                        {user.role === 'driver' && <Radar user={user} />}

                        {/* 👤 Cas Passager (On vérifie explicitement le rôle) */}
                        {user.role === 'passenger' && <Index />}

                        {/* ⚠️ Cas inconnu (Sécurité) */}
                        {!user.role && <div>Erreur : Rôle utilisateur non défini.</div>}
                    </>
                ) : (
                    <div>Veuillez vous connecter</div>
                )}

                {/* Pour garder la flexibilité si tu as d'autres pages */}
                {children}
            </main>
        </div>
    );
}

export default AppLayout;
