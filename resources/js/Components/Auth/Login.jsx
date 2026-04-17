import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onSuccess, onSwitch, onForgot }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/login', {
                email,
                password,
                device_name: navigator.userAgent, // Identifie l'appareil pour le token
            });

            if (response.data.success) {
                // On transmet l'user et le token au parent (AppLayout)
                onSuccess(response.data.user, response.data.token);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Identifiants incorrects');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBFBFB] flex flex-col justify-center px-6 py-12 animate-in fade-in duration-500">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex bg-[#F8B803] w-16 h-16 rounded-[22px] items-center justify-center shadow-lg shadow-yellow-500/20 mb-6">
                    <span className="text-2xl font-black">ST</span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Ravi de vous revoir</h2>
                <p className="mt-2 text-sm text-gray-400 font-bold uppercase tracking-widest">SamaTaxi Live</p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[400px]">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-500 text-xs p-4 rounded-2xl border border-red-100 font-bold">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-5 py-4 bg-white border border-gray-100 rounded-[20px] focus:ring-2 focus:ring-[#F8B803] focus:border-transparent transition-all outline-none shadow-sm"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mot de passe</label>
                            <button
                                onClick={onForgot}
                                type="button" className="text-[10px] font-black text-[#F8B803] uppercase">Mot de pass oublié ?</button>
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full px-5 py-4 bg-white border border-gray-100 rounded-[20px] focus:ring-2 focus:ring-[#F8B803] focus:border-transparent transition-all outline-none shadow-sm"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-[#F8B803] text-black font-black rounded-[22px] shadow-xl shadow-yellow-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase text-sm tracking-tighter"
                    >
                        {loading ? 'Connexion en cours...' : 'Se Connecter'}
                    </button>
                </form>

                <p className="mt-8 text-center text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    Nouveau ici ?{' '}
                    <button onClick={onSwitch} className="text-[#F8B803] hover:underline ml-1">Créer un compte</button>
                </p>
            </div>
        </div>
    );
};

export default Login;
