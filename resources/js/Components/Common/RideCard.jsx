import React from 'react';

const RideCard = ({ ride, onAccept }) => {
    return (
        <div className="bg-white/95 backdrop-blur-md rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 p-6 transform transition-all hover:scale-[1.02] active:scale-95 duration-300">
            {/* Header: Info Client & Prix */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl shadow-lg shadow-slate-200">
                            <span className="grayscale-0">👤</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-lg tracking-tight leading-tight">
                            {ride.passenger?.user?.name || 'Passager'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-yellow-400/20 text-yellow-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                ★ 4.9
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nouveau</span>
                        </div>
                    </div>
                </div>
                <div className="text-right bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-2xl font-black text-slate-900 block leading-none">
                        {ride.estimated_price}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">FCFA</span>
                </div>
            </div>

            {/* Itinéraire : Style Timeline Moderne */}
            <div className="bg-slate-50/50 rounded-[24px] p-4 mb-6 border border-slate-100/50">
                <div className="space-y-4 relative">
                    <div className="absolute left-[11px] top-4 bottom-4 w-[1.5px] bg-dashed bg-gradient-to-b from-green-500 via-yellow-500 to-red-500 opacity-30"></div>

                    <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center z-10">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Prise en charge</p>
                            <p className="text-sm font-bold text-slate-700 truncate">{ride.pickup_address}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center z-10">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Destination</p>
                            <p className="text-sm font-bold text-slate-700 truncate">{ride.destination_address}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions & Stats */}
            <div className="flex items-center gap-4">
                <div className="flex-1 flex gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex-1 text-center py-1">
                        <span className="block text-[8px] font-black text-slate-400 uppercase">Distance</span>
                        <span className="text-xs font-black text-slate-900">{ride.distance_km || '--'} km</span>
                    </div>
                    <div className="w-[1px] bg-slate-100 my-1"></div>
                    <div className="flex-1 text-center py-1">
                        <span className="block text-[8px] font-black text-slate-400 uppercase">Proximité</span>
                        <span className="text-xs font-black text-blue-600">
                            {ride.distance_to_pickup ? `${(ride.distance_to_pickup / 1000).toFixed(1)}km` : '--'}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => onAccept(ride.id)}
                    className="flex-[1.5] py-4 bg-[#F8B803] hover:bg-slate-900 hover:text-[#F8B803] text-slate-900 font-black rounded-[20px] transition-all duration-500 shadow-[0_15px_30px_rgba(248,184,3,0.3)] active:shadow-none uppercase text-xs tracking-widest group"
                >
                    <span className="group-hover:tracking-[0.2em] transition-all duration-300">Accepter l'offre</span>
                </button>
            </div>
        </div>
    );
};

export default RideCard;
