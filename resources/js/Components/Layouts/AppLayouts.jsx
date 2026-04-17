import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Register from '../Auth/Register'; // À importer
import ForgotPassword from '../Auth/ForgotPassword';
import Login from '../Auth/Login';      // À importer
import Header from './Header';
import Radar from '../Driver/Radar';
import Index from '../Passenger/Index';
import ConnectionAlert from '../Common/ConnectionAlert';

function AppLayout({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // Gestion de la vue interne quand non connecté : 'login' ou 'register' ou 'forgot'
    const [authView, setAuthView] = useState('login');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const checkSession = async () => {
            try {
                const res = await axios.get('/api/user');
                setUser(res.data);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    // Fonction pour centraliser la réussite de l'auth
    const handleAuthSuccess = (userData, token) => {
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const handleLogout = async () => {
        try {
            // 1. Appel API pour supprimer le token en base de données
            await axios.post('/api/logout');
        } catch (error) {
            console.error("Erreur lors de la déconnexion API", error);
        } finally {
            // 2. Nettoyage local (qu'importe si l'API a réussi ou non)
            localStorage.removeItem('token');

            // 3. Supprimer le header Authorization pour les prochaines requêtes
            delete axios.defaults.headers.common['Authorization'];

            // 4. Reset de l'état utilisateur (provoque le basculement vers Login)
            setUser(null);
            setAuthView('login');
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-[#F8B803] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold animate-pulse tracking-tighter uppercase text-xs">
                    SamaTaxi • Synchronisation...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FBFBFB] selection:bg-yellow-200">
            <ConnectionAlert />

            {user ? (
                // --- INTERFACE CONNECTÉE ---
                <div className="flex flex-col h-screen overflow-hidden">
                    {/* Header Minimaliste 2026 */}
                    <Header user={user} onLogout={handleLogout}/>

                    <main className="flex-1 relative overflow-hidden pt-20">
                        {/* 🚕 Vue Chauffeur */}
                        {user.role === 'driver' && <Radar user={user} />}

                        {/* 👤 Vue Passager */}
                        {user.role === 'passenger' && <Index user={user} />}

                        {/* ⚠️ Sécurité Rôle */}
                        {!user.role && (
                            <div className="p-10 text-center">
                                <p className="text-red-500 font-bold">Erreur : Profil non configuré.</p>
                            </div>
                        )}

                        {children}
                    </main>
                </div>
            ) : (
                // --- INTERFACE AUTHENTIFICATION ---
                <div className="h-screen">
                    {authView === 'login' ? (
                        <Login
                            onSuccess={handleAuthSuccess}
                            onSwitch={() => setAuthView('register')}
                            onForgot={() => setAuthView('forgot')} // On passe la fonction
                        />
                    ) : authView === 'register' ? (
                        <Register
                            onSuccess={handleAuthSuccess}
                            onSwitch={() => setAuthView('login')}
                        />
                    ) : (
                        <ForgotPassword onBack={() => setAuthView('login')} />
                    )}
                </div>
            )}
        </div>
    );
}

export default AppLayout;
