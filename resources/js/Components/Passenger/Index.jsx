import React, {useState, useEffect} from "react";
import Navigation from "./Navigation";
import OrderForm from "./OrderForm";

// En dehors ou au début du composant
const notificationSound = new Audio('/sounds/ride_requested.wav');

// Index.jsx du passager
function Index() {
    const [currentRide, setCurrentRide] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const handleNewOrder = (ride) => {
        setCurrentRide(ride);
        setIsSearching(true); // On active l'écran d'attente
    };

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

    if (isSearching) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Recherche de chauffeur en cours... 🚕</h2>
                <div className="loader"></div> {/* Ajoute un petit spinner CSS */}
                <p>Trajet : {currentRide.pickup_address} → {currentRide.destination_address}</p>
                <button onClick={() => setIsSearching(false)}>Annuler</button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            {!currentRide ? (
                <OrderForm onOrderCreated={handleNewOrder} />
            ) : (
                <Navigation ride={currentRide} onCancelSuccess={() => setCurrentRide(null)} />
            )}
        </div>
    );
}

export default Index;
