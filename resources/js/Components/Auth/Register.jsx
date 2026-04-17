import React, { useState } from 'react';
import axios from 'axios';

const Register = ({ onSuccess, onSwitch }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        password_confirmation: '',
        role: 'passenger', // Par défaut
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await axios.post('/api/register', {
                ...formData,
                device_name: navigator.userAgent
            });

            if (response.data.success) {
                onSuccess(response.data.user, response.data.token);
            }
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else if (err.response?.data?.message) {
                // Affiche l'erreur spécifique du try/catch PHP (ex: "Passenger model not found")
                alert(err.response.data.message);
            } else {
                alert("Une erreur critique est survenue. Vérifiez votre connexion.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBFBFB] flex flex-col justify-center px-6 py-12 animate-in slide-in-from-right-8 duration-500">
            <div className="max-w-md mx-auto w-full">
                <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight uppercase">Créer un compte</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Rejoignez la révolution du transport</p>

                {/* SÉLECTEUR DE RÔLE STYLE 2026 */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'passenger' })}
                        className={`p-5 rounded-[25px] border-2 transition-all flex flex-col items-center gap-2 ${formData.role === 'passenger' ? 'border-[#F8B803] bg-yellow-50/50' : 'border-gray-100 bg-white'}`}
                    >
                        <span className="text-2xl">🙋‍♂️</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">Passager</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'driver' })}
                        className={`p-5 rounded-[25px] border-2 transition-all flex flex-col items-center gap-2 ${formData.role === 'driver' ? 'border-[#F8B803] bg-yellow-50/50' : 'border-gray-100 bg-white'}`}
                    >
                        <span className="text-2xl">🚕</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">Chauffeur</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        {/* Champ Nom */}
                        <input
                            placeholder="Nom complet"
                            className="w-full px-5 py-4 bg-white border border-gray-100 rounded-[20px] outline-none focus:ring-2 focus:ring-[#F8B803] transition-all shadow-sm"
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        {errors.name && <p className="text-red-500 text-[10px] font-bold ml-2 uppercase">{errors.name[0]}</p>}

                        {/* Champ Email */}
                        <input
                            placeholder="Email professionnel"
                            type="email"
                            className="w-full px-5 py-4 bg-white border border-gray-100 rounded-[20px] outline-none focus:ring-2 focus:ring-[#F8B803] shadow-sm"
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                        {errors.email && <p className="text-red-500 text-[10px] font-bold ml-2 uppercase">{errors.email[0]}</p>}

                        {/* Champ Téléphone (Indispensable pour Driver/Passenger) */}
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold border-r pr-3 text-sm">+221</span>
                            <input
                                placeholder="77 000 00 00"
                                type="tel"
                                className="w-full pl-20 pr-5 py-4 bg-white border border-gray-100 rounded-[20px] outline-none focus:ring-2 focus:ring-[#F8B803] font-bold shadow-sm"
                                onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                            />
                        </div>

                        {/* Mot de passe */}
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                placeholder="Password"
                                type="password"
                                className="w-full px-5 py-4 bg-white border border-gray-100 rounded-[20px] outline-none focus:ring-2 focus:ring-[#F8B803] shadow-sm"
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <input
                                placeholder="Confirm"
                                type="password"
                                className="w-full px-5 py-4 bg-white border border-gray-100 rounded-[20px] outline-none focus:ring-2 focus:ring-[#F8B803] shadow-sm"
                                onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })}
                            />
                        </div>
                        {errors.password && <p className="text-red-500 text-[10px] font-bold ml-2 uppercase">{errors.password[0]}</p>}
                    </div>

                    <button
                        disabled={loading}
                        className="w-full mt-4 py-5 bg-black text-white font-black rounded-[25px] shadow-2xl active:scale-95 transition-all uppercase text-sm tracking-widest"
                    >
                        {loading ? 'Création...' : "C'est parti !"}
                    </button>
                </form>

                <p className="mt-8 text-center text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    Déjà membre ?{' '}
                    <button onClick={onSwitch} className="text-[#F8B803] hover:underline ml-1">Se connecter</button>
                </p>
            </div>
        </div>
    );
};

export default Register;
