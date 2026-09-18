import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import Footer from '../components/Footer';
import '../App.css';

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px', cursor: onChange ? 'pointer' : 'default' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          style={{
            fontSize: onChange ? '1.8rem' : '1.1rem',
            color: star <= (hovered || value) ? '#F5A623' : '#ddd',
            transition: 'color 0.15s'
          }}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(star)}
        >★</span>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart, setIsCartOpen } = useCart();
  const { user: session, isAdmin } = useAuth(); // sessão via AuthContext global
  const [product, setProduct] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { data, error } = await supabase
          .from('products').select('*').eq('slug', slug).single();
        if (error) throw error;
        if (data) {
          // Se o produto está inativo e não é admin
          if (data.is_active === false && !isAdmin) {
            setIsAvailable(false);
            setProduct(null);
          } else {
            setProduct(data);
            setActiveImage(data.image_url);
            setIsAvailable(true);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar produto:', err);
        setIsAvailable(false);
      } finally {
        setLoading(false);
      }
    }
    // Aguarda o isAdmin ser resolvido caso a página carregue logado
    if (isAdmin !== undefined) {
      fetchProduct();
    }
  }, [slug, isAdmin]);

  useEffect(() => {
    if (!product) return;
    fetchReviews();
  }, [product]);

  async function fetchReviews() {
    setReviewsLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*, users(full_name)')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });
    if (data) {
      setReviews(data);
      if (session) {
        const mine = data.find(r => r.user_id === session.id);
        setUserReview(mine || null);
        if (mine) { setNewRating(mine.rating); setNewComment(mine.comment || ''); }
      }
    }
    setReviewsLoading(false);
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!session) { alert('Faça login para deixar sua avaliação.'); return; }
    if (newRating === 0) { setSubmitMsg('Selecione uma nota de 1 a 5 estrelas.'); return; }
    setSubmitting(true);
    setSubmitMsg('');

    const payload = {
      product_id: product.id,
      user_id: session.id,
      rating: newRating,
      comment: newComment
    };

    let error;
    if (userReview) {
      ({ error } = await supabase.from('reviews').update({ rating: newRating, comment: newComment }).eq('id', userReview.id));
    } else {
      ({ error } = await supabase.from('reviews').insert([payload]));
    }

    setSubmitting(false);
    if (error) {
      setSubmitMsg(`Erro: ${error.message}`);
    } else {
      setSubmitMsg('Avaliação enviada! Obrigada pelo carinho. 🌸');
      fetchReviews();
    }
  }

  function handleAddToCart() {
    if (!product) return;
    addToCart(product);
  }

  if (loading) {
    return (
      <>
        <header className="header">
          <Link to="/" className="logo">VIBE</Link>
        </header>
        <div style={{ padding: '100px', textAlign: 'center', color: '#888' }}>Carregando fragrância...</div>
      </>
    );
  }

  if (!isAvailable || !product) {
    return (
      <>
        <header className="header">
          <Link to="/" className="logo">VIBE</Link>
        </header>
        <div style={{ padding: '100px', textAlign: 'center' }}>
          <h2>Produto Indisponível</h2>
          <p style={{ color: '#888', marginTop: '10px' }}>Este produto está temporariamente indisponível ou não existe.</p>
          <Link to="/#fragrances" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px' }}>Ver Catálogo</Link>
        </div>
      </>
    );
  }

  const allImages = [product.image_url, ...(product.gallery_urls || [])].filter(Boolean);
  const avgRating = reviews.length > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <>
      <header className="header">
        <div className="header-left">
          <Link to="/" className="header-menu-btn" style={{ textDecoration: 'none' }}>
            <span className="menu-icon">←</span>
            <span className="menu-text">Catálogo</span>
          </Link>
        </div>
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>VIBE</Link>
        <div className="header-actions">
          <button className="cart-btn" onClick={() => setIsCartOpen(true)}>Sacola</button>
        </div>
      </header>

      {/* Alerta para Admin Visualizando Produto Oculto */}
      {product.is_active === false && isAdmin && (
        <div style={{ background: '#fef3c7', color: '#92400e', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
          ⚠️ Atenção Admin: Este produto está Oculto. Apenas você consegue ver esta página.
        </div>
      )}

      <main className="product-detail-container">
        {/* Galeria */}
        <div className="product-gallery">
          <div className="main-image">
            {activeImage ? (
              <img src={activeImage} alt={product.name} />
            ) : (
              <div className="image-placeholder">Sem Imagem</div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="thumbnail-list">
              {allImages.map((imgUrl, index) => (
                <div
                  key={index}
                  className={`thumbnail ${activeImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setActiveImage(imgUrl)}
                >
                  <img src={imgUrl} alt={`${product.name} visão ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-info-panel">
          <span className="product-category-label">{product.category.toUpperCase()}</span>
          <h1 className="product-title">{product.name}</h1>

          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              <StarRating value={Math.round(avgRating)} />
              <span style={{ fontSize: '0.9rem', color: '#888' }}>{avgRating} ({reviews.length} avaliações)</span>
            </div>
          )}

          <p className="product-price-large">R$ {Number(product.price).toFixed(2).replace('.', ',')}</p>

          <div className="product-description-block">
            <h3>Sobre a Fragrância</h3>
            <p>{product.description}</p>
          </div>

          {product.stock <= 0 ? (
            <button className="btn-primary add-to-cart-large" disabled style={{ opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#666' }}>
              Esgotado
            </button>
          ) : (
            <button className="btn-primary add-to-cart-large" onClick={handleAddToCart}>
              Adicionar à Sacola
            </button>
          )}
          <p style={{ marginTop: '10px', fontSize: '0.9rem', color: product.stock <= 0 ? '#ff4d4f' : '#666' }}>
            {product.stock > 0 ? `${product.stock} unidades em estoque` : 'Produto temporariamente sem estoque'}
          </p>

          <div className="product-benefits">
            <div className="benefit-item">✨ Fixação Prolongada</div>
            <div className="benefit-item">🌸 Assinatura Olfativa Única</div>
            <div className="benefit-item">📦 Envio para todo o Brasil</div>
          </div>
        </div>
      </main>

      {/* Seção de Avaliações */}
      <section className="reviews-section">
        <div className="reviews-container">
          <h2 className="reviews-title">O que dizem sobre essa VIBE</h2>

          {/* Formulário de avaliação */}
          <div className="review-form-card">
            {!session ? (
              <p style={{ textAlign: 'center', color: '#aaa' }}>
                <Link to="/" style={{ color: '#F5A623', textDecoration: 'underline' }}>Faça login</Link> para deixar sua avaliação.
              </p>
            ) : (
              <>
                <h3>{userReview ? 'Editar minha avaliação' : 'Deixe sua avaliação'}</h3>
                <form onSubmit={handleSubmitReview} className="review-form">
                  <div className="review-stars-picker">
                    <span>Sua nota:</span>
                    <StarRating value={newRating} onChange={setNewRating} />
                  </div>
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Conte como foi sua experiência com essa fragrância... (opcional)"
                    rows="4"
                    className="review-textarea"
                  />
                  {submitMsg && (
                    <p style={{ color: submitMsg.startsWith('Erro') ? '#e53935' : '#4CAF50', fontSize: '0.9rem' }}>
                      {submitMsg}
                    </p>
                  )}
                  <button type="submit" className="btn-primary review-submit-btn" disabled={submitting}>
                    {submitting ? 'Enviando...' : (userReview ? 'Atualizar Avaliação' : 'Publicar Avaliação')}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Lista de avaliações */}
          <div className="reviews-list">
            {reviewsLoading ? (
              <p style={{ color: '#888', textAlign: 'center' }}>Carregando avaliações...</p>
            ) : reviews.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center' }}>
                Nenhuma avaliação ainda. Seja a primeira a compartilhar sua VIBE! 🌸
              </p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-card-header">
                    <div className="review-avatar">
                      {(review.users?.full_name || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="review-author">{review.users?.full_name || 'Cliente VIBE'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <StarRating value={review.rating} />
                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                          {new Date(review.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="review-comment">{review.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
