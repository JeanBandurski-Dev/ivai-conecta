import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award, Building2, MapPin, CheckCircle2, ShieldCheck,
  Edit3, ArrowLeft, BookOpen, GraduationCap, Users, X, Eye, Plus, Trash2
} from 'lucide-react';
import { getTeacherById, getTeacherEndorsedStudents, updateTeacherProfile } from '../lib/ivaiConecta';
import TalentCard from '../components/TalentCard';
import useAppStore from '../store/useAppStore';

export default function PerfilProfessor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, showToast } = useAppStore();

  const teacherId = id || (currentUser?.role === 'professor' ? (currentUser?.uid || currentUser?.id || 'prof_1') : 'prof_1');
  const teacher = getTeacherById(teacherId);
  const endorsedStudents = getTeacherEndorsedStudents(teacher.email);

  const isOwner = Boolean(
    currentUser && (
      (currentUser.email && teacher.email && currentUser.email.toLowerCase() === teacher.email.toLowerCase()) ||
      (currentUser.uid != null && (String(currentUser.uid) === String(teacher.id) || String(currentUser.uid) === String(teacher.firestoreId))) ||
      (currentUser.id != null && String(currentUser.id) === String(teacher.id))
    )
  );

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students'
  const [editModal, setEditModal] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState({
    name: teacher.name,
    avatar: teacher.avatar,
    degree: teacher.degree || 'Doutor em Ciência da Computação (UFPR)',
    institution: teacher.institution,
    discipline: teacher.discipline,
    bio: teacher.bio || '',
    classes: [...(teacher.classes || [])],
    education: [...(teacher.education || [
      { degree: 'Doutorado em Ciência da Computação', institution: 'Universidade Federal do Paraná (UFPR)', period: '2026 à 2030' },
      { degree: 'Mestrado em Engenharia Elétrica & Computação', institution: 'Universidade Estadual de Londrina (UEL)', period: '2022 à 2025' },
      { degree: 'Bacharelado em Ciência da Computação', institution: 'Universidade Estadual de Maringá (UEM)', period: '2017 à 2021' }
    ])],
    newClass: '',
    newEdu: { degree: '', institution: '', period: '' }
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateTeacherProfile(teacher.id, editData);
    showToast('🎉 Perfil acadêmico e formações atualizados com sucesso!');
    setEditModal(false);
  };

  const addClassItem = () => {
    if (editData.newClass.trim()) {
      setEditData(prev => ({
        ...prev,
        classes: [...prev.classes, prev.newClass.trim()],
        newClass: ''
      }));
    }
  };

  const removeClassItem = (cls) => {
    setEditData(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c !== cls)
    }));
  };

  const addEducationItem = (e) => {
    e.preventDefault();
    if (!editData.newEdu.degree.trim() || !editData.newEdu.institution.trim()) {
      showToast('Preencha a titulação e a instituição.');
      return;
    }
    const item = {
      degree: editData.newEdu.degree.trim(),
      institution: editData.newEdu.institution.trim(),
      period: editData.newEdu.period.trim() || '2026 à 2030'
    };
    setEditData(prev => ({
      ...prev,
      education: [item, ...prev.education],
      newEdu: { degree: '', institution: '', period: '' }
    }));
    showToast('Formação acadêmica adicionada!');
  };

  const removeEducationItem = (idx) => {
    setEditData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx)
    }));
  };

  return (
    <>
      {/* Hero Header */}
      <div className="bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-10 sm:py-12 relative overflow-hidden">
        <div className="container relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white mb-6 bg-white/10 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para a tela anterior
          </button>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-5 sm:gap-6">
              <img
                src={teacher.avatar}
                alt={teacher.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white/30 object-cover shadow-brand-lg shrink-0 bg-white"
              />

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">{teacher.name}</h1>
                  <span className="bg-green-500/20 text-green-300 border border-green-400/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck size={13} /> Docente Verificado
                  </span>
                </div>

                <div className="text-accent-sky font-bold text-base sm:text-lg mb-1">{teacher.degree}</div>

                <div className="flex items-center gap-3 text-gray-300 text-xs sm:text-sm flex-wrap">
                  <span className="flex items-center gap-1.5"><Building2 size={14} />{teacher.institution}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5"><BookOpen size={14} />{teacher.discipline}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5"><Award size={14} className="text-amber-400" />{teacher.endorsementCount || 18} Indicações Concedidas</span>
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setEditModal(true)} className="btn btn-outline border-white/40 text-white font-bold btn-sm shadow-md">
                  <Edit3 size={15} /> Editar Perfil Acadêmico
                </button>
              </div>
            )}
          </div>

          {/* Abas */}
          <div className="flex items-center gap-2 mt-8 border-b border-white/15 pt-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'overview' ? 'border-accent-sky text-white' : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              Visão Geral &amp; Formações
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'students' ? 'border-accent-sky text-white' : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              Alunos Recomendados por este Professor ({endorsedStudents.length})
            </button>
          </div>

        </div>
      </div>

      <main className="container section">

        {/* ── ABA 1: VISÃO GERAL ── */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Coluna Esquerda: Bio e Instituição */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="font-heading font-bold text-primary-dark dark:text-white mb-3 flex items-center gap-2">
                  <BookOpen size={18} className="text-primary-blue dark:text-blue-400" /> Sobre o Docente
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{teacher.bio}</p>
              </div>

              <div className="card">
                <h3 className="font-heading font-bold text-primary-dark dark:text-white mb-3 flex items-center gap-2">
                  <Building2 size={18} className="text-primary-blue dark:text-blue-400" /> Vínculo Institucional
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
                  <div><strong className="text-gray-800 dark:text-white">Instituição:</strong> {teacher.institution}</div>
                  <div><strong className="text-gray-800 dark:text-white">Área / Disciplina:</strong> {teacher.discipline}</div>
                  <div><strong className="text-gray-800 dark:text-white">E-mail Educacional:</strong> {teacher.email}</div>
                  <div className="text-xs bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 p-2 rounded-lg border border-green-200 dark:border-green-800 mt-2 font-medium">
                    ✓ E-mail Educacional Autenticado pelo Sistema
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Formação Acadêmica Múltipla (Titulação - Instituição - Período) */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="card">
                <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white mb-4 flex items-center gap-2">
                  <GraduationCap size={20} className="text-primary-blue dark:text-blue-400" /> Formações Acadêmicas &amp; Período de Estudo
                </h3>

                <div className="space-y-4">
                  {(teacher.education || [
                    { degree: 'Doutorado em Ciência da Computação', institution: 'Universidade Federal do Paraná (UFPR)', period: '2026 à 2030' },
                    { degree: 'Mestrado em Engenharia Elétrica & Computação', institution: 'Universidade Estadual de Londrina (UEL)', period: '2022 à 2025' },
                    { degree: 'Bacharelado em Ciência da Computação', institution: 'Universidade Estadual de Maringá (UEM)', period: '2017 à 2021' }
                  ]).map((edu, idx) => (
                    <div key={idx} className="border-l-3 border-primary-blue pl-4 py-1.5 space-y-1 bg-gray-50/50 dark:bg-slate-800/40 p-3 rounded-r-2xl border-y border-r border-gray-100 dark:border-slate-800">
                      <div className="font-extrabold text-gray-900 dark:text-white text-base">{edu.degree}</div>
                      <div className="text-xs font-bold text-primary-blue dark:text-blue-400 flex items-center justify-between">
                        <span>🏛️ {edu.institution}</span>
                        <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                          🗓️ {edu.period || edu.year || '2026 à 2030'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen size={20} className="text-primary-blue dark:text-blue-400" /> Disciplinas Ministradas &amp; Turmas
                </h3>

                <div className="flex flex-wrap gap-2">
                  {(teacher.classes || ['Programação de Computadores', 'Redes de Computadores']).map((cls, idx) => (
                    <span key={idx} className="tag tag-blue text-xs py-1.5 px-3">
                      📚 {cls}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── ABA 2: ALUNOS RECOMENDADOS ── */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-2xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <Award className="text-amber-400 fill-amber-400" size={24} /> Alunos Recomendados pelo {teacher.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Estudantes que receberam parecer pedagógico com selo verificado concedido por este professor.</p>
            </div>

            {endorsedStudents.length === 0 ? (
              <div className="card text-center py-12 text-gray-400 dark:text-slate-500">
                <Users size={40} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                <p className="font-bold text-gray-600 dark:text-slate-300">Nenhum aluno recomendado ainda.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {endorsedStudents.map(student => (
                  <TalentCard key={student.id} talent={student} />
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Modal: Editar Perfil do Professor */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-xl p-7 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white">Editar Perfil &amp; Formações Acadêmicas</h3>
              <button onClick={() => setEditModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-white" /></button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="form-group">
                <label className="form-label">Link da Foto de Perfil (URL)</label>
                <input
                  type="url"
                  value={editData.avatar}
                  onChange={e => setEditData(d => ({ ...d, avatar: e.target.value }))}
                  className="form-control"
                />
              </div>

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
                <label className="form-label">Titulação Principal (Exibida no Card)</label>
                <input
                  type="text"
                  value={editData.degree}
                  onChange={e => setEditData(d => ({ ...d, degree: e.target.value }))}
                  className="form-control"
                  placeholder="Ex: Doutor em Ciência da Computação (UFPR)"
                  required
                />
              </div>

              {/* Seção de Formações Acadêmicas Múltiplas com Período */}
              <div className="space-y-3 border-t border-b border-gray-100 dark:border-slate-800 py-4">
                <div className="text-sm font-bold text-primary-dark dark:text-white flex items-center gap-1.5">
                  <GraduationCap size={18} className="text-primary-blue" /> Gerenciar Formações Acadêmicas &amp; Período de Estudo
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-3">
                  <div className="text-xs font-bold text-primary-blue dark:text-blue-400">Adicionar Nova Formação</div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editData.newEdu.degree}
                      onChange={e => setEditData(d => ({ ...d, newEdu: { ...d.newEdu, degree: e.target.value } }))}
                      placeholder="Titulação (ex: Doutorado em Ciência da Computação)"
                      className="form-control text-xs"
                    />
                    <input
                      type="text"
                      value={editData.newEdu.institution}
                      onChange={e => setEditData(d => ({ ...d, newEdu: { ...d.newEdu, institution: e.target.value } }))}
                      placeholder="Instituição (ex: UFPR)"
                      className="form-control text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    value={editData.newEdu.period}
                    onChange={e => setEditData(d => ({ ...d, newEdu: { ...d.newEdu, period: e.target.value } }))}
                    placeholder="Período de Estudo (ex: 2026 à 2030)"
                    className="form-control text-xs"
                  />
                  <button type="button" onClick={addEducationItem} className="btn btn-teal btn-sm text-xs font-bold">
                    <Plus size={14} /> Adicionar Formação
                  </button>
                </div>

                {/* Lista de Formações */}
                <div className="space-y-2">
                  {editData.education.map((edu, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
                      <div>
                        <strong className="text-gray-900 dark:text-white">{edu.degree}</strong> — {edu.institution} <span className="text-primary-blue dark:text-blue-400 font-bold">({edu.period || edu.year})</span>
                      </div>
                      <button type="button" onClick={() => removeEducationItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sobre o Docente (Bio Acadêmica)</label>
                <textarea
                  value={editData.bio}
                  onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))}
                  className="form-control"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEditModal(false)} className="btn btn-outline btn-sm font-semibold">Cancelar</button>
                <button type="submit" className="btn btn-primary btn-sm font-bold shadow-md">Salvar Perfil Docente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
