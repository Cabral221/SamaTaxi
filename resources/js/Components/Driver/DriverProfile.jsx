import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../Context/ToastContext'; // Import du hook

const DriverProfile = ({ user, driverData, onBack }) => {
    // CORRECTION : On récupère l'objet du contexte en sécurité
    const toastContext = useToast();
    const showToast = toastContext?.showToast; // Extraction sécurisée

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({}); // Stockage des erreurs de validation

    const avatarInputRef = useRef(null);
    const [avatarPreview, setAvatarPreview] = useState(driverData.avatar);

    const [formData, setFormData] = useState({
        avatar_file: null,
        full_name: user.name || '',
        email: user.email || '',
        phone: driverData.phone_number || '',
        license_path: driverData.license || '',
        license: null,
        vehicule_make: driverData.vehicule_make || '',
        vehicule_model: driverData.vehicule_model || '',
        vehicule_plate: driverData.vehicule_plate || '',
    });

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;
        if (field === 'avatar') {
            setFormData({ ...formData, avatar_file: file });
            setAvatarPreview(URL.createObjectURL(file));
        } else {
            setFormData({ ...formData, license: file });
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        // Vérifie si showToast existe avant d'appeler
        if (typeof showToast !== 'function') {
            console.error("Erreur critique : showToast n'est pas une fonction", showToast);
            return;
        }

        setLoading(true);
        setErrors({}); // Réinitialise les erreurs au début

        const data = new FormData();
        if (formData.avatar_file) data.append('avatar', formData.avatar_file);
        data.append('full_name', formData.full_name);
        data.append('phone_number', formData.phone); // Laravel attend phone_number
        data.append('email', formData.email);
        if (formData.license instanceof File) data.append('license', formData.license);
        data.append('vehicule_make', formData.vehicule_make);
        data.append('vehicule_model', formData.vehicule_model);
        data.append('vehicule_plate', formData.vehicule_plate);

        console.log("Check showToast function:", showToast);
        try {
            await axios.post('/api/driver/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast("Profil mis à jour !"); // Succès
        } catch (error) {
            if (error.response && error.response.status === 422) {
                const serverErrors = error.response.data.errors;
                setErrors(serverErrors);

                // Optionnel : Récupérer le premier message d'erreur pour le Toast
                // On prend la première erreur du premier champ qui a échoué
                const firstFieldName = Object.keys(serverErrors)[0];
                const firstErrorMessage = serverErrors[firstFieldName][0];

                showToast(firstErrorMessage, "error");
            } else {
                showToast("Erreur réseau ou serveur", "error");
            }
        } finally { setLoading(false); }
    };

    return (
        <div className="animate-in fade-in duration-500 min-h-screen bg-[#FBFBFB] pb-12 px-6">
            <div className="pt-6">
                <button onClick={() => onBack('RADAR')} className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-600 active:scale-95 transition-all">
                    <span className="text-lg">←</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Retour Radar</span>
                </button>
            </div>

            <div className="max-w-md mx-auto mt-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative group">
                        <div className={`w-24 h-24 rounded-[2.5rem] bg-slate-900 border-4 shadow-2xl flex items-center justify-center overflow-hidden transition-colors ${errors.avatar ? 'border-red-500' : 'border-white'}`}>
                            {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-3xl">👤</span>}
                        </div>
                        <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                        <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 bg-[#F8B803] w-8 h-8 rounded-full border-4 border-[#FBFBFB] flex items-center justify-center shadow-lg"><span className="text-[10px]">📷</span></button>
                    </div>
                    {errors.avatar && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-tighter">{errors.avatar[0]}</p>}
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    {/* Section Identité */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
                        <p className="text-[9px] font-black text-[#F8B803] uppercase tracking-[0.3em] mb-6">Identité</p>
                        <div className="space-y-4">
                            <ProfileInput label="Nom Complet" value={formData.full_name} error={errors.full_name} onChange={(v) => setFormData({...formData, full_name: v})} />
                            <ProfileInput label="Email" value={formData.email} error={errors.email} onChange={(v) => setFormData({...formData, email: v})} />
                            <ProfileInput label="Téléphone" value={formData.phone} error={errors.phone_number} onChange={(v) => setFormData({...formData, phone: v})} />
                        </div>
                    </div>

                    {/* Section Documents */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
                        <p className="text-[9px] font-black text-[#F8B803] uppercase tracking-[0.3em] mb-6">Documents</p>
                        {formData.license_path && (
                            <div className="mb-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Permis actuel</span>
                                <a href={formData.license_path} target="_blank" className="text-[10px] font-black text-[#F8B803] underline">VOIR</a>
                            </div>
                        )}
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nouveau Permis (PDF/IMG)</label>
                        <input type="file" accept=".pdf,image/*" className="w-full mt-2 text-[10px]" onChange={(e) => handleFileChange(e, 'license')} />
                        {errors.license && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">{errors.license[0]}</p>}
                    </div>

                    {/* Section Véhicule */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
                        <p className="text-[9px] font-black text-[#F8B803] uppercase tracking-[0.3em] mb-6">Véhicule</p>
                        <div className="space-y-4">
                            <ProfileInput label="Marque" value={formData.vehicule_make} error={errors.vehicule_make} onChange={(v) => setFormData({...formData, vehicule_make: v})} />
                            <ProfileInput label="Modèle" value={formData.vehicule_model} error={errors.vehicule_model} onChange={(v) => setFormData({...formData, vehicule_model: v})} />
                            <ProfileInput label="Plaque" value={formData.vehicule_plate} error={errors.vehicule_plate} onChange={(v) => setFormData({...formData, vehicule_plate: v})} />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-[#F8B803] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50">
                        {loading ? 'Synchronisation...' : 'Enregistrer'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Input avec gestion d'erreur intégrée
const ProfileInput = ({ label, value, error, onChange, type="text" }) => {
    // Nettoyage simple du message si Laravel envoie une clé de trad brute
    const formatError = (err) => {
        if (!err) return null;
        const msg = err[0];
        return msg.includes('Validation.')
            ? `Ce champ est requis ou invalide` // Message générique de secours
            : msg;
    };

    return (
        <div className="flex flex-col">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <input
                type={type}
                className={`w-full mt-1 bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-700 focus:ring-2 transition-all ${
                    error ? 'ring-2 ring-red-500 bg-red-50' : 'focus:ring-[#F8B803]'
                }`}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
            />
            {error && (
                <span className="text-[9px] text-red-500 font-bold mt-1 ml-1 uppercase tracking-tight animate-in fade-in slide-in-from-left-1">
                    {formatError(error)}
                </span>
            )}
        </div>
    );
};

export default DriverProfile;
