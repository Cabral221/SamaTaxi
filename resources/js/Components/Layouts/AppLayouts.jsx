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
    // 1. Renomme ton état pour qu'il serve aux deux rôles
    const [activeView, setActiveView] = useState('HOME');

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // Gestion de la vue interne quand non connecté : 'login' ou 'register' ou 'forgot'
    const [authView, setAuthView] = useState('login');
    // AJOUTER CECI : État de navigation pour le chauffeur
    const [driverView, setDriverView] = useState('RADAR');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const checkSession = async () => {
            try {
                const res = await axios.get('/api/v1/user');
                console.log("Réponse de l'API /user :", res.data.data);
                setUser(res.data.data);
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
        // 1. Stocker le token immédiatement
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // 2. Reset des vues de navigation pour éviter de rester bloqué sur une ancienne vue
        setActiveView('HOME');
        setDriverView('RADAR');

        // 3. Injecter l'utilisateur complet dans l'état
        setUser(userData);
    };

    const handleLogout = async () => {
        try {
        // 1. Appel API pour supprimer le token en base de données
            await axios.post('/api/v1/logout');
        } catch (error) {
            console.error("Erreur lors de la déconnexion API", error);
        } finally {
            // 2. Nettoyage TOTAL du localStorage pour éviter les amalgames
            localStorage.clear(); // Supprime le token et d'éventuels résidus

            // 3. Supprimer le header Authorization pour couper les accès aux requêtes suivantes
            delete axios.defaults.headers.common['Authorization'];

            // 4. Reset complet de tous les états de l'application
            setUser(null);
            setActiveView('HOME');
            setDriverView('RADAR');
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
    console.log("Utilisateur connecté :", user);

    return (
        <div className="min-h-screen bg-[#FBFBFB] selection:bg-yellow-200">
            <ConnectionAlert />

            {user ? (
                // --- INTERFACE CONNECTÉE ---
                <div className="flex flex-col h-screen overflow-hidden">
                    {/* Header Minimaliste 2026 */}
                    <Header user={user} onLogout={handleLogout} onViewChange={(view) => setActiveView(view)} />

                    <main className={`flex-1 relative pt-20 h-screen ${
                        (activeView === 'PROFILE' || activeView === 'HISTORY')
                            ? 'overflow-y-auto pb-20'
                            : 'overflow-hidden'
                    }`}>
                        {/* 🚕 Vue Chauffeur */}
                        {user.role === 'driver' && <Radar
                                                        key={user?.id}
                                                        user={user}
                                                        currentView={activeView}
                                                        setCurrentView={setActiveView} />}

                        {/* 👤 Vue Passager */}
                        {user.role === 'passenger' && <Index
                                                        key={user?.id}
                                                        user={user}
                                                        activeView={activeView}
                                                        onViewChange={setActiveView} />}

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
