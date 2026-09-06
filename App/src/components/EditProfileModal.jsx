import { useState } from 'react';
import {
  X, Camera, Upload, Edit3, Plus, Trash2, Briefcase, GraduationCap,
  Globe, CheckCircle2, Sparkles
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
  newExp,
  setNewExp,
  newProj,
  setNewProj,
  newEdu,
  setNewEdu
}) {
  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    handleSaveProfile(e);
    onClose();
  };

  const handleAddSkillLocal = (e) => {
    if (e) e.preventDefault();
    if (!editData.newSkill || !editData.newSkill.trim()) return;
    const sk = editData.newSkill.trim();
    const val = validateSkill(sk);
    if (!val.valid) {
      alert(val.error);
      return;
    }
    if (!editData.skills.some(s => s.toLowerCase() === sk.toLowerCase())) {
      setEditData(d => ({ ...d, skills: [...d.skills, sk], newSkill: '' }));
    } else {
      setEditData(d => ({ ...d, newSkill: '' }));
    }
  };

  const handleRemoveSkillLocal = (skToRemove) => {
    setEditData(d => ({ ...d, skills: d.skills.filter(s => s !== skToRemove) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho do Modal Estilo Gupy */}
        <div className="bg-gradient-to-r from-primary-dark via-blue-900 to-primary-blue text-white p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <Edit3 size={22} className="text-amber-300" />
            </div>
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold">Editar Meu Perfil &amp; Currículo</h2>
              <p className="text-xs text-blue-200">Atualize suas experiências profissionais, foto e competências estilo Gupy</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="Fechar Janela"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Formulário com Scroll */}
        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1 space-y-8 text-left">
          
          {/* 1. Foto de Perfil (Avatar) */}
          <section className="space-y-4 bg-blue-50/50 dark:bg-slate-800/40 p-5 rounded-2xl border border-blue-100 dark:border-slate-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Camera size={18} className="text-primary-blue dark:text-blue-400" /> 1. Alterar Foto de Perfil
            </h3>

            <div className="flex flex-wrap items-center gap-5">
              <img
                src={editData.avatar}
                alt="Pré-visualização da foto"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-blue shadow-md bg-white shrink-0"
              />

              <div className="flex-1 min-w-[240px] space-y-2">
                <label className="btn btn-primary btn-sm text-xs font-bold cursor-pointer inline-flex items-center gap-2">
                  <Upload size={14} /> Escolher Foto dos Arquivos do Computador
                  <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                </label>

                <input
                  type="url"
                  value={editData.avatar}
                  onChange={e => setEditData(d => ({ ...d, avatar: e.target.value }))}
                  placeholder="Ou colar link/URL da imagem na web..."
                  className="form-control text-xs"
                />
              </div>
            </div>

            {/* Presets de foto rápida */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-2">Ou escolha uma foto de modelo para teste rápido:</div>
              <div className="flex flex-wrap gap-2.5">
                {AVATAR_PRESETS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEditData(d => ({ ...d, avatar: url }))}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      editData.avatar === url ? 'border-primary-blue scale-110 shadow-md ring-2 ring-blue-400/50' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 2. Informações Acadêmicas e Pessoais */}
          <section className="space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <GraduationCap size={18} className="text-primary-blue dark:text-blue-400" /> 2. Informações Gerais &amp; Curso
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cidade de Residência</label>
                <input
                  type="text"
                  value={editData.city}
                  onChange={e => setEditData(d => ({ ...d, city: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Curso ou Formação Principal</label>
                <input
                  type="text"
                  value={editData.course}
                  onChange={e => setEditData(d => ({ ...d, course: e.target.value }))}
                  className="form-control"
                  placeholder="Ex: Análise e Desenvolvimento de Sistemas"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instituição de Ensino / Escola</label>
                <input
                  type="text"
                  value={editData.institution}
                  onChange={e => setEditData(d => ({ ...d, institution: e.target.value }))}
                  className="form-control"
                  placeholder="Ex: IFPR Campus Ivaiporã, Univale, UENP..."
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Período / Semestre</label>
              <input
                type="text"
                value={editData.period}
                onChange={e => setEditData(d => ({ ...d, period: e.target.value }))}
                className="form-control"
                placeholder="Ex: 3º Semestre / Noturno"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Resumo Profissional / Bio</label>
              <textarea
                value={editData.bio}
                onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))}
                className="form-control"
                rows={3}
                placeholder="Apresente um resumo da sua trajetória, objetivos de carreira e principais realizações..."
              />
            </div>
          </section>

          {/* 3. Onde já trabalhou (Experiências Profissionais Estilo Gupy) */}
          <section className="space-y-4 bg-gray-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Briefcase size={18} className="text-primary-blue dark:text-blue-400" /> 3. Experiências Profissionais (Onde já trabalhou)
              </h3>
              <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-bold">Estilo Gupy</span>
            </div>

            {/* Formulário para adicionar nova experiência */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
              <div className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                <Plus size={14} className="text-primary-blue" /> Cadastrar Nova Experiência Profissional
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newExp.role}
                  onChange={e => setNewExp(d => ({ ...d, role: e.target.value }))}
                  placeholder="Cargo (Ex: Estagiário de TI, Auxiliar Financeiro)"
                  className="form-control text-xs"
                />
                <input
                  type="text"
                  value={newExp.company}
                  onChange={e => setNewExp(d => ({ ...d, company: e.target.value }))}
                  placeholder="Empresa (Ex: Prefeitura de Ivaiporã, Empresa X)"
                  className="form-control text-xs"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newExp.period}
                  onChange={e => setNewExp(d => ({ ...d, period: e.target.value }))}
                  placeholder="Período (Ex: Jan/2024 - Atual)"
                  className="form-control text-xs"
                />
                <button
                  type="button"
                  onClick={addExperience}
                  className="btn btn-teal btn-sm text-xs font-bold w-full flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Adicionar Esta Experiência
                </button>
              </div>

              <textarea
                value={newExp.description}
                onChange={e => setNewExp(d => ({ ...d, description: e.target.value }))}
                placeholder="Principais responsabilidades, ferramentas utilizadas e resultados obtidos..."
                className="form-control text-xs"
                rows={2}
              />
            </div>

            {/* Lista de Experiências Existentes */}
            {editData.experiences && editData.experiences.length > 0 ? (
              <div className="space-y-3 pt-1">
                {editData.experiences.map((exp, idx) => (
                  <div key={exp.id || idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{exp.role}</div>
                      <div className="text-xs text-primary-blue dark:text-blue-400 font-semibold">{exp.company} · {exp.period}</div>
                      {exp.description && <div className="text-xs text-gray-600 dark:text-slate-400 pt-1">{exp.description}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Excluir experiência"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-slate-400 italic text-center py-2">Nenhuma experiência cadastrada ainda. Utilize o formulário acima para adicionar!</div>
            )}
          </section>

          {/* 4. Habilidades & Tecnologias */}
          <section className="space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Sparkles size={18} className="text-primary-blue dark:text-blue-400" /> 4. Habilidades Técnicas &amp; Competências
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={editData.newSkill || ''}
                onChange={e => setEditData(d => ({ ...d, newSkill: e.target.value }))}
                placeholder="Digite uma nova habilidade (Ex: Gestão Financeira, React, Excel)..."
                className="form-control text-xs flex-1"
                onKeyDown={e => { if (e.key === 'Enter') handleAddSkillLocal(e); }}
              />
              <button
                type="button"
                onClick={handleAddSkillLocal}
                className="btn btn-primary btn-sm text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {editData.skills?.map(sk => (
                <span key={sk} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full text-xs font-bold">
                  {sk}
                  <button type="button" onClick={() => handleRemoveSkillLocal(sk)} className="hover:text-red-500 transition-colors cursor-pointer">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </section>

          {/* 5. Redes Sociais (LinkedIn e GitHub) */}
          <section className="space-y-4 bg-blue-50/50 dark:bg-slate-800/40 p-5 rounded-2xl border border-blue-100 dark:border-slate-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Globe size={18} className="text-primary-blue dark:text-blue-400" /> 5. Redes Sociais &amp; Portfólio (LinkedIn &amp; GitHub)
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label text-xs font-bold flex items-center gap-1.5">
                  <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/></svg>
                  Link do Perfil no LinkedIn
                </label>
                <input
                  type="url"
                  value={editData.linkedin}
                  onChange={e => setEditData(d => ({ ...d, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/in/seu-perfil"
                  className="form-control text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label text-xs font-bold flex items-center gap-1.5">
                  <svg className="w-4 h-4 fill-current text-gray-800 dark:text-white" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
                  Link do Perfil no GitHub
                </label>
                <input
                  type="url"
                  value={editData.github}
                  onChange={e => setEditData(d => ({ ...d, github: e.target.value }))}
                  placeholder="https://github.com/seu-usuario"
                  className="form-control text-xs"
                />
              </div>
            </div>
          </section>

          {/* Rodapé Fixo de Ações do Modal */}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-sm font-bold text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm font-extrabold text-xs px-6 py-2.5 flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <CheckCircle2 size={16} /> 💾 Salvar Perfil &amp; Currículo Agora
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
