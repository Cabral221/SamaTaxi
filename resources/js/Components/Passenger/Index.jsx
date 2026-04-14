import React, {useState, useEffect} from "react";
import Navigation from "./Navigation";
import OrderForm from "./OrderForm";

// En dehors ou au début du composant
const notificationSound = new Audio('/sounds/ride_requested.wav');

// Index.jsx du passager
function Index() {
    const [currentRide, setCurrentRide] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);

    const handleNewOrder = (ride) => {
        setCurrentRide(ride);
        setIsSearching(true); // On active l'écran d'attente
    };

    const handleCancelledRide = async () => {
        // Ici tu peux aussi appeler une API pour annuler la course
        try {
            const response = await axios.post(`/api/rides/${currentRide.id}/cancel`);
            if (response.data.success) {
                setCurrentRide(null);
                setIsSearching(false);
            }
        } catch (error) {
            alert("Erreur lors de l'annulation.", error);
        }
    }

    // 🔥 FONCTION POUR DÉBLOQUER L'AUDIO
    const unlockAudio = () => {
        notificationSound.play().then(() => {
            notificationSound.pause(); // On le lance et on le coupe direct
            notificationSound.currentTime = 0;
            console.log("🔊 Audio débloqué pour les notifications");
        }).catch(e => console.log("Attente d'interaction..."));

        // On retire l'écouteur après le premier clic pour ne pas polluer
        document.removeEventListener('click', unlockAudio);
    };

    useEffect(() => {
        document.addEventListener('click', unlockAudio);
        return () => document.removeEventListener('click', unlockAudio);
    }, []);

    const playNotification = () => {
        notificationSound.currentTime = 0; // On repart du début
        notificationSound.play().catch(error => {
            console.warn("Lecture bloquée :", error);
        });
    };

    // On écoute l'acceptation du chauffeur pour passer au tracking
    useEffect(() => {
        if (currentRide && isSearching) {
            window.Echo.private(`rides.${currentRide.id}`)
                .listen('.ride.accepted', (e) => {
                    console.log("Chauffeur trouvé !", e.ride);
                    playNotification(); // Joue la notification à l'acceptation
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                    setCurrentRide(e.ride);
                    setIsSearching(false); // On cache l'attente, la carte va s'afficher
                });
        }
    }, [currentRide, isSearching]);

    useEffect(() => {
        const checkActiveRide = async () => {
            setLoading(true);
            try {
                const response = await axios.get('/api/rides/current');
                if (response.data.ride) {
                    setCurrentRide(response.data.ride);
                    console.log("Course active trouvée au chargement :", response.data.ride);

                    // Si la course est encore en attente, on active la vue recherche
                    if (response.data.ride.status === 'requested') {
                        // console.log("isSearching :", isSearching);
                        setIsSearching(true);
                    }
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de la course active", error);
            } finally {
                setLoading(false);
            }
        };

        checkActiveRide();
    }, []);

    // VUE 1 : Recherche de chauffeur (Status: requested)
    if (isSearching && currentRide) {
        console.log("Affichage de la vue de recherche, isSearching :", isSearching);
        return (
            <div style={{ textAlign: 'center', padding: '50px', maxWidth: '500px', margin: '0 auto' }}>
                <div className="status-card" style={{ background: '#f9f9f9', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                    <h2>Recherche en cours... 🚕</h2>
                    <div className="loader"></div>

                    <div style={{ textAlign: 'left', marginTop: '20px', fontSize: '0.9em' }}>
                        <p><strong>De :</strong> {currentRide.pickup_address}</p>
                        <p><strong>À :</strong> {currentRide.destination_address}</p>
                    </div>

                    <button
                        onClick={() => {handleCancelledRide();}}
                        style={{ marginTop: '20px', padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Annuler la demande
                    </button>
                </div>
            </div>
        );
    }
   // VUE 2 & 3 : Formulaire ou Navigation (Status: accepted / in_progress)
    return (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            {!currentRide ? (
                <OrderForm onOrderCreated={handleNewOrder} />
            ) : (
                <Navigation
                    ride={currentRide}
                    onCancelSuccess={() => setCurrentRide(null)}
                    onCompleted={() => setCurrentRide(null)}
                />
            )}
        </div>
    );
}

export default Index;
