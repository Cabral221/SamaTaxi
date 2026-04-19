// À ajouter dans ton fichier de styles (ou au début de Navigation.jsx)
export const Styles = {
    // Le badge de distance flottant (Top)
    distanceOverlay: {
        position: 'absolute', top: '20px', left: '15px', right: '15px', zIndex: 1000,
        background: 'rgba(45, 52, 54, 0.9)', backdropFilter: 'blur(10px)',
        padding: '15px', borderRadius: '18px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)'
    },
    // Carte du bas (Plus imposante pour le chauffeur)
    actionCard: {
        position: 'absolute', bottom: '0', left: '0', right: '0', zIndex: 1000,
        background: 'white', padding: '20px 20px 30px 20px',
        borderTopLeftRadius: '30px', borderTopRightRadius: '30px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.15)'
    },
    mainBtn: (color) => ({
        width: '100%', padding: '18px', background: color, color: 'white',
        border: 'none', borderRadius: '18px', fontWeight: '900', fontSize: '1.2em',
        cursor: 'pointer', boxShadow: `0 8px 20px ${color}44`, transition: '0.3s'
    }),
    secondaryBtn: {
        background: '#f1f2f6', color: '#ff4d4d', border: 'none',
        padding: '12px', borderRadius: '12px', width: '100%',
        fontWeight: 'bold', marginTop: '15px'
    }
};
