import { useEffect } from 'react';

/**
 * Define as OG Tags (Open Graph) da página dinamicamente.
 * Melhora o compartilhamento no WhatsApp, Instagram e Google.
 *
 * @param {object} options
 * @param {string} options.title       - Título da página (sem sufixo da marca)
 * @param {string} options.description - Descrição curta para preview social
 * @param {string} [options.image]     - URL da imagem de preview (og:image)
 * @param {string} [options.url]       - URL canônica (padrão: URL atual)
 */
export function useOgTags({ title, description, image, url }) {
  useEffect(() => {
    const BRAND = 'VIBE';
    const fullTitle = title ? `${title} | ${BRAND}` : BRAND;
    const canonicalUrl = url || window.location.href;
    const defaultImage = '/og-default.jpg'; // imagem padrão no /public

    function setMeta(property, content, attr = 'property') {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    }

    // Open Graph
    setMeta('og:type', 'website');
    setMeta('og:site_name', BRAND);
    setMeta('og:title', fullTitle);
    setMeta('og:description', description);
    setMeta('og:image', image || defaultImage);
    setMeta('og:url', canonicalUrl);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image', 'name');
    setMeta('twitter:title', fullTitle, 'name');
    setMeta('twitter:description', description, 'name');
    setMeta('twitter:image', image || defaultImage, 'name');

    // Meta description padrão
    setMeta('description', description, 'name');
  }, [title, description, image, url]);
}
