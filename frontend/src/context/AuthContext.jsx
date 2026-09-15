import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Busca o role do usuário no banco uma única vez
  async function fetchRole(userId) {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    setIsAdmin(data?.role === 'admin');
  }

  useEffect(() => {
    // Checa sessão ativa ao montar
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await fetchRole(currentUser?.id ?? null);
      setIsLoading(false);
    });

    // Escuta mudanças de auth (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await fetchRole(currentUser?.id ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
