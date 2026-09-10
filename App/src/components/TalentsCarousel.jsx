import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Sparkles } from 'lucide-react';
import TalentCard from './TalentCard';

export default function TalentsCarousel({ talents = [] }) {
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [userInteracting, setUserInteracting] = useState(false);

  const displayTalents = talents;

  // Rotação Automática Contínua
  useEffect(() => {
    if (talents.length <= 1 || isPaused || userInteracting) return;

    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const el = containerRef.current;
      const cardWidth = el.querySelector('.talent-carousel-item')?.clientWidth || 300;
      const gap = 20; // 1.25rem
      const step = cardWidth + gap;
      
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      
      if (el.scrollLeft + step >= maxScroll - 15) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 3200);

    return () => clearInterval(interval);
  }, [talents, isPaused, userInteracting]);

  const scrollPrev = () => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const cardWidth = el.querySelector('.talent-carousel-item')?.clientWidth || 300;
    const step = cardWidth + 20;
    el.scrollBy({ left: -step, behavior: 'smooth' });
  };

  const scrollNext = () => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const cardWidth = el.querySelector('.talent-carousel-item')?.clientWidth || 300;
    const step = cardWidth + 20;
    const maxScroll = el.scrollWidth - el.clientWidth;
    
    if (el.scrollLeft + step >= maxScroll - 15) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: step, behavior: 'smooth' });
    }
  };

  if (talents.length === 0) return null;

  return (
    <div
      className="relative group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setUserInteracting(true)}
      onTouchEnd={() => setUserInteracting(false)}
    >
      {/* Botões de Navegação (se houver mais de 1 talento) */}
      {talents.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            aria-label="Talento anterior"
            className="absolute -left-3.5 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 dark:bg-slate-800 backdrop-blur-md border border-gray-200 dark:border-slate-600 shadow-brand-lg flex items-center justify-center text-gray-700 dark:text-white hover:bg-primary-blue dark:hover:bg-primary-blue hover:text-white dark:hover:border-primary-blue transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            onClick={scrollNext}
            aria-label="Próximo talento"
            className="absolute -right-3.5 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 dark:bg-slate-800 backdrop-blur-md border border-gray-200 dark:border-slate-600 shadow-brand-lg flex items-center justify-center text-gray-700 dark:text-white hover:bg-primary-blue dark:hover:bg-primary-blue hover:text-white dark:hover:border-primary-blue transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Trilha do Carrossel com Scroll Suave e Snap */}
      <div
        ref={containerRef}
        className="flex gap-5 overflow-x-auto scrollbar-none py-3 px-1 scroll-smooth cursor-grab active:cursor-grabbing"
      >
        {displayTalents.map((talent) => (
          <div
            key={talent.id || talent.firestoreId || talent.email}
            className="talent-carousel-item min-w-[275px] sm:min-w-[290px] lg:min-w-[305px] max-w-[315px] shrink-0 transition-transform duration-200 hover:-translate-y-1"
          >
            <TalentCard talent={talent} />
          </div>
        ))}
      </div>

      {/* Barra de Status e Controles Inferiores */}
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 text-primary-blue dark:text-blue-300 bg-primary-light dark:bg-blue-950/70 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 font-bold">
            <Sparkles size={13} /> {talents.length} {talents.length === 1 ? 'Talento em Destaque' : 'Talentos em Destaque'}
          </span>
        </div>

        {/* Botão Play/Pausa e Dica (apenas se houver mais de 1 talento) */}
        {talents.length > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 dark:text-slate-300 hidden sm:inline font-medium">
              {isPaused ? '⏸️ Carrossel pausado' : '▶️ Girando automaticamente'}
            </span>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              {isPaused ? <Play size={12} className="text-accent-green" /> : <Pause size={12} className="text-amber-500" />}
              {isPaused ? 'Continuar Giro' : 'Pausar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
