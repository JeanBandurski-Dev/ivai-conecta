import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award, Building2, MapPin, CheckCircle2, ShieldCheck,
  Edit3, ArrowLeft, BookOpen, GraduationCap, Users, X, Eye, Plus, Trash2,
  MessageSquare, Calendar, Camera, Image as ImageIcon, Share2, Sparkles, Loader2, Check,
  ChevronDown, User
} from 'lucide-react';
import {
  getTeacherById, getTeacherEndorsedStudents, updateTeacherProfile,
  uploadUserProfilePicture, uploadUserCoverPicture,
  DEFAULT_AVATAR, DEFAULT_BANNER
} from '../lib/ivaiConecta';
import TalentCard from '../components/TalentCard';
import useAppStore from '../store/useAppStore';

const BANNER_PRESETS = [
  { id: 'academic', name: 'Campus & Auditório', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1600' },
  { id: 'library', name: 'Biblioteca & Pesquisa', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1600' },
  { id: 'tech', name: 'Laboratório de Inovação', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1600' },
  { id: 'classroom', name: 'Sala de Aula Interativa', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1600' },
];

export default function PerfilProfessor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, showToast, startChatWith } = useAppStore();

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const teacherId = id || (currentUser?.role === 'professor' ? (currentUser?.uid || currentUser?.id) : null);
  const teacher = getTeacherById(teacherId) || (currentUser?.role === 'professor' ? {
    id: currentUser.uid || currentUser.id,
    firestoreId: currentUser.uid || currentUser.id,
    name: currentUser.name || 'Professor Docente',
    email: currentUser.email || '',
    degree: currentUser.degree || 'Docente / Pesquisador',
    institution: currentUser.institution || 'IFPR Campus Ivaiporã',
    discipline: currentUser.discipline || 'Ensino Superior & Técnico',
    endorsementCount: currentUser.endorsementCount || 0,
    avatar: currentUser.avatar || '',
    banner: currentUser.banner || DEFAULT_BANNER,
    bio: currentUser.bio || '',
    classes: currentUser.classes || [],
    education: currentUser.education || [],
  } : null);

  const endorsedStudents = getTeacherEndorsedStudents(teacher?.email);

  const isOwner = Boolean(
    currentUser && teacher && (
      (currentUser.email && teacher?.email && currentUser.email.toLowerCase() === teacher.email.toLowerCase()) ||
      (currentUser.uid != null && (String(currentUser.uid) === String(teacher?.id) || String(currentUser.uid) === String(teacher?.firestoreId))) ||
      (currentUser.id != null && String(currentUser.id) === String(teacher?.id))
    )
  );

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'education'
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState('identity');
  const [coverModalOpen, setCoverModalOpen] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState({
    name: teacher?.name || '',
    avatar: teacher?.avatar || '',
    banner: teacher?.banner || DEFAULT_BANNER,
    degree: teacher?.degree || '',
    institution: teacher?.institution || 'IFPR Campus Ivaiporã',
    discipline: teacher?.discipline || '',
    bio: teacher?.bio || '',
    classes: [...(teacher?.classes || [])],
    education: [...(teacher?.education || [])],
    newClass: '',
    newEdu: { degree: '', institution: '', period: '' }
  });

  useEffect(() => {
    if (teacher) {
      setEditData({
        name: teacher.name || '',
        avatar: teacher.avatar || '',
        banner: teacher.banner || DEFAULT_BANNER,
        degree: teacher.degree || '',
        institution: teacher.institution || 'IFPR Campus Ivaiporã',
        discipline: teacher.discipline || '',
        bio: teacher.bio || '',
        classes: [...(teacher.classes || [])],
        education: [...(teacher.education || [])],
        newClass: '',
        newEdu: { degree: '', institution: '', period: '' }
      });
    }
  }, [teacher]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('🔗 Link do perfil docente copiado com sucesso!');
  };

  // Upload Foto
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ A foto deve ter no máximo 5MB.');
      return;
    }

    setUploadingAvatar(true);
    showToast('Enviando foto de perfil...');
    try {
      const res = await uploadUserProfilePicture(file, currentUser?.uid || teacher?.id);
      if (res.success) {
        setEditData(d => ({ ...d, avatar: res.url }));
        if (currentUser) {
          setCurrentUser({ ...currentUser, avatar: res.url });
        }
        showToast('Foto do perfil docente atualizada!');
      } else {
        showToast(res.error || 'Erro ao carregar a foto.');
      }
    } catch {
      showToast('Erro ao processar imagem.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Upload Capa
  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('⚠️ A imagem de capa deve ter no máximo 8MB.');
      return;
    }

    setUploadingCover(true);
    showToast('Enviando nova imagem de capa...');
    try {
      const res = await uploadUserCoverPicture(file, currentUser?.uid || teacher?.id);
      if (res.success) {
        setEditData(d => ({ ...d, banner: res.url }));
        if (currentUser) {
          setCurrentUser({ ...currentUser, banner: res.url });
        }
        setCoverModalOpen(false);
        showToast('Capa do perfil docente atualizada com sucesso!');
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
    await updateTeacherProfile(teacher.firestoreId || teacher.id, { banner: presetUrl });
    setCoverModalOpen(false);
    showToast('Capa atualizada com sucesso!');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!teacher) return;
    setSaving(true);
    try {
      await updateTeacherProfile(teacher.firestoreId || teacher.id, editData);
      if (isOwner && currentUser) {
        setCurrentUser({
          ...currentUser,
          name: editData.name,
          avatar: editData.avatar,
          banner: editData.banner,
          degree: editData.degree,
          institution: editData.institution,
          discipline: editData.discipline,
          bio: editData.bio,
          classes: editData.classes,
          education: editData.education
        });
      }
      showToast('🎉 Perfil acadêmico e formações atualizados com sucesso!');
      setEditModalOpen(false);
    } catch (err) {
      showToast('Erro ao salvar dados: ' + err.message);
    } finally {
      setSaving(false);
    }
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
      period: editData.newEdu.period.trim() || 'Concluído'
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

  if (!teacher) {
    return (
      <main className="container section text-center py-24">
        <GraduationCap size={54} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
        <h2 className="font-heading text-2xl font-bold text-gray-700 dark:text-white mb-2">Perfil de Docente não encontrado</h2>
        <p className="text-gray-500 dark:text-slate-300 mb-6">O perfil solicitado não foi localizado no banco de dados acadêmico.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary px-6 py-2.5 font-bold">
          Voltar para a Página Inicial
        </button>
      </main>
    );
  }

  const currentBanner = editData.banner || teacher.banner || DEFAULT_BANNER;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 pb-20">

      {/* ── HERO HEADER COM BANNER DE CAPA ── */}
      <section className="relative w-full overflow-hidden bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        
        {/* Banner Area */}
        <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden group">
          <img
            src={currentBanner}
            alt="Capa do Docente"
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
                    src={teacher.avatar || DEFAULT_AVATAR}
                    alt={teacher.name}
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
                    {teacher.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck size={13} /> Docente Verificado
                  </span>
                </div>

                <div className="text-teal-200 font-medium text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <GraduationCap size={16} className="text-teal-400" />
                  <span>{teacher.degree || 'Professor do Ensino Superior & Técnico'}</span>
                </div>

                {/* Chips Meta Row */}
                <div className="flex items-center justify-center sm:justify-start gap-3.5 text-xs text-slate-300 flex-wrap pt-1">
                  <span className="flex items-center gap-1">
                    <Building2 size={13} className="text-slate-400" /> {teacher.institution || 'IFPR Campus Ivaiporã'}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={13} className="text-slate-400" /> {teacher.discipline || 'Área Acadêmica'}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-teal-300 font-semibold">
                    <Award size={13} /> {endorsedStudents.length} Recomendações Emitidas
                  </span>
                </div>

              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-center sm:justify-end gap-2.5 w-full md:w-auto flex-wrap">
              
              {/* Se Visitante: Iniciar Conversa */}
              {!isOwner && (
                <button
                  onClick={() => {
                    startChatWith({
                      name: teacher.name,
                      email: teacher.email || 'professor@ifpr.edu.br',
                      role: 'professor',
                      avatar: teacher.avatar || ''
                    }, `Contato Acadêmico: Docente ${teacher.name}`);
                  }}
                  className="btn btn-primary px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-brand flex items-center gap-2"
                >
                  <MessageSquare size={16} /> Enviar Mensagem
                </button>
              )}

              {/* Compartilhar */}
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-sm"
                title="Compartilhar Perfil"
              >
                <Share2 size={16} />
              </button>

              {/* Se Proprietário: Editar */}
              {isOwner && (
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="btn bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg border border-amber-300 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 size={16} /> Editar Perfil
                </button>
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
              <Sparkles size={15} /> Visão Geral &amp; Biografia
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-primary-blue text-white shadow-brand'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Award size={15} /> Alunos Recomendados ({endorsedStudents.length})
            </button>

            <button
              onClick={() => setActiveTab('education')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'education'
                  ? 'bg-primary-blue text-white shadow-brand'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <GraduationCap size={15} /> Formações &amp; Titulações ({teacher.education?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO DAS ABAS ── */}
      <main className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* ── ABA 1: VISÃO GERAL & BIOGRAFIA ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Coluna Principal (8 colunas) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Biografia */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5 mb-4">
                  <Sparkles size={18} className="text-primary-blue dark:text-blue-400" /> Sobre o Docente
                </h2>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {teacher.bio || (isOwner
                    ? 'Nenhuma apresentação cadastrada. Clique em "Editar Perfil" para descrever suas linhas de pesquisa, disciplinas ministradas e projetos acadêmicos.'
                    : 'Apresentação docente não informada.')}
                </p>
              </div>

              {/* Disciplinas e Turmas */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                    <BookOpen size={18} className="text-primary-blue dark:text-blue-400" /> Disciplinas &amp; Áreas Lecionadas
                  </h2>
                  {isOwner && (
                    <button
                      onClick={() => { setActiveEditTab('classes'); setEditModalOpen(true); }}
                      className="text-xs font-bold text-primary-blue hover:underline"
                    >
                      Gerenciar Disciplinas
                    </button>
                  )}
                </div>

                {!teacher.classes || teacher.classes.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    {teacher.discipline ? `Área principal: ${teacher.discipline}` : 'Nenhuma disciplina específica listada.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {teacher.classes.map((cls, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                          <BookOpen size={16} />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200">{cls}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Coluna Lateral (4 colunas) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Informações Institucionais */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 space-y-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={17} className="text-teal-600" /> Vínculo Institucional
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-gray-500">Instituição:</span>
                    <span className="font-semibold text-gray-800 dark:text-slate-200">{teacher.institution || 'IFPR Campus Ivaiporã'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-gray-500">Titulação:</span>
                    <span className="font-semibold text-gray-800 dark:text-slate-200">{teacher.degree || 'Docente'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-700">
                    <span className="text-gray-500">Área Principal:</span>
                    <span className="font-semibold text-gray-800 dark:text-slate-200">{teacher.discipline || 'Tecnologia'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-gray-500">Status no Portal:</span>
                    <span className="font-bold text-emerald-500">Docente Credenciado</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── ABA 2: ALUNOS RECOMENDADOS ── */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Award size={20} className="text-teal-600" /> Alunos Endossados por {teacher.name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Estudantes que receberam parecer formal de recomendação acadêmica e profissional</p>
              </div>

              {endorsedStudents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                  <Award size={40} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">Nenhum parecer acadêmico emitido no momento</p>
                  <p className="text-xs text-gray-400 mt-1">As recomendações aprovadas pelo professor serão exibidas nesta seção pública.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {endorsedStudents.map(student => (
                    <TalentCard key={student.id} talent={student} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ABA 3: FORMAÇÕES & TITULAÇÕES ── */}
        {activeTab === 'education' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-brand p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <GraduationCap size={20} className="text-primary-blue dark:text-blue-400" /> Trajetória Acadêmica &amp; Titulações
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Graduações, pós-graduações, mestrados e doutorados</p>
              </div>
              {isOwner && (
                <button
                  onClick={() => { setActiveEditTab('education'); setEditModalOpen(true); }}
                  className="btn btn-outline btn-sm rounded-xl text-xs font-bold"
                >
                  <Edit3 size={14} /> Editar Formações
                </button>
              )}
            </div>

            {!teacher.education || teacher.education.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500">Nenhuma titulação complementar cadastrada.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teacher.education.map((edu, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{edu.degree}</h3>
                      <p className="text-xs text-gray-600 dark:text-slate-400">{edu.institution}</p>
                      <span className="inline-block mt-1 text-xs text-teal-600 dark:text-teal-400 font-semibold">{edu.period}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── MODAL ALTERAR CAPA ── */}
      {coverModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-primary-blue" /> Personalizar Capa do Perfil Docente
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
                  Ou Enviar Imagem Personalizada (Até 8MB)
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
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-primary-blue text-sm font-bold text-gray-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {uploadingCover ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                  {uploadingCover ? 'Enviando imagem...' : 'Selecionar Imagem do Computador'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL COMPLETO DE EDIÇÃO DO DOCENTE (UX SÊNIOR E BOTÕES AZUIS) ── */}
      {editModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-teacher-title"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] md:max-h-[85vh] flex flex-col border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h3 id="edit-teacher-title" className="font-heading font-extrabold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit3 size={20} className="text-primary-blue dark:text-blue-400" /> Editar perfil docente
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                  Atualize suas credenciais acadêmicas, titulações, disciplinas e biografia docente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
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
                  { id: 'identity', label: 'Identidade e foto' },
                  { id: 'bio', label: 'Apresentação e bio' },
                  { id: 'classes', label: 'Disciplinas' },
                  { id: 'education', label: 'Formações' },
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
                <label htmlFor="mobile-teacher-tab-select" className="text-xs font-bold text-primary-blue dark:text-blue-300 shrink-0">
                  Seção:
                </label>
                <div className="relative flex-1">
                  <select
                    id="mobile-teacher-tab-select"
                    value={activeEditTab}
                    onChange={e => setActiveEditTab(e.target.value)}
                    className="w-full appearance-none bg-blue-50/60 dark:bg-slate-800 border border-blue-300 dark:border-blue-800 rounded-xl px-3.5 py-2 text-xs font-bold text-primary-blue dark:text-blue-300 pr-8 focus:ring-2 focus:ring-primary-blue/20 outline-none"
                  >
                    <option value="identity">Identidade e foto</option>
                    <option value="bio">Apresentação e bio</option>
                    <option value="classes">Disciplinas</option>
                    <option value="education">Formações</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
              
              {/* ABA 1: Identidade e Foto */}
              {activeEditTab === 'identity' && (
                <div className="space-y-6">
                  
                  {/* Controle e Prévia da Foto */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-primary-blue/30 shadow-sm bg-white dark:bg-slate-900 flex items-center justify-center">
                        <img
                          src={editData.avatar || DEFAULT_AVATAR}
                          alt="Foto do Docente"
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
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Foto de Perfil Docente</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Formatos aceitos: JPG, PNG ou WEBP. Tamanho máximo recomendado: 5MB.
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1 flex-wrap">
                        <input
                          type="file"
                          ref={avatarInputRef}
                          onChange={handleAvatarFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="btn bg-primary-blue hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                        >
                          <Camera size={14} /> {editData.avatar ? 'Trocar foto' : 'Adicionar foto'}
                        </button>
                        {editData.avatar && (
                          <button
                            type="button"
                            onClick={() => setEditData(d => ({ ...d, avatar: '' }))}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-primary-blue dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 hover:bg-blue-200 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                          >
                            Remover foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Campos Pessoais e Institucionais */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="teacher-field-name" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Nome Completo <span className="text-primary-blue">*</span>
                      </label>
                      <input
                        id="teacher-field-name"
                        type="text"
                        required
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        value={editData.name}
                        onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                        placeholder="Nome do docente"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="teacher-field-degree" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                          Titulação Principal
                        </label>
                        <input
                          id="teacher-field-degree"
                          type="text"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                          value={editData.degree}
                          onChange={e => setEditData(d => ({ ...d, degree: e.target.value }))}
                          placeholder="Ex: Prof. Dr. / Mestre em Ciência da Computação"
                        />
                      </div>

                      <div>
                        <label htmlFor="teacher-field-institution" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                          Instituição de Ensino
                        </label>
                        <input
                          id="teacher-field-institution"
                          type="text"
                          className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                          value={editData.institution}
                          onChange={e => setEditData(d => ({ ...d, institution: e.target.value }))}
                          placeholder="Ex: IFPR Campus Ivaiporã"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="teacher-field-discipline" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                        Área de Atuação / Disciplina Principal
                      </label>
                      <input
                        id="teacher-field-discipline"
                        type="text"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        value={editData.discipline}
                        onChange={e => setEditData(d => ({ ...d, discipline: e.target.value }))}
                        placeholder="Ex: Engenharia de Software & Banco de Dados"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* ABA 2: Bio & Linhas de Pesquisa */}
              {activeEditTab === 'bio' && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="teacher-field-bio" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                      Biografia Acadêmica &amp; Linhas de Pesquisa
                    </label>
                    <textarea
                      id="teacher-field-bio"
                      rows={6}
                      className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl p-3.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none leading-relaxed"
                      value={editData.bio}
                      onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))}
                      placeholder="Descreva suas áreas de especialidade, projetos de extensão, linhas de pesquisa e histórico acadêmico com os discentes..."
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Dica: seu resumo acadêmico confere credibilidade às recomendações emitidas para seus alunos.
                    </span>
                  </div>
                </div>
              )}

              {/* ABA 3: Disciplinas */}
              {activeEditTab === 'classes' && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="teacher-field-new-class" className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5 block">
                      Adicionar Disciplina Lecionada
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        id="teacher-field-new-class"
                        type="text"
                        className="flex-1 border border-gray-300 dark:border-slate-700 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm transition-all outline-none"
                        placeholder="Ex: Algoritmos e Estruturas de Dados"
                        value={editData.newClass}
                        onChange={e => setEditData(d => ({ ...d, newClass: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addClassItem(); } }}
                      />
                      <button
                        type="button"
                        onClick={addClassItem}
                        className="btn bg-primary-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 cursor-pointer"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider block mb-2">
                      Disciplinas Cadastradas ({editData.classes?.length || 0}):
                    </label>
                    {editData.classes && editData.classes.length > 0 ? (
                      editData.classes.map((cls, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/40 dark:bg-slate-800/60 border border-blue-100/70 dark:border-slate-700 text-xs font-semibold text-gray-800 dark:text-slate-200">
                          <span>{cls}</span>
                          <button
                            type="button"
                            onClick={() => removeClassItem(cls)}
                            className="p-1 text-blue-400 hover:text-red-500 rounded-full transition-colors cursor-pointer"
                            title={`Remover ${cls}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">Nenhuma disciplina cadastrada ainda.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 4: Formações */}
              {activeEditTab === 'education' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider mb-1">
                      Adicionar Titulação Acadêmica
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                      Graduações, especializações, mestrados ou doutorados
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
                    <input
                      type="text"
                      placeholder="Titulação / Grau (Ex: Doutorado em Ciência da Computação)"
                      className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                      value={editData.newEdu.degree}
                      onChange={e => setEditData(d => ({ ...d, newEdu: { ...d.newEdu, degree: e.target.value } }))}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        placeholder="Universidade / Instituição"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                        value={editData.newEdu.institution}
                        onChange={e => setEditData(d => ({ ...d, newEdu: { ...d.newEdu, institution: e.target.value } }))}
                      />
                      <input
                        type="text"
                        placeholder="Ano de Conclusão (Ex: 2020)"
                        className="w-full border border-gray-300 dark:border-slate-700 focus:border-primary-blue rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-xs outline-none"
                        value={editData.newEdu.period}
                        onChange={e => setEditData(d => ({ ...d, newEdu: { ...d.newEdu, period: e.target.value } }))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addEducationItem}
                      className="btn bg-primary-blue hover:bg-blue-600 text-white btn-sm w-full text-xs font-bold py-2.5 rounded-xl shadow-xs cursor-pointer"
                    >
                      + Adicionar Formação
                    </button>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-primary-blue dark:text-blue-400 uppercase tracking-wider block mb-2">
                      Formações Registradas:
                    </label>
                    {editData.education && editData.education.length > 0 ? (
                      editData.education.map((edu, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs">
                          <div>
                            <span className="font-bold text-gray-800 dark:text-white">{edu.degree}</span> · {edu.institution} ({edu.period})
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEducationItem(idx)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-full transition-colors cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">Nenhuma formação cadastrada ainda.</p>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-slate-800 bg-blue-50/30 dark:bg-slate-900/75 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
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
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
