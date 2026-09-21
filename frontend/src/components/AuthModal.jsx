import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * AuthModal
 * Modal de login/cadastro com modal premium de confirmação de e-mail.
 * Props:
 *   - isOpen: boolean
 *   - onClose: () => void
 */
export default function AuthModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setShowEmailConfirm(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConfirmClose = () => {
    setShowEmailConfirm(false);
    onClose();
  };

  return (
    <>
      {/* ── Modal premium de confirmação de e-mail ── */}
      {showEmailConfirm && (
        <div className="email-confirm-overlay" onClick={handleConfirmClose}>
          <div className="email-confirm-modal" onClick={e => e.stopPropagation()}>

            <div className="email-confirm-icon-wrap">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="56" height="56" rx="28" fill="#c9a25b" fillOpacity="0.12"/>
                <path d="M13 20a2 2 0 0 1 2-2h26a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2V20Z"
                  stroke="#c9a25b" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M13 20l15 11 15-11"
                  stroke="#c9a25b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h3 className="email-confirm-title">Quase lá!</h3>

            <p className="email-confirm-body">
              Enviamos um link de confirmação para<br />
              <span className="email-confirm-address">{email}</span>
            </p>

            <p className="email-confirm-body" style={{ marginTop: '8px' }}>
              Acesse seu e-mail e clique no link para ativar sua conta VIBE.
            </p>

            <p className="email-confirm-hint">
              Não encontrou? Verifique a caixa de spam.
            </p>

            <button className="email-confirm-btn" onClick={handleConfirmClose}>
              Entendi
            </button>

          </div>
        </div>
      )}

      {/* ── Drawer de login / cadastro ── */}
      <div className={`minicart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`login-drawer ${isOpen ? 'open' : ''}`}>
        <div className="login-header">
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="login-content">
          <h2>{authMode === 'login' ? 'Entrar' : 'Criar conta'}</h2>

          <div className="auth-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              className={`btn-text ${authMode === 'login' ? 'bold-highlight' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Entrar
            </button>
            <button
              className={`btn-text ${authMode === 'signup' ? 'bold-highlight' : ''}`}
              onClick={() => setAuthMode('signup')}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {authMode === 'signup' && (
              <div className="input-group">
                <label>Nome completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  placeholder="Seu nome"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="input-group">
              <label>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>
            <div className="input-group">
              <label>Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {authError && (
              <p style={{ color: '#e53935', fontSize: '0.9rem', marginTop: '-8px' }}>
                {authError}
              </p>
            )}

            <button type="submit" className="btn-primary auth-submit" disabled={authLoading}>
              {authLoading ? 'Aguarde...' : (authMode === 'login' ? 'Entrar' : 'Criar conta')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
