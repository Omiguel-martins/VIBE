import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * HeroCarousel
 * Cada slide é uma imagem clicável — sem textos sobrepostos.
 * Props:
 *   - slides: array de objetos da tabela hero_slides
 *   - onCtaAction: função chamada com (cta_action: string) ao clicar no slide
 */
export default function HeroCarousel({ slides, onCtaAction }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length === 0) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(nextSlide, 5500);
    return () => clearInterval(intervalRef.current);
  }, [paused, nextSlide, slides.length]);

  if (slides.length === 0) return null;

  const activeSlide = slides[currentSlide];

  return (
    <section
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="hero-track"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="hero-slide"
            onClick={() => onCtaAction?.(slide.cta_action)}
            title={slide.cta_action ? 'Clique para ver mais' : undefined}
          >
            {slide.bg_image_url ? (
              <picture style={{ display: 'block', width: '100%', height: '100%' }}>
                {slide.bg_image_mobile_url && (
                  <source media="(max-width: 768px)" srcSet={slide.bg_image_mobile_url} />
                )}
                <img
                  src={slide.bg_image_url}
                  alt={slide.label || 'Banner VIBE'}
                  className="hero-slide-img"
                  draggable={false}
                />
              </picture>
            ) : (
              /* Fallback: fundo colorido caso não haja imagem */
              <div
                className="hero-slide-img"
                style={{
                  background: slide.bg_color || '#111',
                  minHeight: '320px',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            className="hero-arrow hero-arrow-prev"
            onClick={(e) => { e.stopPropagation(); goToSlide((currentSlide - 1 + slides.length) % slides.length); }}
            aria-label="Slide anterior"
            style={{ background: 'rgba(0,0,0,0.35)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
          >‹</button>
          <button
            className="hero-arrow hero-arrow-next"
            onClick={(e) => { e.stopPropagation(); goToSlide((currentSlide + 1) % slides.length); }}
            aria-label="Próximo slide"
            style={{ background: 'rgba(0,0,0,0.35)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
          >›</button>
        </>
      )}

      {slides.length > 1 && (
        <div className="hero-dots">
          {slides.map((_, idx) => (
            <button
              key={idx}
              className={`hero-dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
              aria-label={`Ir para slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
