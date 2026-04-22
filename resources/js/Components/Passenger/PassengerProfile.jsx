import React, { useState } from 'react';
import { useToast } from '../Context/ToastContext';
import axios from 'axios';

const PassengerProfile = ({ user, passenger, onBack }) => {
    const { showToast } = useToast();
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        full_name: user.name || '',
        email: user.email || '',
        phone_number: passenger?.phone_number || '', // Selon ta structure DB
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, avatar: file });
            setPreview(URL.createObjectURL(file)); // Prévisualisation immédiate
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Obligatoire pour envoyer des fichiers
        const data = new FormData();
        data.append('full_name', formData.full_name);
        data.append('email', formData.email);
        data.append('phone_number', formData.phone_number);
        if (formData.avatar instanceof File) {
            data.append('avatar', formData.avatar);
        }

        try {
            await axios.post('/api/passenger/profile',data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast("Profil mis à jour !");
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
                showToast("Veuillez corriger les erreurs", "error");
            }
        } finally { setLoading(false); }
    };

    return (
        <div className="animate-in slide-in-from-right duration-300 min-h-screen bg-[#FBFBFB] p-6 pt-6">
            {/* Bouton Retour identique au chauffeur pour la cohérence */}
            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
                <span className="text-gray-400">←</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Retour</span>
            </button>

            <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-8">
                    Mon Compte <br/><span className="text-[#F8B803]">Passager</span>
                </h2>
                {/* Avatar Profile */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-[2rem] bg-slate-100 overflow-hidden border-4 border-white shadow-xl">
                            {preview || passenger.avatar ? (
                                <img
                                    src={preview || `/storage/${passenger.avatar}`}
                                    className="w-full h-full object-cover"
                                    alt="Avatar"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 bg-[#F8B803] w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all">
                            <span className="text-lg">📸</span>
                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </label>
                    </div>
                    <p className="text-[9px] font-black uppercase text-slate-400 mt-4 tracking-widest">Photo de profil</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-4">
                        <ProfileInput
                            label="Nom"
                            value={formData.full_name}
                            error={errors.full_name}
                            onChange={(v) => setFormData({...formData, full_name: v})}
                        />
                        <ProfileInput
                            label="Email"
                            value={formData.email}
                            error={errors.email}
                            onChange={(v) => setFormData({...formData, email: v})}
                        />
                        <ProfileInput
                            label="Téléphone"
                            value={formData.phone_number}
                            error={errors.phone_number}
                            onChange={(v) => setFormData({...formData, phone_number: v})}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-black text-[#F8B803] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                    >
                        {loading ? 'Mise à jour...' : 'Sauvegarder les modifications'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Réutiliser le même composant ProfileInput que pour le chauffeur pour garder le design SamaTaxi
const ProfileInput = ({ label, value, error, onChange }) => (
    <div className="flex flex-col">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input
            className={`w-full mt-1 bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-700 focus:ring-2 transition-all ${
                error ? 'ring-2 ring-red-500' : 'focus:ring-[#F8B803]'
            }`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        {error && <span className="text-[9px] text-red-500 font-bold mt-1 ml-1 uppercase">{error[0]}</span>}
    </div>
);

export default PassengerProfile;
