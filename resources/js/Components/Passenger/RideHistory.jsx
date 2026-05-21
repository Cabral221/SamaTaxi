import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '../Context/ToastContext';

const RideHistory = ({ onBack }) => {
    const [rides, setRides] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const { showToast } = useToast();

    const formatRideDate = (dateString) => {
        const d = new Date(dateString);
        const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
        return `${date} • ${time}`;
    };
    const handleLoadMore = () => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchHistory(nextPage);
    };

    const fetchHistory = async (page = 1) => {
        if (page === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await axios.get(`/api/v1/passenger/rides/history?page=${page}`);
            const newRides = res.data.rides.data;
            // setRides(res.data.rides);
            if (page === 1) {
                setRides(newRides);
            } else {
                setRides(prev => [...prev, ...newRides]);
            }
            // Si on a moins de 10 résultats, c'est qu'il n'y en a plus après
            setHasMore(res.data.rides.next_page_url !== null);

        } catch (err) {
            console.error("Erreur historique", err);
            showToast("Erreur lors de la récupération de l'historique des courses.", "error");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchHistory(1);
    }, []);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-500 min-h-screen bg-[#FBFBFB] p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                    Mes <span className="text-[#F8B803]">Courses</span>
                </h2>
                <button onClick={onBack} className="w-10 h-10 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-gray-400">
                    ✕
                </button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 w-full bg-gray-100 animate-pulse rounded-[2rem]"></div>)}
                </div>
            ) : rides.length === 0 ? (
                <div className="text-center py-20">
                    <span className="text-4xl block mb-4">🚕</span>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Aucun trajet pour le moment</p>
                </div>
            ) : (
                <div className="space-y-4 py-6">
                    {rides.map((ride) => (
                        <div key={ride.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 group hover:border-[#F8B803] transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                        {formatRideDate(ride.created_at)}
                                    </p>
                                    <h3 className="text-lg font-black text-gray-900 italic tracking-tighter">
                                        {ride.final_price ?? (ride.estimated_price ?? '----')} <span className="text-[10px] uppercase">CFA</span>
                                    </h3>
                                </div>
                                <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${
                                    ride.status === 'completed' ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-400'
                                }`}>
                                    {ride.status === 'completed' ? 'Terminé' : 'Annulé'}
                                </span>
                            </div>

                            <div className="space-y-3 relative">
                                {/* Ligne pointillée décorative */}
                                <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-dashed border-l border-gray-100"></div>

                                <div className="flex items-center gap-3 relative">
                                    <div className="w-3 h-3 rounded-full bg-[#F8B803] border-2 border-white shadow-sm z-10"></div>
                                    <p className="text-[11px] font-bold text-gray-600 truncate uppercase">{ride.pickup_address}</p>
                                </div>
                                <div className="flex items-center gap-3 relative">
                                    <div className="w-3 h-3 rounded-full bg-black border-2 border-white shadow-sm z-10"></div>
                                    <p className="text-[11px] font-bold text-gray-900 truncate uppercase">{ride.destination_address}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {hasMore && (
                <div className="pt-4 pb-10">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-[#F8B803] hover:text-[#F8B803] transition-all"
                    >
                        {loadingMore ? 'Chargement...' : 'Voir plus'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RideHistory;
