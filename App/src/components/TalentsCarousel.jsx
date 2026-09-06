import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Sparkles } from 'lucide-react';
import TalentCard from './TalentCard';

export default function TalentsCarousel({ talents = [] }) {
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [userInteracting, setUserInteracting] = useState(false);

  // Duplica os itens para criar uma experiência contínua e rica de navegação
  const displayTalents = talents.length > 0 ? [...talents, ...talents] : [];

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
      
      if (el.scrollLeft + step >= maxScroll - 20) {
        // Volta instantaneamente para o meio da trilha sem quebrar a ilusão de loop
        el.scrollTo({ left: 0, behavior: 'auto' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 2800);

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
    
    if (el.scrollLeft + step >= maxScroll - 20) {
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
      {/* Botão Anterior */}
      <button
        onClick={scrollPrev}
        aria-label="Talento anterior"
        className="absolute -left-3.5 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 shadow-brand-lg flex items-center justify-center text-gray-700 dark:text-slate-200 hover:bg-primary-blue dark:hover:bg-primary-blue hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <ChevronLeft size={22} />
      </button>

      {/* Botão Próximo */}
      <button
        onClick={scrollNext}
        aria-label="Próximo talento"
        className="absolute -right-3.5 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 shadow-brand-lg flex items-center justify-center text-gray-700 dark:text-slate-200 hover:bg-primary-blue dark:hover:bg-primary-blue hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <ChevronRight size={22} />
      </button>

      {/* Trilha do Carrossel com Scroll Suave e Snap */}
      <div
        ref={containerRef}
        className="flex gap-5 overflow-x-auto scrollbar-none py-3 px-1 scroll-smooth cursor-grab active:cursor-grabbing"
      >
        {displayTalents.map((talent, idx) => (
          <div
            key={`${talent.id}-${idx}`}
            className="talent-carousel-item min-w-[275px] sm:min-w-[290px] lg:min-w-[305px] max-w-[315px] shrink-0 transition-transform duration-200 hover:-translate-y-1"
          >
            <TalentCard talent={talent} />
          </div>
        ))}
      </div>

      {/* Barra de Status e Controles Inferiores */}
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 text-primary-blue dark:text-blue-400 bg-primary-light dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
            <Sparkles size={13} /> {talents.length} Talentos em Destaque
          </span>
        </div>

        {/* Botão Play/Pausa e Dica */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-slate-400 hidden sm:inline-flex items-center gap-1">
            {isPaused ? <Pause size={11} className="text-amber-500" /> : <Play size={11} className="text-emerald-500" />}
            {isPaused ? 'Carrossel pausado' : 'Girando automaticamente'}
          </span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            {isPaused ? <Play size={12} className="text-accent-green" /> : <Pause size={12} className="text-amber-500" />}
            {isPaused ? 'Continuar Giro' : 'Pausar'}
          </button>
        </div>
      </div>
    </div>
  );
}
