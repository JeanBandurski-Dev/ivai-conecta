import React, { useState } from 'react';
import {
  Briefcase, DollarSign, FileText, X, Check, ChevronLeft, ChevronRight,
  Plus, MapPin, Phone, Sparkles, Building2, RefreshCw, Globe, ShieldCheck,
  Clock, Award, Gift, CheckCircle2, AlertCircle, Eye, Bookmark, Share2
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { addJob, CITIES } from '../lib/ivaiConecta';

const SUGGESTED_SKILLS = [
  'Comunicação', 'Trabalho em Equipe', 'Atendimento ao Cliente', 'Organização',
  'Vendas', 'Pacote Office', 'Excel Avançado', 'Gestão de Tempo',
  'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'SQL',
  'Figma', 'UI/UX Design', 'Marketing Digital', 'Redes Sociais'
];

const SUGGESTED_BENEFITS = [
  'Vale Alimentação / Refeição',
  'Vale Transporte / Combustível',
  'Plano de Saúde',
  'Plano Odontológico',
  'Horário Flexível',
  'Auxílio Home Office',
  'Gympass / Auxílio Academia',
  'Bolsa de Estudos / Cursos',
  'Seguro de Vida',
  'Day Off no Aniversário'
];

const SALARY_PRESETS = [
  'A Combinar',
  'Bolsa Estágio (R$ 1.000 - 1.500)',
  'R$ 1.600 - R$ 2.400',
  'R$ 2.500 - R$ 4.000',
  'R$ 4.000 - R$ 6.500',
  'Acima de R$ 7.000'
];

const SCHEDULE_PRESETS = [
  '08:00 às 18:00 (Seg a Sex)',
  'Comercial (44h semanais)',
  '08:00 às 12:00 / 13:30 às 17:30',
  '6h diárias / 30h semanais (Estágio)',
  'Escala 12x36'
];

export default function PublishJobModal({ isOpen, onClose, onJobCreated }) {
  const { currentUser, showToast } = useAppStore();
  const [step, setStep] = useState(1);
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [respInput, setRespInput] = useState('');
  const [previewTab, setPreviewTab] = useState('card'); // 'card' | 'details'
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const [form, setForm] = useState({
    title: '',
    type: 'Tempo Integral',
    modality: 'Presencial',
    city: currentUser?.city || 'Ivaiporã',
    level: 'Júnior',
    salary: '',
    workingHours: '',
    recruiterPhone: currentUser?.phone || '',
    requiredSkills: [],
    benefits: [],
    description: '',
    responsibilities: []
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setShowMobilePreview(false);
    onClose();
  };

  const handleAddSkill = (skill) => {
    const s = (skill || skillInput).trim();
    if (!s) return;
    const current = Array.isArray(form.requiredSkills) ? form.requiredSkills : [];
    if (!current.some(item => item.toLowerCase() === s.toLowerCase())) {
      setForm(prev => ({ ...prev, requiredSkills: [...current, s] }));
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setForm(prev => ({
      ...prev,
      requiredSkills: (prev.requiredSkills || []).filter(s => s !== skillToRemove)
    }));
  };

  const handleToggleBenefit = (benefitName) => {
    const current = Array.isArray(form.benefits) ? form.benefits : [];
    const exists = current.includes(benefitName);
    if (exists) {
      setForm(prev => ({ ...prev, benefits: current.filter(b => b !== benefitName) }));
    } else {
      setForm(prev => ({ ...prev, benefits: [...current, benefitName] }));
    }
  };

  const handleAddCustomBenefit = () => {
    const b = benefitInput.trim();
    if (!b) return;
    const current = Array.isArray(form.benefits) ? form.benefits : [];
    if (!current.includes(b)) {
      setForm(prev => ({ ...prev, benefits: [...current, b] }));
    }
    setBenefitInput('');
  };

  const handleAddResponsibility = () => {
    const r = respInput.trim();
    if (!r) return;
    setForm(prev => ({
      ...prev,
      responsibilities: [...(prev.responsibilities || []), r]
    }));
    setRespInput('');
  };

  const handleRemoveResponsibility = (index) => {
    setForm(prev => ({
      ...prev,
      responsibilities: (prev.responsibilities || []).filter((_, idx) => idx !== index)
    }));
  };

  const handlePublish = (e) => {
    if (e) e.preventDefault();
    if (!form.title || !form.title.trim()) {
      showToast('Por favor, informe o cargo / título da vaga.');
      setStep(1);
      return;
    }

    const skillsArray = Array.isArray(form.requiredSkills)
      ? form.requiredSkills.filter(s => s && s.trim())
      : (typeof form.requiredSkills === 'string' ? form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []);

    const benefitsArray = Array.isArray(form.benefits)
      ? form.benefits.filter(b => b && b.trim())
      : (typeof form.benefits === 'string' ? form.benefits.split(',').map(b => b.trim()).filter(Boolean) : []);

    const responsibilitiesArray = Array.isArray(form.responsibilities)
      ? form.responsibilities.filter(r => r && r.trim())
      : (typeof form.responsibilities === 'string' ? form.responsibilities.split('\n').map(r => r.trim()).filter(Boolean) : []);

    let created = null;

    try {
      created = addJob({
        title: form.title.trim(),
        company: currentUser?.name || currentUser?.company || 'ValeTech Soluções Digitais',
        companyLogo: currentUser?.avatar || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=250',
        type: form.type || 'Tempo Integral',
        modality: form.modality || 'Presencial',
        city: form.city || currentUser?.city || 'Ivaiporã',
        level: form.level || 'Júnior',
        salary: form.salary?.trim() || 'A Combinar',
        workingHours: form.workingHours?.trim() || '08:00 às 18:00 (Segunda a Sexta)',
        recruiterPhone: form.recruiterPhone?.trim() || currentUser?.phone || '',
        recruiterEmail: currentUser?.email || 'empresa@ivaiconecta.com.br',
        requiredSkills: skillsArray.length > 0 ? skillsArray : ['Trabalho em Equipe', 'Comunicação'],
        benefits: benefitsArray.length > 0 ? benefitsArray : ['Vale Transporte'],
        description: form.description?.trim() || 'Estamos em busca de talentos para compor nossa equipe em Ivaiporã e região.',
        responsibilities: responsibilitiesArray.length > 0 ? responsibilitiesArray : [
          'Atuar nas rotinas e atividades do setor',
          'Colaborar com a equipe no aprimoramento dos processos'
        ],
        createdBy: currentUser?.uid || currentUser?.email || 'empresa',
        isVerifiedCompany: true
      });

      showToast('Nova vaga publicada com sucesso no Mural Regional!');
    } catch (err) {
      console.error('[PublishJobModal] Erro ao salvar vaga:', err);
      showToast('Ocorreu um erro ao salvar a vaga.');
      return;
    }

    try {
      if (onJobCreated && typeof onJobCreated === 'function') {
        onJobCreated(created);
      }
    } catch (callbackErr) {
      console.warn('[PublishJobModal] Aviso no callback onJobCreated:', callbackErr);
    }

    try {
      setStep(1);
      setForm({
        title: '',
        type: 'Tempo Integral',
        modality: 'Presencial',
        city: currentUser?.city || 'Ivaiporã',
        level: 'Júnior',
        salary: '',
        workingHours: '',
        recruiterPhone: currentUser?.phone || '',
        requiredSkills: [],
        benefits: [],
        description: '',
        responsibilities: []
      });
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    } catch (closeErr) {
      console.warn('[PublishJobModal] Aviso ao fechar modal:', closeErr);
    }
  };

  const stepsList = [
    { num: 1, title: 'Dados da Vaga', subtitle: 'Cargo e modelo', icon: Briefcase },
    { num: 2, title: 'Requisitos & Salário', subtitle: 'Skills e benefícios', icon: DollarSign },
    { num: 3, title: 'Descrição & Atividades', subtitle: 'Texto e detalhes', icon: FileText }
  ];

  // Componente de Prévia em Tempo Real Renderizado Dinamicamente
  const renderLivePreview = () => {
    const companyName = currentUser?.name || currentUser?.company || 'Minha Empresa';
    const companyLogo = currentUser?.avatar || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150';
    const displayTitle = form.title.trim() || 'Título do Cargo / Função';
    const displaySalary = form.salary.trim() || 'A Combinar';
    const displayCity = form.city || 'Ivaiporã';

    return (
      <div className="space-y-3">
        {/* Switcher de Formato de Prévia */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
              Ao Vivo no Mural
            </span>
          </div>

          <div className="bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg flex items-center text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setPreviewTab('card')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                previewTab === 'card'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              Card Mural
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab('details')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                previewTab === 'details'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              Visão Completa
            </button>
          </div>
        </div>

        {/* ── PREVIEW TAB: CARD DO MURAL (IDÊNTICO AO JOBCARD OFICIAL) ── */}
        {previewTab === 'card' ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Header do Card */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800"
                />
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">
                    {companyName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      <ShieldCheck size={12} className="shrink-0" />
                      CNPJ Validado · Vaga Verificada
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-1 rounded-full">
                  {displaySalary}
                </span>
              </div>
            </div>

            {/* Cargo */}
            <h4 className={`text-base font-extrabold leading-snug transition-colors line-clamp-2 ${
              form.title ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500 italic font-medium'
            }`}>
              {displayTitle}
            </h4>

            {/* Metadados: Local, Modalidade e Regime */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-primary-blue dark:text-blue-400">
                <MapPin size={12} className="shrink-0" />
                {displayCity}
              </span>
              <span className="text-gray-300 dark:text-slate-600">·</span>
              <span className="font-semibold text-gray-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                {form.modality}
              </span>
              <span className="text-gray-300 dark:text-slate-600">·</span>
              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                {form.type}
              </span>
              <span className="text-gray-300 dark:text-slate-600">·</span>
              <span className="bg-blue-50 dark:bg-blue-950/80 text-primary-blue dark:text-blue-300 px-2 py-0.5 rounded font-bold text-[10px]">
                {form.level}
              </span>
            </div>

            {/* Benefícios */}
            {form.benefits.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {form.benefits.slice(0, 2).map((b, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1"
                  >
                    <Check size={10} strokeWidth={3} /> {b}
                  </span>
                ))}
                {form.benefits.length > 2 && (
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 self-center">
                    +{form.benefits.length - 2} benefícios
                  </span>
                )}
              </div>
            )}

            {/* Requisitos / Skills */}
            {form.requiredSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.requiredSkills.map(skill => (
                  <span
                    key={skill}
                    className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-gray-400 dark:text-slate-500 italic py-0.5">
                Nenhuma competência selecionada ainda
              </div>
            )}

            {/* CTA do Card */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
              <div className="w-full py-2 bg-primary-blue text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs opacity-90 cursor-default">
                <Eye size={13} /> Candidatar-se à Vaga (Exemplo)
              </div>
            </div>
          </div>
        ) : (
          /* ── PREVIEW TAB: DETALHES COMPLETOS DA VAGA ── */
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm space-y-3.5 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-blue dark:text-blue-400">
                Sobre a Oportunidade
              </span>
              <p className={`mt-1 leading-relaxed text-xs ${
                form.description ? 'text-gray-700 dark:text-slate-300' : 'text-gray-400 italic'
              }`}>
                {form.description || 'A descrição detalhada da oportunidade aparecerá aqui conforme você preenche o campo...'}
              </p>
            </div>

            {form.responsibilities.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 block mb-1.5">
                  Atividades & Responsabilidades ({form.responsibilities.length})
                </span>
                <ul className="space-y-1">
                  {form.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-gray-700 dark:text-slate-300">
                      <span className="text-primary-blue font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {form.workingHours && (
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
                <Clock size={13} className="text-primary-blue shrink-0" />
                <span className="font-semibold text-gray-800 dark:text-slate-200">Horário:</span> {form.workingHours}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* ── HEADER MODERNO & ORGANIZADO ── */}
        <div className="px-6 py-4.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary-blue/10 dark:bg-primary-blue/20 text-primary-blue dark:text-blue-400 flex items-center justify-center shrink-0 border border-primary-blue/20 shadow-xs">
              <Briefcase size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-blue dark:text-blue-400">
                  Painel de Recrutamento
                </span>
                <span className="text-gray-300 dark:text-slate-600">·</span>
                <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                  Etapa {step} de 3
                </span>
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                Publicar Nova Oportunidade
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão para alternar prévia em telas menores */}
            <button
              type="button"
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className={`lg:hidden px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showMobilePreview
                  ? 'bg-primary-blue text-white border-primary-blue'
                  : 'bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
              }`}
            >
              <Eye size={13} />
              <span>{showMobilePreview ? 'Ocultar Prévia' : 'Ver Prévia'}</span>
            </button>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── STEPPER BAR MINIMALISTA & FLUIDO ── */}
        <div className="px-6 py-2.5 bg-gray-50/80 dark:bg-slate-900/90 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {stepsList.map(s => {
              const isCurrent = step === s.num;
              const isDone = step > s.num;

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num > 1 && !form.title.trim()) {
                      showToast('Informe o cargo da vaga antes de prosseguir.');
                      return;
                    }
                    setStep(s.num);
                  }}
                  className={`py-2 px-3 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-2.5 border ${
                    isCurrent
                      ? 'bg-white dark:bg-slate-800 border-primary-blue dark:border-blue-500 shadow-sm'
                      : isDone
                      ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/40 text-primary-blue dark:text-blue-400'
                      : 'bg-transparent border-transparent text-gray-400 dark:text-slate-500 hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-primary-blue text-white shadow-xs'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                  }`}>
                    {isDone ? <Check size={12} strokeWidth={3} /> : s.num}
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <p className={`text-xs font-bold leading-tight truncate ${
                      isCurrent ? 'text-gray-900 dark:text-white' : isDone ? 'text-primary-blue dark:text-blue-300' : 'text-gray-500 dark:text-slate-400'
                    }`}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                      {s.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MODAL BODY: SPLIT VIEW COM FORMULÁRIO (ESQ) E PRÉVIA EM TEMPO REAL (DIR) ── */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUNA ESQUERDA: FORMULÁRIO WIZARD (7 COLUNAS EM TELAS GRANDES) */}
            <div className={`lg:col-span-7 space-y-6 ${showMobilePreview ? 'hidden lg:block' : 'block'}`}>
              
              {/* ═════════════════════════════════════════════════════════════
                  STEP 1: CARGO, MODALIDADE, REGIME E LOCALIZAÇÃO
              ═════════════════════════════════════════════════════════════ */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  
                  {/* Título do Cargo */}
                  <div>
                    <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                      Título do Cargo / Função <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: Assistente Administrativo, Vendedor Comercial, Desenvolvedor React..."
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (form.title.trim()) setStep(2);
                            else showToast('Por favor, informe o título do cargo.');
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 placeholder:font-normal"
                        autoFocus
                        required
                      />
                      <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                    </div>
                  </div>

                  {/* Nível de Experiência */}
                  <div>
                    <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                      Nível de Experiência
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista'].map(lvl => {
                        const isSelected = form.level === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setForm({ ...form, level: lvl })}
                            className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-primary-blue text-white border-primary-blue shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tipo de Contrato & Modalidade */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Modalidade */}
                    <div>
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                        Modalidade de Trabalho
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'Presencial', label: 'Presencial', icon: Building2 },
                          { id: 'Híbrido', label: 'Híbrido', icon: RefreshCw },
                          { id: 'Remoto', label: '100% Remoto', icon: Globe }
                        ].map(mod => {
                          const Icon = mod.icon;
                          const isSelected = form.modality === mod.id;
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => setForm({ ...form, modality: mod.id })}
                              className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                isSelected
                                  ? 'bg-primary-blue text-white border-primary-blue shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                              }`}
                            >
                              <Icon size={14} className={isSelected ? 'text-white' : 'text-primary-blue'} />
                              <span className="text-[11px] truncate">{mod.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tipo de Contrato */}
                    <div>
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                        Regime de Contratação
                      </label>
                      <div className="relative">
                        <select
                          value={form.type}
                          onChange={e => setForm({ ...form, type: e.target.value })}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                        >
                          <option value="Tempo Integral">CLT (Tempo Integral)</option>
                          <option value="Estágio">Estágio Remunerado</option>
                          <option value="Prestador de Serviço">PJ / Prestador de Serviços</option>
                          <option value="Jovem Aprendiz">Jovem Aprendiz</option>
                          <option value="Meio Período">Meio Período</option>
                          <option value="Temporário">Temporário</option>
                        </select>
                        <Award size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Cidade & Horário */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                        Cidade Polo (Vale do Ivaí)
                      </label>
                      <div className="relative">
                        <select
                          value={form.city}
                          onChange={e => setForm({ ...form, city: e.target.value })}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                        >
                          {CITIES.filter(c => c !== 'Todas as Cidades').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <MapPin size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                        Carga Horária & Dias
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ex: 08:00 às 18:00 (Seg a Sex)"
                          value={form.workingHours}
                          onChange={e => setForm({ ...form, workingHours: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-primary-blue"
                        />
                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Sugestões de Horário Rápidas */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Sugestões:</span>
                    {SCHEDULE_PRESETS.slice(0, 3).map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setForm({ ...form, workingHours: preset })}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-600 dark:text-slate-300 hover:text-primary-blue transition-colors cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800 font-medium"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Telefone para Contato */}
                  <div>
                    <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                      Telefone Comercial / WhatsApp para Contato <span className="text-gray-400 font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="(43) 99999-9999"
                        value={form.recruiterPhone}
                        onChange={e => setForm({ ...form, recruiterPhone: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-primary-blue"
                      />
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════════
                  STEP 2: REMUNERAÇÃO, HABILIDADES E BENEFÍCIOS
              ═════════════════════════════════════════════════════════════ */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Remuneração */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block">
                      Faixa Salarial / Bolsa-Auxílio
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: R$ 2.500 - R$ 3.500 / mês ou A Combinar"
                        value={form.salary}
                        onChange={e => setForm({ ...form, salary: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none focus:border-primary-blue text-gray-900 dark:text-white"
                      />
                      <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {SALARY_PRESETS.map(sal => (
                        <button
                          key={sal}
                          type="button"
                          onClick={() => setForm({ ...form, salary: sal })}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all cursor-pointer border border-emerald-200/60 dark:border-emerald-800 font-semibold"
                        >
                          {sal}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Habilidades & Competências */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Competências & Requisitos Desejados ({form.requiredSkills.length})
                      </label>
                      <span className="text-[11px] text-gray-400">Pressione Enter ou clique em Adicionar</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Digite uma habilidade (ex: Atendimento, Pacote Office, React)..."
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-primary-blue text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkill()}
                        className="bg-primary-blue hover:bg-blue-600 text-white px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0 transition-all shadow-xs"
                      >
                        <Plus size={14} /> Adicionar
                      </button>
                    </div>

                    {/* Chips Ativos */}
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 min-h-[48px] items-center">
                      {form.requiredSkills.length === 0 ? (
                        <span className="text-gray-400 text-xs italic">
                          Nenhuma habilidade adicionada ainda.
                        </span>
                      ) : (
                        form.requiredSkills.map(skill => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-200 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="text-blue-400 hover:text-red-500 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Sugestões Populares */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sugestões rápidas:</span>
                      <div className="flex flex-wrap gap-1">
                        {SUGGESTED_SKILLS.map(skill => {
                          const isAdded = form.requiredSkills.some(s => s.toLowerCase() === skill.toLowerCase());
                          if (isAdded) return null;
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => handleAddSkill(skill)}
                              className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-primary-blue dark:hover:text-blue-300 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                            >
                              + {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Benefícios */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block">
                      Benefícios Oferecidos ({form.benefits.length})
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SUGGESTED_BENEFITS.map(b => {
                        const isChecked = form.benefits.includes(b);
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => handleToggleBenefit(b)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-left transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                                : 'bg-slate-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-emerald-300'
                            }`}
                          >
                            <span className="text-xs truncate">{b}</span>
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-slate-600'
                            }`}>
                              {isChecked && <Check size={11} strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Adicionar Benefício Personalizado */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Outro benefício (ex: Bonificação por Metas)..."
                        value={benefitInput}
                        onChange={e => setBenefitInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomBenefit();
                          }
                        }}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary-blue text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomBenefit}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════════
                  STEP 3: DESCRIÇÃO E ATIVIDADES
              ═════════════════════════════════════════════════════════════ */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Descrição */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Descrição da Vaga & Contexto da Empresa
                      </label>
                      <span className="text-[10px] text-gray-400">
                        {form.description.length} caracteres
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Descreva o objetivo da contratação, o ambiente de trabalho e o que a empresa espera do candidato..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs leading-relaxed outline-none focus:border-primary-blue text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                  </div>

                  {/* Atividades & Responsabilidades */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block">
                      Principais Atividades & Responsabilidades
                    </label>

                    {form.responsibilities.length > 0 && (
                      <div className="space-y-1.5">
                        {form.responsibilities.map((resp, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs">
                            <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-300 text-[10px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="flex-1 text-gray-800 dark:text-slate-200 font-medium">{resp}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveResponsibility(idx)}
                              className="text-gray-400 hover:text-red-500 cursor-pointer p-0.5"
                              title="Remover atividade"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Adicione uma atividade (ex: Atendimento a clientes, Elaboração de relatórios)..."
                        value={respInput}
                        onChange={e => setRespInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddResponsibility();
                          }
                        }}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary-blue text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddResponsibility}
                        className="bg-primary-blue hover:bg-blue-600 text-white px-3.5 py-2 font-bold text-xs rounded-xl cursor-pointer shrink-0 transition-colors"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* COLUNA DIREITA: PRÉVIA AO VIVO EM TEMPO REAL (5 COLUNAS EM TELAS GRANDES) */}
            <div className={`lg:col-span-5 sticky top-0 ${showMobilePreview ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-gray-200/80 dark:border-slate-700/80 rounded-3xl p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary-blue dark:text-blue-400 font-bold text-xs">
                    <Sparkles size={15} />
                    <span>Prévia em Tempo Real</span>
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">
                    Atualiza instantaneamente
                  </span>
                </div>

                {renderLivePreview()}
              </div>
            </div>

          </div>
        </div>

        {/* ── MODAL FOOTER ACTIONS ── */}
        <div className="p-4 sm:p-5 bg-gray-50/90 dark:bg-slate-850 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {step === 1 ? (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft size={14} /> Voltar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {step < 3 && form.title.trim() && (
              <button
                type="button"
                onClick={handlePublish}
                className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="Publicar direto com as informações preenchidas"
              >
                <Sparkles size={13} />
                <span>Publicar Direto</span>
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !form.title.trim()) {
                    showToast('Por favor, informe o cargo/título da vaga.');
                    return;
                  }
                  setStep(prev => prev + 1);
                }}
                className="btn btn-primary px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-brand-sm"
              >
                <span>{step === 1 ? 'Requisitos & Salário' : 'Descrição & Atividades'}</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                className="bg-primary-blue hover:bg-blue-600 text-white px-6 py-2.5 text-xs font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-brand-sm hover:shadow-brand-md hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Sparkles size={15} />
                <span>Publicar Vaga no Mural</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
