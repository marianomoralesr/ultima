import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import type { WordPressVehicle } from '../types/types';
import { useVehicles } from '../context/VehicleContext';
import { formatPrice } from '../utils/formatters';

const HeaderSearchBar: React.FC = () => {
  const { vehicles: allVehicles } = useVehicles();
  const [query, setQuery] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [results, setResults] = useState<WordPressVehicle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tooltipShown = sessionStorage.getItem('headerSearchTooltipShown');
    if (!tooltipShown) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        sessionStorage.setItem('headerSearchTooltipShown', 'true');
      }, 2500); // Wait 2.5s before showing
      
      const hideTimer = setTimeout(() => {
        setShowTooltip(false);
      }, 7500); // Tooltip is visible for 5s

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsDropdownVisible(false);
      return;
    }
    setIsSearching(true);
    const handler = setTimeout(() => {
      try {
        const lowercasedQuery = query.toLowerCase();
        const filtered = allVehicles.filter(v =>
          v.titulo.toLowerCase().includes(lowercasedQuery) ||
          (v.marca && v.marca.toLowerCase().includes(lowercasedQuery)) ||
          (v.modelo && v.modelo.toLowerCase().includes(lowercasedQuery)) ||
          (v.autoano && v.autoano.toString().includes(lowercasedQuery))
        );
        setResults(filtered.slice(0, 5)); // Show top 5 results
        setIsDropdownVisible(true);
      } catch (error) {
        console.error("Live search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, allVehicles]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownVisible(false);
    if (query.trim()) {
      navigate(`/autos?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleResultClick = (slug: string) => {
    setIsDropdownVisible(false);
    setQuery('');
    navigate(`/autos/${slug}`);
  };

  return (
    <div className="relative w-full max-w-2xl" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="header-search-container">
          <div className="relative flex items-center w-full bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 sm:pl-3 lg:pl-4">
              {isSearching ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5 text-gray-400 animate-spin" /> : <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5 text-gray-400" aria-hidden="true" />}
            </div>
            <input
              type="search"
              name="search"
              id="header-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por marca, modelo o año..."
              className="block w-full rounded-full border-0 bg-transparent py-2 sm:py-2 lg:py-2.5 pl-8 sm:pl-10 lg:pl-11 pr-3 sm:pr-3 lg:pr-4 text-sm sm:text-sm leading-tight text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-primary-500 focus:bg-white"
              autoComplete="off"
            />
          </div>
        </div>
      </form>
      {isDropdownVisible && results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-2 w-full bg-white rounded-lg shadow-2xl z-[60] overflow-hidden border border-gray-200 max-h-[70vh] overflow-y-auto">
          {results.map(vehicle => (
            <li key={vehicle.id}>
              <button onClick={() => handleResultClick(vehicle.slug)} className="w-full text-left flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-100 active:bg-gray-200 transition-colors">
                <img src={vehicle.feature_image} alt={vehicle.titulo} className="w-16 h-14 sm:w-20 sm:h-16 object-cover rounded-md flex-shrink-0 shadow-sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm sm:text-sm text-gray-900 line-clamp-2">{vehicle.titulo}</p>
                  <p className="text-sm sm:text-sm text-primary-600 font-bold mt-0.5">{formatPrice(vehicle.precio)}</p>
                </div>
              </button>
            </li>
          ))}
           <li className="p-3 sm:p-2 bg-gray-50 border-t border-gray-200">
                <button onClick={() => handleSubmit(new Event('submit') as any)} className="w-full text-center text-sm sm:text-sm font-semibold text-primary-600 hover:text-primary-700 active:text-primary-800 py-1.5">
                    Ver todos los resultados para "{query}"
                </button>
            </li>
        </ul>
      )}
      {showTooltip && (
        <div className="header-search-tooltip">
          ¿Qué auto estás buscando?
        </div>
      )}
    </div>
  );
};

export default HeaderSearchBar;