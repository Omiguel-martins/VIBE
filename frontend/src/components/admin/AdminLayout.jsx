import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

export default function AdminLayout() {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Aguarda o AuthContext terminar de verificar a sessão
    if (isLoading) return;

    if (!user) {
      navigate('/');
      return;
    }

    if (!isAdmin) {
      alert('Acesso restrito a administradores.');
      navigate('/');
    }
  }, [isLoading, user, isAdmin, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Mostra loading enquanto o AuthContext inicializa
  if (isLoading || !isAdmin) {
    return <div className="admin-loading">Carregando painel...</div>;
  }

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-logo">VIBE Admin</div>
        <nav className="admin-nav">
          <Link
            to="/admin"
            className={`admin-nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            Visão Geral
          </Link>
          <Link
            to="/admin/catalog"
            className={`admin-nav-link ${location.pathname === '/admin/catalog' ? 'active' : ''}`}
          >
            Catálogo & Produtos
          </Link>
          <Link
            to="/admin/promotions"
            className={`admin-nav-link ${location.pathname === '/admin/promotions' ? 'active' : ''}`}
          >
            Promoções
          </Link>
          <Link
            to="/admin/hero"
            className={`admin-nav-link ${location.pathname === '/admin/hero' ? 'active' : ''}`}
          >
            Carrossel Inicial
          </Link>
          {/* Futuramente: Pedidos, Avaliações */}
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">Sair do Painel</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <h2>Painel de Controle</h2>
          <Link to="/" className="back-to-store-btn">Ver Loja</Link>
        </header>
        <div className="admin-content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
