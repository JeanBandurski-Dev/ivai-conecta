import { useState, useMemo, useEffect } from 'react';
import {
  X, Camera, Upload, Plus, Building2,
  Globe, Sparkles, Save, HeartHandshake, MapPin, Mail,
  Phone, ShieldCheck, Loader2, Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { CITIES } from '../lib/ivaiConecta';
import {
  maskCNPJ,
  maskPhone,
  validateCompanyProfileForm,
  validateCompanyText,
  validateCompanyCNPJField,
  validateFoundedYear,
  validateCompanyInstitutionalText,
  validateCompanyUrl,
  validateCompanyEmail,
  validateCompanyLinkedIn,
  validateCompanyInstagram,
  validateCompanyBenefitItem
} from '../utils/formValidation';
import { validatePhoneNumber } from '../services/jobTaxonomy';

const COMPANY_LOGO_PRESETS = [
  'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1554774853-719586f82d77?auto=format&fit=crop&q=80&w=250'
];

const COMPANY_COVER_PRESETS = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200'
];

const BENEFIT_SUGGESTIONS = [
  'Vale Alimentação / Refeição',
  'Plano de Saúde',
  'Plano Odontológico',
  'Trabalho Híbrido / Remoto',
  'Gympass / TotalPass',
  'Seguro de Vida',
  'Auxílio Educação / Cursos',
  'PLR / Bônus por Metas',
  'Day Off no Aniversário',
  'Horário Flexível'
];

const INDUSTRY_OPTIONS = [
  'Tecnologia & Inovação',
  'Agronegócio & Cooperativismo',
  'Comércio & Varejo',
  'Indústria & Manufatura',
  'Saúde & Farmácia',
  'Construção Civil & Engenharia',
  'Educação & Treinamento',
  'Serviços Financeiros & Contabilidade',
  'Logística & Transporte',
  'Gastronomia & Hotelaria',
  'Outro Setor'
];

export default function EditCompanyProfileModal({
  isOpen,
  onClose,
  editData,
  setEditData,
  handleSaveProfile,
  handleLogoUpload,
  handleBannerUpload,
  uploadingLogo = false,
  uploadingBanner = false,
  isSaving = false
}) {
  const [activeTab, setActiveTab] = useState('branding');
  const [newBenefitInput, setNewBenefitInput] = useState('');
  const [benefitError, setBenefitError] = useState('');
  const [errors, setErrors] = useState({});
  const [formSubmitAttempted, setFormSubmitAttempted] = useState(false);

  // Calcula a taxa de completude da marca empregadora em tempo real
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (editData?.name?.trim()) score += 15;
    if (editData?.tradingName?.trim()) score += 10;
    if (editData?.avatar?.trim()) score += 15;
    if (editData?.coverImage?.trim()) score += 10;
    if (editData?.cnpj?.trim()) score += 10;
    if (editData?.industry?.trim()) score += 10;
    if (editData?.city?.trim()) score += 10;
    if (editData?.description?.trim()) score += 10;
    if (editData?.benefits && editData.benefits.length > 0) score += 5;
    if (editData?.website?.trim() || editData?.linkedin?.trim()) score += 5;
    return Math.min(100, score);
  }, [editData]);

  // Contagem de erros agrupados por aba
  const tabErrors = useMemo(() => {
    const counts = { branding: 0, info: 0, culture: 0, contact: 0 };
    if (!errors || Object.keys(errors).length === 0) return counts;

    const infoFields = ['name', 'tradingName', 'cnpj', 'city', 'industry', 'foundedYear'];
    const cultureFields = ['description', 'culture', 'benefits'];
    const contactFields = ['website', 'email', 'linkedin', 'instagram', 'phone'];
    const brandingFields = ['coverImage', 'avatar'];

    Object.keys(errors).forEach(field => {
      if (errors[field]) {
        if (infoFields.includes(field)) counts.info++;
        else if (cultureFields.includes(field)) counts.culture++;
        else if (contactFields.includes(field)) counts.contact++;
        else if (brandingFields.includes(field)) counts.branding++;
      }
    });
    return counts;
  }, [errors]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSaving]);

  if (!isOpen) return null;

  // Submissão do formulário com validação completa em todos os campos
  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    setFormSubmitAttempted(true);

    const validation = validateCompanyProfileForm(editData || {});
    if (!validation.isValid) {
      setErrors(validation.errors);
      if (validation.firstErrorTab) {
        setActiveTab(validation.firstErrorTab);
      }
      return;
    }

    setErrors({});
    handleSaveProfile(e);
  };

  // Handlers para cada campo com validação e máscara em tempo real IMEDIATA
  const handleNameChange = (val) => {
    setEditData(d => ({ ...d, name: val }));
    const res = validateCompanyText(val, { fieldName: 'Razão Social', min: 3, max: 100, required: true });
    setErrors(prev => ({ ...prev, name: res.valid ? undefined : res.error }));
  };

  const handleNameBlur = () => {
    const res = validateCompanyText(editData.name, { fieldName: 'Razão Social', min: 3, max: 100, required: true });
    setErrors(prev => ({ ...prev, name: res.valid ? undefined : res.error }));
  };

  const handleTradingNameChange = (val) => {
    setEditData(d => ({ ...d, tradingName: val }));
    const res = validateCompanyText(val, { fieldName: 'Nome Fantasia', min: 2, max: 70, required: true });
    setErrors(prev => ({ ...prev, tradingName: res.valid ? undefined : res.error }));
  };

  const handleTradingNameBlur = () => {
    const res = validateCompanyText(editData.tradingName, { fieldName: 'Nome Fantasia', min: 2, max: 70, required: true });
    setErrors(prev => ({ ...prev, tradingName: res.valid ? undefined : res.error }));
  };

  const handleCnpjChange = (val) => {
    const masked = maskCNPJ(val);
    setEditData(d => ({ ...d, cnpj: masked }));
    const res = validateCompanyCNPJField(masked, true);
    setErrors(prev => ({ ...prev, cnpj: res.valid ? undefined : res.error }));
  };

  const handleCnpjBlur = () => {
    const res = validateCompanyCNPJField(editData.cnpj, true);
    setErrors(prev => ({ ...prev, cnpj: res.valid ? undefined : res.error }));
  };

  const handleFoundedYearChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    setEditData(d => ({ ...d, foundedYear: digits }));
    if (digits) {
      const res = validateFoundedYear(digits, false);
      setErrors(prev => ({ ...prev, foundedYear: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, foundedYear: undefined }));
    }
  };

  const handleFoundedYearBlur = () => {
    if (editData.foundedYear) {
      const res = validateFoundedYear(editData.foundedYear, false);
      setErrors(prev => ({ ...prev, foundedYear: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, foundedYear: undefined }));
    }
  };

  const handleDescriptionChange = (val) => {
    setEditData(d => ({ ...d, description: val }));
    if (val?.trim()) {
      const res = validateCompanyInstitutionalText(val, { fieldName: 'Sobre a Organização', min: 30, max: 3000, required: false });
      setErrors(prev => ({ ...prev, description: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
  };

  const handleDescriptionBlur = () => {
    if (editData.description?.trim()) {
      const res = validateCompanyInstitutionalText(editData.description, { fieldName: 'Sobre a Organização', min: 30, max: 3000, required: false });
      setErrors(prev => ({ ...prev, description: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
  };

  const handleCultureChange = (val) => {
    setEditData(d => ({ ...d, culture: val }));
    if (val?.trim()) {
      const res = validateCompanyInstitutionalText(val, { fieldName: 'Missão, Visão e Cultura', min: 20, max: 2000, required: false });
      setErrors(prev => ({ ...prev, culture: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, culture: undefined }));
    }
  };

  const handleCultureBlur = () => {
    if (editData.culture?.trim()) {
      const res = validateCompanyInstitutionalText(editData.culture, { fieldName: 'Missão, Visão e Cultura', min: 20, max: 2000, required: false });
      setErrors(prev => ({ ...prev, culture: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, culture: undefined }));
    }
  };

  const handleWebsiteChange = (val) => {
    setEditData(d => ({ ...d, website: val }));
    if (val?.trim()) {
      const res = validateCompanyUrl(val, { fieldName: 'Website Oficial', required: false });
      setErrors(prev => ({ ...prev, website: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, website: undefined }));
    }
  };

  const handleWebsiteBlur = () => {
    if (editData.website?.trim()) {
      const res = validateCompanyUrl(editData.website, { fieldName: 'Website Oficial', required: false });
      setErrors(prev => ({ ...prev, website: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, website: undefined }));
    }
  };

  const handleEmailChange = (val) => {
    setEditData(d => ({ ...d, email: val }));
    if (val?.trim()) {
      const res = validateCompanyEmail(val, { required: false });
      setErrors(prev => ({ ...prev, email: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handleEmailBlur = () => {
    if (editData.email?.trim()) {
      const res = validateCompanyEmail(editData.email, { required: false });
      setErrors(prev => ({ ...prev, email: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handleLinkedInChange = (val) => {
    setEditData(d => ({ ...d, linkedin: val }));
    if (val?.trim()) {
      const res = validateCompanyLinkedIn(val, { required: false });
      setErrors(prev => ({ ...prev, linkedin: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, linkedin: undefined }));
    }
  };

  const handleLinkedInBlur = () => {
    if (editData.linkedin?.trim()) {
      const res = validateCompanyLinkedIn(editData.linkedin, { required: false });
      setErrors(prev => ({ ...prev, linkedin: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, linkedin: undefined }));
    }
  };

  const handleInstagramChange = (val) => {
    setEditData(d => ({ ...d, instagram: val }));
    if (val?.trim()) {
      const res = validateCompanyInstagram(val, { required: false });
      setErrors(prev => ({ ...prev, instagram: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, instagram: undefined }));
    }
  };

  const handleInstagramBlur = () => {
    if (editData.instagram?.trim()) {
      const res = validateCompanyInstagram(editData.instagram, { required: false });
      setErrors(prev => ({ ...prev, instagram: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, instagram: undefined }));
    }
  };

  const handlePhoneChange = (val) => {
    const masked = maskPhone(val);
    setEditData(d => ({ ...d, phone: masked }));
    if (masked?.trim()) {
      const res = validatePhoneNumber(masked, false);
      setErrors(prev => ({ ...prev, phone: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  const handlePhoneBlur = () => {
    if (editData.phone?.trim()) {
      const res = validatePhoneNumber(editData.phone, false);
      setErrors(prev => ({ ...prev, phone: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  const handleCoverUrlChange = (val) => {
    setEditData(d => ({ ...d, coverImage: val }));
    if (val?.trim()) {
      const res = validateCompanyUrl(val, { fieldName: 'Imagem de Capa', required: false });
      setErrors(prev => ({ ...prev, coverImage: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, coverImage: undefined }));
    }
  };

  const handleCoverUrlBlur = () => {
    if (editData.coverImage?.trim()) {
      const res = validateCompanyUrl(editData.coverImage, { fieldName: 'Imagem de Capa', required: false });
      setErrors(prev => ({ ...prev, coverImage: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, coverImage: undefined }));
    }
  };

  const handleAvatarUrlChange = (val) => {
    setEditData(d => ({ ...d, avatar: val }));
    if (val?.trim()) {
      const res = validateCompanyUrl(val, { fieldName: 'Logotipo', required: false });
      setErrors(prev => ({ ...prev, avatar: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, avatar: undefined }));
    }
  };

  const handleAvatarUrlBlur = () => {
    if (editData.avatar?.trim()) {
      const res = validateCompanyUrl(editData.avatar, { fieldName: 'Logotipo', required: false });
      setErrors(prev => ({ ...prev, avatar: res.valid ? undefined : res.error }));
    } else {
      setErrors(prev => ({ ...prev, avatar: undefined }));
    }
  };


  const addBenefitItem = (itemToAdd) => {
    const val = (typeof itemToAdd === 'string' ? itemToAdd : newBenefitInput).trim();
    if (!val) {
      setBenefitError('Digite o nome do benefício para adicionar.');
      return;
    }
    const current = Array.isArray(editData.benefits) ? editData.benefits : [];
    const check = validateCompanyBenefitItem(val, current);
    if (!check.valid) {
      setBenefitError(check.error);
      return;
    }

    setBenefitError('');
    setEditData(prev => ({
      ...prev,
      benefits: [...current, check.benefit]
    }));
    setNewBenefitInput('');
    if (errors.benefits) {
      setErrors(prev => ({ ...prev, benefits: undefined }));
    }
  };

  const removeBenefitItem = (itemToRemove) => {
    const updated = (editData.benefits || []).filter(b => b !== itemToRemove);
    setEditData(prev => ({
      ...prev,
      benefits: updated
    }));
    if (errors.benefits) {
      const hasInvalid = updated.some(b => !validateCompanyBenefitItem(b).valid);
      if (!hasInvalid) {
        setErrors(prev => ({ ...prev, benefits: undefined }));
      }
    }
  };

  // Helper para renderizar mensagem de erro abaixo do campo
  const renderFieldError = (fieldKey) => {
    if (!errors[fieldKey]) return null;
    return (
      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-[11px] font-semibold animate-in fade-in duration-150">
        <AlertCircle size={13} className="shrink-0" />
        <span>{errors[fieldKey]}</span>
      </div>
    );
  };

  // Helper de classe CSS para input com erro
  const getInputClass = (fieldKey, base = 'form-control text-xs') => {
    return `${base} ${
      errors[fieldKey]
        ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10'
        : ''
    }`;
  };

  const TABS = [
    { id: 'branding', label: 'Imagens & Capa', icon: Camera, badge: null },
    { id: 'info', label: 'Dados da Empresa', icon: Building2, badge: null },
    { id: 'culture', label: 'Cultura & Benefícios', icon: HeartHandshake, badge: editData?.benefits?.length || null },
    { id: 'contact', label: 'Contato & Redes', icon: Globe, badge: null }
  ];

  return (
    <div role="dialog"
      aria-modal="true"
      aria-labelledby="edit-company-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Cabeçalho Premium com Indicador de Completude */}
        <div className="bg-[linear-gradient(135deg,#0A1128_0%,#051944_50%,#0052FF_100%)] text-white p-5 sm:p-6 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-inner backdrop-blur-md shrink-0">
                <Building2 size={22} className="text-cyan-300" />
              </div>
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Editar Perfil da Empresa</span>
                  <span className="text-[10px] uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded-full text-cyan-200 font-bold hidden sm:inline-block">
                    Recrutador
                  </span>
                </h2>
                <p className="text-xs text-slate-300 line-clamp-1">
                  Personalize a identidade da empresa para atrair os melhores talentos do Vale do Ivaí
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 border border-white/10 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Fechar Janela"
            >
              <X size={18} />
            </button>
          </div>

          {/* Barra de Progresso da Força da Marca Empregadora */}
          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Sparkles size={14} className="text-cyan-300" />
              <span>Força da Marca Empregadora:</span>
              <span className={`font-extrabold ${completionPercentage >= 80 ? 'text-emerald-300' : completionPercentage >= 50 ? 'text-amber-300' : 'text-cyan-300'}`}>
                {completionPercentage}%
              </span>
            </div>
            <div className="flex-1 max-w-[200px] h-2 rounded-full bg-white/15 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Barra de Navegação por Abas (Tabs) com Indicadores de Erros */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 overflow-x-auto scrollbar-none shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const errorCount = tabErrors[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-primary-blue dark:text-blue-400 shadow-xs border border-gray-200/80 dark:border-slate-700'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-primary-blue dark:text-blue-400' : 'text-gray-400'} />
                <span>{tab.label}</span>

                {/* Badge de Erros na Aba */}
                {errorCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle size={10} />
                    {errorCount}
                  </span>
                ) : tab.badge !== null && tab.badge > 0 ? (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Banner de Alerta Geral caso haja erros ao tentar salvar */}
        {formSubmitAttempted && Object.keys(errors).length > 0 && (
          <div className="mx-5 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in duration-200">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Atenção:</span> Existem campos com informações inválidas ou pendentes ({Object.keys(errors).length} erro{Object.keys(errors).length > 1 ? 's' : ''}). Verifique as abas destacadas em vermelho antes de salvar o perfil.
            </div>
          </div>
        )}

        {/* Corpo do Formulário com Scroll e Navegação Suave */}
        <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-left" noValidate>
          
          {/* ═════════════════════════════════════════════════════════════
              ABA 1: IDENTIDADE VISUAL, LOGO & CAPA
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'branding' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Capa / Banner da Empresa */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                    <ImageIcon size={16} className="text-primary-blue dark:text-blue-400" /> Imagem de Capa do Perfil
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                    Recomendado: 1200x350px
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden h-36 sm:h-44 border-2 border-dashed border-gray-300 dark:border-slate-700 group">
                    <img
                      src={editData.coverImage || COMPANY_COVER_PRESETS[0]}
                      alt="Capa da Empresa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = COMPANY_COVER_PRESETS[0];
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="btn btn-primary btn-sm text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-md">
                        {uploadingBanner ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        <span>{uploadingBanner ? 'Enviando...' : 'Alterar Capa do Computador'}</span>
                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={uploadingBanner} />
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <label className="btn btn-primary btn-sm text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shrink-0 shadow-xs">
                        {uploadingBanner ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        <span>{uploadingBanner ? 'Enviando Capa...' : 'Upload de Capa do PC'}</span>
                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={uploadingBanner} />
                      </label>

                      <input
                        type="url"
                        value={editData.coverImage || ''}
                        onChange={e => handleCoverUrlChange(e.target.value)}
                        onBlur={handleCoverUrlBlur}
                        placeholder="Ou cole a URL direta de uma imagem de capa (https://...)"
                        className={getInputClass('coverImage', 'form-control text-xs flex-1')}
                      />
                    </div>
                    {renderFieldError('coverImage')}
                  </div>

                  {/* Presets de Capa */}
                  <div className="pt-2 border-t border-gray-200/80 dark:border-slate-700/80">
                    <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-2">
                      Capas corporativas prontas:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {COMPANY_COVER_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setEditData(d => ({ ...d, coverImage: preset }));
                            setErrors(prev => ({ ...prev, coverImage: undefined }));
                          }}
                          className={`h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative group ${
                            editData.coverImage === preset
                              ? 'border-primary-blue ring-2 ring-blue-400/50 scale-[1.02]'
                              : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt={`Cover preset ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logotipo da Empresa */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                    <Camera size={16} className="text-primary-blue dark:text-blue-400" /> Logotipo Oficial da Empresa
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                    PNG transparente ou JPG quadrado
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative group shrink-0">
                    <img
                      src={editData.avatar || COMPANY_LOGO_PRESETS[0]}
                      alt="Logo da Empresa"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-blue shadow-md bg-white dark:bg-slate-800 p-1"
                      onError={(e) => {
                        e.target.src = COMPANY_LOGO_PRESETS[0];
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                      <Camera size={18} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[240px] space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="btn btn-primary btn-sm text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                        {uploadingLogo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        <span>{uploadingLogo ? 'Enviando Logo...' : 'Upload de Logo do PC'}</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                      </label>
                    </div>

                    <div>
                      <input
                        type="url"
                        value={editData.avatar || ''}
                        onChange={e => handleAvatarUrlChange(e.target.value)}
                        onBlur={handleAvatarUrlBlur}
                        placeholder="Ou cole a URL direta do logotipo (https://...)"
                        className={getInputClass('avatar', 'form-control text-xs')}
                      />
                      {renderFieldError('avatar')}
                    </div>
                  </div>
                </div>

                {/* Presets de Logotipo */}
                <div className="pt-2 border-t border-gray-200/80 dark:border-slate-700/80">
                  <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-2">
                    Ou escolha uma identidade rápida:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COMPANY_LOGO_PRESETS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setEditData(d => ({ ...d, avatar: url }));
                          setErrors(prev => ({ ...prev, avatar: undefined }));
                        }}
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white p-0.5 ${
                          editData.avatar === url
                            ? 'border-primary-blue scale-110 shadow-md ring-2 ring-blue-400/50'
                            : 'border-transparent hover:border-gray-300 dark:hover:border-slate-600 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover rounded-lg" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              ABA 2: DADOS DA EMPRESA & CNPJ
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'info' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <Building2 size={13} className="text-primary-blue" /> Razão Social / Nome Oficial *
                  </label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={e => handleNameChange(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="Ex: Ivaí Tech Soluções em TI Ltda"
                    className={getInputClass('name', 'form-control text-xs font-semibold')}
                    maxLength={100}
                    required
                  />
                  {renderFieldError('name')}
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <Building2 size={13} className="text-primary-blue" /> Nome Fantasia (Exibido aos Candidatos) *
                  </label>
                  <input
                    type="text"
                    value={editData.tradingName || ''}
                    onChange={e => handleTradingNameChange(e.target.value)}
                    onBlur={handleTradingNameBlur}
                    placeholder="Ex: Ivaí Tech"
                    className={getInputClass('tradingName', 'form-control text-xs font-semibold')}
                    maxLength={70}
                    required
                  />
                  {renderFieldError('tradingName')}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-primary-blue" /> CNPJ Cadastrado *
                  </label>
                  <input
                    type="text"
                    value={editData.cnpj || ''}
                    onChange={e => handleCnpjChange(e.target.value)}
                    onBlur={handleCnpjBlur}
                    placeholder="00.000.000/0001-00"
                    className={getInputClass('cnpj', 'form-control text-xs font-mono')}
                    maxLength={18}
                    required
                  />
                  {renderFieldError('cnpj')}
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <MapPin size={13} className="text-primary-blue" /> Cidade Polo de Atuação *
                  </label>
                  <select
                    value={editData.city || 'Ivaiporã'}
                    onChange={e => {
                      setEditData(d => ({ ...d, city: e.target.value }));
                      setErrors(prev => ({ ...prev, city: undefined }));
                    }}
                    className={getInputClass('city', 'form-control text-xs font-semibold')}
                  >
                    {CITIES.filter(c => c !== 'Todas as Cidades').map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {renderFieldError('city')}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-xs font-bold">Setor de Atuação Principal *</label>
                  <select
                    value={editData.industry || 'Tecnologia & Inovação'}
                    onChange={e => {
                      setEditData(d => ({ ...d, industry: e.target.value }));
                      setErrors(prev => ({ ...prev, industry: undefined }));
                    }}
                    className={getInputClass('industry', 'form-control text-xs')}
                  >
                    {INDUSTRY_OPTIONS.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                  {renderFieldError('industry')}
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold">Porte da Empresa</label>
                  <select
                    value={editData.size || '1-10 colaboradores'}
                    onChange={e => setEditData(d => ({ ...d, size: e.target.value }))}
                    className="form-control text-xs"
                  >
                    <option value="1-10 colaboradores">1 a 10 colaboradores (Microempresa)</option>
                    <option value="11-50 colaboradores">11 a 50 colaboradores (Pequeno Porte)</option>
                    <option value="51-200 colaboradores">51 a 200 colaboradores (Médio Porte)</option>
                    <option value="200+ colaboradores">Mais de 200 colaboradores (Grande Porte)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label text-xs font-bold">Ano de Fundação</label>
                <input
                  type="text"
                  value={editData.foundedYear || ''}
                  onChange={e => handleFoundedYearChange(e.target.value)}
                  onBlur={handleFoundedYearBlur}
                  placeholder="Ex: 2018"
                  maxLength={4}
                  className={getInputClass('foundedYear', 'form-control text-xs')}
                />
                {renderFieldError('foundedYear')}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              ABA 3: CULTURA, SOBRE & BENEFÍCIOS
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'culture' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 space-y-4">
                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <Building2 size={13} className="text-primary-blue" /> Sobre a Organização
                  </label>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                    Apresente a história, o propósito e os projetos desenvolvidos pela sua organização aos talentos.
                  </p>
                  <textarea
                    value={editData.description || ''}
                    onChange={e => handleDescriptionChange(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    className={getInputClass('description', 'form-control text-xs leading-relaxed')}
                    rows={4}
                    maxLength={3000}
                    placeholder="Conte sobre o início da empresa, as soluções desenvolvidas e o impacto no Vale do Ivaí..."
                  />
                  {renderFieldError('description')}
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <HeartHandshake size={13} className="text-primary-blue" /> Missão, Visão e Cultura Organizacional
                  </label>
                  <textarea
                    value={editData.culture || ''}
                    onChange={e => handleCultureChange(e.target.value)}
                    onBlur={handleCultureBlur}
                    className={getInputClass('culture', 'form-control text-xs leading-relaxed')}
                    rows={3}
                    maxLength={2000}
                    placeholder="Nosso ambiente valoriza inovação contínua, colaboração aberta e bem-estar dos profissionais..."
                  />
                  {renderFieldError('culture')}
                </div>
              </div>

              {/* Gerenciador de Benefícios */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                      <Sparkles size={16} className="text-primary-blue dark:text-blue-400" /> Benefícios Oferecidos aos Colaboradores
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Destaque os diferenciais e atrativos que sua empresa oferece.
                    </p>
                  </div>
                  <span className="text-[11px] bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-300 font-bold px-2.5 py-0.5 rounded-full shrink-0">
                    {editData.benefits?.length || 0} benefícios
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBenefitInput}
                      onChange={e => {
                        setNewBenefitInput(e.target.value);
                        if (benefitError) setBenefitError('');
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addBenefitItem();
                        }
                      }}
                      placeholder="Digite um benefício e aperte Enter..."
                      className={`form-control text-xs flex-1 ${benefitError ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
                      maxLength={50}
                    />
                    <button
                      type="button"
                      onClick={() => addBenefitItem()}
                      className="btn btn-teal btn-sm text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>
                  {benefitError && (
                    <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400 text-[11px] font-semibold animate-in fade-in duration-150">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{benefitError}</span>
                    </div>
                  )}
                </div>

                {/* Sugestões Rápidas */}
                <div className="pt-2 border-t border-gray-200/80 dark:border-slate-700/80">
                  <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-2">
                    Benefícios mais valorizados por candidatos:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {BENEFIT_SUGGESTIONS.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => addBenefitItem(sug)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                          (editData.benefits || []).includes(sug)
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary-blue'
                        }`}
                      >
                        <Plus size={10} /> {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Benefícios */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {(!editData.benefits || editData.benefits.length === 0) ? (
                    <p className="text-xs text-gray-400 dark:text-slate-500 italic">
                      Nenhum benefício cadastrado. Adicione acima para atrair mais candidatos.
                    </p>
                  ) : (
                    editData.benefits.map((b, idx) => {
                      const bCheck = validateCompanyBenefitItem(b);
                      const isInvalid = !bCheck.valid;
                      return (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs border ${
                            isInvalid
                              ? 'bg-red-50 dark:bg-red-950/70 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800 ring-2 ring-red-400/30'
                              : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                          }`}
                          title={isInvalid ? bCheck.error : undefined}
                        >
                          {isInvalid ? (
                            <AlertCircle size={12} className="text-red-600 dark:text-red-400 shrink-0" />
                          ) : (
                            <Sparkles size={12} className="text-emerald-600 shrink-0" />
                          )}
                          <span>{b}</span>
                          <button
                            type="button"
                            onClick={() => removeBenefitItem(b)}
                            className={`p-0.5 rounded-md transition-colors cursor-pointer ml-1 ${
                              isInvalid
                                ? 'hover:bg-red-200 dark:hover:bg-red-900 text-red-600'
                                : 'hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-600 hover:text-red-600'
                            }`}
                            title="Remover benefício"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
                {renderFieldError('benefits')}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              ABA 4: CONTATO, REDES & CANAIS
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'contact' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 space-y-4">
                <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Globe size={16} className="text-primary-blue" /> Canais Oficiais de Contato da Empresa
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold flex items-center gap-1.5">
                      <Globe size={13} className="text-primary-blue" /> Website Oficial
                    </label>
                    <input
                      type="url"
                      value={editData.website || ''}
                      onChange={e => handleWebsiteChange(e.target.value)}
                      onBlur={handleWebsiteBlur}
                      placeholder="https://suaempresa.com.br"
                      className={getInputClass('website', 'form-control text-xs')}
                    />
                    {renderFieldError('website')}
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs font-bold flex items-center gap-1.5">
                      <Mail size={13} className="text-primary-blue" /> E-mail de Recrutamento / RH
                    </label>
                    <input
                      type="email"
                      value={editData.email || ''}
                      onChange={e => handleEmailChange(e.target.value)}
                      onBlur={handleEmailBlur}
                      placeholder="rh@suaempresa.com.br"
                      className={getInputClass('email', 'form-control text-xs')}
                    />
                    {renderFieldError('email')}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 fill-[#0A66C2] shrink-0" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/></svg>
                      LinkedIn da Empresa
                    </label>
                    <input
                      type="text"
                      value={editData.linkedin || ''}
                      onChange={e => handleLinkedInChange(e.target.value)}
                      onBlur={handleLinkedInBlur}
                      placeholder="https://linkedin.com/company/sua-empresa"
                      className={getInputClass('linkedin', 'form-control text-xs')}
                    />
                    {renderFieldError('linkedin')}
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs font-bold flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 fill-pink-500 shrink-0" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      Instagram Corporativo
                    </label>
                    <input
                      type="text"
                      value={editData.instagram || ''}
                      onChange={e => handleInstagramChange(e.target.value)}
                      onBlur={handleInstagramBlur}
                      placeholder="@suaempresa"
                      className={getInputClass('instagram', 'form-control text-xs')}
                    />
                    {renderFieldError('instagram')}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <Phone size={13} className="text-emerald-500" /> Telefone / WhatsApp Corporativo
                  </label>
                  <input
                    type="text"
                    value={editData.phone || ''}
                    onChange={e => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    placeholder="(43) 99999-9999"
                    className={getInputClass('phone', 'form-control text-xs')}
                  />
                  {renderFieldError('phone')}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              RODAPÉ DO MODAL (Ações de Cancelar / Salvar)
          ═════════════════════════════════════════════════════════════ */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="btn btn-outline btn-sm text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={14} /> Salvar Perfil da Empresa
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
