import './bootstrap.js'; // Pour charger Echo/Reverb
import React from 'react';
import ReactDOM from 'react-dom/client';
import Index from './Index.jsx';

const rootElement = document.getElementById('app');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<Index />);
}
