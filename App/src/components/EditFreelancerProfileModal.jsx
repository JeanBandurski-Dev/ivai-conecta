import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Camera, Upload, Plus, Trash2,
  Globe, Sparkles, Save, User,
  ExternalLink, MapPin, Phone, Wrench,
  CheckCircle2, FileText, Wand2
} from 'lucide-react';
import { CITIES, maskPhone, maskCNPJ } from '../lib/ivaiConecta';
import { validatePhoneNumber } from '../services/jobTaxonomy';

const FREELANCER_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250'
];

const FREELANCER_COVER_PRESETS = [
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200'
];

const SPECIALTY_SUGGESTIONS = [
  'Desenvolvimento Web & Apps',
  'Eletricista Residencial e Predial',
  'Marketing Digital & Tráfego Pago',
  'Design Gráfico & UI/UX',
  'Consultoria Empresarial & Financeira',
  'Fotografia & Produção de Vídeo',
  'Manutenção de Computadores & Redes',
  'Arquitetura & Projetos 3D',
  'Aulas Particulares & Treinamentos',
  'Redação & Criação de Conteúdo'
];

export default function EditFreelancerProfileModal({
  isOpen,
  onClose,
  editData,
  setEditData,
  handleSaveProfile,
  handleAvatarFileChange,
  handleBannerFileChange
}) {
  const [activeTab, setActiveTab] = useState('general');
  const [newSkill, setNewSkill] = useState('');
  const [newProject, setNewProject] = useState({ title: '', description: '', link: '' });

  const completionPercentage = useMemo(() => {
    let score = 0;
    if (editData?.name?.trim()) score += 20;
    if (editData?.specialty?.trim() || editData?.title?.trim()) score += 20;
    if (editData?.city?.trim()) score += 10;
    if (editData?.phone?.trim()) score += 15;
    if (editData?.bio?.trim()) score += 15;
    if (editData?.skills && editData.skills.length > 0) score += 10;
    if (editData?.projects && editData.projects.length > 0) score += 10;
    return Math.min(100, score);
  }, [editData]);

  if (!isOpen) return null;

  const handleAddSkill = (skill) => {
    const val = (skill || newSkill).trim();
    if (!val) return;
    const current = editData?.skills || [];
    if (!current.includes(val)) {
      setEditData(prev => ({ ...prev, skills: [...current, val] }));
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill) => {
    setEditData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(s => s !== skill)
    }));
  };

  const handleAddProject = () => {
    if (!newProject.title.trim()) return;
    setEditData(prev => ({
      ...prev,
      projects: [...(prev.projects || []), { ...newProject, id: `proj_${Date.now()}` }]
    }));
    setNewProject({ title: '', description: '', link: '' });
  };

  const handleRemoveProject = (idx) => {
    setEditData(prev => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== idx)
    }));
  };

  const handleInsertBioTemplate = () => {
    const spec = editData?.specialty || editData?.title || 'serviços profissionais';
    const cty = editData?.city || 'Ivaiporã e Vale do Ivaí';
    const template = `Sou especialista em ${spec}, com atuação em ${cty} e municípios vizinhos.

• Atendimento pontual e transparente com garantia dos serviços executados;
• Ferramentas e metodologias modernas para garantir durabilidade e segurança;
• Experiência sólida atendendo clientes residenciais e comerciais;
• Flexibilidade de horários e facilidade nas formas de pagamento.`;
    setEditData(prev => ({ ...prev, bio: template }));
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-6 border border-gray-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}>
        
        {/* Header Modal */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-teal-300 mb-1">
            <Sparkles size={14} /> Perfil Profissional Freelancer
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading">
            Editar Perfil de Prestador Autônomo
          </h2>
          <p className="text-xs text-blue-200 mt-1 max-w-lg">
            Mantenha suas especialidades, contatos, cidades atendidas no Vale do Ivaí e portfólio atualizados para atrair clientes.
          </p>

          {/* Barra de Progresso do Perfil */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-200">Completude do Perfil:</span>
              <span className="text-xs font-extrabold text-teal-300">{completionPercentage}%</span>
            </div>
            <div className="flex-1 max-w-xs bg-white/15 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-400 to-green-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-primary-blue text-primary-blue dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800'
            }`}
          >
            <User size={14} /> Dados Gerais &amp; Contato
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'skills'
                ? 'border-primary-blue text-primary-blue dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800'
            }`}
          >
            <Wrench size={14} /> Especialidades &amp; Tags
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'portfolio'
                ? 'border-primary-blue text-primary-blue dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800'
            }`}
          >
            <Globe size={14} /> Portfólio &amp; Trabalhos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'media'
                ? 'border-primary-blue text-primary-blue dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800'
            }`}
          >
            <Camera size={14} /> Foto &amp; Capa
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSaveProfile} className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'general' && (
            <div className="space-y-5">
              
              {/* Card 1: Identificação & Especialidade */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200/80 dark:border-slate-700/80 pb-2">
                  <User size={16} className="text-primary-blue dark:text-blue-400" />
                  <h3 className="font-heading font-bold text-sm text-gray-800 dark:text-slate-100">
                    Identificação &amp; Especialidade Principal
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Nome Completo ou Nome Profissional <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editData?.name || ''}
                      onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: João da Silva / Silva Eletricista"
                      className="input w-full text-xs font-semibold rounded-xl"
                      maxLength={70}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Título Profissional / Especialidade Principal <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editData?.specialty || editData?.title || ''}
                      onChange={e => setEditData(prev => ({ ...prev, specialty: e.target.value, title: e.target.value }))}
                      placeholder="Ex: Eletricista Residencial e Predial"
                      className="input w-full text-xs font-semibold rounded-xl"
                    />
                  </div>
                </div>

                {/* Sugestões rápidas de especialidades */}
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 block mb-1.5">
                    Sugestões rápidas (clique para preencher a especialidade):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SPECIALTY_SUGGESTIONS.slice(0, 6).map((sugg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEditData(prev => ({ ...prev, specialty: sugg, title: sugg }))}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer border ${
                          (editData?.specialty === sugg || editData?.title === sugg)
                            ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Apresentação & Bio Profissional */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-slate-700/80 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-teal-600 dark:text-teal-400" />
                    <h3 className="font-heading font-bold text-sm text-gray-800 dark:text-slate-100">
                      Apresentação &amp; Bio Profissional
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleInsertBioTemplate}
                    className="text-[11px] font-bold text-primary-blue hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Preencher com modelo profissional"
                  >
                    <Wand2 size={12} /> Preencher Modelo Profissional
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={editData?.bio || ''}
                    onChange={e => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Descreva sua experiência, diferenciais de atendimento, garantia de serviço e formas de pagamento aceitas..."
                    className="input w-full text-xs rounded-xl resize-none leading-relaxed p-3.5"
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-[11px] font-mono text-gray-400 dark:text-slate-500">
                      {(editData?.bio || '').length}/600 caracteres
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Localização, Contato & Informações Comerciais */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200/80 dark:border-slate-700/80 pb-2">
                  <Phone size={16} className="text-green-600 dark:text-green-400" />
                  <h3 className="font-heading font-bold text-sm text-gray-800 dark:text-slate-100">
                    Localização &amp; Dados Comerciais
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Cidade Base (Polo)
                    </label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <select
                        value={editData?.city || 'Ivaiporã'}
                        onChange={e => setEditData(prev => ({ ...prev, city: e.target.value }))}
                        className="input pl-9 w-full text-xs font-semibold rounded-xl"
                      >
                        {CITIES.filter(c => c !== 'Todas as Cidades').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                        WhatsApp / Contato
                      </label>
                      {editData?.phone && validatePhoneNumber(editData.phone, false).valid && (
                        <span className="text-[10px] text-green-600 dark:text-green-400 font-bold flex items-center gap-0.5">
                          <CheckCircle2 size={11} /> Válido
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={editData?.phone ? maskPhone(editData.phone) : ''}
                        onChange={e => setEditData(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                        placeholder="(43) 99999-0000"
                        className="input pl-9 w-full text-xs font-semibold rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      CNPJ ou MEI (Opcional)
                    </label>
                    <input
                      type="text"
                      value={editData?.cnpj ? maskCNPJ(editData.cnpj) : ''}
                      onChange={e => setEditData(prev => ({ ...prev, cnpj: maskCNPJ(e.target.value) }))}
                      placeholder="00.000.000/0001-00"
                      className="input w-full text-xs font-semibold rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Tempo de Atuação / Experiência
                    </label>
                    <input
                      type="text"
                      value={editData?.experienceYears || ''}
                      onChange={e => setEditData(prev => ({ ...prev, experienceYears: e.target.value }))}
                      placeholder="Ex: 5 anos de experiência no mercado regional"
                      className="input w-full text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                      Disponibilidade para Atendimento
                    </label>
                    <input
                      type="text"
                      value={editData?.availability || ''}
                      onChange={e => setEditData(prev => ({ ...prev, availability: e.target.value }))}
                      placeholder="Ex: De segunda a sábado • Horário comercial"
                      className="input w-full text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Adicionar Competência / Serviço Executado
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                    placeholder="Digite uma habilidade ou serviço (ex: Instalação de Padrão Copel, Figma, React)..."
                    className="input flex-1 text-xs rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill()}
                    className="btn btn-primary btn-sm text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 dark:text-slate-400 block mb-2 font-medium">Sugestões rápidas de especialidades:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALTY_SUGGESTIONS.map(spec => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleAddSkill(spec)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-gray-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 cursor-pointer transition-colors"
                    >
                      + {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                <span className="text-xs font-bold text-gray-800 dark:text-white block mb-2">
                  Suas Habilidades Cadastradas ({editData?.skills?.length || 0}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {(editData?.skills || []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Nenhuma habilidade adicionada ainda.</p>
                  ) : (
                    editData.skills.map(s => (
                      <span
                        key={s}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-primary-blue dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-2"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s)}
                          className="hover:text-red-500 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Plus size={14} className="text-primary-blue" /> Adicionar Novo Item ao Portfólio
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))}
                    placeholder="Título do Projeto ou Trabalho Realizado"
                    className="input text-xs rounded-xl"
                  />
                  <input
                    type="text"
                    value={newProject.link}
                    onChange={e => setNewProject(p => ({ ...p, link: e.target.value }))}
                    placeholder="Link / URL (Website, GitHub, Instagram ou Drive)"
                    className="input text-xs rounded-xl"
                  />
                </div>
                <textarea
                  rows={2}
                  value={newProject.description}
                  onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                  placeholder="Breve descrição do trabalho realizado, materiais ou tecnologias utilizadas..."
                  className="input w-full text-xs rounded-xl resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddProject}
                    disabled={!newProject.title.trim()}
                    className="btn btn-primary btn-sm text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus size={13} /> Incluir Projeto no Portfólio
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-gray-800 dark:text-white block">
                  Projetos do Portfólio ({editData?.projects?.length || 0}):
                </span>
                {(!editData?.projects || editData.projects.length === 0) ? (
                  <p className="text-xs text-gray-400 italic">Nenhum projeto cadastrado no portfólio ainda.</p>
                ) : (
                  <div className="space-y-2.5">
                    {editData.projects.map((proj, idx) => (
                      <div
                        key={proj.id || idx}
                        className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <h5 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-2">
                            {proj.title}
                            {proj.link && (
                              <a
                                href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary-blue hover:underline text-[11px] font-normal flex items-center gap-0.5"
                              >
                                <ExternalLink size={11} /> Acessar Link
                              </a>
                            )}
                          </h5>
                          {proj.description && (
                            <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 leading-relaxed">
                              {proj.description}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(idx)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Remover projeto"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-5">
              {/* Foto de Perfil */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
                  Foto de Perfil do Profissional
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800 border-2 border-primary-blue/30 shrink-0">
                    {editData?.avatar ? (
                      <img src={editData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary-blue font-bold text-lg">
                        {editData?.name?.charAt(0) || 'F'}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="btn btn-outline btn-sm text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                      <Upload size={13} />
                      Carregar Foto do Computador
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                    </label>
                    <span className="text-[11px] text-gray-400 block">Recomendado: imagem quadrada de até 5MB</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] text-gray-400 font-semibold block mb-1.5">Ou escolha um avatar predefinido:</span>
                  <div className="flex gap-2">
                    {FREELANCER_AVATAR_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEditData(prev => ({ ...prev, avatar: preset }))}
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          editData?.avatar === preset ? 'border-primary-blue ring-2 ring-primary-blue/30 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Imagem de Capa */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
                  Banner / Imagem de Capa
                </label>
                <div className="space-y-2">
                  <label className="btn btn-outline btn-sm text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer">
                    <Upload size={13} />
                    Carregar Banner do Computador
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                      onChange={handleBannerFileChange}
                    />
                  </label>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] text-gray-400 font-semibold block mb-1.5">Ou selecione um banner temático:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FREELANCER_COVER_PRESETS.map((cover, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEditData(prev => ({ ...prev, banner: cover }))}
                        className={`h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative ${
                          editData?.banner === cover ? 'border-primary-blue ring-2 ring-primary-blue/30 scale-102' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={cover} alt={`Cover ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-sm text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Save size={14} /> Salvar Perfil Freelancer
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
