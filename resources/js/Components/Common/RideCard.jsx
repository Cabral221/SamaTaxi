import React from 'react';

const RideCard = ({ ride, onAccept }) => {
    return (
        <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-5 transform transition-all active:scale-95">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                        👤
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{ride.passenger?.user?.name || 'Client SamaTaxi'}</h3>
                        <div className="flex items-center gap-1 text-[#F8B803]">
                            <span className="text-xs font-bold text-yellow-500">★ 4.9</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-gray-900">{ride.estimated_price}</span>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">FCFA</span>
                </div>
            </div>

            {/* Itinéraire */}
            <div className="space-y-3 mb-5 relative">
                <div className="absolute left-[9px] top-3 bottom-3 w-[2px] bg-gray-100"></div>

                <div className="flex items-start gap-4">
                    <div className="w-5 h-5 rounded-full bg-green-500 border-4 border-white shadow-sm z-10"></div>
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Départ</p>
                        <p className="text-sm font-medium text-gray-700 truncate">{ride.pickup_address}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="w-5 h-5 rounded-full bg-[#F8B803] border-4 border-white shadow-sm z-10"></div>
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Destination</p>
                        <p className="text-sm font-medium text-gray-700 truncate">{ride.destination_address}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-50">
                <div className="flex gap-4">
                    <div className="text-center">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Distance</span>
                        <span className="text-sm font-bold text-gray-700">
                            {ride.distance_km ? `${ride.distance_km} km` : '--'}
                        </span>
                    </div>
                    {ride.distance_to_pickup && (
                        <div className="text-center border-l pl-4 font-bold text-blue-600">
                             <span className="block text-[10px] uppercase text-gray-400">À vous</span>
                             <span className="text-sm">{(ride.distance_to_pickup / 1000).toFixed(1)} km</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => onAccept(ride.id)}
                    className="flex-1 py-4 bg-[#F8B803] hover:bg-black hover:text-[#F8B803] text-black font-black rounded-2xl transition-all duration-300 shadow-[0_10px_20px_rgba(248,184,3,0.3)] uppercase text-sm tracking-tighter"
                >
                    Accepter
                </button>
            </div>
        </div>
    );
};

export default RideCard;
