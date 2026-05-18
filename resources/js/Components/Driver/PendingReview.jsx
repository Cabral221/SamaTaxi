import React from 'react';

export default function PendingReview({ user }) {
    return (
        <div className="h-screen w-full bg-[#FBFBFB] flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-8">
                <div className="w-24 h-24 bg-[#F8B803] rounded-[2rem] flex items-center justify-center shadow-xl animate-bounce">
                    <span className="text-4xl">⏳</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <span className="text-xs">✨</span>
                </div>
            </div>

            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
                Dossier en cours
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Ravi de vous voir, <span className="font-bold text-slate-900">{user.name}</span> !<br/>
                L'équipe <span className="text-[#F8B803] font-bold">SamaTaxi</span> vérifie vos documents.
                Cela prend généralement moins de 24h.
            </p>

            <div className="w-full space-y-3">
                <a href="https://wa.me/221xxxxxx" className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform">
                    CONTACTER LE SUPPORT
                </a>
                <button onClick={() => window.location.reload()} className="block w-full py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-bold text-sm active:scale-95 transition-transform">
                    ACTUALISER
                </button>
            </div>
        </div>
    );
}
