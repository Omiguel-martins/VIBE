import { Link } from 'react-router-dom';

/**
 * ProductGrid
 * Renderiza a grade de produtos com paginação.
 * Props:
 *   - products: array de produtos da página atual (já paginados pelo servidor)
 *   - loading: boolean
 *   - totalPages: number
 *   - currentPage: number
 *   - onPageChange: (page: number) => void
 *   - onAddToCart: (product) => void
 */
export default function ProductGrid({ products, loading, totalPages, currentPage, onPageChange, onAddToCart }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p style={{ textAlign: 'center', marginTop: '60px', color: '#888' }}>
        Nenhum produto nesta categoria ainda.
      </p>
    );
  }

  return (
    <>
      <div className="product-grid">
        {products.map((product) => (
          <div className="product-card" key={product.id}>
            <Link to={`/produto/${product.slug}`} className="product-card-link" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="product-image-container">
                {product.image_url && !product.image_url.includes('LINK_') ? (
                  <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div className="product-image-placeholder">
                    <span>🌸</span>
                  </div>
                )}
                {product.stock <= 0 && (
                  <div className="out-of-stock-badge">Esgotado</div>
                )}
              </div>
              <div className="product-card-body">
                <span className="product-card-category">{product.category?.toUpperCase()}</span>
                <h3 className="product-card-name">{product.name}</h3>
                <p className="product-card-price">R$ {Number(product.price).toFixed(2).replace('.', ',')}</p>
              </div>
            </Link>
            <button
              className="btn-add-to-cart"
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0}
            >
              {product.stock <= 0 ? 'Esgotado' : 'Adicionar à Sacola'}
            </button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-btn number ${currentPage === page ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próxima
          </button>
        </div>
      )}
    </>
  );
}
