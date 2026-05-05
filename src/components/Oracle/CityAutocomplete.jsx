import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CityAutocomplete({ onSelect }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&featuretype=city`;
        const response = await fetch(endpoint, {
           headers: { 'Accept-Language': 'pt-BR' }
        });
        const data = await response.json();
        
        if (data && data.length > 0) {
          setSuggestions(data);
          setIsOpen(true);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      } catch (error) {
        console.error(t('oracle.city_autocomplete.fetch_error', 'Erro ao buscar cidades:'), error);
      } finally {
        setLoading(false);
      }
    }, 800); 

    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  const handleSelect = (item) => {
    const cityName = item.display_name.split(',')[0];
    const lat = toNumber(item.lat);
    const lng = toNumber(item.lon);

    if (lat === null || lng === null) {
      onSelect(null);
      return;
    }

    setQuery(cityName); 
    setIsOpen(false);
    onSelect({
      name: cityName,
      lat,
      lng
    });
  };

  return (
    <div className="relative w-full text-left">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelect(null); 
          }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={t('oracle.city_autocomplete.placeholder', 'Digite o nome da cidade em que nasceu...')}
          className="w-full bg-black/60 border border-mystic-purple/50 rounded-lg px-4 py-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:border-mystic-gold focus:ring-1 focus:ring-mystic-gold transition-all"
        />
        <div className="absolute left-4 top-4 text-mystic-gold/70">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
        </div>
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#1a0f2e] border border-mystic-purple rounded-lg shadow-2xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-mystic-gold scrollbar-track-black">
          {suggestions.map((item, index) => (
            <button
              key={item.place_id || index}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
              className="w-full text-left px-4 py-3 hover:bg-mystic-purple/50 text-gray-200 transition-colors border-b border-mystic-purple/30 last:border-0"
            >
              <div className="font-medium text-mystic-gold">{item.display_name.split(',')[0]}</div>
              <div className="text-xs text-gray-400 mt-1 truncate">
                {item.display_name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
