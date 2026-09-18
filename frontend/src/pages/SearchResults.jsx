import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductGrid from '../components/ProductGrid';
import SearchBar from '../components/SearchBar';
import Minicart from '../components/Minicart';
import Footer from '../components/Footer';

const ITEMS_PER_PAGE = 28;

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { addToCart, cartCount, setIsCartOpen } = useCart();
  const { user, isAdmin, signOut } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    if (!query.trim()) {
      navigate('/');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setCurrentPage(1);

    const offset = 0;

    supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .ilike('name', `%${query.trim()}%`)
      .order('created_at', { ascending: true })
      .range(offset, offset + ITEMS_PER_PAGE - 1)
      .then(({ data, count, error }) => {
        if (cancelled) return;
        if (!error) {
          setProducts(data || []);
          setTotalCount(count || 0);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [query, navigate]);

  useEffect(() => {
    if (currentPage === 1) return;

    let cancelled = false;
    setLoading(true);

    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .ilike('name', `%${query.trim()}%`)
      .order('created_at', { ascending: true })
      .range(offset, offset + ITEMS_PER_PAGE - 1)
      .then(({ data, count, error }) => {
        if (cancelled) return;
        if (!error) {
          setProducts(data || []);
          setTotalCount(count || 0);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [currentPage, query]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="header-menu-btn" onClick={() => navigate('/')}>
            <span className="menu-icon">←</span>
            <span className="menu-text">Voltar</span>
          </button>
        </div>
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>VIBE</div>
        <div className="header-actions">
          {isAdmin && (
            <a href="/admin" className="btn-text" style={{ marginRight: '20px', fontWeight: '700', textDecoration: 'underline' }}>
              Escritório (Admin)
            </a>
          )}
          {user ? (
            <div className="user-menu">
              <span style={{ marginRight: '15px', fontSize: '0.9rem' }}>
                {user.user_metadata?.full_name?.split(' ')[0] || 'Viber'}
              </span>
              <button className="btn-text" onClick={signOut} style={{ marginRight: '15px' }}>Sair</button>
            </div>
          ) : (
            <button className="btn-text" onClick={() => setIsLoginOpen(true)} style={{ marginRight: '15px' }}>
              Entrar
            </button>
          )}
          <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
            Sacola
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* Barra de busca na página de resultados */}
      <div className="search-results-bar-container">
        <SearchBar />
      </div>

      <main className="container section">
        <div className="search-results-header">
          {loading ? (
            <h2>Buscando por "<em>{query}</em>"...</h2>
          ) : (
            <h2>
              {totalCount > 0
                ? <>{totalCount} resultado{totalCount !== 1 ? 's' : ''} para "<em>{query}</em>"</>
                : <>Nenhum resultado para "<em>{query}</em>"</>
              }
            </h2>
          )}
          {!loading && totalCount === 0 && (
            <p className="search-no-results-hint">
              Tente usar palavras-chave mais curtas ou verifique a ortografia. Você também pode <button className="btn-text" onClick={() => navigate('/')} style={{ textDecoration: 'underline' }}>ver todos os produtos</button>.
            </p>
          )}
        </div>

        <ProductGrid
          products={products}
          loading={loading}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onAddToCart={addToCart}
        />
      </main>

      <Footer />
    </>
  );
}
