import { useState, useMemo } from 'react';
import {
  X, Camera, Upload, Edit3, Plus, Trash2, Briefcase, GraduationCap,
  Globe, CheckCircle2, Sparkles, Save, FolderGit2, Link2,
  User, Code2, Check, ExternalLink, AlertCircle
} from 'lucide-react';
import { validateSkill } from '../lib/ivaiConecta';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
];

const SKILL_SUGGESTIONS = [
  'React', 'JavaScript', 'Node.js', 'Python', 'TypeScript', 'SQL',
  'Excel Avançado', 'Figma', 'UI/UX Design', 'Gestão Financeira',
  'Atendimento ao Cliente', 'Vendas B2B', 'Marketing Digital',
  'Liderança', 'Comunicação Assertiva', 'Git & GitHub'
];

export default function EditProfileModal({
  isOpen,
  onClose,
  editData,
  setEditData,
  handleSaveProfile,
  handleAvatarFileChange,
  addExperience,
  removeExperience,
  addProject,
  removeProject,
  addEducation,
  removeEducation,
  newExp = { role: '', company: '', period: '', description: '' },
  setNewExp,
  newProj = { title: '', tech: '', link: '', description: '' },
  setNewProj,
  newEdu = { degree: '', institution: '', period: '' },
  setNewEdu
}) {
  const [activeTab, setActiveTab] = useState('general');
  const [skillInputError, setSkillInputError] = useState('');
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(false);

  // Calcula a taxa de completude do perfil em tempo real
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (editData?.name?.trim()) score += 20;
    if (editData?.avatar?.trim()) score += 15;
    if (editData?.city?.trim()) score += 15;
    if (editData?.bio?.trim()) score += 15;
    if (editData?.course?.trim() || editData?.institution?.trim()) score += 15;
    if (editData?.skills && editData.skills.length > 0) score += 10;
    if (editData?.experiences && editData.experiences.length > 0) score += 5;
    if (editData?.linkedin?.trim() || editData?.github?.trim()) score += 5;
    return Math.min(100, score);
  }, [editData]);

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    handleSaveProfile(e);
    onClose();
  };

  const handleAddSkillLocal = (skillToAdd) => {
    const raw = typeof skillToAdd === 'string' ? skillToAdd : editData?.newSkill;
    if (!raw || !raw.trim()) return;
    const sk = raw.trim();
    const val = validateSkill(sk);
    if (!val.valid) {
      setSkillInputError(val.error);
      return;
    }
    setSkillInputError('');
    if (!editData.skills.some(s => s.toLowerCase() === sk.toLowerCase())) {
      setEditData(d => ({ ...d, skills: [...(d.skills || []), sk], newSkill: '' }));
    } else {
      setEditData(d => ({ ...d, newSkill: '' }));
    }
  };

  const handleRemoveSkillLocal = (skToRemove) => {
    setEditData(d => ({ ...d, skills: (d.skills || []).filter(s => s !== skToRemove) }));
  };

  const TABS = [
    { id: 'general', label: 'Dados Gerais', icon: User, badge: null },
    { id: 'experience', label: 'Experiências', icon: Briefcase, badge: editData?.experiences?.length || null },
    { id: 'projects', label: 'Projetos', icon: FolderGit2, badge: editData?.projects?.length || null },
    { id: 'skills', label: 'Habilidades', icon: Sparkles, badge: editData?.skills?.length || null },
    { id: 'links', label: 'Redes & Contato', icon: Globe, badge: null }
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
                <Edit3 size={22} className="text-cyan-300" />
              </div>
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Editar Meu Perfil Profissional</span>
                  <span className="text-[10px] uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded-full text-cyan-200 font-bold hidden sm:inline-block">
                    Padrão Gupy
                  </span>
                </h2>
                <p className="text-xs text-slate-300 line-clamp-1">
                  Mantenha suas informações sempre atualizadas para aumentar suas chances de match com vagas
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 border border-white/10 hover:scale-105 active:scale-95"
              title="Fechar Janela"
            >
              <X size={18} />
            </button>
          </div>

          {/* Barra de Progresso de Completude do Perfil */}
          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Sparkles size={14} className="text-cyan-300" />
              <span>Força do Perfil:</span>
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
              ABA 1: DADOS GERAIS, FOTO & CURSO
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Foto de Perfil & Avatar */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                    <Camera size={16} className="text-primary-blue dark:text-blue-400" /> Foto de Perfil
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                    PNG, JPG ou link web
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative group shrink-0">
                    <img
                      src={editData.avatar || AVATAR_PRESETS[0]}
                      alt="Pré-visualização"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-blue shadow-md bg-white dark:bg-slate-800"
                    />
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

                {/* Presets de Foto */}
                <div className="pt-2 border-t border-gray-200/80 dark:border-slate-700/80">
                  <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-2">
                    Ou selecione um avatar rápido:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_PRESETS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEditData(d => ({ ...d, avatar: url }))}
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          editData.avatar === url
                            ? 'border-primary-blue scale-110 shadow-md ring-2 ring-blue-400/50'
                            : 'border-transparent opacity-75 hover:opacity-100 hover:scale-105'
                        }`}
                      >
                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informações Básicas */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label text-xs font-bold">Nome Completo *</label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                    className="form-control text-xs sm:text-sm font-semibold"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold">Cidade Polo de Residência *</label>
                  <input
                    type="text"
                    value={editData.city || ''}
                    onChange={e => setEditData(d => ({ ...d, city: e.target.value }))}
                    className="form-control text-xs sm:text-sm font-semibold"
                    placeholder="Ex: Ivaiporã, PR"
                    required
                  />
                </div>
              </div>

              {/* Curso & Instituição */}
              <div className="grid sm:grid-cols-3 gap-3.5">
                <div className="form-group sm:col-span-2">
                  <label className="form-label text-xs font-bold flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-primary-blue" /> Curso ou Formação Principal
                  </label>
                  <input
                    type="text"
                    value={editData.course || ''}
                    onChange={e => setEditData(d => ({ ...d, course: e.target.value }))}
                    className="form-control text-xs sm:text-sm"
                    placeholder="Ex: Análise e Desenvolvimento de Sistemas"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold">Período / Semestre</label>
                  <input
                    type="text"
                    value={editData.period || ''}
                    onChange={e => setEditData(d => ({ ...d, period: e.target.value }))}
                    className="form-control text-xs sm:text-sm"
                    placeholder="Ex: 4º Semestre"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label text-xs font-bold">Instituição de Ensino / Faculdade</label>
                <input
                  type="text"
                  value={editData.institution || ''}
                  onChange={e => setEditData(d => ({ ...d, institution: e.target.value }))}
                  className="form-control text-xs sm:text-sm"
                  placeholder="Ex: IFPR Campus Ivaiporã, UNIVALE, UENP..."
                />
              </div>

              {/* Bio / Resumo */}
              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label text-xs font-bold mb-0">Resumo Profissional / Apresentação</label>
                  <span className="text-[11px] text-gray-400">
                    {(editData.bio || '').length} caracteres
                  </span>
                </div>
                <textarea
                  value={editData.bio || ''}
                  onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))}
                  className="form-control text-xs sm:text-sm leading-relaxed"
                  rows={4}
                  placeholder="Conte um pouco sobre seus objetivos, principais competências e o que você busca na sua carreira..."
                />
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              ABA 2: EXPERIÊNCIAS PROFISSIONAIS (ESTILO GUPY / LINKEDIN)
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'experience' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Card de Adição de Nova Experiência */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-700 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Plus size={15} className="text-primary-blue" /> Adicionar Experiência Profissional
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-primary-blue dark:text-blue-300 px-2 py-0.5 rounded-md">
                    Histórico
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 block mb-1">Cargo / Função *</label>
                    <input
                      type="text"
                      value={newExp?.role || ''}
                      onChange={e => setNewExp(d => ({ ...d, role: e.target.value }))}
                      placeholder="Ex: Desenvolvedor Front-end, Auxiliar de TI"
                      className="form-control text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 block mb-1">Empresa / Organização *</label>
                    <input
                      type="text"
                      value={newExp?.company || ''}
                      onChange={e => setNewExp(d => ({ ...d, company: e.target.value }))}
                      placeholder="Ex: Empresa X, Prefeitura de Ivaiporã"
                      className="form-control text-xs"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 block mb-1">Período de Atuação</label>
                    <input
                      type="text"
                      value={newExp?.period || ''}
                      onChange={e => setNewExp(d => ({ ...d, period: e.target.value }))}
                      placeholder={isCurrentlyWorking ? 'Jan/2024 - Atual' : 'Jan/2023 - Dez/2024'}
                      className="form-control text-xs"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isCurrentlyWorking}
                        onChange={e => {
                          setIsCurrentlyWorking(e.target.checked);
                          if (e.target.checked && setNewExp) {
                            setNewExp(d => ({ ...d, period: (d.period || '').replace(/-.*/, '- Atual') || '2025 - Atual' }));
                          }
                        }}
                        className="rounded text-primary-blue focus:ring-primary-blue"
                      />
                      <span>Trabalho atualmente aqui</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 block mb-1">Principais Atividades e Resultados</label>
                  <textarea
                    value={newExp?.description || ''}
                    onChange={e => setNewExp(d => ({ ...d, description: e.target.value }))}
                    placeholder="Descreva as tecnologias utilizadas, rotinas de trabalho e conquistas no cargo..."
                    className="form-control text-xs"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={addExperience}
                    className="btn btn-teal btn-sm text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-[1.02] active:scale-95"
                  >
                    <Plus size={14} /> Incluir Experiência
                  </button>
                </div>
              </div>

              {/* Lista de Experiências Cadastradas */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-800 dark:text-slate-200">
                  Experiências no Currículo ({editData?.experiences?.length || 0})
                </div>

                {editData?.experiences && editData.experiences.length > 0 ? (
                  <div className="space-y-2.5">
                    {editData.experiences.map((exp, idx) => (
                      <div
                        key={exp.id || idx}
                        className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex items-start justify-between gap-3 shadow-2xs hover:border-primary-blue/50 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Briefcase size={16} />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="font-extrabold text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                              {exp.role}
                            </div>
                            <div className="text-xs text-primary-blue dark:text-blue-400 font-semibold flex items-center gap-2">
                              <span>{exp.company}</span>
                              <span className="text-gray-300 dark:text-slate-600">•</span>
                              <span className="text-gray-500 dark:text-slate-400 font-normal">{exp.period}</span>
                            </div>
                            {exp.description && (
                              <p className="text-xs text-gray-600 dark:text-slate-300 pt-1 leading-relaxed">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeExperience(exp.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Excluir experiência"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-gray-400 text-xs">
                    Nenhuma experiência profissional cadastrada ainda. Se for seu primeiro emprego, você pode deixar em branco ou destacar projetos acadêmicos na aba Projetos!
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              ABA 3: PROJETOS & PORTFÓLIO PRÁTICO
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'projects' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Formulário para Cadastrar Novo Projeto */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-700 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <FolderGit2 size={15} className="text-primary-blue" /> Cadastrar Projeto / Portfólio
                  </span>
                  <span className="text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded-md">
                    Destaque
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 block mb-1">Título do Projeto *</label>
                    <input
                      type="text"
                      value={newProj?.title || ''}
                      onChange={e => setNewProj(d => ({ ...d, title: e.target.value }))}
                      placeholder="Ex: App de Gestão de Vagas, E-commerce em React"
                      className="form-control text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 block mb-1">Tecnologias Utilizadas</label>
                    <input
                      type="text"
                      value={newProj?.tech || ''}
                      onChange={e => setNewProj(d => ({ ...d, tech: e.target.value }))}
                      placeholder="Ex: React, Node.js, Tailwind CSS"
                      className="form-control text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 block mb-1">Link do Projeto / GitHub (Opcional)</label>
                  <input
                    type="url"
                    value={newProj?.link || ''}
                    onChange={e => setNewProj(d => ({ ...d, link: e.target.value }))}
                    placeholder="https://github.com/seu-usuario/projeto ou link do deploy"
                    className="form-control text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 block mb-1">Descrição Breve do Projeto</label>
                  <textarea
                    value={newProj?.description || ''}
                    onChange={e => setNewProj(d => ({ ...d, description: e.target.value }))}
                    placeholder="Qual problema o projeto resolveu e qual foi o seu papel..."
                    className="form-control text-xs"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={addProject}
                    className="btn btn-teal btn-sm text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-[1.02] active:scale-95"
                  >
                    <Plus size={14} /> Incluir Projeto
                  </button>
                </div>
              </div>

              {/* Lista de Projetos */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-800 dark:text-slate-200">
                  Projetos no Portfólio ({editData?.projects?.length || 0})
                </div>

                {editData?.projects && editData.projects.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {editData.projects.map((proj, idx) => (
                      <div
                        key={proj.id || idx}
                        className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-2 relative group shadow-2xs hover:border-primary-blue/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-extrabold text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                            {proj.title}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProject(proj.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Remover Projeto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {proj.tech && (
                          <div className="text-[11px] font-semibold text-primary-blue dark:text-blue-400 truncate">
                            🛠 {proj.tech}
                          </div>
                        )}

                        {proj.description && (
                          <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {proj.description}
                          </p>
                        )}

                        {proj.link && (
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline pt-1"
                          >
                            <ExternalLink size={12} /> Ver projeto
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-gray-400 text-xs">
                    Nenhum projeto cadastrado no portfólio. Projetos práticos chamam muita atenção de recrutadores!
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              ABA 4: COMPETÊNCIAS & HABILIDADES
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'skills' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Campo para Adicionar Habilidade */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-primary-blue" /> Digite uma Competência ou Ferramenta
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editData?.newSkill || ''}
                    onChange={e => {
                      setSkillInputError('');
                      setEditData(d => ({ ...d, newSkill: e.target.value }));
                    }}
                    placeholder="Ex: React, Vendas B2B, Excel, Python..."
                    className="form-control text-xs sm:text-sm flex-1"
                    onKeyDown={e => { if (e.key === 'Enter') handleAddSkillLocal(); }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkillLocal()}
                    className="btn btn-primary btn-sm text-xs font-bold shrink-0 flex items-center gap-1.5 px-4 shadow-xs cursor-pointer"
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>

                {skillInputError && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} /> {skillInputError}
                  </p>
                )}
              </div>

              {/* Habilidades Selecionadas */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-gray-200/90 dark:border-slate-800">
                <div className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Habilidades no seu Perfil ({editData?.skills?.length || 0})</span>
                  <span className="text-[11px] text-gray-400">Clique no X para remover</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 min-h-[48px] items-center">
                  {editData?.skills && editData.skills.length > 0 ? (
                    editData.skills.map(sk => (
                      <span
                        key={sk}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 text-primary-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs font-bold shadow-2xs group hover:border-red-300 transition-colors"
                      >
                        <span>{sk}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkillLocal(sk)}
                          className="text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                          title="Remover"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      Nenhuma habilidade adicionada ainda. Adicione as tecnologias e competências que você domina!
                    </span>
                  )}
                </div>
              </div>

              {/* Sugestões Rápidas de Habilidades */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" /> Sugestões em alta no mercado do Vale do Ivaí:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SKILL_SUGGESTIONS.filter(s => !editData?.skills?.some(item => item.toLowerCase() === s.toLowerCase())).map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddSkillLocal(sug)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-primary-blue hover:text-white dark:hover:bg-blue-600 transition-all cursor-pointer border border-gray-200 dark:border-slate-700 flex items-center gap-1 active:scale-95"
                    >
                      <Plus size={11} /> {sug}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              ABA 5: REDES SOCIAIS & LINKS EXTERNOS
          ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'links' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2.5">
                <Globe size={18} className="text-primary-blue shrink-0" />
                <span>
                  Perfis com links para <strong>LinkedIn</strong> e <strong>GitHub</strong> recebem até 3x mais visualizações de recrutadores e empresas parceiras.
                </span>
              </div>

              {/* LinkedIn */}
              <div className="form-group">
                <label className="form-label text-xs font-bold flex items-center gap-2">
                  <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/>
                  </svg>
                  Link do Perfil no LinkedIn
                </label>
                <input
                  type="url"
                  value={editData?.linkedin || ''}
                  onChange={e => setEditData(d => ({ ...d, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/in/seu-perfil"
                  className="form-control text-xs sm:text-sm"
                />
              </div>

              {/* GitHub */}
              <div className="form-group">
                <label className="form-label text-xs font-bold flex items-center gap-2">
                  <svg className="w-4 h-4 fill-current text-gray-800 dark:text-white" viewBox="0 0 24 24">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                  </svg>
                  Link do Perfil no GitHub / Portfólio
                </label>
                <input
                  type="url"
                  value={editData?.github || ''}
                  onChange={e => setEditData(d => ({ ...d, github: e.target.value }))}
                  placeholder="https://github.com/seu-usuario"
                  className="form-control text-xs sm:text-sm"
                />
              </div>

            </div>
          )}

          {/* Rodapé Fixo de Ações do Modal com Botões Estilizados */}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-gray-400 hidden sm:block">
              * Alterações são salvas em tempo real no seu perfil
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline btn-sm font-bold text-xs px-4 py-2 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm font-extrabold text-xs px-6 py-2.5 flex items-center gap-2 shadow-brand-sm hover:shadow-brand-md cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <Save size={15} /> Salvar Perfil Completo
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
