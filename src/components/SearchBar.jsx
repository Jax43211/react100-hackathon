import { useState, useEffect } from 'react';

export default function SearchBar({ onSearch, flights = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Debounced search (300ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        onSearch?.(null); // null means show all flights
        return;
      }

      const term = searchTerm.toUpperCase().trim();
      const results = flights.filter(flight =>
        flight.callsign?.toUpperCase().includes(term)
      );

      setSearchResults(results);
      onSearch?.(results);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, flights, onSearch]);

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    onSearch?.(null);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-gray-200">
      {/* Search Input */}
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg placeholder-gray-500"
          placeholder="Search flights (UAL123, AAL456, DAL...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoComplete="off"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Live results count */}
      {searchTerm && (
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>
            {searchResults.length > 0 ? (
              <>
                {searchResults.length} of {flights.length} flight{searchResults.length !== 1 ? 's' : ''} found
              </>
            ) : (
              flights.length > 0 ? (
                <>No flights match "{searchTerm}"</>
              ) : (
                <>Waiting for flights to load...</>
              )
            )}
          </span>
          <button
            onClick={clearSearch}
            className="text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline transition-all"
          >
            Clear
          </button>
        </div>
      )}

      {/* Help text when not searching */}
      {!searchTerm && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 Try: UAL, AAL, DAL, SWA, JBU</p>
          <p>🎖️ Military: RCH, SAM, TANK</p>
          <p>✈️ General Aviation: N123AB</p>
        </div>
      )}
    </div>
  );
}