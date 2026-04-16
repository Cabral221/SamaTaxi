import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddressInput = ({ label, placeholder, onSelect, defaultValue }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isTyping, setIsTyping] = useState(false); // 🔥 Pour bloquer les recherches auto après sélection

    useEffect(() => {
        if (defaultValue) {
            setQuery(defaultValue);
            setIsTyping(false); // C'est une valeur auto, on ne cherche pas
        }
    }, [defaultValue]);

    useEffect(() => {
        // 🔥 On ne cherche que si l'utilisateur tape ET que ce n'est pas la valeur par défaut
        if (isTyping && query.length > 3 && query !== defaultValue) {
            const delayDebounceFn = setTimeout(() => {
                searchAddress(query);
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setSuggestions([]);
        }
    }, [query, isTyping]);

    const searchAddress = async (q) => {
        try {
            const url = `https://photon.komoot.io/api/?q=${q}&limit=5&lat=14.7167&lon=-17.4677`;
            const res = await axios.get(url);
            setSuggestions(res.data.features);
        } catch (err) {
            console.error("Erreur Geocoding:", err);
        }
    };

    return (
        <div className="address-group">
            <label className="address-label">{label}</label>
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setIsTyping(true); // 🔥 L'utilisateur tape, on active la recherche
                    setQuery(e.target.value);
                }}
                placeholder={placeholder}
                className="address-input-field"
            />

            {suggestions.length > 0 && (
                <ul className="suggestions-list">
                    {suggestions.map((s, index) => {
                        const cityName = s.properties.city || s.properties.state || '';
                        const districtName = s.properties.district ? `- ${s.properties.district}` : '';

                        return (
                            <li
                                key={index}
                                className="suggestion-item"
                                onClick={() => {
                                    const fullLabel = s.properties.name + (cityName ? `, ${cityName}` : '');
                                    const coords = {
                                        lat: s.geometry.coordinates[1],
                                        lng: s.geometry.coordinates[0],
                                        label: fullLabel
                                    };

                                    setIsTyping(false); // 🔥 STOP la recherche avant de mettre à jour le texte
                                    setQuery(fullLabel);
                                    setSuggestions([]);
                                    onSelect(coords);
                                }}
                            >
                                <div className="suggestion-icon">📍</div>
                                <div className="suggestion-text">
                                    <span className="suggestion-name">{s.properties.name}</span>
                                    <span className="suggestion-city">
                                        {cityName} {districtName}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default AddressInput;
