import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import ProductDetail from './pages/ProductDetail';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminCatalog from './components/admin/AdminCatalog';
import AdminHero from './components/admin/AdminHero';
import AdminPromotions from './components/admin/AdminPromotions';
import Minicart from './components/Minicart';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          {/* Minicart global — visível em todas as páginas */}
          <Minicart />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/produto/:slug" element={<ProductDetail />} />
            <Route path="/busca" element={<SearchResults />} />

            {/* Rotas de Admin — Protegidas no AdminLayout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="catalog" element={<AdminCatalog />} />
              <Route path="hero" element={<AdminHero />} />
              <Route path="promotions" element={<AdminPromotions />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
