import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * CustomSelect - Caixa de seleção moderna, estilizada e acessível
 * Substitui elementos <select> nativos com suporte a temas claro/escuro,
 * busca opcional, badges, ícones e animações fluidas.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Selecione uma opção...',
  label = null,
  icon: LeadingIcon = null,
  disabled = false,
  className = '',
  searchable = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  name = '',
  id = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalização de opções para formato { value, label, badge, icon, description }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return {
      value: opt.value,
      label: opt.label ?? String(opt.value),
      badge: opt.badge,
      icon: opt.icon,
      description: opt.description
    };
  });

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  // Filtragem se searchable estiver ativo
  const filteredOptions = searchable && searchQuery.trim()
    ? normalizedOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : normalizedOptions;

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
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

  // Foco no campo de busca ao abrir
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  // Teclado
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    }
  };

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs rounded-xl',
    md: 'py-2.5 px-3.5 text-sm rounded-xl',
    lg: 'py-3 px-4 text-base rounded-2xl'
  }[size] || 'py-2.5 px-3.5 text-sm rounded-xl';

  return (
    <div className={`relative ${className}`} ref={containerRef} id={id}>
      {label && (
        <label className="form-label mb-1.5 block text-xs font-bold text-gray-700 dark:text-slate-200">
          {label}
        </label>
      )}

      {/* Botão Gatilho do Dropdown */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 text-left font-medium transition-all border outline-none cursor-pointer ${sizeClasses} ${
          disabled
            ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700 cursor-not-allowed'
            : isOpen
            ? 'bg-white dark:bg-slate-900 border-primary-blue ring-2 ring-primary-blue/20 text-gray-900 dark:text-white shadow-sm'
            : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 text-gray-800 dark:text-slate-100 shadow-xs'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {LeadingIcon && (
            <span className="shrink-0 text-gray-400 dark:text-slate-500">
              <LeadingIcon size={16} />
            </span>
          )}
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : (
              <span className="text-gray-400 dark:text-slate-500 font-normal">{placeholder}</span>
            )}
          </span>
          {selectedOption?.badge && (
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-primary-blue dark:text-blue-300">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 dark:text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary-blue dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Menu Flutuante de Opções */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-brand-xl p-1.5 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md max-h-64 flex flex-col"
          style={{ minWidth: '100%' }}
        >
          {/* Campo de Busca Opcional */}
          {searchable && (
            <div className="p-1 mb-1 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Pesquisar..."
                  className="w-full text-xs bg-transparent text-gray-800 dark:text-slate-100 placeholder-gray-400 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Lista de Itens */}
          <div
            ref={listRef}
            role="listbox"
            className="overflow-y-auto space-y-0.5 max-h-56 pr-0.5 custom-scrollbar"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-center text-gray-400 dark:text-slate-500">
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-300 font-bold'
                        : isHighlighted
                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <div>{opt.label}</div>
                        {opt.description && (
                          <div className="text-[10px] text-gray-400 dark:text-slate-500 font-normal truncate">
                            {opt.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                          {opt.badge}
                        </span>
                      )}
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
