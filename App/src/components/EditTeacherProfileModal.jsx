import { useState, useMemo } from 'react';
import {
  X, Camera, Upload, Plus, Trash2, GraduationCap,
  Globe, Sparkles, Save, BookOpen, Building2, User,
  Mail, Calendar, Award, ExternalLink, Link2, MapPin,
  Loader2
} from 'lucide-react';
import { CITIES } from '../lib/ivaiConecta';
import { isGenericPlaceholderAvatar, getAvatarGradient } from '../services/chatService';

const TEACHER_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250'
];

const DISCIPLINE_SUGGESTIONS = [
  'Programação de Computadores',
  'Banco de Dados',
  'Desenvolvimento Web',
  'Estrutura de Dados',
  'Engenharia de Software',
  'Redes de Computadores',
  'Sistemas Operacionais',
  'Inteligência Artificial',
  'Algoritmos',
  'Segurança da Informação'
];

export default function EditTeacherProfileModal({
  isOpen,
  onClose,
  editData,
  setEditData,
  handleSaveProfile,
  handleAvatarFileChange,
  isSaving = false
}) {
  const [activeTab, setActiveTab] = useState('general');

  // Calcula a taxa de completude do perfil acadêmico em tempo real
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (editData?.name?.trim()) score += 20;
    if (editData?.avatar?.trim()) score += 15;
    if (editData?.institution?.trim()) score += 15;
    if (editData?.discipline?.trim()) score += 15;
    if (editData?.degree?.trim()) score += 15;
    if (editData?.classes && editData.classes.length > 0) score += 10;
    if (editData?.education && editData.education.length > 0) score += 5;
    if (editData?.bio?.trim() || editData?.linkedin?.trim() || editData?.lattes?.trim()) score += 5;
    return Math.min(100, score);
  }, [editData]);

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    handleSaveProfile(e);
  };

  const addClassItem = (clsName) => {
    const val = (typeof clsName === 'string' ? clsName : editData.newClass || '').trim();
    if (!val) return;
    if (!editData.classes.includes(val)) {
      setEditData(prev => ({
        ...prev,
        classes: [...(prev.classes || []), val],
        newClass: ''
      }));
    } else {
      setEditData(prev => ({ ...prev, newClass: '' }));
    }
  };

  const removeClassItem = (cls) => {
    setEditData(prev => ({
      ...prev,
      classes: (prev.classes || []).filter(c => c !== cls)
    }));
  };

  const addEducationItem = (e) => {
    if (e) e.preventDefault();
    if (!editData.newEdu?.degree?.trim() || !editData.newEdu?.institution?.trim()) {
      return;
    }
    const item = {
      degree: editData.newEdu.degree.trim(),
      institution: editData.newEdu.institution.trim(),
      period: editData.newEdu.period?.trim() || 'Período Vigente'
    };
    setEditData(prev => ({
      ...prev,
      education: [item, ...(prev.education || [])],
      newEdu: { degree: '', institution: '', period: '' }
    }));
  };

  const removeEducationItem = (idx) => {
    setEditData(prev => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== idx)
    }));
  };

  const TABS = [
    { id: 'general', label: 'Dados Gerais', icon: User, badge: null },
    { id: 'classes', label: 'Matérias & Turmas', icon: BookOpen, badge: editData?.classes?.length || null },
    { id: 'education', label: 'Formações Acadêmicas', icon: GraduationCap, badge: editData?.education?.length || null },
    { id: 'bio', label: 'Bio & Atuação', icon: Award, badge: null },
    { id: 'contact', label: 'Redes & Contato', icon: Globe, badge: null }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Cabeçalho Premium com Indicador de Completude */}
        <div className="bg-[linear-gradient(135deg,#0A1128_0%,#051944_50%,#0052FF_100%)] text-white p-5 sm:p-6 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-inner backdrop-blur-md shrink-0">
                <GraduationCap size={22} className="text-cyan-300" />
              </div>
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Editar Meu Perfil Docente</span>
                  <span className="text-[10px] uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded-full text-cyan-200 font-bold hidden sm:inline-block">
                    Docente Verificado
                  </span>
                </h2>
                <p className="text-xs text-slate-300 line-clamp-1">
                  Mantenha suas matérias, titulações e dados acadêmicos sempre atualizados
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

          {/* Barra de Progresso da Força do Perfil Docente */}
          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Sparkles size={14} className="text-cyan-300" />
              <span>Força do Perfil Acadêmico:</span>
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

        {/* Barra de Navegação por Abas (Tabs) */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 overflow-x-auto scrollbar-none shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
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
                {tab.badge !== null && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Corpo do Formulário com Scroll e Navegação Suave */}
        <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-left">
          
          {/* ═════════════════════════════════════════════════════════════
              ABA 1: DADOS GERAIS, FOTO & VÍNCULO INSTITUCIONAL
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Foto de Perfil & Avatar */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                    <Camera size={16} className="text-primary-blue dark:text-blue-400" /> Foto do Docente
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                    PNG, JPG ou link web
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative group shrink-0">
                    {editData.avatar && !isGenericPlaceholderAvatar(editData.avatar) ? (
                      <img
                        src={editData.avatar}
                        alt="Pré-visualização"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-blue shadow-md bg-white dark:bg-slate-800"
                      />
                    ) : (
                      <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(editData.name)} text-white font-extrabold text-2xl flex items-center justify-center border-2 border-primary-blue shadow-md`}
                      >
                        {(editData.name || 'P').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                      <Camera size={18} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[240px] space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="btn btn-primary btn-sm text-xs font-bold cursor-pointer inline-flex items-center gap-2 shadow-xs">
                        <Upload size={13} /> Escolher Foto do Computador
                        <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                      </label>
                    </div>

                    <input
                      type="url"
                      value={editData.avatar || ''}
                      onChange={e => setEditData(d => ({ ...d, avatar: e.target.value }))}
                      placeholder="Ou cole a URL direta de uma imagem..."
                      className="form-control text-xs"
                    />
                  </div>
                </div>

                {/* Presets de Foto Acadêmica */}
                <div className="pt-2 border-t border-gray-200/80 dark:border-slate-700/80">
                  <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-2">
                    Ou selecione um avatar acadêmico rápido:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TEACHER_AVATAR_PRESETS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEditData(d => ({ ...d, avatar: url }))}
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          editData.avatar === url
                            ? 'border-primary-blue scale-110 shadow-md ring-2 ring-blue-400/50'
                            : 'border-transparent hover:border-gray-300 dark:hover:border-slate-600 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informações Básicas do Docente */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <User size={13} className="text-primary-blue" /> Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                    placeholder="Ex: Prof. Dr. Carlos Eduardo"
                    className="form-control text-xs font-semibold"
                    maxLength={70}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <MapPin size={13} className="text-primary-blue" /> Cidade Polo de Residência / Atuação *
                  </label>
                  <select
                    value={editData.city || 'Ivaiporã'}
                    onChange={e => setEditData(d => ({ ...d, city: e.target.value }))}
                    className="form-control text-xs font-semibold"
                  >
                    {CITIES.filter(c => c !== 'Todas as Cidades').map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <Building2 size={13} className="text-primary-blue" /> Instituição de Ensino Principal *
                  </label>
                  <input
                    type="text"
                    value={editData.institution || ''}
                    onChange={e => setEditData(d => ({ ...d, institution: e.target.value }))}
                    placeholder="Ex: IFPR Campus Ivaiporã"
                    className="form-control text-xs"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <BookOpen size={13} className="text-primary-blue" /> Área / Especialidade Principal *
                  </label>
                  <input
                    type="text"
                    value={editData.discipline || ''}
                    onChange={e => setEditData(d => ({ ...d, discipline: e.target.value }))}
                    placeholder="Ex: Informática e Engenharia de Software"
                    className="form-control text-xs"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label text-xs font-bold flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-primary-blue" /> Titulação Principal (Exibida no Card) *
                </label>
                <input
                  type="text"
                  value={editData.degree || ''}
                  onChange={e => setEditData(d => ({ ...d, degree: e.target.value }))}
                  placeholder="Ex: Doutor em Ciência da Computação (UFPR)"
                  className="form-control text-xs"
                  required
                />
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              ABA 2: MATÉRIAS & DISCIPLINAS MINISTRADAS
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'classes' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                      <BookOpen size={16} className="text-primary-blue dark:text-blue-400" /> Matérias Ministradas pelo Docente
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Cadastre as disciplinas que você leciona para que seus estudantes possam selecioná-las ao solicitar pareceres.
                    </p>
                  </div>
                  <span className="text-[11px] bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-300 font-bold px-2.5 py-0.5 rounded-full shrink-0">
                    {editData.classes?.length || 0} {editData.classes?.length === 1 ? 'matéria' : 'matérias'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editData.newClass || ''}
                    onChange={e => setEditData(d => ({ ...d, newClass: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addClassItem();
                      }
                    }}
                    placeholder="Digite o nome da disciplina (ex: Banco de Dados)..."
                    className="form-control text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => addClassItem()}
                    className="btn btn-teal btn-sm text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus size={14} /> Adicionar Matéria
                  </button>
                </div>

                {/* Sugestões Rápidas */}
                <div className="pt-2 border-t border-gray-200/80 dark:border-slate-700/80">
                  <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-2">
                    Sugestões rápidas de disciplinas acadêmicas:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DISCIPLINE_SUGGESTIONS.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => addClassItem(sug)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                          (editData.classes || []).includes(sug)
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary-blue'
                        }`}
                      >
                        <Plus size={10} /> {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Matérias Cadastradas */}
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-2">
                    Disciplinas ativas no seu perfil:
                  </div>
                  {(!editData.classes || editData.classes.length === 0) ? (
                    <p className="text-xs text-gray-400 dark:text-slate-500 italic p-3 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-slate-800 text-center">
                      Nenhuma matéria adicionada ainda. Digite o nome acima ou clique nas sugestões para incluir.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {editData.classes.map((cls, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-primary-blue dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 px-3.5 py-1.5 rounded-xl shadow-2xs"
                        >
                          <BookOpen size={13} />
                          <span>{cls}</span>
                          <button
                            type="button"
                            onClick={() => removeClassItem(cls)}
                            className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-900 rounded-md transition-colors text-blue-500 hover:text-red-600 cursor-pointer ml-1"
                            title="Remover matéria"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              ABA 3: FORMAÇÕES ACADÊMICAS & PERÍODO DE ESTUDO
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'education' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Formulário para adicionar nova formação */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 space-y-4">
                <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <GraduationCap size={16} className="text-primary-blue" /> Adicionar Nova Titulação / Formação
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold">Titulação / Curso *</label>
                    <input
                      type="text"
                      value={editData.newEdu?.degree || ''}
                      onChange={e => setEditData(d => ({ ...d, newEdu: { ...d.newEdu, degree: e.target.value } }))}
                      placeholder="Ex: Doutorado em Ciência da Computação"
                      className="form-control text-xs"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs font-bold">Instituição de Ensino *</label>
                    <input
                      type="text"
                      value={editData.newEdu?.institution || ''}
                      onChange={e => setEditData(d => ({ ...d, newEdu: { ...d.newEdu, institution: e.target.value } }))}
                      placeholder="Ex: UFPR - Univ. Federal do Paraná"
                      className="form-control text-xs"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold">Período de Estudo</label>
                  <input
                    type="text"
                    value={editData.newEdu?.period || ''}
                    onChange={e => setEditData(d => ({ ...d, newEdu: { ...d.newEdu, period: e.target.value } }))}
                    placeholder="Ex: 2022 à 2026 (ou Concluído em 2025)"
                    className="form-control text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={addEducationItem}
                  className="btn btn-teal btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={14} /> Adicionar Formação Acadêmica
                </button>
              </div>

              {/* Lista de Formações */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-600 dark:text-slate-400">
                  Formações cadastradas ({editData.education?.length || 0}):
                </div>

                {(!editData.education || editData.education.length === 0) ? (
                  <div className="p-5 text-center bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 text-xs text-gray-500 dark:text-slate-400">
                    Nenhuma titulação cadastrada ainda. Adicione suas graduações, mestrados e doutorados acima.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {editData.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xs text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-extrabold text-gray-900 dark:text-white text-sm">
                            {edu.degree}
                          </div>
                          <div className="flex items-center gap-2 text-primary-blue dark:text-blue-400 font-semibold">
                            <span className="flex items-center gap-1"><Building2 size={12} /> {edu.institution}</span>
                            <span>·</span>
                            <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 text-[11px]">
                              <Calendar size={10} /> {edu.period || edu.year || 'Período Vigente'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEducationItem(idx)}
                          className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Remover Formação"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              ABA 4: BIO ACADÊMICA & ATUAÇÃO
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'bio' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 space-y-4">
                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <Award size={14} className="text-primary-blue" /> Sobre o Docente (Bio Acadêmica)
                  </label>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                    Apresente sua trajetória de ensino, linhas de pesquisa e experiência com orientação de alunos.
                  </p>
                  <textarea
                    value={editData.bio || ''}
                    onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))}
                    className="form-control text-xs leading-relaxed"
                    rows={6}
                    placeholder="Docente na área de Computação no IFPR Campus Ivaiporã, atuando em projetos de pesquisa e desenvolvimento de software..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              ABA 5: REDES, LATTES & CONTATO
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'contact' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 space-y-4">
                <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Globe size={16} className="text-primary-blue" /> Presença Online &amp; Canais Acadêmicos
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <Mail size={13} className="text-primary-blue" /> E-mail Educacional Institucional
                  </label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={e => setEditData(d => ({ ...d, email: e.target.value }))}
                    placeholder="professor@ifpr.edu.br"
                    className="form-control text-xs"
                  />
                  <span className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 block">
                    Utilizado pelos estudantes para direcionar solicitações oficiais de parecer pedagógico.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <Link2 size={13} className="text-primary-blue" /> Link do Currículo Lattes / CNPq
                  </label>
                  <input
                    type="url"
                    value={editData.lattes || ''}
                    onChange={e => setEditData(d => ({ ...d, lattes: e.target.value }))}
                    placeholder="http://lattes.cnpq.br/..."
                    className="form-control text-xs"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <ExternalLink size={13} className="text-primary-blue" /> Perfil no LinkedIn
                  </label>
                  <input
                    type="url"
                    value={editData.linkedin || ''}
                    onChange={e => setEditData(d => ({ ...d, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/seu-perfil"
                    className="form-control text-xs"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <Globe size={13} className="text-primary-blue" /> Sala Virtual / Link de Atendimento (Meet/Teams)
                  </label>
                  <input
                    type="url"
                    value={editData.meetUrl || ''}
                    onChange={e => setEditData(d => ({ ...d, meetUrl: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                    className="form-control text-xs"
                  />
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
              className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={14} /> Salvar Perfil Docente
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
