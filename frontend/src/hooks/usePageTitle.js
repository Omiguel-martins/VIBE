import { useEffect } from 'react';

const BRAND = 'VIBE';

/**
 * Define o <title> da página de forma dinâmica.
 * @param {string} title - Título específico da página. Se vazio, usa só a marca.
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BRAND}` : BRAND;

    // Restaura o título padrão ao desmontar (boa prática)
    return () => {
      document.title = BRAND;
    };
  }, [title]);
}
