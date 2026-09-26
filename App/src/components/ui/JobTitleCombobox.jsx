import { useState, useRef, useEffect } from 'react';
import { Briefcase, Check, Sparkles, ChevronDown, X } from 'lucide-react';
import { STANDARD_JOB_TITLES, validateJobTitle } from '../../lib/ivaiConecta';

/**
 * JobTitleCombobox - Caixa de pesquisa e seleção inteligente de cargos (CBO)
 * Substitui o <datalist> padrão com uma interface moderna, autocomplete filtrado,
 * destaque de termos e validação em tempo real.
 */
export default function JobTitleCombobox({
  value = '',
  onChange,
  onSelect = null,
  onBlur = null,
  placeholder = 'Ex: Desenvolvedor Front-end, Auxiliar Administrativo, Vendedor(a)...',
  required = false,
  error = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Normalização de texto sem acentos para busca precisa
  const normalize = (str) =>
    (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const queryNorm = normalize(value);

  // Filtra títulos do CBO
  const filteredTitles = queryNorm.trim()
    ? STANDARD_JOB_TITLES.filter(t => normalize(t).includes(queryNorm))
    : STANDARD_JOB_TITLES.slice(0, 15); // Exibe os 15 mais comuns se o campo estiver limpo

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

  const handleSelectTitle = (titleToSelect) => {
    onChange(titleToSelect);
    if (onSelect) onSelect(titleToSelect);
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
        prev < filteredTitles.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev > 0 ? prev - 1 : filteredTitles.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredTitles.length) {
        handleSelectTitle(filteredTitles[highlightedIndex]);
      } else if (value.trim()) {
        if (titleValidation.valid) {
          handleSelectTitle(value.trim());
        }
      } else {
        setIsOpen(false);
      }
    }
  };

  const titleValidation = validateJobTitle(value);
  const isValid = Boolean(value && titleValidation.valid);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Campo de Entrada com Ícone e Indicadores */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-gray-400 dark:text-slate-500 pointer-events-none">
          <Briefcase size={16} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onClick={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          className={`form-control pl-10 pr-20 text-sm font-semibold transition-all ${
            error
              ? 'border-red-400 dark:border-red-500 bg-red-50/15'
              : value && !isValid
              ? 'border-amber-400 dark:border-amber-500 bg-amber-50/20'
              : value && isValid
              ? 'border-green-400 dark:border-green-500 bg-green-50/10'
              : ''
          }`}
          autoComplete="off"
        />

        {/* Ações / Botões laterais dentro do input */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title="Limpar"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-primary-blue transition-colors cursor-pointer"
            title="Ver sugestões CBO"
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-blue' : ''}`}
            />
          </button>
        </div>
      </div>

      {error && !value && (
        <p className="text-red-500 dark:text-red-400 text-[11px] font-medium px-1 mt-1">
          {error}
        </p>
      )}

      {/* Painel Flutuante de Autocomplete CBO */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-brand-xl p-1.5 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md max-h-64 flex flex-col"
          style={{ minWidth: '100%' }}
        >
          <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
            <span>Ocupações Homologadas (CBO)</span>
            <span className="text-[10px] text-primary-blue dark:text-blue-400 font-semibold flex items-center gap-1">
              <Sparkles size={11} /> {filteredTitles.length} sugestões
            </span>
          </div>

          <div
            ref={listRef}
            role="listbox"
            className="overflow-y-auto space-y-0.5 max-h-52 py-1 pr-0.5 custom-scrollbar"
          >
            {filteredTitles.length === 0 ? (
              <div className="p-3 text-center">
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-2">
                  Nenhum cargo idêntico no catálogo CBO.
                </p>
                {value.trim().length >= 3 && titleValidation.valid && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectTitle(value.trim());
                    }}
                    className="w-full p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-primary-blue dark:text-blue-300 transition-all font-bold text-xs flex items-center justify-between cursor-pointer group shadow-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Check size={14} className="text-primary-blue dark:text-blue-400 shrink-0" />
                      <span className="truncate">Usar cargo profissional: &quot;{value.trim()}&quot;</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 font-bold border border-blue-200 dark:border-blue-800 group-hover:scale-105 transition-transform">
                      Confirmar
                    </span>
                  </button>
                )}
                {value.trim().length >= 3 && !titleValidation.valid && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-300 text-xs font-medium text-left">
                    <p className="flex items-center gap-1 font-bold text-[11px] mb-0.5">
                      <AlertCircle size={12} /> Título Não Permitido
                    </p>
                    <p className="text-[11px] leading-tight">{titleValidation.error}</p>
                  </div>
                )}
              </div>
            ) : (
              filteredTitles.map((titleItem, idx) => {
                const isSelected = titleItem.toLowerCase() === value.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={titleItem}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectTitle(titleItem)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-300 font-bold'
                        : isHighlighted
                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-semibold'
                        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className={`p-1 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                      }`}>
                        <Briefcase size={12} />
                      </span>
                      <span className="truncate">{titleItem}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                        CBO
                      </span>
                      {isSelected && (
                        <Check size={14} className="text-primary-blue dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
