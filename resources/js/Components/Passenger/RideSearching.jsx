import React from 'react';

const RideSearching = ({ ride, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-white z-[3000] flex flex-col items-center justify-center p-6 text-center">
            {/* Animation du radar */}
            <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-[#F8B803] opacity-20 animate-ping"></div>
                <div className="relative bg-[#F8B803] w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-4xl">🚕</span>
                </div>
            </div>

            <h2 className="text-2xl font-black text-gray-800 mb-2">
                Recherche de chauffeur...
            </h2>
            <p className="text-gray-500 mb-8 animate-pulse">
                Sama Taxi cherche le meilleur trajet pour vous
            </p>

            {/* Détails de la course */}
            <div className="w-full max-w-sm bg-gray-50 rounded-[25px] p-6 mb-8 border border-gray-100 shadow-sm">
                <div className="flex flex-col gap-4 text-left">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-gray-400">Départ</span>
                            <p className="text-sm font-semibold text-gray-700 truncate">{ride.pickup_address}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-2 h-2 rounded-full bg-[#F8B803] shadow-[0_0_8px_rgba(248,184,3,0.6)]"></div>
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-gray-400">Destination</span>
                            <p className="text-sm font-semibold text-gray-700 truncate">{ride.destination_address}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-400">PRIX ESTIMÉ</span>
                    <span className="text-xl font-black text-gray-800">{ride.estimated_price} FCFA</span>
                </div>
            </div>

            {/* Bouton Annuler */}
            <button
                onClick={onCancel}
                className="text-gray-400 font-bold text-sm uppercase tracking-widest hover:text-red-500 transition-colors"
            >
                Annuler la demande
            </button>
        </div>
    );
};

export default RideSearching;
