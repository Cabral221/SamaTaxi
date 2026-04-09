import React, {useState, useEffect} from "react";
import Navigation from "./Navigation";
import OrderForm from "./OrderForm";

// Index.jsx du passager
function Index() {
    const [currentRide, setCurrentRide] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const handleNewOrder = (ride) => {
        setCurrentRide(ride);
        setIsSearching(true); // On active l'écran d'attente
    };

    // On écoute l'acceptation du chauffeur pour passer au tracking
    useEffect(() => {
        if (currentRide && isSearching) {
            window.Echo.private(`rides.${currentRide.id}`)
                .listen('.ride.accepted', (e) => {
                    console.log("Chauffeur trouvé !", e.ride);
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
