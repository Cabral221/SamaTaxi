import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = ({ onBack }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
    const [email, setEmail] = useState('');
    const [formData, setFormData] = useState({
        otp: '',
        password: '',
        password_confirmation: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            const res = await axios.post('/api/password/otp', { email });
            if (res.data.success) {
                setStep(2);
            }
        } catch (err) {
            setErrors(err.response?.data?.errors || { email: ["Utilisateur introuvable"] });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            const res = await axios.post('/api/password/reset', {
                email,
                ...formData
            });
            if (res.data.success) {
                alert("Mot de passe mis à jour !");
                onBack();
            }
        } catch (err) {
            setErrors(err.response?.data?.errors || {});
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBFBFB] flex flex-col justify-center px-6 py-12 animate-in fade-in duration-500">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Header Style SamaTaxi */}
                <div className="text-center mb-10">
                    <div className="inline-flex bg-[#F8B803] w-16 h-16 rounded-[22px] items-center justify-center shadow-lg shadow-yellow-500/20 mb-6">
                        <span className="text-2xl font-black">ST</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
                        {step === 1 ? 'Accès perdu ?' : 'Code Sécurité'}
                    </h2>
                    <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                        SamaTaxi • Récupération
                    </p>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-50">
                    {step === 1 ? (
                        <form onSubmit={handleRequestOtp} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email du compte</label>
                                <input
                                    placeholder="votre@email.com"
                                    type="email"
                                    required
                                    className="w-full px-5 py-4 bg-[#F9F9F9] border border-transparent rounded-[20px] outline-none focus:ring-2 focus:ring-[#F8B803] transition-all"
                                    onChange={e => setEmail(e.target.value)}
                                />
                                {errors.email && <p className="text-red-500 text-[10px] font-bold ml-2 uppercase">{errors.email[0]}</p>}
                            </div>

                            <button
                                disabled={loading}
                                className="w-full py-5 bg-black text-white font-black rounded-[22px] shadow-xl active:scale-95 transition-all uppercase text-sm tracking-tighter"
                            >
                                {loading ? 'Vérification...' : 'Envoyer le code'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-center block mb-2">Code reçu par mail</label>
                                    <input
                                        placeholder="000000"
                                        maxLength="6"
                                        required
                                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-[20px] outline-none focus:ring-2 focus:ring-[#F8B803] text-center text-2xl font-black tracking-[0.4em]"
                                        onChange={e => setFormData({ ...formData, otp: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                                    <input
                                        placeholder="••••••••"
                                        type="password"
                                        required
                                        className="w-full px-5 py-4 bg-[#F9F9F9] border border-transparent rounded-[20px] outline-none focus:ring-2 focus:ring-[#F8B803]"
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>

                                <input
                                    placeholder="Confirmer le mot de passe"
                                    type="password"
                                    required
                                    className="w-full px-5 py-4 bg-[#F9F9F9] border border-transparent rounded-[20px] outline-none focus:ring-2 focus:ring-[#F8B803]"
                                    onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })}
                                />

                                {errors.otp && <p className="text-red-500 text-[10px] font-bold text-center uppercase">{errors.otp[0]}</p>}
                                {errors.password && <p className="text-red-500 text-[10px] font-bold text-center uppercase">{errors.password[0]}</p>}
                            </div>

                            <button
                                disabled={loading}
                                className="w-full mt-4 py-5 bg-[#F8B803] text-black font-black rounded-[22px] shadow-xl active:scale-95 transition-all uppercase text-sm tracking-tighter"
                            >
                                {loading ? 'Mise à jour...' : 'Valider le changement'}
                            </button>
                        </form>
                    )}
                </div>

                <button
                    onClick={onBack}
                    className="w-full mt-8 text-gray-400 hover:text-black transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                >
                    ← Retour à la connexion
                </button>
            </div>
        </div>
    );
};

export default ForgotPassword;
