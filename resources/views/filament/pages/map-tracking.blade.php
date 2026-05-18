<x-filament-panels::page>
    @vite(['resources/js/bootstrap.js'])

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />

    <div class="grid grid-cols-1 gap-4">
        <div class="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div id="admin-map" class="w-full rounded-lg" style="height: 600px; z-index: 1;"></div>
        </div>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const map = L.map('admin-map').setView([14.7167, -17.4677], 12);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const activeDrivers = {};

            const taxiIcon = L.icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
                iconSize: [35, 35],
                iconAnchor: [17, 17],
                popupAnchor: [0, -15]
            });

            // --- CORRECTION : ATTENTE ACTIVE DE LARAVEL ECHO ---
            function initEchoListening() {
                if (window.Echo) {
                    console.log("Admin Tracking: Connexion au canal global initiée avec succès !");
                    clearInterval(checkEchoInterval); // On arrête de chercher, on a trouvé !

                    window.Echo.channel('global-drivers')
                        .listen('.driver.movedGlobal', (e) => {
                            console.log("Position globale reçue :", e);

                            const driverId = e.driver_id;
                            const lat = e.lat;
                            const lng = e.lng;
                            const driverName = e.driver_name;

                            if (activeDrivers[driverId]) {
                                activeDrivers[driverId].setLatLng([lat, lng]);
                            } else {
                                const marker = L.marker([lat, lng], { icon: taxiIcon })
                                    .addTo(map)
                                    .bindPopup(`<b>${driverName}</b><br>Statut: En déplacement`);

                                activeDrivers[driverId] = marker;
                            }
                        });
                } else {
                    console.log("Admin Tracking: En attente de l'initialisation de Laravel Echo...");
                }
            }

            // On vérifie toutes les 500ms si Echo est enfin disponible globalement
            const checkEchoInterval = setInterval(initEchoListening, 500);
        });
    </script>
</x-filament-panels::page>
