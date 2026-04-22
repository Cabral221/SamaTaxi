import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

const SamaRouting = ({ from, to, color = '#F8B803' }) => {
    const map = useMap();
    const routingControlRef = useRef(null);

    // AJOUT : Sécurité absolue avant de faire quoi que ce soit
    const isValid = from?.lat && from?.lng && to?.lat && to?.lng;

    useEffect(() => {
        if (!map || !isValid) return;

        // Initialisation du tracé
        try {
            const routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(parseFloat(from.lat), parseFloat(from.lng)),
                    L.latLng(parseFloat(to.lat), parseFloat(to.lng))
                ],
                router: L.Routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1',
                    profile: 'driving',
                    timeout: 10000, // Réduit à 10s pour plus de réactivité
                }),
                lineOptions: {
                    styles: [{ color: color, weight: 6, opacity: 0.8 }],
                    extendToWaypoints: false,
                    missingRouteTolerance: 0
                },
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: false,
                show: false,
                createMarker: () => null // On utilise nos propres Markers React
            }).addTo(map);

            routingControlRef.current = routingControl;
            console.log("Routing control initialisé avec succès");
        } catch (err) {
            console.error("Erreur initialisation Routing:", err);
        }

        return () => {
            if (routingControlRef.current && map) {
                try {
                    map.removeControl(routingControlRef.current);
                    routingControlRef.current = null;
                } catch (e) {
                    console.warn("Erreur lors du retrait du contrôle routing:", e);
                }
            }
        };
    }, [map, isValid, L, color]); // Créé une seule fois au montage

    // Mise à jour si la position change (ex: le taxi bouge)
    // 2. Mise à jour dynamique des waypoints quand 'from' ou 'to' changent
    useEffect(() => {
        if (routingControlRef.current && isValid) {
            const start = L.latLng(parseFloat(from.lat), parseFloat(from.lng));
            const end = L.latLng(parseFloat(to.lat), parseFloat(to.lng));

            // Vérification anti-NaN avant de soumettre à Leaflet
            if (!isNaN(start.lat) && !isNaN(end.lat)) {
                routingControlRef.current.setWaypoints([start, end]);

                // Ajustement automatique de la vue
                const bounds = L.latLngBounds([start, end]);
                map.fitBounds(bounds, { padding: [70, 70], maxZoom: 17 });
            }
        }
    }, [from.lat, from.lng, to.lat, to.lng, map, isValid]);

    return null;
};

export default SamaRouting;
