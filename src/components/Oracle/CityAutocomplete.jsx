import React, { useState, useEffect, useRef } from 'react';
import { usePlatformContext } from "../../context/platform-context";
import { MapPin, Loader2 } from 'lucide-react';

export function CityAutocomplete({ onSelect }) {
  const { oracleCredentials } = usePlatformContext();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  // A chave da API HERE deve estar armazenada no contexto a partir do DB
  const apiKey = oracleCredentials?.oracleHereApiKey;

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (!apiKey) {
      console.warn("Aviso: HERE Maps API Key não configurada no AdminPanel.");
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Usamos o endpoint de discover do HERE para encontrar cidades e já trazer lat/lng
        const endpoint = `https://geocode.search.hereapi.com/v1/discover?q=${encodeURIComponent(query)}&apiKey=${apiKey}&types=city`;
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.items) {
          setSuggestions(data.items);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Erro ao buscar cidades:", error);
      } finally {
        setLoading(false);
      }
    }, 600); // 600ms de debounce

    return () => clearTimeout(timeoutRef.current);
  }, [query, apiKey]);

  const handleSelect = (item) => {
    setQuery(item.title); // Preenche o input
    setIsOpen(false);
    onSelect({
      name: item.title,
      lat: item.position.lat,
      lng: item.position.lng
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
            onSelect(null); // Reseta a seleção se voltar a digitar
          }}
          placeholder="Digite o nome da cidade em que nasceu..."
          className="w-full bg-black/60 border border-mystic-purple/50 rounded-lg px-4 py-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:border-mystic-gold focus:ring-1 focus:ring-mystic-gold transition-all"
        />
        <div className="absolute left-4 top-4 text-mystic-gold/70">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
        </div>
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#1a0f2e] border border-mystic-purple rounded-lg shadow-2xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-mystic-gold scrollbar-track-black">
          {suggestions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 hover:bg-mystic-purple/50 text-gray-200 transition-colors border-b border-mystic-purple/30 last:border-0"
            >
              <div className="font-medium text-mystic-gold">{item.title}</div>
              <div className="text-xs text-gray-400 mt-1">
                {item.address?.state ? `${item.address.state}, ` : ''}{item.address?.countryName}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
