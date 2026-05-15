import React from 'react';
import { Head } from '@inertiajs/react';

export default function PendingReview() {
    return (
        <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center p-6 text-center">
            <Head title="Compte en examen" />

            {/* Illustration ou Icone Animée */}
            <div className="w-32 h-32 bg-[#F8B803] rounded-full flex items-center justify-center shadow-lg mb-8 animate-pulse">
                <span className="text-5xl">⏳</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-4">
                Votre compte est en cours d'examen
            </h1>

            <p className="text-slate-600 max-w-sm mb-10">
                Merci de votre patience, **Diop** ! Nos administrateurs vérifient vos documents.
                Vous recevrez une notification dès que vous pourrez commencer à rouler.
            </p>

            {/* Actions de Support */}
            <div className="space-y-4 w-full max-w-xs">
                <a
                    href="https://wa.me/221778435052" // Remplace par ton numéro RioFix/SamaTaxi
                    className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-green-600 transition"
                >
                    <span>💬</span> Contacter le support WhatsApp
                </a>

                <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-slate-800 transition"
                >
                    Actualiser mon statut
                </button>
            </div>

            <footer className="mt-12 text-slate-400 text-sm italic">
                SamaTaxi — La sécurité avant tout.
            </footer>
        </div>
    );
}
