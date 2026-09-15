import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * AuthModal
 * Modal de login/cadastro extraído da Home.jsx.
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

  if (!isOpen) return null;

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
        alert('Cadastro realizado! Verifique seu e-mail para confirmar o acesso.');
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

  return (
    <>
      <div className="modal-overlay open" onClick={onClose} />
      <div className="modal open">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>{authMode === 'login' ? 'Entrar' : 'Criar conta'}</h2>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => setAuthMode('login')}
          >
            Entrar
          </button>
          <button
            className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
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
    </>
  );
}
