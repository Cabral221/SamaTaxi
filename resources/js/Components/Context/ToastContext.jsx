// src/Components/Context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
            setTimeout(() => setToast(null), 3500);
    }, []);

    // On utilise useMemo pour garantir que la valeur est stable et ne revient pas à undefined
    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toast && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 ${
                        toast.type === 'error'
                        ? 'bg-red-50 border-red-100 text-red-600'
                        : 'bg-slate-900 border-slate-800 text-[#F8B803]'
                    }`}>
                        <span className="text-sm font-black uppercase tracking-widest">
                            {toast.type === 'error' ? '⚠️' : '⚡'} {toast.message}
                        </span>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);

    // Si le contexte n'est pas trouvé (ex: erreur de hiérarchie dans App.jsx)
    if (!context) {
        console.error("ERREUR: useToast utilisé en dehors de ToastProvider");
        return { showToast: () => {} }; // Renvoie une fonction vide pour éviter le crash
    }

    return context;
};
