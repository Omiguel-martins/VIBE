import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Fecha o dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca sugestões com debounce de 300ms
  const fetchSuggestions = useCallback((value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, image_url, price')
        .eq('is_active', true)
        .ilike('name', `%${value.trim()}%`)
        .limit(6);

      setSuggestions(data || []);
      setIsOpen(true);
      setLoading(false);
    }, 300);
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    navigate(`/busca?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSuggestionClick = (product) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/produto/${product.slug}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="search-bar-wrapper" ref={containerRef}>
      <form className="search-bar-form" onSubmit={handleSubmit}>
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          type="search"
          className="search-bar-input"
          placeholder="Busque sua vibe aqui"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-label="Buscar produtos"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); }}
            aria-label="Limpar busca"
          >
            ✕
          </button>
        )}
      </form>

      {isOpen && (
        <div className="search-suggestions" role="listbox">
          {loading && (
            <div className="search-suggestion-loading">Buscando...</div>
          )}
          {!loading && suggestions.length === 0 && query.trim() && (
            <div className="search-suggestion-empty">
              Nenhum produto encontrado para "<strong>{query}</strong>"
            </div>
          )}
          {!loading && suggestions.map((product) => (
            <button
              key={product.id}
              className="search-suggestion-item"
              onClick={() => handleSuggestionClick(product)}
              role="option"
            >
              <div className="suggestion-img">
                {product.image_url && !product.image_url.includes('LINK_DA_FOTO') ? (
                  <img src={product.image_url} alt={product.name} />
                ) : (
                  <div className="suggestion-img-placeholder" />
                )}
              </div>
              <div className="suggestion-info">
                <span className="suggestion-name">{product.name}</span>
                <span className="suggestion-price">
                  R$ {Number(product.price).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <span className="suggestion-arrow">→</span>
            </button>
          ))}
          {!loading && suggestions.length > 0 && (
            <button
              className="search-see-all-btn"
              onClick={handleSubmit}
            >
              Ver todos os resultados para "{query}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
