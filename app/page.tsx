'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SearchBar from '@/components/SearchBar';
import Filters from '@/components/Filters';
import ResultList from '@/components/ResultList';
import type { SearchResult, SearchError } from '@/lib/types';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map...</div>
});

export default function Home() {
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterOperator, setFilterOperator] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    setFilterOperator(null);
    setFilterType(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as SearchError;
        setError(errorData.error);
        setSearchResult(null);
      } else {
        setSearchResult(data as SearchResult);
        setError(null);
      }
    } catch {
      setError('Network error. Please check your connection.');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
              <path strokeLinecap="round" strokeWidth="2" d="M12 2v4m0 12v4M2 12h4m12 0h4m-2.93-7.07l-2.83 2.83m-8.48 8.48l-2.83 2.83m14.14 0l-2.83-2.83M6.34 6.34L3.51 3.51" />
            </svg>
            <span className="logo-text">Sightline</span>
          </div>
          
          <SearchBar onSearch={handleSearch} loading={loading} />
          
          <div className="header-meta">
            <a 
              href="https://github.com/ni5arga/sightline" 
              target="_blank" 
              rel="noopener noreferrer"
              className="header-link"
            >
              Docs
            </a>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <main className="app-main">
        <Filters
          searchResult={searchResult}
          selectedOperator={filterOperator}
          selectedType={filterType}
          onOperatorChange={setFilterOperator}
          onTypeChange={setFilterType}
        />
        
        <ResultList
          results={searchResult?.results || []}
          selectedId={selectedId}
          onSelect={handleSelect}
          filterOperator={filterOperator}
          filterType={filterType}
        />
        
        <MapView
          results={searchResult?.results || []}
          bounds={searchResult?.bounds || null}
          selectedId={selectedId}
          onSelect={handleSelect}
          filterOperator={filterOperator}
          filterType={filterType}
        />
      </main>
    </div>
  );
}
