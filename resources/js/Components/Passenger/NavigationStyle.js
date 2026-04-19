// NavigationStyles.js
export const navStyles = {
    headerCard: {
        position: 'absolute', top: '20px', left: '15px', right: '15px', zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)',
        padding: '18px', borderRadius: '20px', display: 'flex', alignItems: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.3)'
    },
    priceBadge: {
        background: '#2d3436', color: 'white', padding: '10px 15px', borderRadius: '12px',
        fontWeight: '800', fontSize: '1.1em'
    },
    bottomCard: {
        position: 'absolute', bottom: '0', left: '0', right: '0', zIndex: 1000,
        background: 'white', padding: '20px 25px 35px 25px',
        borderTopLeftRadius: '30px', borderTopRightRadius: '30px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.15)'
    },
    dragHandle: {
        width: '40px', height: '5px', background: '#dfe6e9', borderRadius: '10px',
        margin: '0 auto 15px auto'
    },
    driverAvatar: {
        width: '45px', height: '45px', background: '#f1f2f6', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 'bold', color: '#2ecc71', fontSize: '1.2em', border: '2px solid #2ecc71'
    },
    addressBox: {
        background: '#f8f9fa', padding: '15px', borderRadius: '15px', marginBottom: '20px'
    },
    addressLine: { display: 'flex', alignItems: 'center', gap: '10px' },
    dot: { width: '8px', height: '8px', borderRadius: '50%' },
    addressText: { fontSize: '0.85em', color: '#2d3436', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    cancelButton: {
        width: '100%', padding: '16px', background: '#ff7675', color: 'white',
        border: 'none', borderRadius: '15px', fontWeight: '800', cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(255, 118, 117, 0.3)', transition: '0.3s'
    },
    arrivalBadge: {
        position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 2000, background: '#2ecc71', color: 'white', padding: '12px 25px',
        borderRadius: '50px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px',
        boxShadow: '0 10px 20px rgba(46, 204, 113, 0.4)'
    },
    phoneBtn: {
        display: 'inline-block', padding: '10px', background: '#f1f2f6',
        borderRadius: '12px', textDecoration: 'none', fontSize: '1.2em'
    }
};
