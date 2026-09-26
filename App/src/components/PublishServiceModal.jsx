import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Wrench, Sparkles, AlertCircle, CheckCircle2,
  MapPin, Phone, DollarSign, FileText, Check, Wand2, ShieldCheck, Tag
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  addService,
  validateServiceTitle,
  validateServiceDescription,
  validateServicePayload,
  validatePhoneNumber,
  hasProfanity,
  maskPhone,
  CITIES,
  SERVICE_CATEGORIES
} from '../lib/ivaiConecta';
import { formatCurrencyBRL } from '../utils/formValidation';

const BUDGET_TYPES = [
  { id: 'combinar', label: 'A Combinar', desc: 'Negociar com o cliente' },
  { id: 'fixo', label: 'Preço Fixo', desc: 'Valor fechado por serviço' },
  { id: 'hora', label: 'Por Hora', desc: 'Valor cobrado por hora técnica' },
  { id: 'diaria', label: 'Diária', desc: 'Valor fechado por dia de serviço' }
];

const DELIVERY_MODES = [
  { id: 'presencial', label: 'Presencial', desc: 'No endereço do cliente ou oficina' },
  { id: 'remoto', label: 'Remoto / Online', desc: 'Atendimento 100% digital' },
  { id: 'hibrido', label: 'Híbrido', desc: 'Presencial ou online conforme a demanda' }
];

export default function PublishServiceModal({ onClose, onSuccess }) {
  const { currentUser, showToast } = useAppStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0] || 'Construção & Manutenção');
  const [city, setCity] = useState(currentUser?.city || 'Ivaiporã');
  const [phone, setPhone] = useState(currentUser?.phone ? maskPhone(currentUser.phone) : '');
  const [budgetType, setBudgetType] = useState('combinar');
  const [price, setPrice] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('presencial');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Validação em tempo real do Título
  const titleProfane = title ? hasProfanity(title) : false;
  const titleValidation = title ? validateServiceTitle(title) : null;

  // Validação em tempo real da Descrição
  const descProfane = description ? hasProfanity(description) : false;
  const descValidation = description ? validateServiceDescription(description) : null;

  // Validação em tempo real do Telefone
  const phoneValidation = phone ? validatePhoneNumber(phone, true) : null;

  const handleUseTemplate = () => {
    const template = `Ofereço serviços profissionais de ${category} em ${city} e municípios do Vale do Ivaí.
• Atendimento pontual com garantia de execução e orçamentos claros;
• Ferramentas e metodologias atualizadas com experiência prática na área;
• Disponibilidade para demandas pontuais ou contratos contínuos com empresas e pessoas físicas.`;
    setDescription(template);
    setFieldErrors(prev => ({ ...prev, description: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      title: title.trim(),
      name: title.trim(),
      category,
      city,
      phone: phone.trim(),
      budgetType,
      price: budgetType === 'combinar' ? 'A combinar' : price.trim() || 'A combinar',
      deliveryMode,
      description: description.trim(),
      providerName: currentUser?.name || 'Profissional Autônomo',
      avatar: currentUser?.avatar || '',
      providerEmail: currentUser?.email || '',
      createdBy: currentUser?.uid || currentUser?.id || currentUser?.email || 'freelancer',
      providerUid: currentUser?.uid || currentUser?.id || '',
      badge: currentUser?.badge || (currentUser?.cnpj ? 'Prestador PJ Verificado' : 'Prestador Regional')
    };

    // Validação estrita com feedback completo
    const validation = validateServicePayload(payload);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      showToast(`⚠️ ${firstError}`);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const created = await addService(payload);
      showToast(`🎉 Serviço "${created.title}" publicado com sucesso no Marketplace!`);
      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err) {
      console.error('[PublishServiceModal] Erro ao cadastrar serviço:', err);
      showToast(`❌ ${err.message || 'Erro ao publicar serviço.'}`);
      setFieldErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-slate-800 overflow-hidden my-auto animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header com Gradiente Profissional */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 text-white p-6 sm:p-7 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Fechar formulário"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-sky-200 mb-1.5 uppercase tracking-wider">
            <Sparkles size={14} className="text-amber-300" />
            <span>Marketplace de Autônomos &amp; Freelancers</span>
          </div>

          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Wrench size={22} className="text-white" /> Cadastrar Novo Serviço
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-lg leading-relaxed">
            Divulgue suas especialidades com avaliações reais de clientes e receba solicitações de orçamento pelo Vale do Ivaí.
          </p>
        </div>

        {/* Formulário com Validação Completa */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* 1. TÍTULO DO SERVIÇO */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <Tag size={13} className="text-primary-blue" />
                Título ou Especialidade do Serviço <span className="text-red-500">*</span>
              </label>
              <span className={`text-[11px] font-semibold ${
                title.length > 80 ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'
              }`}>
                {title.length}/80 caracteres
              </span>
            </div>

            <input
              type="text"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors(prev => ({ ...prev, title: null }));
                }
              }}
              placeholder="Ex: Instalação e Manutenção Elétrica Residencial"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-hidden ${
                titleProfane || fieldErrors.title || (title && titleValidation && !titleValidation.valid)
                  ? 'border-red-500 bg-red-50/30 text-red-900 dark:bg-red-950/20 dark:text-red-200 focus:ring-2 focus:ring-red-400'
                  : titleValidation && titleValidation.valid
                  ? 'border-green-500/60 bg-green-50/20 text-gray-900 dark:text-white dark:bg-green-950/10 focus:ring-2 focus:ring-green-400'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20'
              }`}
              maxLength={80}
              required
            />

            {/* Aviso instantâneo de profanidade */}
            {titleProfane && (
              <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 font-semibold p-2 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>Linguagem imprópria ou ofensiva detectada. Por favor, utilize uma denominação profissional legítima.</span>
              </div>
            )}

            {/* Erro de validação de tamanho, formato ou termos troll */}
            {!titleProfane && (fieldErrors.title || (title && titleValidation && !titleValidation.valid)) && (
              <p className="text-xs text-red-500 flex items-center gap-1 font-medium p-2 bg-red-50/70 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle size={12} className="shrink-0" /> {fieldErrors.title || titleValidation?.error}
              </p>
            )}

            {titleValidation && titleValidation.valid && !titleProfane && (
              <p className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                <CheckCircle2 size={12} /> Título profissional válido
              </p>
            )}
          </div>

          {/* 2. CATEGORIA E CIDADE (GRID DUPLO) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Categoria */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <Wrench size={13} className="text-primary-blue" />
                Categoria Profissional <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => {
                  setCategory(e.target.value);
                  if (fieldErrors.category) setFieldErrors(prev => ({ ...prev, category: null }));
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
              >
                {SERVICE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {fieldErrors.category && (
                <p className="text-xs text-red-500 flex items-center gap-1">{fieldErrors.category}</p>
              )}
            </div>

            {/* Cidade Polo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin size={13} className="text-primary-blue" />
                Cidade de Atuação <span className="text-red-500">*</span>
              </label>
              <select
                value={city}
                onChange={e => {
                  setCity(e.target.value);
                  if (fieldErrors.city) setFieldErrors(prev => ({ ...prev, city: null }));
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
              >
                {CITIES.filter(c => c !== 'Todas as Cidades').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {fieldErrors.city && (
                <p className="text-xs text-red-500 flex items-center gap-1">{fieldErrors.city}</p>
              )}
            </div>
          </div>

          {/* 3. TELEFONE / WHATSAPP E MODALIDADE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Telefone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <Phone size={13} className="text-green-600" />
                Telefone / WhatsApp com DDD <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => {
                  const masked = maskPhone(e.target.value);
                  setPhone(masked);
                  if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: null }));
                }}
                placeholder="(43) 99999-0000"
                maxLength={15}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-hidden ${
                  fieldErrors.phone || (phone && phoneValidation && !phoneValidation.valid)
                    ? 'border-red-500 bg-red-50/20 text-red-900 dark:text-red-200 focus:ring-2 focus:ring-red-400'
                    : phone && phoneValidation && phoneValidation.valid
                    ? 'border-green-500/60 bg-green-50/20 text-gray-900 dark:text-white'
                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20'
                }`}
                required
              />
              {fieldErrors.phone && (
                <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {fieldErrors.phone}
                </p>
              )}
              {phone && phoneValidation && !phoneValidation.valid && !fieldErrors.phone && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {phoneValidation.error}
                </p>
              )}
            </div>

            {/* Modalidade */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-indigo-500" />
                Modalidade de Atendimento
              </label>
              <select
                value={deliveryMode}
                onChange={e => setDeliveryMode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
              >
                {DELIVERY_MODES.map(m => (
                  <option key={m.id} value={m.id}>{m.label} ({m.desc})</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. TIPO DE ORÇAMENTO / PREÇO */}
          <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700/80 space-y-3">
            <label className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
              <DollarSign size={13} className="text-amber-500" />
              Condições de Orçamento &amp; Valor
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BUDGET_TYPES.map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setBudgetType(t.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between ${
                    budgetType === t.id
                      ? 'border-primary-blue bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-300 shadow-xs ring-1 ring-primary-blue/20'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    {t.label}
                    {budgetType === t.id && <Check size={12} className="text-primary-blue" />}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal mt-1 leading-tight block">
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>

            {budgetType !== 'combinar' && (
              <div className="pt-2 animate-fade-in">
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 block mb-1">
                  Valor Estimado ({budgetType === 'fixo' ? 'Por Serviço' : budgetType === 'hora' ? 'Por Hora' : 'Por Diária'})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">R$</span>
                  <input
                    type="text"
                    value={price}
                    onChange={e => {
                      const str = e.target.value.replace(/[^\d,]/g, '');
                      setPrice(str);
                    }}
                    onBlur={() => {
                      if (price && price.trim()) {
                        const formatted = formatCurrencyBRL(price).replace(/^R\$\s*/, '');
                        setPrice(formatted);
                      }
                    }}
                    placeholder="Ex: 1500 (preenche 1.500,00)"
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {['100,00', '250,00', '500,00', '1.500,00'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrice(p)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                        price === p
                          ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}
                    >
                      R$ {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. DESCRIÇÃO DAS ATIVIDADES E DIFERENCIAIS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText size={13} className="text-primary-blue" />
                Descrição dos Serviços &amp; Especialidades <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleUseTemplate}
                  className="text-[11px] font-bold text-primary-blue dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Preencher com modelo profissional de exemplo"
                >
                  <Wand2 size={12} /> Usar Modelo Profissional
                </button>
                <span className={`text-[11px] font-semibold ${
                  description.length > 1000 ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'
                }`}>
                  {description.length}/1000
                </span>
              </div>
            </div>

            <textarea
              rows={4}
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                if (fieldErrors.description) {
                  setFieldErrors(prev => ({ ...prev, description: null }));
                }
              }}
              placeholder="Descreva com detalhes suas especialidades, diferenciais, ferramentas e garantias. Mínimo de 25 caracteres."
              className={`w-full p-4 rounded-xl border text-sm transition-all focus:outline-hidden leading-relaxed ${
                descProfane || fieldErrors.description || (description && descValidation && !descValidation.valid)
                  ? 'border-red-500 bg-red-50/20 text-red-900 dark:bg-red-950/20 dark:text-red-200 focus:ring-2 focus:ring-red-400'
                  : descValidation && descValidation.valid
                  ? 'border-green-500/60 bg-green-50/20 text-gray-900 dark:text-white dark:bg-green-950/10'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20'
              }`}
              maxLength={1000}
              required
            />

            {/* Aviso de profanidade na descrição */}
            {descProfane && (
              <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 font-semibold p-2 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>A descrição contém termos impróprios ou palavras de baixo calão. Mantenha um vocabulário profissional.</span>
              </div>
            )}

            {!descProfane && (fieldErrors.description || (description && descValidation && !descValidation.valid)) && (
              <p className="text-xs text-red-500 flex items-center gap-1 font-medium p-2 bg-red-50/70 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle size={12} className="shrink-0" /> {fieldErrors.description || descValidation?.error}
              </p>
            )}

            {descValidation && descValidation.valid && !descProfane && (
              <p className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                <CheckCircle2 size={12} /> Descrição detalhada e profissional
              </p>
            )}
          </div>

          {/* Footer de Ações */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                titleProfane ||
                descProfane ||
                (title ? !titleValidation?.valid : true) ||
                (description ? !descValidation?.valid : true) ||
                (phone ? !phoneValidation?.valid : true)
              }
              className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 text-white ${
                isSubmitting ||
                titleProfane ||
                descProfane ||
                (title ? !titleValidation?.valid : true) ||
                (description ? !descValidation?.valid : true) ||
                (phone ? !phoneValidation?.valid : true)
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 cursor-pointer shadow-blue-500/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Publicando no Firestore...
                </>
              ) : (
                <>
                  <Check size={15} strokeWidth={2.5} /> Publicar Serviço no Marketplace
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
