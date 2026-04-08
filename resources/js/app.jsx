import './bootstrap.js'; // Pour charger Echo/Reverb
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppLayouts from './Components/Layouts/AppLayouts.jsx';
import axios from 'axios';

// CONFIGURATION GLOBALE D'AXIOS
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.Accept = 'application/json';
    return config;
});

const rootElement = document.getElementById('app');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<AppLayouts />);
}
