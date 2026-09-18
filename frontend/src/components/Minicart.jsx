import { useCart } from '../context/CartContext';
import { useEffect } from 'react';

export default function Minicart() {
  const { cartItems, cartTotal, isCartOpen, setIsCartOpen, removeFromCart, updateQty } = useCart();

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const handleWhatsAppCheckout = () => {
    const phoneNumber = "5566981338837";
    let message = "Olá! Gostaria de finalizar meu pedido:\n\n";
    
    cartItems.forEach(item => {
      message += `${item.qty}x ${item.name} - R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}\n`;
    });
    
    message += `\n*Total: R$ ${cartTotal.toFixed(2).replace('.', ',')}*`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <>
      <div
        className={`minicart-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={() => setIsCartOpen(false)}
      />
      <div className={`minicart ${isCartOpen ? 'open' : ''}`}>
        <div className="minicart-header">
          <h2>Sua Sacola</h2>
          <button className="close-btn" onClick={() => setIsCartOpen(false)}>✕</button>
        </div>
        <div className="minicart-items">
          {cartItems.length === 0 ? (
            <p style={{ color: '#888', padding: '20px 0' }}>Sua sacola está vazia.</p>
          ) : (
            cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-img">
                  {item.image_url && !item.image_url.includes('LINK_DA_FOTO') ? (
                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                  ) : (
                    <div style={{ background: '#eee', width: '100%', height: '100%', borderRadius: 'inherit' }} />
                  )}
                </div>
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <div className="cart-item-price">
                    R$ {Number(item.price).toFixed(2).replace('.', ',')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: '24px', height: '24px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: '#fff' }}>−</button>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} disabled={item.qty >= item.stock} style={{ width: '24px', height: '24px', border: '1px solid #ddd', borderRadius: '4px', cursor: item.qty >= item.stock ? 'not-allowed' : 'pointer', background: '#fff', opacity: item.qty >= item.stock ? 0.5 : 1 }}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Remover</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="minicart-footer">
            <div className="minicart-total">
              <span>Total:</span>
              <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <button className="btn-primary" onClick={handleWhatsAppCheckout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Finalizar via WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  );
}
