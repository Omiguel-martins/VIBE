import { useState, useEffect } from 'react';

export default function Footer() {
  const [modalType, setModalType] = useState(null);

  // WhatsApp para Trocas e Devoluções
  const handleWhatsApp = (e) => {
    e.preventDefault();
    const phoneNumber = "5566981338837";
    const message = "Olá, estou com problema com meu produto, pode me ajudar?";
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  // Bloquear scroll do body quando modal aberto
  useEffect(() => {
    if (modalType) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalType]);

  return (
    <>
      <footer className="footer">
        <div className="footer-section">
          <h4>VIBE</h4>
          <p style={{ color: '#aaa', maxWidth: '300px' }}>
            A marca de Body Splashes e Perfumes feita para exaltar a sua personalidade, todos os dias.
          </p>
          <div className="badges">
            <span className="badge">Compra Segura 🔒</span>
            <span className="badge">Garantia de Satisfação ⭐</span>
          </div>
        </div>
        <div className="footer-section">
          <h4>Links Úteis</h4>
          <div className="footer-links">
            <button onClick={() => setModalType('privacy')} className="footer-btn-link">Política de Privacidade</button>
            <button onClick={() => setModalType('terms')} className="footer-btn-link">Termos de Uso</button>
            <button onClick={handleWhatsApp} className="footer-btn-link">Trocas e Devoluções</button>
          </div>
          <div className="footer-dev-credit">
            <span>Desenvolvido por</span>
            <a
              href="https://www.instagram.com/omiguel.martins/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-dev-link"
            >
              {/* Ícone Instagram SVG */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @omiguel.martins
            </a>
          </div>
        </div>
        <div className="footer-section">
          <h4>Siga-nos</h4>
          <div>
            <a
              href="https://www.instagram.com/vibepormarinagabriela?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="footer-dev-link"
              style={{ fontSize: '0.9rem', marginTop: '12px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @vibepormarinagabriela
            </a>
          </div>
        </div>
      </footer>

      {/* MODAL DE POLÍTICAS */}
      {modalType && (
        <div className="policy-modal-overlay" onClick={() => setModalType(null)}>
          <div className="policy-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="policy-modal-header">
              <h3>{modalType === 'privacy' ? 'Política de Privacidade' : 'Termos de Uso'}</h3>
              <button className="policy-modal-close" onClick={() => setModalType(null)}>✕</button>
            </div>
            <div className="policy-modal-body">
              {modalType === 'privacy' && (
                <>
                  <p><strong>Última atualização:</strong> Setembro de 2026</p>
                  <p>Bem-vindo à VIBE. Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais ao utilizar nosso site e serviços.</p>
                  
                  <h4>1. Coleta de Informações</h4>
                  <p>Coletamos informações que você nos fornece diretamente (como nome, endereço, e-mail e telefone) durante o cadastro, compra e atendimento. Também coletamos automaticamente dados de navegação por meio de cookies para melhorar sua experiência.</p>
                  
                  <h4>2. Uso das Informações</h4>
                  <p>As informações coletadas são usadas para processar pedidos, realizar entregas, processar pagamentos, comunicar-se sobre o seu pedido e, se autorizado, enviar ofertas promocionais.</p>
                  
                  <h4>3. Proteção e Segurança</h4>
                  <p>Adotamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração ou destruição. Seus dados de pagamento são processados através de gateways de pagamento seguros e não são armazenados em nossos servidores.</p>
                  
                  <h4>4. Compartilhamento de Dados</h4>
                  <p>Não vendemos ou alugamos suas informações. Compartilhamos dados estritamente necessários apenas com parceiros logísticos e de pagamento para viabilizar a sua compra.</p>
                  
                  <div className="lgpd-notice">
                    <strong>Aviso LGPD:</strong> Em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), garantimos os seus direitos de acesso, correção, anonimização e exclusão de seus dados. Você pode exercer seus direitos a qualquer momento entrando em contato conosco.
                  </div>
                </>
              )}
              {modalType === 'terms' && (
                <>
                  <p><strong>Última atualização:</strong> Setembro de 2026</p>
                  <p>Estes Termos de Uso regem o seu acesso e uso do site VIBE e a compra dos nossos produtos.</p>
                  
                  <h4>1. Aceitação dos Termos</h4>
                  <p>Ao acessar e usar este site, você concorda em cumprir integralmente com estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não deverá utilizar nossos serviços.</p>
                  
                  <h4>2. Produtos e Precificação</h4>
                  <p>Nos esforçamos para exibir com precisão as características e preços dos produtos (Body Splashes e Perfumes). Reservamo-nos o direito de alterar os preços a qualquer momento sem aviso prévio. Os pedidos estão sujeitos à disponibilidade de estoque.</p>
                  
                  <h4>3. Política de Trocas e Devoluções</h4>
                  <p>Garantimos o direito de arrependimento da compra em até 7 (sete) dias corridos após o recebimento do produto, desde que este esteja em sua embalagem original, lacrado e sem indícios de uso. Para solicitar, acesse a aba "Trocas e Devoluções" no rodapé.</p>
                  
                  <h4>4. Responsabilidade</h4>
                  <p>Não nos responsabilizamos por alergias ou reações adversas decorrentes do uso inadequado dos produtos, ou incompatibilidade pessoal com os ingredientes informados nos rótulos.</p>
                  
                  <div className="lgpd-notice">
                    <strong>Aviso LGPD:</strong> A utilização deste site está condicionada à nossa Política de Privacidade, desenvolvida em conformidade com a LGPD (Lei nº 13.709/2018) para assegurar a proteção de todos os seus dados.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
