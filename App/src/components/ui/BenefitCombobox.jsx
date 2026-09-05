import { useState, useRef, useEffect } from 'react';
import { Sparkles, Plus, Check, Search, AlertCircle, X, ChevronDown, Gift } from 'lucide-react';
import { STANDARD_BENEFITS, validateBenefit } from '../../lib/ivaiConecta';

/**
 * BenefitCombobox - Caixa de pesquisa e seleção inteligente de benefícios e vantagens corporativas
 * Permite buscar na base homologada ou adicionar benefícios personalizados com validação profissional.
 */
export default function BenefitCombobox({
  benefitsList = [],
  onAddBenefit,
  placeholder = 'Buscar ou adicionar outro benefício (ex: Gympass, Auxílio Creche, Vale Combustível)...',
  error = ''
}) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const normalize = (str) =>
    (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const queryNorm = normalize(inputValue);

  // Filtra benefícios do catálogo
  const filteredBenefits = queryNorm.trim()
    ? STANDARD_BENEFITS.filter(b => normalize(b).includes(queryNorm))
    : STANDARD_BENEFITS.slice(0, 16);

  // Validação em tempo real do texto digitado
  const currentValidation = inputValue.trim() ? validateBenefit(inputValue) : null;
  const isExactMatchInCatalog = STANDARD_BENEFITS.some(
    b => normalize(b) === queryNorm.trim()
  );

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleAdd = (benefitToAdd) => {
    const clean = (benefitToAdd || '').trim();
    if (!clean) return;

    onAddBenefit(clean);
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < filteredBenefits.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev > 0 ? prev - 1 : filteredBenefits.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredBenefits.length) {
        handleAdd(filteredBenefits[highlightedIndex]);
      } else if (inputValue.trim()) {
        handleAdd(inputValue);
      }
    }
  };

  return (
    <div className="relative w-full space-y-1.5" ref={containerRef}>
      <div className="flex gap-2 items-center">
        {/* Campo de Entrada de Benefício */}
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none">
            <Gift size={14} />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onClick={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`form-control pl-9 pr-14 text-xs transition-all ${
              inputValue.trim() && currentValidation && !currentValidation.valid
                ? 'border-amber-400 dark:border-amber-500 bg-amber-50/20'
                : inputValue.trim() && currentValidation && currentValidation.valid
                ? 'border-teal-400 dark:border-teal-500 bg-teal-50/15'
                : ''
            }`}
            autoComplete="off"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                title="Limpar"
              >
                <X size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }}
              className="p-1 text-gray-400 hover:text-teal-600 cursor-pointer"
            >
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-teal-600' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Botão de Adicionar Rápido */}
        <button
          type="button"
          onClick={() => handleAdd(inputValue)}
          disabled={!inputValue.trim()}
          className="btn btn-primary btn-sm text-xs font-bold shrink-0 flex items-center gap-1.5 px-3 py-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-teal-600 hover:bg-teal-700 border-teal-600"
        >
          <Plus size={14} />
          <span>Adicionar</span>
        </button>
      </div>

      {/* Dica / Validação em Tempo Real sob o input */}
      {inputValue.trim() && (
        <div className="text-[11px] font-medium px-1">
          {currentValidation?.valid ? (
            <p className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <Check size={12} /> Benefício aceito para publicação corporativa
            </p>
          ) : currentValidation ? (
            <p className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle size={12} /> {currentValidation.error}
            </p>
          ) : null}
        </div>
      )}

      {/* Menu Flutuante Autocomplete de Benefícios */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-brand-xl p-1.5 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md max-h-64 flex flex-col"
          style={{ minWidth: '100%' }}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
            <span>Catálogo Corporativo ({filteredBenefits.length})</span>
            <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <Sparkles size={10} /> Clique para selecionar
            </span>
          </div>

          <div
            ref={listRef}
            role="listbox"
            className="overflow-y-auto space-y-0.5 max-h-52 py-1 pr-0.5 custom-scrollbar"
          >
            {/* Se o usuário digitou um benefício personalizado */}
            {inputValue.trim() && !isExactMatchInCatalog && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentValidation?.valid) handleAdd(inputValue);
                }}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border mb-1 transition-all ${
                  currentValidation?.valid
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 cursor-not-allowed opacity-80'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Plus size={14} className="shrink-0" />
                  <span className="truncate">Adicionar benefício: &quot;{inputValue.trim()}&quot;</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 shrink-0 font-bold">
                  {currentValidation?.valid ? 'Novo Benefício' : 'Verificar'}
                </span>
              </div>
            )}

            {filteredBenefits.map((benefit, idx) => {
              const isAlreadyAdded = benefitsList.some(
                b => b.toLowerCase() === benefit.toLowerCase()
              );
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={benefit}
                  role="option"
                  aria-selected={isAlreadyAdded}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAlreadyAdded) handleAdd(benefit);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isAlreadyAdded
                      ? 'bg-gray-100/60 dark:bg-slate-800/40 text-gray-400 dark:text-slate-500 cursor-default'
                      : isHighlighted
                      ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300 font-semibold'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Gift size={12} className={isAlreadyAdded ? 'text-gray-400' : 'text-teal-600 dark:text-teal-400'} />
                    <span className="truncate">{benefit}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAlreadyAdded ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center gap-1">
                        <Check size={10} /> Incluso
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 group-hover:text-teal-600 font-bold">
                        + Adicionar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
