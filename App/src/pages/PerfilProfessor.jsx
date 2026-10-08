import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award, Building2, ShieldCheck,
  Edit3, ArrowLeft, ArrowRight, BookOpen, GraduationCap, Users, Plus, MessageSquare, Calendar
} from 'lucide-react';
import {
  getTeacherById, getTalents, subscribeToTalents, updateTeacherProfile,
  subscribeToEndorsementRequests, deduplicateRequestsByStudent,
  hasTeacherEndorsedStudent, sanitizeUniqueEndorsements, isSameProfessor, getTalentById,
  uploadUserProfilePicture
} from '../lib/ivaiConecta';
import { db } from '../lib/firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import TalentCard from '../components/TalentCard';
import EditTeacherProfileModal from '../components/EditTeacherProfileModal';
import { isGenericPlaceholderAvatar, getAvatarGradient } from '../services/chatService';
import useAppStore from '../store/useAppStore';

export default function PerfilProfessor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, showToast, startChatWith, setCurrentUser } = useAppStore();

  const teacherId = id || (currentUser?.role === 'professor' ? (currentUser?.uid || currentUser?.id) : null);
  const [liveTeacherDoc, setLiveTeacherDoc] = useState(null);

  useEffect(() => {
    if (!teacherId) return;
    try {
      const unsub = onSnapshot(doc(db, 'users', String(teacherId)), (snap) => {
        if (snap.exists()) {
          setLiveTeacherDoc({ id: snap.id, firestoreId: snap.id, ...snap.data() });
        }
      }, () => {});
      return () => unsub();
    } catch {}
  }, [teacherId]);

  const teacher = liveTeacherDoc || getTeacherById(teacherId) || (currentUser?.role === 'professor' ? {
    id: currentUser.uid || currentUser.id,
    firestoreId: currentUser.uid || currentUser.id,
    name: currentUser.name || 'Professor Docente',
    email: currentUser.email || '',
    degree: currentUser.degree || 'Docente / Pesquisador',
    institution: currentUser.institution || 'IFPR Campus Ivaiporã',
    discipline: currentUser.discipline || 'Ensino Superior & Técnico',
    endorsementCount: currentUser.endorsementCount || 0,
    avatar: currentUser.avatar || '',
    bio: currentUser.bio || '',
    classes: currentUser.classes || [],
    education: currentUser.education || [],
  } : null);

  const isOwner = Boolean(
    currentUser && teacher && (
      (currentUser.email && teacher?.email && currentUser.email.toLowerCase() === teacher.email.toLowerCase()) ||
      (currentUser.uid != null && (String(currentUser.uid) === String(teacher?.id) || String(currentUser.uid) === String(teacher?.firestoreId))) ||
      (currentUser.id != null && String(currentUser.id) === String(teacher?.id))
    )
  );

  const [liveTalents, setLiveTalents] = useState(() => getTalents('Todas as Cidades'));
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    const unsub = subscribeToTalents('Todas as Cidades', (data) => {
      if (Array.isArray(data)) setLiveTalents(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'professor' && currentUser.role !== 'docente')) return;
    const unsub = subscribeToEndorsementRequests(currentUser, (reqs) => {
      if (Array.isArray(reqs)) {
        setPendingRequests(deduplicateRequestsByStudent(reqs).filter(r => r.status === 'Pendente'));
      }
    });
    return () => unsub();
  }, [currentUser]);

  const endorsedStudents = useMemo(() => {
    if (!teacher) return [];
    const profEmails = [teacher.profEmail, teacher.teacherEmail, teacher.email].filter(Boolean).map(e => String(e).toLowerCase().trim());
    const profUid = String(teacher.firestoreId || teacher.id || teacher.uid || '');

    // 1. Alunos de liveTalents que já possuem este professor em t.endorsements
    const matchedFromTalents = (liveTalents || []).filter(t =>
      hasTeacherEndorsedStudent(t.endorsements || [], teacher) ||
      (t.endorsements?.some(e => {
        const eEmail = (e.profEmail || e.teacherEmail || e.email || '').toLowerCase().trim();
        return eEmail && profEmails.includes(eEmail);
      })) ||
      (profUid && t.endorsements?.some(e => String(e.profUid || '') === profUid))
    );

    const studentMap = new Map();
    matchedFromTalents.forEach(s => {
      const sId = String(s.id || s.firestoreId || s.uid);
      studentMap.set(sId, s);
    });

    // 2. Alunos registrados em endorsementResponses no perfil do professor (Firestore)
    const allResponses = [
      ...(Array.isArray(teacher.endorsementResponses) ? teacher.endorsementResponses : []),
      ...(liveTeacherDoc && Array.isArray(liveTeacherDoc.endorsementResponses) ? liveTeacherDoc.endorsementResponses : []),
      ...(isOwner && currentUser && Array.isArray(currentUser.endorsementResponses) ? currentUser.endorsementResponses : [])
    ];

    const approvedResponses = allResponses.filter(r => r && r.status === 'Aprovado' && r.studentId);

    approvedResponses.forEach(resp => {
      const sId = String(resp.studentId);
      const existing = studentMap.get(sId);
      const talentBase = existing || (liveTalents || []).find(t => String(t.id) === sId || String(t.firestoreId) === sId) || getTalentById(sId);

      if (talentBase) {
        const teacherEndorsement = {
          id: `end_${resp.reqId || resp.timestamp || Date.now()}`,
          profUid: profUid || String(teacher.id || ''),
          profName: teacher.name || 'Professor Docente',
          profEmail: teacher.profEmail || teacher.teacherEmail || teacher.email || '',
          institution: teacher.institution || 'IFPR Campus Ivaiporã',
          discipline: resp.discipline || teacher.discipline || 'Formação Acadêmica',
          quote: resp.quote || 'Estudante com excelente desempenho acadêmico e postura ética comprovada.',
          isVerified: true,
          date: resp.date || new Date().toLocaleDateString('pt-BR'),
          timestamp: resp.timestamp || Date.now()
        };

        const existingEndorsements = Array.isArray(talentBase.endorsements) ? talentBase.endorsements : [];
        const mergedEndorsements = sanitizeUniqueEndorsements([teacherEndorsement, ...existingEndorsements]);

        studentMap.set(sId, {
          ...talentBase,
          id: talentBase.id || sId,
          endorsements: mergedEndorsements,
          endorsementCount: mergedEndorsements.length,
          isVerifiedStudent: true
        });
      }
    });

    return Array.from(studentMap.values());
  }, [liveTalents, teacher, liveTeacherDoc, isOwner, currentUser]);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students'
  const [editModal, setEditModal] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState({
    name: teacher?.name || '',
    avatar: teacher?.avatar || '',
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
    if (teacher && editModal) {
      setEditData({
        name: teacher.name || '',
        avatar: teacher.avatar || '',
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
  }, [teacher, editModal]);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!teacher) return;
    const targetId = teacher.firestoreId || teacher.id;
    await updateTeacherProfile(targetId, editData);
    if (isOwner && currentUser && typeof setCurrentUser === 'function') {
      setCurrentUser({
        ...currentUser,
        ...editData
      });
    }
    showToast('🎉 Perfil acadêmico e matérias atualizados com sucesso!');
    setEditModal(false);
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast('Enviando foto para o Firebase Storage...');
      const targetId = teacher?.firestoreId || teacher?.id || currentUser?.uid;
      const res = await uploadUserProfilePicture(file, targetId);
      if (res.success) {
        setEditData(d => ({ ...d, avatar: res.url }));
        showToast('Foto do docente salva com sucesso!');
      } else {
        showToast(res.error || 'Erro ao enviar foto.');
      }
    }
  };

  if (!teacher) {
    return (
      <main className="container section text-center py-24">
        <GraduationCap size={54} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
        <h2 className="font-heading text-2xl font-bold text-gray-700 dark:text-white mb-2">Perfil de Docente não encontrado</h2>
        <p className="text-gray-500 dark:text-slate-300 mb-6">O perfil do professor solicitado não foi localizado.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary px-6 py-2.5 font-bold">
          Voltar para a Página Inicial
        </button>
      </main>
    );
  }

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
            <div className="flex flex-wrap items-center gap-5 sm:gap-6 min-w-0 flex-1 max-w-full">
              {teacher.avatar && !isGenericPlaceholderAvatar(teacher.avatar) ? (
                <img
                  src={teacher.avatar}
                  alt={teacher.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white/30 object-cover shadow-brand-lg shrink-0 bg-white dark:bg-slate-800"
                />
              ) : (
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white/30 bg-gradient-to-tr ${getAvatarGradient(teacher.name)} text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-brand-lg shrink-0`}
                >
                  {(teacher.name || 'P').slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1 max-w-full">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white break-words [overflow-wrap:anywhere] max-w-full">{teacher.name}</h1>
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
                  <span className="flex items-center gap-1.5">
                    <Award size={14} className="text-amber-400" />
                    {Math.max(teacher.endorsementCount || 0, endorsedStudents.length)} {Math.max(teacher.endorsementCount || 0, endorsedStudents.length) === 1 ? 'Indicação Concedida' : 'Indicações Concedidas'}
                  </span>
                </div>
              </div>
            </div>

            {isOwner ? (
              <div className="flex items-center gap-3 flex-wrap">
                <Link to="/minhas-vagas" className="btn btn-teal text-white font-bold btn-sm shadow-md flex items-center gap-1.5 cursor-pointer">
                  <Award size={15} /> Pareceres de Alunos ({pendingRequests.length})
                </Link>
                <button onClick={() => setEditModal(true)} className="btn btn-outline border-white/40 text-white font-bold btn-sm shadow-md cursor-pointer">
                  <Edit3 size={15} /> Editar Perfil Acadêmico
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => {
                    startChatWith({
                      name: teacher.name,
                      email: teacher.email,
                      role: 'professor',
                      avatar: teacher.avatar || ''
                    }, `Orientação Acadêmica: ${teacher.discipline}`);
                  }}
                  className="btn bg-white dark:bg-slate-800 text-primary-dark dark:text-white font-bold btn-sm shadow-md hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer border border-white/20"
                >
                  <MessageSquare size={15} /> Falar com o Docente
                </button>
              </div>
            )}
          </div>

          {/* Banner de Solicitações Pendentes (Visível se houver alunos aguardando) */}
          {isOwner && pendingRequests.length > 0 && (
            <div className="mt-6 bg-amber-500/20 border border-amber-400/40 rounded-2xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4 shadow-sm backdrop-blur-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center shrink-0 font-bold">
                  <Award size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">
                    Você tem {pendingRequests.length} {pendingRequests.length === 1 ? 'aluno aguardando sua recomendação' : 'alunos aguardando sua recomendação'}!
                  </h4>
                  <p className="text-xs text-amber-200 mt-0.5">
                    Estudantes solicitaram seu parecer pedagógico para comprovação curricular e selo verificado.
                  </p>
                </div>
              </div>
              <Link to="/minhas-vagas" className="btn btn-teal btn-sm font-bold text-xs flex items-center gap-1.5 shadow-md">
                Avaliar Solicitações no Painel <ArrowRight size={14} />
              </Link>
            </div>
          )}

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
                  <div className="text-xs bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 p-2 rounded-lg border border-green-200 dark:border-green-800 mt-2 font-medium flex items-center gap-1">
                    <ShieldCheck size={13} /> E-mail Educacional Autenticado pelo Sistema
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Formação Acadêmica Múltipla (Titulação - Instituição - Período) */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="card">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white flex items-center gap-2">
                    <GraduationCap size={20} className="text-primary-blue dark:text-blue-400" /> Formações Acadêmicas &amp; Período de Estudo
                  </h3>
                  {isOwner && (
                    <button
                      onClick={() => setEditModal(true)}
                      className="btn btn-outline btn-sm text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Gerenciar Formações
                    </button>
                  )}
                </div>

                {(!teacher.education || teacher.education.length === 0) ? (
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 text-center">
                    <GraduationCap size={28} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                    <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Nenhuma formação acadêmica cadastrada ainda.
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-3">
                      Adicione suas titulações, pós-graduações e períodos acadêmicos para valorizar seu perfil.
                    </p>
                    {isOwner && (
                      <button
                        onClick={() => setEditModal(true)}
                        className="btn btn-teal btn-sm text-xs font-bold cursor-pointer"
                      >
                        <Plus size={13} /> Adicionar Formação
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teacher.education.map((edu, idx) => (
                      <div key={idx} className="border-l-3 border-primary-blue pl-4 py-1.5 space-y-1 bg-gray-50/50 dark:bg-slate-800/40 p-3 rounded-r-2xl border-y border-r border-gray-100 dark:border-slate-800">
                        <div className="font-extrabold text-gray-900 dark:text-white text-base">{edu.degree}</div>
                        <div className="text-xs font-bold text-primary-blue dark:text-blue-400 flex items-center justify-between">
                          <span className="flex items-center gap-1"><Building2 size={12} /> {edu.institution}</span>
                          <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                            <Calendar size={11} /> {edu.period || edu.year || 'Período Vigente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-heading text-lg font-bold text-primary-dark dark:text-white flex items-center gap-2">
                    <BookOpen size={20} className="text-primary-blue dark:text-blue-400" /> Disciplinas Ministradas &amp; Turmas
                  </h3>
                  {isOwner && (
                    <button
                      onClick={() => setEditModal(true)}
                      className="btn btn-outline btn-sm text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Gerenciar Matérias
                    </button>
                  )}
                </div>

                {(!teacher.classes || teacher.classes.length === 0) ? (
                  <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 text-center">
                    <BookOpen size={28} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                    <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Nenhuma matéria cadastrada ainda.
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-3">
                      Cadastre as matérias que você leciona para que seus estudantes possam selecioná-las ao solicitar pareceres.
                    </p>
                    {isOwner && (
                      <button
                        onClick={() => setEditModal(true)}
                        className="btn btn-teal btn-sm text-xs font-bold cursor-pointer"
                      >
                        <Plus size={13} /> Adicionar Minhas Matérias
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {teacher.classes.map((cls, idx) => (
                      <span key={idx} className="tag tag-blue text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold">
                        <BookOpen size={12} /> {cls}
                      </span>
                    ))}
                  </div>
                )}
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
                {endorsedStudents.map(student => {
                  const endorsement = student.endorsements?.find(e => isSameProfessor(e, teacher));
                  return (
                    <div key={student.id} className="flex flex-col h-full group">
                      <TalentCard talent={student} />
                      {endorsement?.quote && (
                        <div className="-mt-1.5 mx-1 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-b-2xl p-3.5 text-xs text-emerald-900 dark:text-emerald-200 shadow-2xs transition-all">
                          <div className="font-bold flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 mb-1">
                            <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            Parecer Concedido pelo Docente:
                          </div>
                          <p className="italic text-gray-700 dark:text-emerald-100/90 font-medium leading-relaxed">
                            "{endorsement.quote}"
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-2 pt-1.5 border-t border-emerald-200/60 dark:border-emerald-800/40">
                            <span>Disciplina: <strong className="text-emerald-900 dark:text-emerald-200">{endorsement.discipline || teacher.discipline}</strong></span>
                            <span>{endorsement.date}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Modal Padronizado: Editar Perfil do Professor */}
      <EditTeacherProfileModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        editData={editData}
        setEditData={setEditData}
        handleSaveProfile={handleSaveProfile}
        handleAvatarFileChange={handleAvatarFileChange}
      />
    </>
  );
}
