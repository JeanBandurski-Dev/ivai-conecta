import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  GraduationCap, Building2, MapPin, Award, CheckCircle, ShieldCheck,
  Send, Edit3, ArrowLeft, Plus, X, Sparkles, BookOpen, Briefcase, FolderKanban,
  Lock, AlertCircle, Globe, Printer, Trash2, ExternalLink, Camera, Upload, MessageSquare
} from 'lucide-react';
import { getTalentById, requestTeacherEndorsement, updateTalentProfile, proactiveEndorseStudent, uploadUserProfilePicture, validateSkill } from '../lib/ivaiConecta';
import ResumePDFModal from '../components/ResumePDFModal';
import EditProfileModal from '../components/EditProfileModal';
import useAppStore from '../store/useAppStore';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
];

export default function PerfilAluno() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, showToast, startChatWith } = useAppStore();

  const talentId = id || currentUser?.uid || currentUser?.id;
  const talent = getTalentById(talentId) || (currentUser ? {
    id: currentUser.uid || currentUser.id,
    firestoreId: currentUser.uid || currentUser.id,
    name: currentUser.name || 'Estudante / Profissional',
    course: currentUser.course || (currentUser.role === 'aluno' ? 'Graduação / Ensino Técnico' : 'Profissional'),
    institution: currentUser.institution || 'IFPR Campus Ivaiporã',
    period: currentUser.period || 'Em andamento',
    city: currentUser.city || 'Ivaiporã',
    avatar: currentUser.avatar || '',
    skills: currentUser.skills || [],
    isVerifiedStudent: currentUser.isVerifiedStudent ?? (currentUser.role === 'aluno' ? false : true),
    raNumber: currentUser.raNumber || '',
    linkedin: currentUser.linkedin || '',
    github: currentUser.github || '',
    bio: currentUser.bio || '',
    experiences: currentUser.experiences || [],
    projects: currentUser.projects || [],
    education: currentUser.education || [],
    endorsements: currentUser.endorsements || []
  } : null);

  // Permissão estrita do proprietário: id, uid, e-mail ou nome correspondente entre o usuário logado e o perfil
  const isOwner = Boolean(
    currentUser && talent && (
      (currentUser.id != null && talent.id != null && String(currentUser.id) === String(talent.id)) ||
      (currentUser.uid != null && (String(currentUser.uid) === String(talent.id) || String(currentUser.uid) === String(talent.firestoreId) || String(currentUser.uid) === String(talent.uid))) ||
      (currentUser.email && talent.email && currentUser.email.toLowerCase() === talent.email.toLowerCase()) ||
      (currentUser.name && talent.name && currentUser.name.trim().toLowerCase() === talent.name.trim().toLowerCase())
    )
  );

  const isProfessor = currentUser?.role === 'professor';

  const [activeTab, setActiveTab] = useState('overview');
  const [editModalOpen, setEditModalOpen] = useState(Boolean(searchParams.get('tab') === 'edit' || searchParams.get('edit') === 'true'));

  useEffect(() => {
    if (searchParams.get('tab') === 'edit' || searchParams.get('edit') === 'true') {
      setEditModalOpen(true);
    }
  }, [searchParams]);

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    if (searchParams.get('tab') || searchParams.get('edit')) {
      navigate(window.location.pathname, { replace: true });
    }
  };

  const [requestModal, setRequestModal] = useState(false);
  const [proactiveEndorseModal, setProactiveEndorseModal] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  // Form for proactive endorsement by teacher
  const [proactiveQuote, setProactiveQuote] = useState('');
  const [proactiveDiscipline, setProactiveDiscipline] = useState(currentUser?.discipline || 'Programação de Computadores');

  const [requestForm, setRequestForm] = useState({ profName: '', profEmail: '', discipline: '', message: '' });
  const [error, setError] = useState('');

  // Comprehensive edit form state
  const [editData, setEditData] = useState({
    name: talent?.name || '',
    avatar: talent?.avatar || '',
    city: talent?.city || 'Ivaiporã',
    institution: talent?.institution || '',
    course: talent?.course || '',
    period: talent?.period || '',
    bio: talent?.bio || '',
    linkedin: talent?.linkedin || '',
    github: talent?.github || '',
    skills: [...(talent?.skills || [])],
    experiences: [...(talent?.experiences || [])],
    projects: [...(talent?.projects || [])],
    education: [...(talent?.education || [])],
    newSkill: ''
  });

  // Forms to add new experience, project, and education
  const [newExp, setNewExp] = useState({ role: '', company: '', period: '', description: '' });
  const [newProj, setNewProj] = useState({ title: '', tech: '', link: '', description: '' });
  const [newEdu, setNewEdu] = useState({ degree: '', institution: '', period: '' });

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!requestForm.profEmail.toLowerCase().includes('@')) {
      setError('Por favor, informe um e-mail educacional válido.');
      return;
    }
    setError('');
    requestTeacherEndorsement(requestForm.profEmail, requestForm.profName, requestForm.discipline, currentUser);
    setRequestModal(false);
    showToast(`Solicitação enviada para o professor ${requestForm.profName}!`);
    setRequestForm({ profName: '', profEmail: '', discipline: '', message: '' });
  };

  const handleProactiveEndorseSubmit = (e) => {
    e.preventDefault();
    const res = proactiveEndorseStudent(talent.id, currentUser, proactiveQuote, proactiveDiscipline);
    if (res.success) {
      showToast(`🎉 Recomendação concedida com sucesso para ${talent.name}!`);
      setProactiveEndorseModal(false);
      setProactiveQuote('');
    } else {
      showToast(res.error);
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast('⏳ Enviando foto para o Firebase Storage...');
      const res = await uploadUserProfilePicture(file, currentUser?.uid || talent?.id);
      if (res.success) {
        setEditData(d => ({ ...d, avatar: res.url }));
        showToast('📸 Foto de perfil salva na nuvem com sucesso!');
      } else {
        showToast(`⚠️ ${res.error || 'Erro ao enviar foto.'}`);
      }
    }
  };

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    const updated = updateTalentProfile(talent.id, editData);

    // If owner is currently logged in, update app store state
    if (isOwner && currentUser) {
      setCurrentUser({
        ...currentUser,
        name: editData.name,
        avatar: editData.avatar,
        city: editData.city,
        course: editData.course,
        institution: editData.institution,
        period: editData.period,
        bio: editData.bio,
        skills: editData.skills,
        experiences: editData.experiences,
        projects: editData.projects,
        education: editData.education,
        linkedin: editData.linkedin,
        github: editData.github,
      });
    }

    showToast('🎉 Foto de perfil, currículo e redes sociais salvos com sucesso!');
    handleCloseEditModal();
  };

  const addEducation = (e) => {
    if (e) e.preventDefault();
    if (!newEdu.degree.trim() || !newEdu.institution.trim()) {
      showToast('Preencha o curso/titulação e a instituição.');
      return;
    }
    const eduItem = {
      id: `edu_${Date.now()}`,
      degree: newEdu.degree.trim(),
      institution: newEdu.institution.trim(),
      period: newEdu.period.trim() || 'Concluído'
    };
    setEditData(prev => ({ ...prev, education: [eduItem, ...(prev.education || [])] }));
    setNewEdu({ degree: '', institution: '', period: '' });
    showToast('Formação acadêmica adicionada!');
  };

  const removeEducation = (eduId) => {
    setEditData(prev => ({ ...prev, education: (prev.education || []).filter(e => e.id !== eduId && String(e.id) !== String(eduId)) }));
  };

  const addSkill = () => {
    const sk = (editData.newSkill || '').trim();
    if (sk) {
      const val = validateSkill(sk);
      if (!val.valid) {
        showToast(`⚠️ ${val.error}`);
        return;
      }
      if (!editData.skills.some(s => s.toLowerCase() === sk.toLowerCase())) {
        setEditData(prev => ({
          ...prev,
          skills: [...prev.skills, sk],
          newSkill: ''
        }));
      } else {
        showToast('Esta habilidade já foi adicionada.');
      }
    }
  };

  const removeSkill = (sk) => {
    setEditData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== sk)
    }));
  };

  const addExperience = (e) => {
    e.preventDefault();
    if (!newExp.role.trim() || !newExp.company.trim()) {
      showToast('Preencha o cargo e a empresa.');
      return;
    }
    const expItem = {
      id: `exp_${Date.now()}`,
      role: newExp.role.trim(),
      company: newExp.company.trim(),
      period: newExp.period.trim() || '2025 - Atual',
      description: newExp.description.trim() || 'Atuação direta na área.'
    };
    setEditData(prev => ({ ...prev, experiences: [expItem, ...prev.experiences] }));
    setNewExp({ role: '', company: '', period: '', description: '' });
    showToast('Experiência adicionada à lista!');
  };

  const removeExperience = (expId) => {
    setEditData(prev => ({ ...prev, experiences: prev.experiences.filter(e => e.id !== expId) }));
  };

  const addProject = (e) => {
    e.preventDefault();
    if (!newProj.title.trim()) {
      showToast('Preencha o título do projeto.');
      return;
    }
    const projItem = {
      id: `proj_${Date.now()}`,
      title: newProj.title.trim(),
      tech: newProj.tech.trim() || 'React, Node.js',
      link: newProj.link.trim() || '',
      description: newProj.description.trim() || 'Projeto prático desenvolvido durante a graduação.'
    };
    setEditData(prev => ({ ...prev, projects: [projItem, ...prev.projects] }));
    setNewProj({ title: '', tech: '', link: '', description: '' });
    showToast('Projeto adicionado à lista!');
  };

  const removeProject = (projId) => {
    setEditData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== projId) }));
  };

  return (
    <>
      {/* Alerta de Perfil Não Verificado para o próprio aluno */}
      {isOwner && !currentUser?.isVerifiedStudent && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 py-3 px-4 text-xs sm:text-sm">
          <div className="container flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 font-semibold">
              <Lock size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Seu perfil está <strong>INVISÍVEL</strong> para recrutadores. Envie sua Declaração de Matrícula para liberar candidaturas e o Selo Verificado.
              </span>
            </div>
            <Link to="/configuracoes" className="btn btn-primary btn-sm text-xs font-bold shrink-0">
              Enviar Comprovante de Matrícula →
            </Link>
          </div>
        </div>
      )}

      {/* Hero / Header do Perfil Gupy */}
      <div className="bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-10 sm:py-12 relative overflow-hidden">
        <div className="container relative z-10">
          
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white mb-6 bg-white/10 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para a página anterior
          </button>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-5 sm:gap-6">
              <div className="relative group shrink-0">
                <img
                  src={talent.avatar}
                  alt={talent.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white/30 object-cover shadow-brand-lg bg-white"
                />
                {isOwner && (
                  <button
                    onClick={() => setActiveTab('edit')}
                    className="absolute -bottom-2 -right-2 bg-primary-blue text-white p-2 rounded-full border-2 border-white shadow-md hover:bg-blue-600 transition-all cursor-pointer"
                    title="Alterar Foto de Perfil"
                  >
                    <Camera size={14} />
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">{talent.name}</h1>
                  {talent.isVerifiedStudent ? (
                    <span className="bg-green-500/20 text-green-300 border border-green-400/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <ShieldCheck size={13} /> Matrícula Verificada
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Lock size={12} /> Matrícula Pendente
                    </span>
                  )}
                </div>

                <div className="text-accent-sky font-bold text-base sm:text-lg mb-1 flex items-center gap-2">
                  <GraduationCap size={18} /> {talent.course || (isOwner ? 'Adicione seu curso ou formação' : 'Curso não informado')}
                </div>

                <div className="flex items-center gap-3 text-gray-300 text-xs sm:text-sm flex-wrap">
                  {talent.institution ? (
                    <span className="flex items-center gap-1.5"><Building2 size={14} />{talent.institution}</span>
                  ) : (
                    isOwner && <span className="text-gray-400 italic">Instituição não informada</span>
                  )}
                  {talent.period && (
                    <>
                      <span>·</span>
                      <span>{talent.period}</span>
                    </>
                  )}
                  <span>·</span>
                  <span className="flex items-center gap-1.5"><MapPin size={14} />{talent.city || 'Vale do Ivaí'}, PR</span>
                </div>

                {/* Badges Destacadas de Redes Sociais (LinkedIn e GitHub) */}
                <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                  {talent.linkedin ? (
                    <a
                      href={talent.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold bg-[#0A66C2] hover:bg-[#004182] text-white px-3.5 py-1.5 rounded-full transition-all shadow-md"
                      title="Acessar Perfil no LinkedIn"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/></svg>
                      <span>LinkedIn</span>
                    </a>
                  ) : (
                    isOwner && (
                      <button
                        onClick={() => setActiveTab('edit')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#0A66C2]/30 hover:bg-[#0A66C2] text-blue-100 border border-blue-400/40 px-3 py-1.5 rounded-full transition-all"
                      >
                        + Adicionar LinkedIn
                      </button>
                    )
                  )}

                  {talent.github ? (
                    <a
                      href={talent.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold bg-[#181717] hover:bg-black text-white border border-white/20 px-3.5 py-1.5 rounded-full transition-all shadow-md"
                      title="Acessar Perfil no GitHub"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
                      <span>GitHub</span>
                    </a>
                  ) : (
                    isOwner && (
                      <button
                        onClick={() => setActiveTab('edit')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-gray-200 border border-white/20 px-3 py-1.5 rounded-full transition-all"
                      >
                        + Adicionar GitHub
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Coluna de Botões Perfeitamente Alinhados à Direita */}
            <div className="flex flex-col sm:items-end gap-2.5 shrink-0 w-full sm:w-auto">
              {/* Botão de Chat Direto (visível para quem está visitando o perfil) */}
              {!isOwner && (
                <button
                  onClick={() => {
                    startChatWith({
                      name: talent.name,
                      email: talent.email || 'aluno@ivaiconecta.com.br',
                      role: 'aluno',
                      avatar: talent.avatar || ''
                    }, `Contato Direto: Perfil de ${talent.name}`);
                  }}
                  className="btn btn-primary btn-sm font-bold shadow-md flex items-center justify-center gap-2 w-full text-xs cursor-pointer"
                >
                  <MessageSquare size={15} /> 💬 Conversar com {talent.name.split(' ')[0]}
                </button>
              )}

              {/* 1. Baixar Currículo em PDF */}
              <button
                onClick={() => setPdfModalOpen(true)}
                className="btn btn-outline border-white/40 text-white btn-sm font-bold shadow-md flex items-center justify-center gap-2 w-full"
              >
                <Printer size={15} /> 📄 Baixar Currículo em PDF
              </button>

              {/* 2. Editar Meu Perfil (visível apenas para o dono) */}
              {isOwner && (
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="btn bg-amber-400 hover:bg-amber-500 text-slate-950 btn-sm font-extrabold shadow-lg flex items-center justify-center gap-2 border border-amber-300 transition-all cursor-pointer w-full"
                  title="Abrir formulário de edição de perfil e currículo"
                >
                  <Edit3 size={16} /> ✏️ Editar Meu Perfil &amp; Currículo
                </button>
              )}

              {/* 3. Pedir Recomendação a Professor (posicionado logo abaixo dos 2 botões alinhados) */}
              {currentUser?.role === 'aluno' && (
                <button
                  onClick={() => setRequestModal(true)}
                  className="btn btn-teal btn-sm font-bold shadow-md flex items-center justify-center gap-2 w-full text-xs"
                >
                  <Send size={14} /> Pedir Recomendação a Professor
                </button>
              )}

              {isProfessor && (
                <button
                  onClick={() => setProactiveEndorseModal(true)}
                  className="btn btn-teal btn-sm font-bold shadow-md flex items-center justify-center gap-2 w-full"
                >
                  <Award size={16} /> ⭐ Recomendar Este Aluno
                </button>
              )}
            </div>
          </div>

          {/* Abas Principais */}
          <div className="flex items-center gap-2 mt-8 border-b border-white/15 pt-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'overview' ? 'border-accent-sky text-white' : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'experience' ? 'border-accent-sky text-white' : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              Experiências &amp; Projetos ({talent.experiences?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('endorsements')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'endorsements' ? 'border-accent-sky text-white' : 'border-transparent text-gray-300 hover:text-white'
              }`}
            >
              Recomendações ({talent.endorsements?.length || 0})
            </button>
          </div>

        </div>
      </div>

      <main className="container section">

        {/* ── ABA 1: VISÃO GERAL ── */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div className="card">
                <h3 className="font-heading font-bold text-primary-dark dark:text-white mb-3 flex items-center gap-2">
                  <Sparkles size={17} className="text-primary-blue dark:text-blue-400" /> Sobre o Estudante
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                  {talent.bio || (isOwner ? 'Nenhum resumo adicionado. Clique no botão "Editar Perfil" acima para escrever sua biografia e objetivos.' : 'Nenhum resumo profissional adicionado.')}
                </p>
              </div>

              <div className="card">
                <h3 className="font-heading font-bold text-primary-dark dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen size={17} className="text-primary-blue dark:text-blue-400" /> Habilidades Técnicas
                </h3>
                {!talent.skills || talent.skills.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-slate-500 italic">
                    {isOwner ? 'Nenhuma competência cadastrada. Clique em "Editar Perfil" para adicionar suas habilidades.' : 'Nenhuma habilidade cadastrada ainda.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {talent.skills.map(s => (
                      <span key={s} className="tag tag-blue">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white flex items-center gap-2">
                    <Briefcase size={18} className="text-primary-blue dark:text-blue-400" /> Experiências Profissionais
                  </h3>
                  <button onClick={() => setActiveTab('experience')} className="text-xs font-bold text-primary-blue dark:text-blue-400 hover:underline">
                    Ver todas →
                  </button>
                </div>

                {!talent.experiences || talent.experiences.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma experiência cadastrada ainda.</p>
                ) : (
                  <div className="space-y-4">
                    {talent.experiences.slice(0, 2).map(exp => (
                      <div key={exp.id} className="border-l-2 border-primary-blue pl-4 py-1">
                        <div className="font-bold text-gray-800 dark:text-white text-base">{exp.role}</div>
                        <div className="text-xs font-semibold text-primary-blue dark:text-blue-400">{exp.company} · {exp.period}</div>
                        <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white flex items-center gap-2">
                    <Award size={18} className="text-primary-blue dark:text-blue-400" /> Parecer Pedagógico &amp; Recomendações
                  </h3>
                  {isProfessor ? (
                    <button onClick={() => setProactiveEndorseModal(true)} className="btn btn-teal btn-sm text-xs font-bold">
                      <Award size={13} /> ⭐ Recomendar Aluno
                    </button>
                  ) : null}
                </div>

                {!talent.endorsements || talent.endorsements.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 dark:text-slate-500">
                    <p className="font-semibold text-sm">Nenhuma recomendação ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {talent.endorsements.map((e, i) => (
                      <div key={e.id || i} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 gap-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-gray-800 dark:text-white text-sm">{e.profName}</div>
                            <div className="text-xs text-primary-blue dark:text-blue-400 font-medium">{e.discipline} · {e.institution}</div>
                          </div>
                          <span className="text-xs font-bold text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-2.5 py-0.5 rounded-full">
                            ✓ Verificado
                          </span>
                        </div>
                        <blockquote className="text-sm text-gray-600 dark:text-slate-300 italic mt-2">
                          "{e.quote}"
                        </blockquote>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ABA 2: EXPERIÊNCIAS & PROJETOS ── */}
        {activeTab === 'experience' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-primary-blue dark:text-blue-400" /> Histórico de Experiências Profissionais
              </h3>
              {!talent.experiences || talent.experiences.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma experiência cadastrada ainda.</p>
              ) : (
                <div className="space-y-6">
                  {talent.experiences.map(exp => (
                    <div key={exp.id} className="border-l-3 border-primary-blue pl-4 py-1 space-y-1">
                      <div className="font-bold text-gray-900 dark:text-white text-lg">{exp.role}</div>
                      <div className="text-xs font-bold text-primary-blue dark:text-blue-400">{exp.company} · {exp.period}</div>
                      <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mt-1">{exp.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white mb-4 flex items-center gap-2">
                <FolderKanban size={20} className="text-primary-blue dark:text-blue-400" /> Projetos &amp; Portfólio
              </h3>
              {!talent.projects || talent.projects.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500">Nenhum projeto cadastrado ainda.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {talent.projects.map(proj => (
                    <div key={proj.id} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-2xl space-y-2">
                      <div className="font-bold text-gray-900 dark:text-white text-base flex items-center justify-between">
                        <span>{proj.title}</span>
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-primary-blue dark:text-blue-400 hover:underline">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <div className="text-xs font-bold text-accent-sky">{proj.tech}</div>
                      <p className="text-xs text-gray-600 dark:text-slate-300">{proj.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ABA 3: RECOMENDAÇÕES ── */}
        {activeTab === 'endorsements' && (
          <div className="card space-y-4">
            <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white flex items-center gap-2">
              <Award size={20} className="text-amber-500 fill-amber-500" /> Pareceres Pedagógicos Autenticados
            </h3>
            {!talent.endorsements || talent.endorsements.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma recomendação registrada ainda.</p>
            ) : (
              <div className="space-y-4">
                {talent.endorsements.map((e, i) => (
                  <div key={e.id || i} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-base">{e.profName}</div>
                        <div className="text-xs font-semibold text-primary-blue dark:text-blue-400">{e.discipline} · {e.institution}</div>
                      </div>
                      <span className="bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 border border-green-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <ShieldCheck size={13} /> Parecer Autenticado
                      </span>
                    </div>
                    <blockquote className="text-sm text-gray-700 dark:text-slate-300 italic pt-2 border-t border-gray-200 dark:border-slate-700">
                      "{e.quote}"
                    </blockquote>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Modal: Recomendação Proativa pelo Professor */}
      {proactiveEndorseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setProactiveEndorseModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-lg p-7" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <Award size={20} className="text-amber-500 fill-amber-500" /> Recomendar {talent.name}
              </h3>
              <button onClick={() => setProactiveEndorseModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-white" /></button>
            </div>

            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 leading-relaxed">
              Como docente autenticado, você pode emitir uma avaliação recomendando este aluno. O parecer exibirá seu nome, titulação e o selo de recomendação verificada.
            </p>

            <form onSubmit={handleProactiveEndorseSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Disciplina / Área Avaliada</label>
                <input
                  type="text"
                  value={proactiveDiscipline}
                  onChange={e => setProactiveDiscipline(e.target.value)}
                  className="form-control"
                  placeholder="Ex: Programação de Computadores"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Seu Parecer Pedagógico</label>
                <textarea
                  value={proactiveQuote}
                  onChange={e => setProactiveQuote(e.target.value)}
                  className="form-control"
                  rows={3}
                  placeholder="Escreva sobre a assiduidade, qualidade dos trabalhos e competências técnicas do aluno..."
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button type="button" onClick={() => setProactiveEndorseModal(false)} className="btn btn-outline btn-sm font-semibold">Cancelar</button>
                <button type="submit" className="btn btn-teal btn-sm font-bold shadow-md flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Conceder Parecer Verificado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pedir Recomendação a Professor (Para Alunos) */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setRequestModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-brand-xl w-full max-w-lg p-7" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
                <Send size={18} className="text-primary-blue dark:text-blue-400" /> Pedir Recomendação a Professor
              </h3>
              <button onClick={() => setRequestModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-white" /></button>
            </div>

            {error && <div className="mb-4 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl">{error}</div>}

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nome do Professor(a)</label>
                <input
                  type="text"
                  value={requestForm.profName}
                  onChange={e => setRequestForm(f => ({ ...f, profName: e.target.value }))}
                  className="form-control"
                  placeholder="Ex: Prof. Dr. Ronan Silva"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail Educacional do Professor</label>
                <input
                  type="email"
                  value={requestForm.profEmail}
                  onChange={e => setRequestForm(f => ({ ...f, profEmail: e.target.value }))}
                  className="form-control"
                  placeholder="Ex: ronan.silva@ifpr.edu.br"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Disciplina / Matéria Ministrada</label>
                <input
                  type="text"
                  value={requestForm.discipline}
                  onChange={e => setRequestForm(f => ({ ...f, discipline: e.target.value }))}
                  className="form-control"
                  placeholder="Ex: Programação de Computadores"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button type="button" onClick={() => setRequestModal(false)} className="btn btn-outline btn-sm font-semibold">Cancelar</button>
                <button type="submit" className="btn btn-teal btn-sm font-bold shadow-md">Enviar Solicitação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pré-visualização e Impressão de CV em PDF */}
      {pdfModalOpen && (
        <ResumePDFModal talent={talent} onClose={() => setPdfModalOpen(false)} />
      )}

      {/* Modal: Edição Completa de Perfil & Currículo Estilo Gupy */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editData={editData}
        setEditData={setEditData}
        handleSaveProfile={handleSaveProfile}
        handleAvatarFileChange={handleAvatarFileChange}
        addExperience={addExperience}
        removeExperience={removeExperience}
        addProject={addProject}
        removeProject={removeProject}
        addEducation={addEducation}
        removeEducation={removeEducation}
        newExp={newExp}
        setNewExp={setNewExp}
        newProj={newProj}
        setNewProj={setNewProj}
        newEdu={newEdu}
        setNewEdu={setNewEdu}
      />
    </>
  );
}
