import React, { useState } from 'react';

const Header = ({ user, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md z-[5000] px-6 flex justify-between items-center border-b border-gray-50">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="bg-[#F8B803] w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                    <span className="font-black text-black text-xl italic">S</span>
                </div>
                <span className="font-black tracking-tighter text-gray-900 uppercase hidden sm:block">SamaTaxi</span>
            </div>

            {/* User Menu & Hamburger */}
            <div className="relative flex items-center gap-3">
                {/* Info Utilisateur (Desktop) */}
                <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-[10px] font-black uppercase text-gray-900 leading-none">{user.name}</span>
                    <span className="text-[9px] font-bold text-[#F8B803] uppercase tracking-tighter italic">Compte {user.role}</span>
                </div>

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2 pr-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-all border border-gray-100 active:scale-95 z-[5001]"
                >
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-black border-2 border-white">
                        {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* ICON HAMBURGER / X ANIMÉE */}
                    <div className="w-5 h-5 relative flex flex-col justify-center items-center gap-1.5 overflow-hidden">
                        <span className={`w-full h-0.5 bg-gray-900 rounded-full transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                        <span className={`w-full h-0.5 bg-gray-900 rounded-full transition-all duration-300 ${isMenuOpen ? 'opacity-0 translate-x-full' : ''}`}></span>
                        <span className={`w-full h-0.5 bg-gray-900 rounded-full transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <>
                        {/* Overlay invisible pour fermer le menu */}
                        <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>

                        <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.1)] border border-gray-50 p-4 z-20 animate-in zoom-in-95">
                            <div className="px-4 py-4 border-b border-gray-50 mb-4 bg-gray-50/50 rounded-3xl">
                                <p className="text-xs font-black text-gray-900 truncate">{user.name}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{user.email}</p>
                            </div>

                            <nav className="space-y-1">
                                <MenuButton icon="👤" label="Mon Compte" />
                                <MenuButton icon="🚕" label="Mes Courses" />
                                <MenuButton icon="⚙️" label="Paramètres" />
                                <div className="h-[1px] bg-gray-50 my-3 mx-4"></div>
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onLogout();
                                    }}
                                    className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
                                >
                                    <span className="text-lg group-hover:scale-110 transition-transform">📥</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Déconnexion</span>
                                </button>
                            </nav>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
};

const MenuButton = ({ icon, label }) => (
    <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-2xl transition-all text-gray-600 hover:text-black">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

export default Header;
