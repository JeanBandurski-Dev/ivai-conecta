import React, { useState } from 'react';
import {
  Briefcase, DollarSign, FileText, X, Check, ChevronLeft, ChevronRight,
  Plus, MapPin, Phone, Sparkles, Building2, RefreshCw, Globe, ShieldCheck, Clock
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { addJob, CITIES } from '../lib/ivaiConecta';

const POPULAR_SKILLS = [
  'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Git',
  'HTML5/CSS3', 'Tailwind CSS', 'SQL', 'PostgreSQL', 'Figma', 'UI/UX Design',
  'Excel Avançado', 'Gestão Financeira', 'ERP', 'Atendimento ao Cliente',
  'Redes de Computadores', 'Hardware', 'Vendas B2B', 'Marketing Digital',
  'AutoCAD', 'NR-10', 'Java', 'PHP', 'WordPress', 'Photoshop'
];

const POPULAR_BENEFITS = [
  'Vale Alimentação / Refeição',
  'Vale Transporte / Auxílio Combustível',
  'Plano de Saúde (Unimed/Clinipam)',
  'Plano Odontológico',
  'Horário Flexível',
  'Auxílio Home Office',
  'TotalPass / Gympass',
  'Bolsa de Estudos / Auxílio Cursos',
  'Seguro de Vida',
  'Day Off no Aniversário'
];

export default function PublishJobModal({ isOpen, onClose, onJobCreated }) {
  const { currentUser, showToast } = useAppStore();
  const [step, setStep] = useState(1);
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [respInput, setRespInput] = useState('');

  const [form, setForm] = useState({
    title: '',
    type: 'Tempo Integral',
    modality: 'Presencial',
    city: currentUser?.city || 'Ivaiporã',
    level: 'Júnior',
    salary: 'R$ 2.500 - R$ 3.500 / mês',
    workingHours: '08:00 às 18:00 (Segunda a Sexta)',
    recruiterPhone: currentUser?.phone || '5543999887766',
    requiredSkills: ['React', 'JavaScript', 'HTML5/CSS3', 'Git'],
    benefits: ['Vale Alimentação / Refeição', 'Vale Transporte / Auxílio Combustível', 'Plano de Saúde (Unimed/Clinipam)'],
    description: 'Buscamos um talento dedicado e proativo para compor nossa equipe e atuar no desenvolvimento de projetos e soluções inovadoras no Vale do Ivaí.',
    responsibilities: [
      'Desenvolver e manter soluções e interfaces responsivas',
      'Integrar serviços e dados com o time de desenvolvimento',
      'Colaborar com a equipe no aprimoramento contínuo de processos'
    ]
  });

  if (!isOpen) return null;

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
      showToast('Por favor, informe o cargo/título da vaga.');
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
        salary: form.salary || 'A Combinar',
        workingHours: form.workingHours || '08:00 às 18:00 (Segunda a Sexta)',
        recruiterPhone: form.recruiterPhone || currentUser?.phone || '5543999887766',
        recruiterEmail: currentUser?.email || 'empresa@ivaiconecta.com.br',
        requiredSkills: skillsArray.length > 0 ? skillsArray : ['Trabalho em Equipe', 'Comunicação'],
        benefits: benefitsArray.length > 0 ? benefitsArray : ['Vale Transporte'],
        description: form.description || 'Estamos em busca de talentos para compor nossa equipe em Ivaiporã e região.',
        responsibilities: responsibilitiesArray.length > 0 ? responsibilitiesArray : [
          'Atuar nas rotinas diárias do setor',
          'Contribuir com ideias e projetos da equipe'
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

    // Executa callback da tela pai de forma isolada
    try {
      if (onJobCreated && typeof onJobCreated === 'function') {
        onJobCreated(created);
      }
    } catch (callbackErr) {
      console.warn('[PublishJobModal] Aviso no callback onJobCreated:', callbackErr);
    }

    // Reseta o formulário e fecha o modal
    try {
      setStep(1);
      setForm(prev => ({
        ...prev,
        title: ''
      }));
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    } catch (closeErr) {
      console.warn('[PublishJobModal] Aviso ao fechar modal:', closeErr);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header no Padrão da Identidade Visual do Site */}
        <div className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_50%,#0052FF_100%)] text-white px-6 py-5 shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.2),transparent_50%)] pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-accent-sky flex items-center justify-center shrink-0 backdrop-blur-md shadow-inner">
                <Briefcase size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-accent-sky">Recrutamento Regional</span>
                </div>
                <h3 className="font-heading text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Publicar Nova Vaga
                </h3>
              </div>
            </div>

            <button
              onClick={() => {
                setStep(1);
                onClose();
              }}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Stepper Progress Bar na Paleta do Site */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/90 shrink-0">
          <div className="grid grid-cols-3 gap-2">
            {[
              { stepNum: 1, label: 'Cargo & Modalidade', icon: Briefcase },
              { stepNum: 2, label: 'Requisitos & Salário', icon: DollarSign },
              { stepNum: 3, label: 'Descrição & Prévia', icon: FileText }
            ].map(item => {
              const isCurrent = step === item.stepNum;
              const isDone = step > item.stepNum;

              return (
                <button
                  key={item.stepNum}
                  type="button"
                  onClick={() => setStep(item.stepNum)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                    isCurrent
                      ? 'bg-primary-blue text-white border-primary-blue shadow-md shadow-blue-500/20'
                      : isDone
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-primary-blue dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60'
                      : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-white text-primary-blue'
                      : isDone
                      ? 'bg-accent-green text-white'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                  }`}>
                    {isDone ? <Check size={10} strokeWidth={3} /> : item.stepNum}
                  </span>
                  <span className="truncate hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* STEP 1: CARGO, NÍVEL E REGIME */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Job Title */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                  Título do Cargo / Função <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: Desenvolvedor Front-end React Júnior"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (form.title.trim()) {
                          setStep(2);
                        } else {
                          showToast('Por favor, informe o cargo/título da vaga.');
                        }
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white transition-all"
                    autoFocus
                    required
                  />
                  <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                </div>
              </div>

              {/* Experience Level (Segmented) */}
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
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-sm shadow-blue-500/25'
                            : 'bg-slate-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contract Type (Segmented) */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                  Tipo de Contrato / Regime
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Tempo Integral', label: 'CLT (Integral)' },
                    { id: 'Estágio', label: 'Estágio' },
                    { id: 'Prestador de Serviço', label: 'PJ / Freelancer' },
                    { id: 'Meio Período', label: 'Meio Período' }
                  ].map(typeItem => {
                    const isSelected = form.type === typeItem.id;
                    return (
                      <button
                        key={typeItem.id}
                        type="button"
                        onClick={() => setForm({ ...form, type: typeItem.id })}
                        className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer truncate ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-sm shadow-blue-500/25'
                            : 'bg-slate-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                        }`}
                      >
                        {typeItem.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modality (Segmented with icons) */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                  Modalidade de Trabalho
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Presencial', title: 'Presencial', icon: Building2 },
                    { id: 'Híbrido', title: 'Híbrido', icon: RefreshCw },
                    { id: 'Remoto', title: '100% Remoto', icon: Globe }
                  ].map(modItem => {
                    const ModIcon = modItem.icon;
                    const isSelected = form.modality === modItem.id;
                    return (
                      <button
                        key={modItem.id}
                        type="button"
                        onClick={() => setForm({ ...form, modality: modItem.id })}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-sm shadow-blue-500/25'
                            : 'bg-slate-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                        }`}
                      >
                        <ModIcon size={15} className={isSelected ? 'text-white' : 'text-primary-blue'} />
                        <span>{modItem.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* City & Working Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1">
                    Cidade Polo
                  </label>
                  <div className="relative">
                    <select
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20"
                    >
                      {CITIES.filter(c => c !== 'Todas as Cidades').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <MapPin size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1">
                    Carga Horária & Dias
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 08:00 às 18:00 (Seg a Sex)"
                      value={form.workingHours}
                      onChange={e => setForm({ ...form, workingHours: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Recruiter Phone */}
              <div>
                <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1">
                  WhatsApp / Telefone de Contato da Empresa
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="5543999887766"
                    value={form.recruiterPhone}
                    onChange={e => setForm({ ...form, recruiterPhone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REMUNERAÇÃO, HABILIDADES E BENEFÍCIOS */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Salary Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block">
                  Faixa Salarial / Bolsa-Auxílio
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: R$ 2.500 - R$ 3.500 / mês"
                    value={form.salary}
                    onChange={e => setForm({ ...form, salary: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                  />
                  <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                </div>

                {/* Salary Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {[
                    'R$ 1.200 - 1.600 (Estágio)',
                    'R$ 2.500 - 3.500',
                    'R$ 4.000 - 5.500',
                    'A Combinar'
                  ].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setForm({ ...form, salary: sug })}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-primary-blue dark:text-blue-300 hover:bg-primary-blue hover:text-white dark:hover:bg-primary-blue dark:hover:text-white text-[11px] font-semibold transition-all cursor-pointer border border-blue-200/60 dark:border-blue-900/60"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Required Skills */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block">
                  Competências & Habilidades Desejadas ({form.requiredSkills.length})
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Digite uma competência (ex: React, Excel) e tecle Enter..."
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill()}
                    className="bg-primary-blue hover:bg-primary-hover text-white px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0 shadow-sm transition-all"
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>

                {/* Active Skills Chips */}
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 min-h-[42px] items-center">
                  {form.requiredSkills.length === 0 ? (
                    <span className="text-gray-400 text-xs italic">Nenhuma habilidade adicionada ainda.</span>
                  ) : (
                    form.requiredSkills.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-200 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800 shadow-2xs"
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

                {/* Popular Skills Cloud */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {POPULAR_SKILLS.slice(0, 10).map(skill => {
                    const isAlreadyAdded = form.requiredSkills.some(s => s.toLowerCase() === skill.toLowerCase());
                    if (isAlreadyAdded) return null;
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleAddSkill(skill)}
                        className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-primary-blue dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-200 transition-colors cursor-pointer border border-transparent"
                      >
                        + {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Benefits Selection Grid */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block">
                  Benefícios Oferecidos
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_BENEFITS.slice(0, 8).map(b => {
                    const isChecked = form.benefits.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleToggleBenefit(b)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-left transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-800'
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

                {/* Custom Benefit Adder */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Outro benefício (ex: Horário Flexível)..."
                    value={benefitInput}
                    onChange={e => setBenefitInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomBenefit();
                      }
                    }}
                    className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomBenefit}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-primary-blue dark:text-blue-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DESCRIÇÃO, RESPONSABILIDADES E PRÉVIA */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Description Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                    Descrição da Oportunidade
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {form.description.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Descreva o contexto da vaga, ambiente de trabalho e o que a empresa busca..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-xs leading-relaxed outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                />
              </div>

              {/* Responsibilities Items */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block">
                  Principais Atividades & Responsabilidades
                </label>

                <div className="space-y-1.5">
                  {(form.responsibilities || []).map((resp, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-xs">
                      <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-300 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-gray-800 dark:text-slate-200 font-medium">{resp}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveResponsibility(idx)}
                        className="text-gray-400 hover:text-red-500 cursor-pointer p-0.5"
                        title="Remover"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Adicionar atividade..."
                    value={respInput}
                    onChange={e => setRespInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddResponsibility();
                      }
                    }}
                    className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddResponsibility}
                    className="bg-primary-blue hover:bg-primary-hover text-white px-3.5 py-1.5 font-bold text-xs rounded-xl cursor-pointer shrink-0 transition-colors"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              {/* Clean Live Card Preview */}
              <div className="pt-2">
                <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-primary-blue" /> Prévia de como a vaga aparecerá no Mural Regional
                </label>

                <div className="bg-white dark:bg-slate-900 border-2 border-primary-blue/20 dark:border-primary-blue/30 rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={currentUser?.avatar || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150'}
                        alt="Empresa"
                        className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-slate-700 shadow-xs shrink-0 bg-white"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">
                            {currentUser?.name || 'ValeTech Soluções Digitais'}
                          </span>
                          <ShieldCheck size={13} className="text-primary-blue" />
                        </div>
                        <h4 className="font-heading font-extrabold text-sm text-primary-dark dark:text-white">
                          {form.title || 'Título da Vaga'}
                        </h4>
                      </div>
                    </div>

                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {form.salary || 'A Combinar'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-primary-blue">
                      <MapPin size={12} /> {form.city}
                    </span>
                    <span>•</span>
                    <span>{form.modality}</span>
                    <span>•</span>
                    <span>{form.type}</span>
                    <span>•</span>
                    <span className="bg-blue-50 dark:bg-blue-950/80 text-primary-blue dark:text-blue-300 px-2 py-0.5 rounded-md font-bold">
                      {form.level || 'Júnior'}
                    </span>
                  </div>

                  {form.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {form.requiredSkills.map(skill => (
                        <span
                          key={skill}
                          className="text-[10px] bg-slate-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2.5 py-0.5 rounded-md border border-gray-200 dark:border-slate-700 font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 sm:p-5 bg-gray-50/90 dark:bg-slate-850 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} /> Voltar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {step < 3 && form.title.trim() && (
              <button
                type="button"
                onClick={handlePublish}
                className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="Publicar com as opções atuais"
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
                className="btn btn-primary px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <span>{step === 1 ? 'Próximo: Requisitos' : 'Próximo: Descrição'}</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                className="btn btn-teal px-6 py-2.5 text-xs font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                <Sparkles size={14} />
                <span>Publicar Vaga no Mural</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
