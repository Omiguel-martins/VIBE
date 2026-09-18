import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import HeroCarousel from '../components/HeroCarousel';
import ProductGrid from '../components/ProductGrid';
import AuthModal from '../components/AuthModal';
import SearchBar from '../components/SearchBar';

const ITEMS_PER_PAGE = 28;

function Home() {
  const { addToCart, cartCount, setIsCartOpen } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Catálogo
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [genderTab, setGenderTab] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);

  // Carrossel
  const [heroSlides, setHeroSlides] = useState([]);

  // UI
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Referência para a seção de produtos — substitui document.getElementById (anti-pattern)
  const fragrancesRef = useRef(null);

  // ─── Busca de slides (uma única vez) ────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('hero_slides')
      .select('*')
      .order('order_index')
      .then(({ data }) => {
        if (data?.length) setHeroSlides(data);
      });
  }, []);

  // ─── Bloqueio de scroll do body quando drawer estiver aberto ──────────────
  useEffect(() => {
    if (isCategoryDrawerOpen || isLoginOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCategoryDrawerOpen, isLoginOpen]);

  // ─── Server-side pagination: rebusca ao mudar filtros ou página ──────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (selectedCategory !== 'todos') {
      query = query.eq('category', selectedCategory);
    }
    if (genderTab !== 'todos') {
      query = query.eq('gender', genderTab);
    }

    query.then(({ data, count, error }) => {
      if (cancelled) return;
      if (!error) {
        setProducts(data || []);
        setTotalCount(count || 0);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [selectedCategory, genderTab, currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback((type, value) => {
    if (type === 'category') setSelectedCategory(value);
    if (type === 'gender') setGenderTab(value);
    setCurrentPage(1);
    setIsCategoryDrawerOpen(false);
  }, []);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fragrancesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [totalPages]);

  const handleCtaAction = useCallback((actionStr) => {
    if (!actionStr) return;
    if (actionStr.startsWith('/')) {
      navigate(actionStr);
    } else {
      setSelectedCategory(actionStr);
      setCurrentPage(1);
      fragrancesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [navigate]);

  // ─── JSX ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Overlay Category Drawer */}
      <div
        className={`minicart-overlay ${isCategoryDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsCategoryDrawerOpen(false)}
        style={{ zIndex: 999 }}
      />

      {/* Category Drawer */}
      <div className={`category-drawer ${isCategoryDrawerOpen ? 'open' : ''}`}>
        <div className="login-header">
          <button className="close-btn" onClick={() => setIsCategoryDrawerOpen(false)}>✕</button>
        </div>

        <div className="login-content" style={{ justifyContent: 'flex-start' }}>
          <h2 style={{ marginBottom: '30px' }}>Navegação</h2>

          <div className="drawer-nav-section">
            <h3 style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Categorias</h3>
            {[
              { label: 'Todos os Produtos', value: 'todos' },
              { label: 'VIBE', value: 'vibe' },
              { label: 'Fragrâncias', value: 'fragrancia' },
              { label: 'Body Splash', value: 'bodysplash' },
              { label: 'Combos', value: 'combo' },
            ].map(({ label, value }) => (
              <button
                key={value}
                className={`category-btn ${selectedCategory === value ? 'active' : ''}`}
                onClick={() => handleFilterChange('category', value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="drawer-nav-section">
            <h3 style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Para Quem?</h3>
            {[
              { label: 'Unissex / Todos', value: 'todos' },
              { label: 'Para Elas', value: 'feminino' },
              { label: 'Para Eles', value: 'masculino' },
            ].map(({ label, value }) => (
              <button
                key={value}
                className={`category-btn ${genderTab === value ? 'active' : ''}`}
                onClick={() => handleFilterChange('gender', value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="drawer-nav-section" style={{ marginTop: 'auto', borderTop: '1px solid #eaeaea', paddingTop: '20px' }}>
            <a href="#about" className="drawer-link" onClick={() => setIsCategoryDrawerOpen(false)}>Sobre a Marca</a>
            <a href="#contact" className="drawer-link" onClick={() => setIsCategoryDrawerOpen(false)}>Contato</a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="header-menu-btn" onClick={() => setIsCategoryDrawerOpen(true)}>
            <span className="menu-icon">☰</span>
            <span className="menu-text">Catálogo</span>
          </button>
        </div>
        <div className="logo">VIBE</div>
        <SearchBar />
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

      {/* Hero Carousel — componente isolado */}
      <HeroCarousel slides={heroSlides} onCtaAction={handleCtaAction} />

      {/* Catálogo */}
      <main className="container section" ref={fragrancesRef}>
        <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Nossas Fragrâncias</h2>

        <ProductGrid
          products={products}
          loading={loading}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onAddToCart={addToCart}
        />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-section">
          <h4>VIBE</h4>
          <p style={{ color: '#aaa', maxWidth: '300px' }}>
            A marca de Body Splash feita para exaltar a sua personalidade, todos os dias.
          </p>
          <div className="badges">
            <span className="badge">Compra Segura 🔒</span>
            <span className="badge">Garantia de Satisfação ⭐</span>
          </div>
        </div>
        <div className="footer-section">
          <h4>Links Úteis</h4>
          <div className="footer-links">
            <a href="#">Política de Privacidade</a>
            <a href="#">Termos de Uso</a>
            <a href="#">Trocas e Devoluções</a>
          </div>
        </div>
        <div className="footer-section">
          <h4>Siga-nos</h4>
          <div className="footer-links">
            <a href="#">Instagram</a>
            <a href="#">TikTok</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal — componente isolado */}
      <AuthModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}

export default Home;
