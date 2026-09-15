import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * HeroCarousel
 * Componente isolado do carrossel da Hero.
 * Props:
 *   - slides: array de objetos da tabela hero_slides
 *   - onCtaAction: função chamada com (cta_action: string) ao clicar no botão
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
            style={{
              background: slide.bg_image_url
                ? `linear-gradient(135deg, rgba(13,13,13,0.72) 0%, rgba(26,18,0,0.65) 100%), url(${slide.bg_image_url}) center/cover no-repeat`
                : slide.bg_color,
            }}
          >
            <div className={`hero-slide-content ${slide.text_dark ? 'dark-text' : 'light-text'}`}>
              <span
                className="hero-slide-label"
                style={{ color: slide.accent_color, borderColor: slide.accent_color }}
              >
                {slide.label}
              </span>
              <h1 className="hero-slide-title" style={{ '--slide-accent': slide.accent_color }}>
                {slide.title.split('\n').map((line, i, arr) => (
                  <span
                    key={i}
                    className={i === arr.length - 1 ? 'hero-title-accent' : ''}
                    style={{ '--slide-accent': slide.accent_color }}
                  >
                    {line}{i < arr.length - 1 && <br />}
                  </span>
                ))}
              </h1>
              <p className="hero-slide-subtitle">{slide.subtitle}</p>
              <button
                className="hero-slide-cta"
                style={{
                  '--slide-accent': slide.accent_color,
                  '--slide-accent-dark': slide.text_dark ? '#111' : '#fff',
                }}
                onClick={() => onCtaAction?.(slide.cta_action)}
              >
                {slide.cta_text}
              </button>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            className="hero-arrow hero-arrow-prev"
            onClick={() => goToSlide((currentSlide - 1 + slides.length) % slides.length)}
            aria-label="Slide anterior"
            style={activeSlide?.text_dark ? {
              background: 'rgba(0,0,0,0.12)', color: '#111', border: '1px solid rgba(0,0,0,0.18)',
            } : {
              background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
            }}
          >‹</button>
          <button
            className="hero-arrow hero-arrow-next"
            onClick={() => goToSlide((currentSlide + 1) % slides.length)}
            aria-label="Próximo slide"
            style={activeSlide?.text_dark ? {
              background: 'rgba(0,0,0,0.12)', color: '#111', border: '1px solid rgba(0,0,0,0.18)',
            } : {
              background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
            }}
          >›</button>
        </>
      )}

      {slides.length > 1 && (
        <div className="hero-dots">
          {slides.map((_, idx) => (
            <button
              key={idx}
              className={`hero-dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(idx)}
              aria-label={`Ir para slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
