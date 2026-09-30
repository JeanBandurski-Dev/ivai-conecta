import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  GraduationCap, Building2, MapPin, Award, ShieldCheck,
  Send, Edit3, ArrowLeft, X, BookOpen, Briefcase,
  Printer, ExternalLink, Camera, MessageSquare, Lock, Sparkles, Check,
  Share2, Plus, Trash2, Globe, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon,
  User, ChevronDown
} from 'lucide-react';
import {
  getTalentById, requestTeacherEndorsement, updateTalentProfile,
  proactiveEndorseStudent, uploadUserProfilePicture, uploadUserCoverPicture, CITIES,
  DEFAULT_AVATAR, DEFAULT_BANNER
} from '../lib/ivaiConecta';
import ResumePDFModal from '../components/ResumePDFModal';
import useAppStore from '../store/useAppStore';

// ── Ícones SVG Customizados para Redes Sociais ──
function IconInstagram({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function IconLinkedin({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
    </svg>
  );
}

function IconGithub({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
    </svg>
  );
}

const BANNER_PRESETS = [
  { id: 'academic', name: 'Campus Universitário', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1600' },
  { id: 'tech', name: 'Tecnologia & Dev', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1600' },
  { id: 'library', name: 'Estudos & Foco', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1600' },
  { id: 'creative', name: 'Design & Inovação', url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1600' },
];

export default function PerfilAluno() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, showToast, startChatWith } = useAppStore();

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const modalAvatarInputRef = useRef(null);

  const talentId = id || currentUser?.uid || currentUser?.id;
  const talent = getTalentById(talentId) || (currentUser ? {
    id: currentUser.uid || currentUser.id,
    firestoreId: currentUser.uid || currentUser.id,
    name: currentUser.name || (currentUser.role === 'candidato' ? 'Candidato / Profissional' : 'Estudante'),
    role: currentUser.role || 'aluno',
    course: currentUser.course || (currentUser.role === 'candidato' ? (currentUser.headline || '') : 'Graduação / Ensino Técnico'),
    institution: currentUser.institution || (currentUser.role === 'aluno' ? 'IFPR Campus Ivaiporã' : ''),
    period: currentUser.period || (currentUser.role === 'aluno' ? 'Em andamento' : ''),
    city: currentUser.city || 'Ivaiporã',
    avatar: currentUser.avatar || '',
    banner: currentUser.banner || DEFAULT_BANNER,
    skills: currentUser.skills || [],
    isVerifiedStudent: currentUser.isVerifiedStudent ?? false,
    raNumber: currentUser.raNumber || '',
    linkedin: currentUser.linkedin || '',
    github: currentUser.github || '',
    instagram: currentUser.instagram || '',
    website: currentUser.website || '',
    bio: currentUser.bio || '',
    experiences: currentUser.experiences || [],
    projects: currentUser.projects || [],
    education: currentUser.education || [],
    endorsements: currentUser.endorsements || []
  } : null);

  const userRole = talent?.role || currentUser?.role || 'aluno';
  const isCandidate = Boolean(userRole === 'candidato');
  const isStudent = Boolean(userRole === 'aluno');
  const isFreelancer = Boolean(userRole === 'freelancer');

  // Permissão estrita do proprietário
  const isOwner = Boolean(
    currentUser && talent && (
      (currentUser.id != null && talent.id != null && String(currentUser.id) === String(talent.id)) ||
      (currentUser.uid != null && (String(currentUser.uid) === String(talent.id) || String(currentUser.uid) === String(talent.firestoreId) || String(currentUser.uid) === String(talent.uid))) ||
      (currentUser.email && talent.email && currentUser.email.toLowerCase() === talent.email.toLowerCase()) ||
      (currentUser.name && talent.name && currentUser.name.trim().toLowerCase() === talent.name.trim().toLowerCase())
    )
  );

  const isProfessor = currentUser?.role === 'professor';

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'experience' | 'endorsements' | 'resume'
  const [editModalOpen, setEditModalOpen] = useState(Boolean(searchParams.get('tab') === 'edit' || searchParams.get('edit') === 'true'));
  const [activeEditTab, setActiveEditTab] = useState('profile'); // 'profile' | 'presentation' | 'education' | 'experience'
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [proactiveEndorseModal, setProactiveEndorseModal] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form for proactive endorsement by teacher
  const [proactiveQuote, setProactiveQuote] = useState('');
  const [proactiveDiscipline, setProactiveDiscipline] = useState(currentUser?.discipline || 'Programação de Computadores');
  const [requestForm, setRequestForm] = useState({ profName: '', profEmail: '', discipline: '', message: '' });
  const [requestError, setRequestError] = useState('');

  // Comprehensive edit form state
  const [editData, setEditData] = useState({
    name: talent?.name || '',
    avatar: talent?.avatar || '',
    banner: talent?.banner || DEFAULT_BANNER,
    city: talent?.city || 'Ivaiporã',
    institution: talent?.institution || '',
    course: talent?.course || '',
    period: talent?.period || '',
    bio: talent?.bio || '',
    linkedin: talent?.linkedin || '',
    github: talent?.github || '',
    instagram: talent?.instagram || '',
    website: talent?.website || '',
    skills: [...(talent?.skills || [])],
    experiences: [...(talent?.experiences || [])],
    projects: [...(talent?.projects || [])],
    education: [...(talent?.education || [])],
    newSkill: ''
  });

  // Novos itens em edição
  const [newExp, setNewExp] = useState({ role: '', company: '', period: '', description: '' });
  const [newProj, setNewProj] = useState({ title: '', tech: '', link: '', description: '' });
  const [newEdu, setNewEdu] = useState({ degree: '', institution: '', period: '' });

  useEffect(() => {
    if (talent) {
      setEditData({
        name: talent.name || '',
        avatar: talent.avatar || '',
        banner: talent.banner || DEFAULT_BANNER,
        city: talent.city || 'Ivaiporã',
        institution: talent.institution || '',
        course: talent.course || '',
        period: talent.period || '',
        bio: talent.bio || '',
        linkedin: talent.linkedin || '',
        github: talent.github || '',
        instagram: talent.instagram || '',
        website: talent.website || '',
        skills: [...(talent.skills || [])],
        experiences: [...(talent.experiences || [])],
        projects: [...(talent.projects || [])],
        education: [...(talent.education || [])],
        newSkill: ''
      });
    }
  }, [talent]);

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('🔗 Link do perfil copiado para a área de transferência!');
  };

  // Upload de Foto de Perfil
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadingAvatar(true);
    showToast('Enviando foto de perfil...');
    try {
      const res = await uploadUserProfilePicture(file, currentUser?.uid || talent?.id);
      if (res.success) {
        setEditData(d => ({ ...d, avatar: res.url }));
        if (currentUser) {
          setCurrentUser({ ...currentUser, avatar: res.url });
        }
        showToast('Foto de perfil atualizada com sucesso!');
      } else {
        showToast(res.error || 'Erro ao carregar a foto.');
      }
    } catch {
      showToast('Erro ao processar imagem.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Remover foto de perfil
  const handleRemoveAvatar = () => {
    setEditData(d => ({ ...d, avatar: '' }));
    if (currentUser) {
      setCurrentUser({ ...currentUser, avatar: '' });
    }
    showToast('Foto de perfil removida.');
  };

  // Upload de Imagem de Capa
  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('⚠️ A capa deve ter no máximo 8MB.');
      return;
    }

    setUploadingCover(true);
    showToast('Enviando nova imagem de capa...');
    try {
      const res = await uploadUserCoverPicture(file, currentUser?.uid || talent?.id);
      if (res.success) {
        setEditData(d => ({ ...d, banner: res.url }));
        if (currentUser) {
          setCurrentUser({ ...currentUser, banner: res.url });
        }
        setCoverModalOpen(false);
        showToast('Imagem de capa atualizada com sucesso!');
      } else {
        showToast(res.error || 'Erro ao enviar capa.');
      }
    } catch {
      showToast('Erro ao processar imagem.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSelectPresetCover = async (presetUrl) => {
    setEditData(d => ({ ...d, banner: presetUrl }));
    if (currentUser) {
      setCurrentUser({ ...currentUser, banner: presetUrl });
    }
    await updateTalentProfile(talent.id, { banner: presetUrl });
    setCoverModalOpen(false);
    showToast('Capa do perfil atualizada!');
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateTalentProfile(talent.id, editData);
      if (isOwner && currentUser) {
        setCurrentUser({
          ...currentUser,
          name: editData.name,
          avatar: editData.avatar,
          banner: editData.banner,
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
          instagram: editData.instagram,
          website: editData.website,
        });
      }
      showToast('🎉 Perfil e dados profissionais salvos com sucesso!');
      handleCloseEditModal();
    } catch (err) {
      showToast('Erro ao salvar alterações: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add / Remove Skills
  const handleAddSkill = () => {
    if (editData.newSkill?.trim()) {
      const skill = editData.newSkill.trim();
      if (!editData.skills.includes(skill)) {
        setEditData(prev => ({ ...prev, skills: [...prev.skills, skill], newSkill: '' }));
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
  };

  // Add / Remove Formação
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

  // Add / Remove Experiência
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
    showToast('Experiência adicionada!');
  };

  const removeExperience = (expId) => {
    setEditData(prev => ({ ...prev, experiences: prev.experiences.filter(e => e.id !== expId) }));
  };

  // Add / Remove Projeto
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
    showToast('Projeto adicionado!');
  };

  const removeProject = (projId) => {
    setEditData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== projId) }));
  };

  // Solicitar parecer a professor
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!requestForm.profEmail.toLowerCase().includes('@')) {
      setRequestError('Por favor, informe um e-mail educacional válido.');
      return;
    }
    setRequestError('');
    requestTeacherEndorsement(requestForm.profEmail, requestForm.profName, requestForm.discipline, currentUser);
    setRequestModal(false);
    showToast(`Solicitação enviada para o professor ${requestForm.profName}!`);
    setRequestForm({ profName: '', profEmail: '', discipline: '', message: '' });
  };

  // Professor recomenda aluno
  const handleProactiveEndorseSubmit = (e) => {
    e.preventDefault();
    const res = proactiveEndorseStudent(talent.id, currentUser, proactiveQuote, proactiveDiscipline);
    if (res.success) {
      showToast(`Recomendação concedida com sucesso para ${talent.name}!`);
      setProactiveEndorseModal(false);
      setProactiveQuote('');
    } else {
      showToast(res.error);
    }
  };

  if (!talent) {
    return (
      <main className="container section text-center py-24">
        <GraduationCap size={54} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
        <h2 className="font-heading text-2xl font-bold text-gray-700 dark:text-white mb-2">Perfil de Estudante não encontrado</h2>
        <p className="text-gray-500 dark:text-slate-300 mb-6">O perfil solicitado não foi localizado no banco de talentos.</p>
        <button onClick={() => navigate('/talentos')} className="btn btn-primary px-6 py-2.5 font-bold">
          Explorar Banco de Talentos
        </button>
      </main>
    );
  }

  const currentBanner = editData.banner || talent.banner || DEFAULT_BANNER;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 pb-20">

      {/* Alerta de Perfil Não Verificado apenas para Alunos */}
      {isOwner && isStudent && !currentUser?.isVerifiedStudent && (
        <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 py-3 px-4 text-xs sm:text-sm">
          <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 font-medium">
              <Lock size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Seu perfil está aguardando verificação acadêmica. Envie sua Declaração de Matrícula para liberar o <strong>Selo de Matrícula Verificada</strong>.
              </span>
            </div>
            <Link to="/configuracoes" className="btn btn-primary btn-sm text-xs font-bold shrink-0">
              Enviar Declaração de Matrícula →
            </Link>
          </div>
        </div>
      )}

      {/* ── HERO HEADER COM BANNER DE CAPA ── */}
      <section className="relative w-full overflow-hidden bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        
        {/* Banner Area */}
        <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden group">
          <img
            src={currentBanner}
            alt="Capa de Perfil"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* Top Bar inside Banner */}
          <div className="absolute top-4 inset-x-4 sm:inset-x-8 w-full max-w-7xl 2xl:max-w-[1536px] mx-auto flex items-center justify-between z-10">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs font-semibold border border-white/20 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft size={14} /> Voltar
            </button>

            {isOwner && (
              <button
                onClick={() => setCoverModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-md text-xs font-semibold border border-white/20 transition-all cursor-pointer shadow-sm"
              >
                <ImageIcon size={14} /> Alterar Capa
              </button>
            )}
          </div>
        </div>

        {/* Profile Info Bar */}
        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 sm:-mt-24 pb-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            
            {/* Avatar & Main Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left w-full md:w-auto">
              
              {/* Avatar Container */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 shadow-2xl relative">
                  <img
                    src={talent.avatar || DEFAULT_AVATAR}
                    alt={talent.name}
                    className="w-full h-full object-cover"
                  />

                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  )}
                </div>

                {isOwner && (
                  <>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      onChange={handleAvatarFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-1 right-1 p-2 rounded-2xl bg-primary-blue hover:bg-blue-600 text-white shadow-lg border-2 border-white dark:border-slate-900 transition-all transform hover:scale-105 cursor-pointer"
                      title="Alterar foto de perfil"
                    >
                      <Camera size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Text Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
                    {talent.name}
                  </h1>
                  {isCandidate ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/25 text-sky-200 border border-sky-400/40 shadow-xs">
                      <Briefcase size={13} className="text-sky-300" /> Candidato / Profissional
                    </span>
                  ) : isFreelancer ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/25 text-purple-200 border border-purple-400/40 shadow-xs">
                      <Zap size={13} className="text-purple-300" /> Freelancer / Autônomo
                    </span>
                  ) : talent.isVerifiedStudent ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-xs">
                      <ShieldCheck size={13} className="text-emerald-300" /> Matrícula Verificada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/25 text-blue-200 border border-blue-400/40 shadow-xs">
                      <GraduationCap size={13} className="text-blue-300" /> Estudante / Aluno
                    </span>
                  )}
                </div>

                <div className="text-blue-200 font-medium text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {isCandidate ? (
                    <>
                      <Briefcase size={16} className="text-sky-400" />
                      <span>{talent.course || talent.headline || 'Profissional em Busca de Oportunidades'}</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap size={16} className="text-primary-blue dark:text-blue-400" />
                      <span>{talent.course || 'Graduação / Ensino Técnico'}</span>
                    </>
                  )}
                </div>

                {/* Chips Meta Row */}
                <div className="flex items-center justify-center sm:justify-start gap-3.5 text-xs text-slate-300 flex-wrap pt-1">
                  {talent.institution && (
                    <span className="flex items-center gap-1">
                      <Building2 size={13} className="text-slate-400" /> {talent.institution}
                    </span>
                  )}
                  {talent.period && (
                    <span className="flex items-center gap-1">
                      · {talent.period}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" /> {talent.city || 'Ivaiporã'}, PR
                  </span>
                </div>

                {/* Social Badges */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                  {talent.linkedin && (
                    <a
                      href={talent.linkedin.startsWith('http') ? talent.linkedin : `https://linkedin.com/in/${talent.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-800/60 text-xs font-semibold transition-all"
                    >
                      <IconLinkedin size={13} className="text-blue-400" /> LinkedIn
                    </a>
                  )}
                  {talent.github && (
                    <a
                      href={talent.github.startsWith('http') ? talent.github : `https://github.com/${talent.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
                    >
                      <IconGithub size={13} className="text-slate-300" /> GitHub
                    </a>
                  )}
                  {talent.instagram && (
                    <a
                      href={talent.instagram.startsWith('http') ? talent.instagram : `https://instagram.com/${talent.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-950/60 hover:bg-pink-900/80 text-pink-200 border border-pink-800/60 text-xs font-semibold transition-all"
                    >
                      <IconInstagram size={13} className="text-pink-400" /> Instagram
                    </a>
                  )}
                  {talent.website && (
                    <a
                      href={talent.website.startsWith('http') ? talent.website : `https://${talent.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-800/60 text-xs font-semibold transition-all"
                    >
                      <Globe size={13} className="text-emerald-400" /> Portfólio
                    </a>
                  )}
                </div>

              </div>
            </div>

            {/* Quick Actions / Buttons Row */}
            <div className="flex items-center justify-center sm:justify-end gap-2.5 w-full md:w-auto flex-wrap">
              
              {/* Botão de Chat (para visitantes) */}
              {!isOwner && (
                <button
                  onClick={() => {
                    startChatWith({
                      name: talent.name,
                      email: talent.email || 'candidato@ivaiconecta.com.br',
                      role: userRole,
                      avatar: talent.avatar || ''
                    }, `Contato Direto: Perfil de ${talent.name}`);
                  }}
                  className="btn btn-primary px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-brand flex items-center gap-2"
                >
                  <MessageSquare size={16} /> Conversar no Chat
                </button>
              )}

              {/* Botão Baixar Currículo PDF */}
              <button
                onClick={() => setPdfModalOpen(true)}
                className="btn btn-outline border-white/30 hover:border-white text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold backdrop-blur-md flex items-center gap-2"
              >
                <Printer size={16} /> Currículo em PDF
              </button>

              {/* Botão de Compartilhar */}
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-sm"
                title="Compartilhar Perfil"
              >
                <Share2 size={16} />
              </button>

              {/* Se for Professor logado visitando o aluno */}
              {isProfessor && !isOwner && (
                <button
                  onClick={() => setProactiveEndorseModal(true)}
                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2"
                >
                  <Award size={16} /> {isStudent ? 'Recomendar Aluno' : 'Emitir Parecer'}
                </button>
              )}

              {/* Botões do Proprietário */}
              {isOwner && (
                <>
                  {isStudent && (
                    <button
                      onClick={() => setRequestModal(true)}
                      className="btn btn-outline border-blue-400/50 hover:border-blue-400 text-blue-300 px-3.5 py-2.5 rounded-2xl text-xs font-bold backdrop-blur-md flex items-center gap-2"
                    >
                      <Send size={14} /> Pedir Parecer Docente
                    </button>
                  )}
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="btn bg-primary-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-brand flex items-center gap-2 cursor-pointer"
                  >
                    <Edit3 size={16} /> Editar Perfil
                  </button>
                </>
              )}

            </div>

          </div>
        </div>

      </section>

      {/* ── NAVEGAÇÃO POR ABAS ── */}
      <div className="sticky top-16 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-primary-blue text-white shadow-brand'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles size={15} /> Visão Geral &amp; Sobre
            </button>

            <button
              onClick={() => setActiveTab('experience')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'experience'
                  ? 'bg-primary-blue text-white shadow-brand'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase size={15} /> Experiências &amp; Projetos ({talent.experiences?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('endorsements')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'endorsements'
                  ? 'bg-primary-blue text-white shadow-brand'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Award size={15} /> {isStudent ? 'Pareceres Docentes' : 'Recomendações'} ({talent.endorsements?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('resume')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'resume'
                  ? 'bg-primary-blue text-white shadow-brand'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Printer size={15} /> Currículo &amp; Download
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO DAS ABAS ── */}
      <main className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* ── ABA 1: VISÃO GERAL & SOBRE ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Coluna Principal (8 colunas) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Card Biografia */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5 mb-4">
                  <Sparkles size={18} className="text-primary-blue dark:text-blue-400" /> {isStudent ? 'Sobre o Estudante / Aluno' : isFreelancer ? 'Sobre o Freelancer' : 'Sobre o Candidato / Profissional'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {talent.bio || (isOwner
                    ? `Nenhum resumo adicionado ainda. Clique em "Editar Perfil" para escrever sua apresentação ${isStudent ? 'acadêmica' : 'profissional'} e objetivos de carreira.`
                    : `Nenhum resumo ${isStudent ? 'acadêmico' : 'profissional'} cadastrado.`)}
                </p>
              </div>

              {/* Card Formação Acadêmica Principal */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                    <GraduationCap size={18} className="text-primary-blue dark:text-blue-400" /> {isStudent ? 'Formação Acadêmica' : 'Formação & Cursos'}
                  </h2>
                  {isOwner && (
                    <button
                      onClick={() => { setActiveEditTab('education'); setEditModalOpen(true); }}
                      className="text-xs font-bold text-primary-blue hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} /> Adicionar Formação
                    </button>
                  )}
                </div>

                {talent.education && talent.education.length > 0 ? (
                  <div className="space-y-4">
                    {talent.education.map((edu, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-primary-blue flex items-center justify-center shrink-0">
                          <Building2 size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{edu.degree}</h3>
                          <p className="text-xs text-gray-600 dark:text-slate-400">{edu.institution}</p>
                          <span className="inline-block mt-1 text-xs text-primary-blue dark:text-blue-400 font-semibold">{edu.period}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{talent.course || (isStudent ? 'Curso em Andamento' : 'Formação Principal')}</h3>
                    {talent.institution && <p className="text-xs text-gray-600 dark:text-slate-400">{talent.institution}</p>}
                    <span className="inline-block mt-1 text-xs text-primary-blue dark:text-blue-400 font-semibold">{talent.period || (isStudent ? 'Em andamento' : 'Concluído / Em formação')}</span>
                  </div>
                )}
              </div>

              {/* Card Destaque de Experiências */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                    <Briefcase size={18} className="text-primary-blue dark:text-blue-400" /> Experiências Recentes
                  </h2>
                  <button
                    onClick={() => setActiveTab('experience')}
                    className="text-xs font-bold text-primary-blue hover:underline"
                  >
                    Ver todas ({talent.experiences?.length || 0}) →
                  </button>
                </div>

                {!talent.experiences || talent.experiences.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400 dark:text-slate-500">
                    {isOwner ? 'Nenhuma experiência cadastrada. Clique em Editar para adicionar estágios ou empregos.' : 'Nenhuma experiência cadastrada ainda.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {talent.experiences.slice(0, 2).map((exp, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{exp.role}</h3>
                          <span className="text-xs text-gray-500 font-medium">{exp.period}</span>
                        </div>
                        <p className="text-xs text-primary-blue dark:text-blue-400 font-semibold mb-2">{exp.company}</p>
                        <p className="text-xs text-gray-600 dark:text-slate-300">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Coluna Lateral / Sidebar (4 colunas) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card Habilidades Técnicas */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={17} className="text-primary-blue dark:text-blue-400" /> Habilidades &amp; Stacks
                  </h2>
                  {isOwner && (
                    <button
                      onClick={() => { setActiveEditTab('presentation'); setEditModalOpen(true); }}
                      className="text-xs font-bold text-primary-blue hover:underline"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {!talent.skills || talent.skills.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-slate-500 italic">
                    {isOwner ? 'Nenhuma habilidade adicionada.' : 'Nenhuma habilidade informada.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {talent.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-primary-blue dark:text-blue-300 text-xs font-semibold border border-blue-100 dark:border-blue-900/60">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Informações Institucionais / Status */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 space-y-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={17} className="text-primary-blue dark:text-blue-400" /> {isStudent ? 'Informações do Aluno' : isFreelancer ? 'Informações do Freelancer' : 'Informações Profissionais'}
                </h2>

                <div className="space-y-3 text-xs">
                  {isStudent ? (
                    <>
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                        <span className="text-gray-500">Instituição:</span>
                        <span className="font-semibold text-gray-800 dark:text-slate-200">{talent.institution || 'IFPR Ivaiporã'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                        <span className="text-gray-500">Período/Ano:</span>
                        <span className="font-semibold text-gray-800 dark:text-slate-200">{talent.period || 'Em andamento'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                        <span className="text-gray-500">Localização:</span>
                        <span className="font-semibold text-gray-800 dark:text-slate-200">{talent.city || 'Ivaiporã'}, PR</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-gray-500">Status Matrícula:</span>
                        <span className={`font-bold ${talent.isVerifiedStudent ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {talent.isVerifiedStudent ? 'Verificada Oficialmente' : 'Pendente de Comprovação'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                        <span className="text-gray-500">Perfil / Atuação:</span>
                        <span className="font-semibold text-gray-800 dark:text-slate-200">{talent.course || talent.headline || (isFreelancer ? 'Freelancer Autônomo' : 'Candidato / Profissional')}</span>
                      </div>
                      {talent.institution && (
                        <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                          <span className="text-gray-500">Instituição / Escola:</span>
                          <span className="font-semibold text-gray-800 dark:text-slate-200">{talent.institution}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                        <span className="text-gray-500">Localização:</span>
                        <span className="font-semibold text-gray-800 dark:text-slate-200">{talent.city || 'Ivaiporã'}, PR</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-gray-500">Status do Perfil:</span>
                        <span className="font-bold text-emerald-500">
                          Candidato Ativo / Disponível
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── ABA 2: EXPERIÊNCIAS & PROJETOS ── */}
        {activeTab === 'experience' && (
          <div className="space-y-8">
            
            {/* Seção de Experiências */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase size={20} className="text-primary-blue dark:text-blue-400" /> Trajetória Profissional
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Estágios, empregos anteriores e projetos corporativos</p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => { setActiveEditTab('experience'); setEditModalOpen(true); }}
                    className="btn btn-primary btn-sm rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Adicionar Experiência
                  </button>
                )}
              </div>

              {!talent.experiences || talent.experiences.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                  <Briefcase size={36} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">Nenhuma experiência profissional cadastrada</p>
                  <p className="text-xs text-gray-400 mt-1">Adicione experiências para enriquecer seu currículo.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {talent.experiences.map((exp, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">{exp.role}</h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-400 self-start sm:self-auto">
                          {exp.period}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-primary-blue dark:text-blue-400 mb-3">{exp.company}</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seção de Projetos */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={20} className="text-primary-blue dark:text-blue-400" /> Portfólio de Projetos
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Sistemas, trabalhos de conclusão e projetos acadêmicos</p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => { setActiveEditTab('experience'); setEditModalOpen(true); }}
                    className="btn btn-primary btn-sm rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Adicionar Projeto
                  </button>
                )}
              </div>

              {!talent.projects || talent.projects.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                  <BookOpen size={36} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">Nenhum projeto cadastrado</p>
                  <p className="text-xs text-gray-400 mt-1">Destaque projetos práticos para impressionar recrutadores.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {talent.projects.map((proj, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">{proj.title}</h3>
                          {proj.link && (
                            <a
                              href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-blue hover:text-blue-600 p-1"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-4">{proj.description}</p>
                      </div>
                      {proj.tech && (
                        <div className="pt-2 border-t border-gray-200 dark:border-slate-800">
                          <span className="text-[11px] font-semibold text-primary-blue dark:text-blue-400">Tecnologias: {proj.tech}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── ABA 3: PARECERES & RECOMENDAÇÕES ── */}
        {activeTab === 'endorsements' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Award size={20} className="text-primary-blue dark:text-blue-400" /> {isStudent ? 'Pareceres Acadêmicos & Endossos' : 'Recomendações & Avaliações'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {isStudent
                      ? 'Recomendações formais emitidas por professores e orientadores do IFPR'
                      : 'Endossos e recomendações de professores, orientadores e colegas'}
                  </p>
                </div>
                {isOwner && isStudent && (
                  <button
                    onClick={() => setRequestModal(true)}
                    className="btn btn-primary btn-sm rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Send size={14} /> Solicitar Parecer a Professor
                  </button>
                )}
              </div>

              {!talent.endorsements || talent.endorsements.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                  <Award size={40} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                    {isStudent ? 'Nenhum parecer acadêmico emitido ainda' : 'Nenhuma recomendação registrada ainda'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                    {isStudent
                      ? 'Estudantes podem solicitar aos seus professores do IFPR uma recomendação formal para destacar suas competências perante as empresas.'
                      : 'Recomendações de professores, gestores e colegas enriquecem sua apresentação profissional.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {talent.endorsements.map((end, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary-blue text-white font-bold flex items-center justify-center shrink-0">
                          {end.teacherName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{end.teacherName}</h3>
                          <p className="text-xs text-primary-blue dark:text-blue-400 font-semibold">{end.discipline || 'Docente IFPR'}</p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm italic text-gray-700 dark:text-slate-300">
                        &ldquo;{end.quote || end.message}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ABA 4: CURRÍCULO & DOWNLOAD ── */}
        {activeTab === 'resume' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-8 text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue mx-auto flex items-center justify-center">
              <Printer size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Currículo Formatado Padrão Vale do Ivaí</h2>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                Gere e imprima instantaneamente uma versão oficial em PDF do seu currículo com selos de validação acadêmica e histórico profissional.
              </p>
            </div>
            <button
              onClick={() => setPdfModalOpen(true)}
              className="btn btn-primary px-8 py-3 rounded-2xl font-bold shadow-brand inline-flex items-center gap-2"
            >
              <Printer size={18} /> Visualizar &amp; Imprimir Currículo em PDF
            </button>
          </div>
        )}

      </main>

      {/* ── MODAL DE EDIÇÃO DE CAPA ── */}
      {coverModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-primary-blue" /> Personalizar Capa do Perfil
              </h3>
              <button onClick={() => setCoverModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Escolher Capa Predefinida
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {BANNER_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPresetCover(preset.url)}
                      className="group relative h-20 rounded-2xl overflow-hidden border-2 hover:border-primary-blue transition-all cursor-pointer text-left"
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-end p-2 transition-all">
                        <span className="text-[11px] font-bold text-white drop-shadow">{preset.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Ou Enviar Foto Personalizada (Até 8MB)
                </label>
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-800 hover:border-primary-blue text-sm font-bold text-primary-blue dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {uploadingCover ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                  {uploadingCover ? 'Enviando imagem...' : 'Selecionar Imagem do Computador'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE EDIÇÃO DO PERFIL (BOTÕES AZUIS E UX SENIOR) ── */}
      {editModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] md:max-h-[85vh] flex flex-col border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h3 id="edit-profile-title" className="font-heading font-extrabold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit3 size={20} className="text-primary-blue dark:text-blue-400" /> Editar perfil
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Atualize suas informações pessoais, acadêmicas e profissionais visíveis na plataforma.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:text-white hover:bg-primary-blue dark:hover:bg-primary-blue bg-blue-50 dark:bg-blue-950/50 transition-colors cursor-pointer"
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs / Section Switcher */}
            <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
              
              {/* Desktop Tabs (>= 640px) */}
              <div className="hidden sm:grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                {[
                  { id: 'profile', label: 'Perfil' },
                  { id: 'presentation', label: 'Apresentação' },
                  { id: 'education', label: 'Formação' },
                  { id: 'experience', label: 'Experiência e projetos' },
                ].map(tab => {
                  const isActive = activeEditTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveEditTab(tab.id)}
                      className={`py-2 px-3 text-xs md:text-sm font-semibold rounded-xl transition-all text-center truncate cursor-pointer ${
                        isActive
                          ? 'bg-primary-blue text-white shadow-sm font-bold'
                          : 'text-blue-700 dark:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 hover:text-primary-blue'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Select (< 640px) */}
              <div className="sm:hidden flex items-center gap-2">
                <label htmlFor="mobile-section-select" className="text-xs font-bold text-primary-blue dark:text-blue-300 shrink-0">
                  Seção:
                </label>
                <div className="relative flex-1">
                  <select
                    id="mobile-section-select"
                    value={activeEditTab}
                    onChange={e => setActiveEditTab(e.target.value)}
                    className="w-full appearance-none bg-blue-50/60 dark:bg-slate-800 border border-blue-300 dark:border-blue-800 rounded-xl px-3.5 py-2 text-xs font-bold text-primary-blue dark:text-blue-300 pr-8 focus:ring-2 focus:ring-primary-blue/20 outline-none"
                  >
                    <option value="profile">Perfil</option>
                    <option value="presentation">Apresentação</option>
                    <option value="education">Formação</option>
                    <option value="experience">Experiência e projetos</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Modal Form Body */}
            <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
              
              {/* ── SEÇÃO 1: PERFIL (FOTO, DADOS BÁSICOS E CONTATOS) ── */}
              {activeEditTab === 'profile' && (
                <div className="space-y-6">
                  
                  {/* Controle e Prévia da Foto */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-primary-blue/30 shadow-sm bg-white dark:bg-slate-900 flex items-center justify-center">
                        <img
                          src={editData.avatar || DEFAULT_AVATAR}
                          alt="Foto de Perfil"
                          className="w-full h-full object-cover"
                        />
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs rounded-2xl">
                            <Loader2 className="animate-spin text-white" size={20} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Foto de Perfil</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Formatos aceitos: JPG, PNG ou WEBP. Tamanho máximo recomendado: 5MB.
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1 flex-wrap">
                        <input
                          type="file"
                          ref={modalAvatarInputRef}
                          onChange={handleAvatarFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => modalAvatarInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="btn bg-primary-blue hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                        >
                          <Camera size={14} /> {editData.avatar ? 'Trocar foto' : 'Adicionar foto'}
                        </button>
                        {editData.avatar && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-primary-blue dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 hover:bg-blue-200 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                          >
                            Remover foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Campos Pessoais */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="field-name" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Nome Completo <span className="text-primary-blue">*</span>
                      </label>
                      <input
                        id="field-name"
                        type="text"
                        required
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        value={editData.name}
                        onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                        placeholder="Ex: Ana Clara Silva"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="field-city" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Cidade de Residência
                      </label>
                      <select
                        id="field-city"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        value={editData.city}
                        onChange={e => setEditData(d => ({ ...d, city: e.target.value }))}
                      >
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Redes e Contatos */}
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider">
                      Links e Redes Sociais
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="field-linkedin" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                          LinkedIn (URL ou Usuário)
                        </label>
                        <input
                          id="field-linkedin"
                          type="text"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                          value={editData.linkedin}
                          onChange={e => setEditData(d => ({ ...d, linkedin: e.target.value }))}
                          placeholder="https://linkedin.com/in/seu-perfil"
                        />
                      </div>

                      <div>
                        <label htmlFor="field-github" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                          GitHub (URL ou Usuário)
                        </label>
                        <input
                          id="field-github"
                          type="text"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                          value={editData.github}
                          onChange={e => setEditData(d => ({ ...d, github: e.target.value }))}
                          placeholder="https://github.com/seu-usuario"
                        />
                      </div>

                      <div>
                        <label htmlFor="field-instagram" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                          Instagram (@usuario)
                        </label>
                        <input
                          id="field-instagram"
                          type="text"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                          value={editData.instagram}
                          onChange={e => setEditData(d => ({ ...d, instagram: e.target.value }))}
                          placeholder="@seu.instagram"
                        />
                      </div>

                      <div>
                        <label htmlFor="field-website" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                          Portfólio / Site Pessoal
                        </label>
                        <input
                          id="field-website"
                          type="text"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                          value={editData.website}
                          onChange={e => setEditData(d => ({ ...d, website: e.target.value }))}
                          placeholder="https://meuportfolio.com"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ── SEÇÃO 2: APRESENTAÇÃO & SKILLS ── */}
              {activeEditTab === 'presentation' && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="field-bio" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                      Biografia &amp; Resumo Profissional
                    </label>
                    <textarea
                      id="field-bio"
                      rows={5}
                      className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl p-3.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none leading-relaxed"
                      value={editData.bio}
                      onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))}
                      placeholder="Apresente sua trajetória, áreas de maior interesse, competências e objetivos profissionais..."
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Dica: perfis com uma biografia clara recebem mais visualizações de recrutadores.
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                    <label htmlFor="field-new-skill" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                      Habilidades &amp; Competências
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        id="field-new-skill"
                        type="text"
                        className="flex-1 border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        placeholder="Ex: React, Node.js, Atendimento ao Cliente, Excel"
                        value={editData.newSkill}
                        onChange={e => setEditData(d => ({ ...d, newSkill: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="btn bg-primary-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 cursor-pointer"
                      >
                        Adicionar
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {editData.skills && editData.skills.length > 0 ? (
                        editData.skills.map(skill => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900/60 shadow-2xs"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="p-0.5 text-blue-400 hover:text-red-500 rounded-full transition-colors cursor-pointer"
                              title={`Remover ${skill}`}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">Nenhuma competência cadastrada ainda.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SEÇÃO 3: FORMAÇÃO / QUALIFICAÇÃO ── */}
              {activeEditTab === 'education' && (
                <div className="space-y-6">
                  
                  {/* Dados do Curso / Cargo Principal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="field-course" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        {isStudent ? 'Curso / Graduação Principal' : 'Profissão / Formação Principal'} <span className="text-primary-blue">*</span>
                      </label>
                      <input
                        id="field-course"
                        type="text"
                        required
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        value={editData.course}
                        onChange={e => setEditData(d => ({ ...d, course: e.target.value }))}
                        placeholder={isStudent ? 'Ex: Bacharelado em Sistemas de Informação' : 'Ex: Analista de Sistemas / Administrador / Desenvolvedor Web'}
                      />
                    </div>

                    <div>
                      <label htmlFor="field-institution" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Instituição de Ensino / Formação
                      </label>
                      <input
                        id="field-institution"
                        type="text"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        value={editData.institution}
                        onChange={e => setEditData(d => ({ ...d, institution: e.target.value }))}
                        placeholder={isStudent ? 'Ex: IFPR Campus Ivaiporã' : 'Ex: IFPR, UEM, Fatec ou Autodidata'}
                      />
                    </div>

                    <div>
                      <label htmlFor="field-period" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        {isStudent ? 'Período / Ano' : 'Ano de Conclusão / Período'}
                      </label>
                      <input
                        id="field-period"
                        type="text"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        value={editData.period}
                        onChange={e => setEditData(d => ({ ...d, period: e.target.value }))}
                        placeholder={isStudent ? 'Ex: 5º Período (2026)' : 'Ex: Concluído (2024) ou Em andamento'}
                      />
                    </div>
                  </div>

                  {/* Formações Complementares */}
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider">
                        Formações Complementares &amp; Cursos
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Adicione outros cursos técnicos, certificações ou graduações
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Curso / Titulação (Ex: Técnico em Informática)"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                          value={newEdu.degree}
                          onChange={e => setNewEdu(prev => ({ ...prev, degree: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Instituição (Ex: Senai)"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                          value={newEdu.institution}
                          onChange={e => setNewEdu(prev => ({ ...prev, institution: e.target.value }))}
                        />
                        <input
                          type="text"
                          placeholder="Período (Ex: 2023 - 2024)"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                          value={newEdu.period}
                          onChange={e => setNewEdu(prev => ({ ...prev, period: e.target.value }))}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addEducation}
                        className="btn bg-primary-blue hover:bg-blue-600 text-white btn-sm w-full text-xs font-bold py-2.5 rounded-xl shadow-xs cursor-pointer"
                      >
                        + Adicionar Formação
                      </button>
                    </div>

                    <div className="space-y-2">
                      {editData.education && editData.education.map((edu, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs"
                        >
                          <div>
                            <span className="font-bold text-gray-800 dark:text-white">{edu.degree}</span> · {edu.institution} ({edu.period})
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEducation(edu.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ── SEÇÃO 4: EXPERIÊNCIA E PROJETOS ── */}
              {activeEditTab === 'experience' && (
                <div className="space-y-6">
                  
                  {/* Experiências Profissionais */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider">
                        Experiências Profissionais
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Estágios, empregos anteriores ou trabalhos voluntários
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Cargo / Função (Ex: Desenvolvedor Front-end)"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                          value={newExp.role}
                          onChange={e => setNewExp(prev => ({ ...prev, role: e.target.value }))}
                        />
                        <input
                          type="text"
                          placeholder="Empresa / Organização"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                          value={newExp.company}
                          onChange={e => setNewExp(prev => ({ ...prev, company: e.target.value }))}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Período (Ex: Jan 2024 - Atual)"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                        value={newExp.period}
                        onChange={e => setNewExp(prev => ({ ...prev, period: e.target.value }))}
                      />
                      <textarea
                        rows={2}
                        placeholder="Descrição das principais responsabilidades e resultados..."
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                        value={newExp.description}
                        onChange={e => setNewExp(prev => ({ ...prev, description: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={addExperience}
                        className="btn bg-primary-blue hover:bg-blue-600 text-white btn-sm w-full text-xs font-bold py-2.5 rounded-xl shadow-xs cursor-pointer"
                      >
                        + Salvar Experiência
                      </button>
                    </div>

                    <div className="space-y-2">
                      {editData.experiences && editData.experiences.map((exp, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs"
                        >
                          <div>
                            <span className="font-bold text-gray-800 dark:text-white">{exp.role}</span> na {exp.company} ({exp.period})
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExperience(exp.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Projetos em Destaque */}
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider">
                        Portfólio de Projetos
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Projetos práticos, acadêmicos ou sistemas desenvolvidos
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
                      <input
                        type="text"
                        placeholder="Título do Projeto (Ex: Sistema de Gestão Hospitalar)"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                        value={newProj.title}
                        onChange={e => setNewProj(prev => ({ ...prev, title: e.target.value }))}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="Tecnologias Utilizadas (Ex: React, Node.js)"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                          value={newProj.tech}
                          onChange={e => setNewProj(prev => ({ ...prev, tech: e.target.value }))}
                        />
                        <input
                          type="text"
                          placeholder="Link do Projeto (GitHub ou Deploy)"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                          value={newProj.link}
                          onChange={e => setNewProj(prev => ({ ...prev, link: e.target.value }))}
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Resumo das funcionalidades desenvolvidas no projeto..."
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                        value={newProj.description}
                        onChange={e => setNewProj(prev => ({ ...prev, description: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={addProject}
                        className="btn bg-primary-blue hover:bg-blue-600 text-white btn-sm w-full text-xs font-bold py-2.5 rounded-xl shadow-xs cursor-pointer"
                      >
                        + Salvar Projeto
                      </button>
                    </div>

                    <div className="space-y-2">
                      {editData.projects && editData.projects.map((proj, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs"
                        >
                          <div>
                            <span className="font-bold text-gray-800 dark:text-white">{proj.title}</span> ({proj.tech})
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProject(proj.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-slate-800 bg-blue-50/30 dark:bg-slate-900/75 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={saving}
                className="btn border border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white bg-blue-50/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving || uploadingAvatar}
                className="btn bg-primary-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer transition-all"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                {saving ? 'Salvando alterações...' : 'Salvar alterações'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL SOLICITAR PARECER A PROFESSOR ── */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Send size={18} className="text-primary-blue" /> Solicitar Parecer Acadêmico
              </h3>
              <button onClick={() => setRequestModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {requestError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {requestError}
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Nome do Professor</label>
                <input
                  type="text"
                  required
                  className="input w-full text-xs"
                  placeholder="Ex: Prof. Dr. Carlos Silva"
                  value={requestForm.profName}
                  onChange={e => setRequestForm(f => ({ ...f, profName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">E-mail Institucional do Docente</label>
                <input
                  type="email"
                  required
                  className="input w-full text-xs"
                  placeholder="professor@ifpr.edu.br"
                  value={requestForm.profEmail}
                  onChange={e => setRequestForm(f => ({ ...f, profEmail: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Disciplina / Projeto</label>
                <input
                  type="text"
                  required
                  className="input w-full text-xs"
                  placeholder="Ex: Engenharia de Software"
                  value={requestForm.discipline}
                  onChange={e => setRequestForm(f => ({ ...f, discipline: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Mensagem para o Professor (Opcional)</label>
                <textarea
                  rows={3}
                  className="input w-full text-xs"
                  placeholder="Olá Professor, gostaria de solicitar uma recomendação para o meu perfil no Ivaí Conecta..."
                  value={requestForm.message}
                  onChange={e => setRequestForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestModal(false)}
                  className="btn border border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white bg-blue-50/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn bg-primary-blue hover:bg-blue-600 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  Enviar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL PROFESSOR RECOMENDA ALUNO ── */}
      {proactiveEndorseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Award size={18} className="text-primary-blue" /> Recomendar {talent.name}
              </h3>
              <button onClick={() => setProactiveEndorseModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProactiveEndorseSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Disciplina Lecionada</label>
                <input
                  type="text"
                  required
                  className="input w-full text-xs"
                  value={proactiveDiscipline}
                  onChange={e => setProactiveDiscipline(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">Parecer / Citação de Destaque</label>
                <textarea
                  rows={4}
                  required
                  className="input w-full text-xs"
                  placeholder="Ex: Aluno extremamente dedicado, com excelente capacidade lógica e perfil colaborativo..."
                  value={proactiveQuote}
                  onChange={e => setProactiveQuote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProactiveEndorseModal(false)}
                  className="btn border border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white bg-blue-50/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn bg-primary-blue hover:bg-blue-600 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  Emitir Parecer Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE CURRÍCULO EM PDF ── */}
      {pdfModalOpen && (
        <ResumePDFModal
          talent={talent}
          isOpen={pdfModalOpen}
          onClose={() => setPdfModalOpen(false)}
        />
      )}

    </div>
  );
}
