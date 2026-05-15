import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DriverHistory = ({ onBack }) => {
    const [rides, setRides] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const fetchHistory = async (page = 1) => {
        if (page === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await axios.get(`/api/driver/rides/history?page=${page}`);

            // Mise à jour des stats (seulement au premier chargement)
            if (page === 1) setStats(res.data.stats);

            // Fusion des courses
            const newRides = res.data.rides.data;
            setRides(prev => page === 1 ? newRides : [...prev, ...newRides]);

            // Vérifier s'il y a une page suivante
            setHasMore(res.data.rides.next_page_url !== null);
        } catch (err) {
            console.error("Erreur historique chauffeur", err);
            
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchHistory(1);
    }, []);

    const handleLoadMore = () => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchHistory(nextPage);
    };

    if (loading) {
        return <div className="p-10 text-center font-black uppercase text-[10px] animate-pulse">Chargement du portefeuille...</div>;
    }

    return (
        <div className="animate-in slide-in-from-right duration-300 min-h-screen bg-[#FBFBFB] p-6 pt-6">
            {/* Header Performance */}
            <div className="flex justify-between items-start mb-8">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                    Portefeuille <br/><span className="text-[#F8B803]">Chauffeur</span>
                </h2>
                <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-gray-400">✕</span>
                </button>
            </div>

            {/* Widgets de Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black p-5 rounded-[2rem] shadow-xl col-span-2">
                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">Gains Totaux Estimés</p>
                    <p className="text-3xl font-black text-[#F8B803] italic">
                        {stats.total_earnings?.toLocaleString()} <span className="text-[12px] not-italic">CFA</span>
                    </p>
                </div>
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50">
                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">Courses</p>
                    <p className="text-xl font-black text-gray-900 italic">
                        {stats.rides_count}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50">
                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">Distance</p>
                    <p className="text-xl font-black text-gray-900 italic">
                        {stats.total_distance || 0} <span className="text-[10px] not-italic">km</span>
                    </p>
                </div>
            </div>

            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 ml-2">Détails des gains</h3>

            <div className="space-y-3">
                {rides.map(ride => (
                    <div key={ride.id} className="bg-white p-5 rounded-[2rem] border border-gray-50 flex items-center justify-between animate-in fade-in duration-500">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-lg shadow-inner">
                                💰
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-gray-900 uppercase truncate w-32">
                                    {ride.destination_address.split(',')[0]}
                                </p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">
                                    {new Date(ride.created_at).toLocaleDateString('fr-FR')} • {new Date(ride.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}).replace(':','h')}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-green-500">+{ride.estimated_price} F</p>
                            <div className="flex items-center justify-end gap-1">
                                <div className="w-1 h-1 rounded-full bg-green-500"></div>
                                <p className="text-[8px] font-black text-gray-300 uppercase italic">Payé</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bouton Voir Plus - Style Chauffeur */}
            {hasMore && (
                <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full mt-6 py-5 bg-white border-2 border-dashed border-gray-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-gray-400 active:scale-95 transition-all mb-10"
                >
                    {loadingMore ? 'Chargement...' : 'Afficher plus de trajets'}
                </button>
            )}
        </div>
    );
};

export default DriverHistory;
