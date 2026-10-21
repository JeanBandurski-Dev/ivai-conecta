import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  GraduationCap, Building2, MapPin, Award, ShieldCheck,
  Send, Edit3, ArrowLeft, X, BookOpen, Briefcase, FolderKanban,
  Printer, ExternalLink, Camera, MessageSquare, Lock, Sparkles, Check, CheckCircle, CheckCircle2, Clock, ChevronDown, User, Mail
} from 'lucide-react';
import {
  getTalentById, requestTeacherEndorsement, updateTalentProfile,
  proactiveEndorseStudent, uploadUserProfilePicture,
  subscribeToStudentEndorsementRequests, getVerifiedTeachers, subscribeToTeachers,
  hasTeacherEndorsedStudent, sanitizeUniqueEndorsements, getEndorsementRequests,
  deduplicateRequestsByTeacher, isSameProfessor, STORAGE_KEY_ENDORSEMENT_REQUESTS,
  validateStudentEmail
} from '../lib/ivaiConecta';
import { db } from '../lib/firebase.js';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, limit } from 'firebase/firestore';
import ResumePDFModal from '../components/ResumePDFModal';
import EditProfileModal from '../components/EditProfileModal';
import { isGenericPlaceholderAvatar, getAvatarGradient } from '../services/chatService';
import useAppStore from '../store/useAppStore';

// Função auxiliar de montagem do perfil em fallback
function buildFallbackTalent(user) {
  if (!user) return null;
  return {
    id: user.uid || user.id || '',
    firestoreId: user.uid || user.id || '',
    name: user.name || user.displayName || 'Estudante',
    course: user.course || '',
    institution: user.institution || 'IFPR Campus Ivaiporã',
    period: user.period || '',
    city: user.city || 'Ivaiporã',
    avatar: user.avatar || user.photoURL || '',
    email: user.email || '',
    skills: Array.isArray(user.skills) ? user.skills : [],
    isVerifiedStudent: Boolean(user.isVerifiedStudent || user.emailVerified),
    studentEmail: user.studentEmail || (validateStudentEmail(user.email)?.isValid ? user.email : ''),
    raNumber: user.raNumber || '',
    linkedin: user.linkedin || '',
    github: user.github || '',
    bio: user.bio || '',
    experiences: Array.isArray(user.experiences) ? user.experiences : [],
    projects: Array.isArray(user.projects) ? user.projects : [],
    education: Array.isArray(user.education) ? user.education : [],
    endorsements: Array.isArray(user.endorsements) ? user.endorsements : []
  };
}

export default function PerfilAluno() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, showToast, startChatWith } = useAppStore();

  const talentId = id || currentUser?.uid || currentUser?.id;

  // 1. Estados principais do Perfil e Carregamento (declarados no topo para evitar TDZ)
  const [talent, setTalent] = useState(() => {
    const local = getTalentById(talentId);
    if (local) return local;
    return id ? null : buildFallbackTalent(currentUser);
  });
  const [loading, setLoading] = useState(!talent);

  // 2. Pedidos de endosso e professores verificados
  const [studentRequests, setStudentRequests] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState(() => getVerifiedTeachers());

  // 3. Navegação, abas e modais
  const [activeTab, setActiveTab] = useState('overview');
  const [editModalOpen, setEditModalOpen] = useState(Boolean(searchParams.get('tab') === 'edit' || searchParams.get('edit') === 'true'));
  const [requestModal, setRequestModal] = useState(false);
  const [proactiveEndorseModal, setProactiveEndorseModal] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);

  // 4. Formulários de endosso
  const [proactiveQuote, setProactiveQuote] = useState('');
  const [proactiveDiscipline, setProactiveDiscipline] = useState(currentUser?.discipline || 'Programação de Computadores');
  const [requestForm, setRequestForm] = useState({ profName: '', profEmail: '', discipline: '', message: '' });
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [nameInputFocused, setNameInputFocused] = useState(false);
  const [error, setError] = useState('');

  // 5. Formulário completo de edição do perfil
  const [editData, setEditData] = useState(() => ({
    name: talent?.name || currentUser?.name || '',
    avatar: talent?.avatar || currentUser?.avatar || '',
    city: talent?.city || currentUser?.city || 'Ivaiporã',
    institution: talent?.institution || currentUser?.institution || '',
    course: talent?.course || currentUser?.course || '',
    period: talent?.period || currentUser?.period || '',
    bio: talent?.bio || currentUser?.bio || '',
    linkedin: talent?.linkedin || currentUser?.linkedin || '',
    github: talent?.github || currentUser?.github || '',
    skills: Array.isArray(talent?.skills) ? [...talent.skills] : [],
    experiences: Array.isArray(talent?.experiences) ? [...talent.experiences] : [],
    projects: Array.isArray(talent?.projects) ? [...talent.projects] : [],
    education: Array.isArray(talent?.education) ? [...talent.education] : [],
    newSkill: ''
  }));

  const [newExp, setNewExp] = useState({ role: '', company: '', period: '', description: '' });
  const [newProj, setNewProj] = useState({ title: '', tech: '', link: '', description: '' });

  // 6. Valores derivados e memorizados
  const platformTeachers = useMemo(() => {
    return availableTeachers.filter(t => t.firestoreId || (t.id && !String(t.id).startsWith('prof_')));
  }, [availableTeachers]);

  const institutionalTeachers = useMemo(() => {
    return availableTeachers.filter(t => t.id && String(t.id).startsWith('prof_'));
  }, [availableTeachers]);

  const isOwner = Boolean(
    currentUser && talent && (
      (currentUser.id != null && talent.id != null && String(currentUser.id) === String(talent.id)) ||
      (currentUser.uid != null && (String(currentUser.uid) === String(talent.id) || String(currentUser.uid) === String(talent.firestoreId) || String(currentUser.uid) === String(talent.uid))) ||
      (currentUser.email && talent.email && currentUser.email.toLowerCase() === talent.email.toLowerCase()) ||
      (!id) // Rota "/perfil" direta sem ID é sempre do usuário logado
    )
  );

  const isProfessor = currentUser?.role === 'professor';

  const uniqueEndorsements = useMemo(() => {
    const fromTalent = Array.isArray(talent?.endorsements) ? talent.endorsements : [];
    const fromApprovedRequests = (studentRequests || [])
      .filter(r => r.status === 'Aprovado')
      .map(r => ({
        id: `end_${r.id || r.firestoreId || Date.now()}`,
        profUid: r.profUid || r.targetTeacherId || '',
        profName: r.profName || 'Professor Docente',
        profEmail: r.profEmail || '',
        institution: r.studentInstitution || 'IFPR Campus Ivaiporã',
        discipline: r.discipline || 'Formação Acadêmica',
        quote: r.quote || 'Estudante com excelente desempenho acadêmico, postura ética e ótimo raciocínio em projetos práticos.',
        isVerified: true,
        date: r.resolvedAt || r.requestedAt || new Date().toLocaleDateString('pt-BR'),
        timestamp: r.requestedTimestamp || Date.now()
      }));

    return sanitizeUniqueEndorsements([...fromTalent, ...fromApprovedRequests]);
  }, [talent?.endorsements, studentRequests]);

  const hasAlreadyEndorsed = Boolean(
    isProfessor && hasTeacherEndorsedStudent(uniqueEndorsements, currentUser)
  );

  const isTargetTeacherAlreadyEndorsed = Boolean(
    (requestForm.profEmail || selectedTeacher) &&
    hasTeacherEndorsedStudent(uniqueEndorsements, selectedTeacher || requestForm.profEmail)
  );

  const hasPendingRequestForTeacher = Boolean(
    (requestForm.profEmail || selectedTeacher) &&
    studentRequests.some(r =>
      (isSameProfessor(r, selectedTeacher || requestForm.profEmail) ||
        (requestForm.profEmail && String(r.profEmail || '').toLowerCase().trim() === requestForm.profEmail.toLowerCase().trim())) &&
      r.status === 'Pendente'
    )
  );

  // 7. Efeitos colaterais e assinaturas em tempo real (Firestore / Local)
  useEffect(() => {
    const studentUid = String(talentId || currentUser?.uid || currentUser?.id || '');
    if (!studentUid) return;
    const unsub = subscribeToStudentEndorsementRequests(studentUid, (reqs) => {
      setStudentRequests(deduplicateRequestsByTeacher(reqs));
    });
    return () => unsub();
  }, [talentId, currentUser]);

  useEffect(() => {
    const unsub = subscribeToTeachers((teachers) => {
      if (Array.isArray(teachers)) setAvailableTeachers(teachers);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'aluno' && currentUser.role !== 'candidato')) return;
    const studentUid = String(currentUser.uid || currentUser.id || '');
    if (!studentUid) return;

    try {
      const studentDocRef = doc(db, 'users', studentUid);
      getDoc(studentDocRef).then(snap => {
        if (snap.exists()) {
          const remoteReqs = snap.data().pendingEndorsementRequests || [];
          const localReqs = getEndorsementRequests().filter(r => String(r.studentId) === studentUid);
          const cleaned = deduplicateRequestsByTeacher([...remoteReqs, ...localReqs]);

          if (cleaned.length !== remoteReqs.length || JSON.stringify(cleaned) !== JSON.stringify(remoteReqs)) {
            setDoc(studentDocRef, { pendingEndorsementRequests: cleaned }, { merge: true });
          }

          const allOtherLocal = getEndorsementRequests().filter(r => String(r.studentId) !== studentUid);
          try {
            localStorage.setItem(STORAGE_KEY_ENDORSEMENT_REQUESTS, JSON.stringify([...cleaned, ...allOtherLocal]));
          } catch {}
        }
      }).catch(() => {});
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'aluno' && currentUser.role !== 'candidato')) return;
    const studentUid = String(currentUser.uid || currentUser.id || '');
    if (!studentUid) return;

    const approvedList = studentRequests.filter(r => r.status === 'Aprovado');
    if (approvedList.length === 0) return;

    const currentEndorsements = Array.isArray(talent?.endorsements) ? talent.endorsements : [];
    const synthesized = approvedList.map(r => ({
      id: `end_${r.id || r.firestoreId || Date.now()}`,
      profUid: r.profUid || r.targetTeacherId || '',
      profName: r.profName || 'Professor Docente',
      profEmail: r.profEmail || '',
      institution: r.studentInstitution || 'IFPR Campus Ivaiporã',
      discipline: r.discipline || 'Formação Acadêmica',
      quote: r.quote || 'Estudante com excelente desempenho acadêmico, postura ética e ótimo raciocínio em projetos práticos.',
      isVerified: true,
      date: r.resolvedAt || r.requestedAt || new Date().toLocaleDateString('pt-BR'),
      timestamp: r.requestedTimestamp || Date.now()
    }));

    const merged = sanitizeUniqueEndorsements([...currentEndorsements, ...synthesized]);
    if (merged.length > currentEndorsements.length || !talent?.isVerifiedStudent) {
      try {
        const studentDocRef = doc(db, 'users', studentUid);
        setDoc(studentDocRef, {
          endorsements: merged,
          endorsementCount: merged.length,
          isVerifiedStudent: true
        }, { merge: true }).catch(() => {});
      } catch {}
    }
  }, [currentUser, studentRequests, talent?.endorsements, talent?.isVerifiedStudent]);

  useEffect(() => {
    const targetId = id || currentUser?.uid || currentUser?.id;
    if (!targetId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const docRef = doc(db, 'users', String(targetId));

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!isMounted) return;
      if (docSnap.exists()) {
        const data = docSnap.data();
        const mergedTalent = {
          id: docSnap.id,
          firestoreId: docSnap.id,
          name: data.name || data.displayName || (currentUser && String(currentUser.uid) === String(docSnap.id) ? currentUser.name : 'Estudante'),
          course: data.course || (currentUser?.course) || 'Graduação / Ensino Técnico',
          institution: data.institution || (currentUser?.institution) || 'IFPR Campus Ivaiporã',
          period: data.period || (currentUser?.period) || 'Em andamento',
          city: data.city || (currentUser?.city) || 'Ivaiporã',
          avatar: data.avatar || data.photoURL || (currentUser?.avatar) || '',
          skills: Array.isArray(data.skills) ? data.skills : (currentUser?.skills || []),
          isVerifiedStudent: Boolean(data.isVerifiedStudent || data.emailVerified || currentUser?.isVerifiedStudent || currentUser?.emailVerified),
          studentEmail: data.studentEmail || (validateStudentEmail(data.email)?.isValid ? data.email : (currentUser?.studentEmail || '')),
          email: data.email || (currentUser?.email) || '',
          raNumber: data.raNumber || (currentUser?.raNumber) || '',
          linkedin: data.linkedin || (currentUser?.linkedin) || '',
          github: data.github || (currentUser?.github) || '',
          bio: data.bio || (currentUser?.bio) || '',
          experiences: Array.isArray(data.experiences) ? data.experiences : (currentUser?.experiences || []),
          projects: Array.isArray(data.projects) ? data.projects : (currentUser?.projects || []),
          education: Array.isArray(data.education) ? data.education : (currentUser?.education || []),
          endorsements: Array.isArray(data.endorsements) ? data.endorsements : (currentUser?.endorsements || [])
        };

        setTalent(mergedTalent);
        setEditData({
          name: mergedTalent.name,
          avatar: mergedTalent.avatar,
          city: mergedTalent.city,
          institution: mergedTalent.institution,
          course: mergedTalent.course,
          period: mergedTalent.period,
          bio: mergedTalent.bio,
          linkedin: mergedTalent.linkedin,
          github: mergedTalent.github,
          skills: [...mergedTalent.skills],
          experiences: [...mergedTalent.experiences],
          projects: [...mergedTalent.projects],
          education: [...mergedTalent.education],
          newSkill: ''
        });
      } else {
        const fallback = getTalentById(targetId) || (!id ? buildFallbackTalent(currentUser) : null);
        if (fallback) {
          setTalent(fallback);
        } else if (id) {
          try {
            const cleanTarget = decodeURIComponent(String(targetId)).trim();
            const cleanLower = cleanTarget.toLowerCase();
            const usersCol = collection(db, 'users');
            const queries = cleanLower.includes('@')
              ? [query(usersCol, where('email', '==', cleanLower), limit(1))]
              : [
                  query(usersCol, where('name', '==', cleanTarget), limit(1)),
                  query(usersCol, where('displayName', '==', cleanTarget), limit(1))
                ];
            Promise.all(queries.map(q => getDocs(q))).then(results => {
              if (!isMounted) return;
              for (const r of results) {
                if (!r.empty) {
                  const uDoc = r.docs[0];
                  const d = uDoc.data();
                  setTalent({
                    id: uDoc.id,
                    firestoreId: uDoc.id,
                    name: d.name || d.displayName || cleanTarget,
                    course: d.course || 'Graduação / Ensino Técnico',
                    institution: d.institution || 'IFPR Campus Ivaiporã',
                    period: d.period || 'Em andamento',
                    city: d.city || 'Ivaiporã',
                    avatar: d.avatar || d.photoURL || '',
                    skills: Array.isArray(d.skills) ? d.skills : [],
                    isVerifiedStudent: Boolean(d.isVerifiedStudent || d.emailVerified),
                    studentEmail: d.studentEmail || (validateStudentEmail(d.email)?.isValid ? d.email : ''),
                    email: d.email || '',
                    raNumber: d.raNumber || '',
                    linkedin: d.linkedin || '',
                    github: d.github || '',
                    bio: d.bio || '',
                    experiences: Array.isArray(d.experiences) ? d.experiences : [],
                    projects: Array.isArray(d.projects) ? d.projects : [],
                    education: Array.isArray(d.education) ? d.education : [],
                    endorsements: Array.isArray(d.endorsements) ? d.endorsements : []
                  });
                  break;
                }
              }
            }).catch(() => {});
          } catch {}
        }
      }
      setLoading(false);
    }, (err) => {
      console.warn('[PerfilAluno] Erro na sincronização com Firestore:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [id, currentUser]);

  useEffect(() => {
    if (searchParams.get('tab') === 'edit' || searchParams.get('edit') === 'true') {
      setEditModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!successBanner) return;
    const timer = setTimeout(() => setSuccessBanner(null), 8000);
    return () => clearTimeout(timer);
  }, [successBanner]);

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    if (searchParams.get('tab') || searchParams.get('edit')) {
      navigate(window.location.pathname, { replace: true });
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.profEmail.toLowerCase().includes('@')) {
      setError('Por favor, informe um e-mail educacional válido.');
      return;
    }
    if (isTargetTeacherAlreadyEndorsed) {
      setError('Este professor(a) já concedeu uma recomendação para você. É permitida apenas uma recomendação por docente.');
      return;
    }
    if (hasPendingRequestForTeacher) {
      setError('Você já possui uma solicitação pendente enviada para este professor(a). Aguarde a avaliação.');
      return;
    }
    setError('');
    setIsSubmittingRequest(true);

    try {
      const studentData = {
        ...currentUser,
        ...talent,
        id: String(talentId || currentUser?.uid || currentUser?.id || ''),
        uid: String(currentUser?.uid || talentId || ''),
        name: talent?.name || currentUser?.name || 'Estudante',
        course: talent?.course || currentUser?.course || 'Graduação / Ensino Técnico',
        institution: talent?.institution || currentUser?.institution || 'IFPR Campus Ivaiporã',
        avatar: talent?.avatar || currentUser?.avatar || '',
        email: currentUser?.email || talent?.email || ''
      };

      const res = await requestTeacherEndorsement(
        requestForm.profEmail,
        requestForm.profName,
        requestForm.discipline,
        studentData,
        selectedTeacher
      );

      setIsSubmittingRequest(false);

      if (res.success) {
        // Sai da tela imediatamente
        setRequestModal(false);
        const msg = res.message || `Solicitação enviada com sucesso para o professor ${requestForm.profName}!`;
        // Mensagem clara e verde em destaque
        setSuccessBanner(msg);
        showToast(msg, 'success');
        setRequestForm({ profName: '', profEmail: '', discipline: '', message: '' });
        setSelectedTeacher(null);
        setNameInputFocused(false);
      } else {
        setError(res.message || 'Erro ao enviar solicitação.');
        showToast(res.message || 'Erro ao enviar solicitação.', 'error');
      }
    } catch (err) {
      setIsSubmittingRequest(false);
      setError(err.message || 'Erro ao enviar solicitação.');
      showToast(err.message || 'Erro ao processar solicitação.', 'error');
    }
  };

  const handleProactiveEndorseSubmit = async (e) => {
    e.preventDefault();
    if (hasAlreadyEndorsed) {
      showToast('Você já recomendou este aluno. É permitida apenas uma recomendação por professor para cada aluno.');
      setProactiveEndorseModal(false);
      return;
    }
    const res = await proactiveEndorseStudent(talent.id, currentUser, proactiveQuote, proactiveDiscipline);
    if (res.success) {
      showToast(`Recomendação concedida com sucesso para ${talent.name}!`);
      setProactiveEndorseModal(false);
      setProactiveQuote('');
    } else {
      showToast(res.error || 'Não foi possível conceder recomendação.');
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast('Enviando foto para o Firebase Storage...');
      const res = await uploadUserProfilePicture(file, currentUser?.uid || talent?.id);
      if (res.success) {
        setEditData(d => ({ ...d, avatar: res.url }));
        showToast('Foto de perfil salva na nuvem com sucesso!');
      } else {
        showToast(res.error || 'Erro ao enviar foto.');
      }
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    const targetId = talent?.id || currentUser?.uid || currentUser?.id;
    if (targetId) {
      updateTalentProfile(targetId, editData);
      try {
        await setDoc(doc(db, 'users', String(targetId)), {
          ...editData,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn('[PerfilAluno] Erro ao sincronizar edição no Firestore:', dbErr);
      }
    }

    // Se o usuário logado for o proprietário, atualiza a store global
    if (isOwner && currentUser) {
      setCurrentUser({
        ...currentUser,
        ...editData
      });
    }

    setTalent(prev => ({
      ...prev,
      ...editData
    }));

    showToast('Foto de perfil, currículo e redes sociais salvos com sucesso!');
    handleCloseEditModal();
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

  if (loading && !talent) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-primary-blue/20 border-t-primary-blue rounded-full animate-spin mb-3"></div>
        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium animate-pulse">Carregando dados do perfil...</p>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="container section text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Perfil não encontrado</h2>
        <p className="text-gray-500 text-sm mb-6">O perfil solicitado não existe ou ainda não foi configurado.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">Voltar ao Início</button>
      </div>
    );
  }

  const hasCustomAvatar = talent.avatar && !isGenericPlaceholderAvatar(talent.avatar);

  return (
    <>
      {/* Alerta de Perfil Não Verificado para o próprio aluno */}
      {isOwner && !currentUser?.isVerifiedStudent && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 py-3 px-4 text-xs sm:text-sm">
          <div className="container flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 font-semibold">
              <Lock size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Seu perfil está <strong>INVISÍVEL</strong> para recrutadores. Valide seu e-mail estudantil institucional para ativar seu Selo de Estudante Verificado.
              </span>
            </div>
            <Link to="/configuracoes" className="btn btn-primary btn-sm text-xs font-bold shrink-0">
              Validar E-mail Estudantil →
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
            <div className="flex flex-wrap items-center gap-5 sm:gap-6 min-w-0 max-w-full flex-1">
              <div className="relative group shrink-0">
                {hasCustomAvatar ? (
                  <img
                    src={talent.avatar}
                    alt={talent.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white/30 object-cover shadow-brand-lg bg-white dark:bg-slate-800"
                  />
                ) : (
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white/30 bg-gradient-to-tr ${getAvatarGradient(talent.name)} text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-brand-lg shrink-0`}
                  >
                    {(talent.name || 'A').slice(0, 2).toUpperCase()}
                  </div>
                )}
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

              <div className="min-w-0 flex-1 max-w-full">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white break-words [overflow-wrap:anywhere] max-w-full">{talent.name}</h1>
                  {talent.isVerifiedStudent ? (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                      <ShieldCheck size={13} className="text-emerald-400" /> Estudante Verificado
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Lock size={12} /> Comprovação Pendente
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
                  {talent.studentEmail && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1.5 text-blue-200 font-medium">
                        <GraduationCap size={14} /> {talent.studentEmail}
                      </span>
                    </>
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
                    const targetEmail = talent.email || talent.studentEmail || '';
                    const targetUid = talent.uid || talent.id || (id !== 'aluno' ? id : '');

                    if (!targetEmail && !targetUid) {
                      showToast('Estudante não possui canal de chat configurado.');
                      return;
                    }

                    startChatWith({
                      name: talent.name,
                      email: targetEmail,
                      uid: targetUid,
                      role: 'aluno',
                      avatar: talent.avatar || ''
                    }, `Contato Direto: Perfil de ${talent.name}`);
                  }}
                  className="btn btn-primary btn-sm font-bold shadow-md flex items-center justify-center gap-2 w-full text-xs cursor-pointer"
                >
                  <MessageSquare size={15} /> Conversar com {talent.name ? String(talent.name).split(' ')[0] : 'Estudante'}
                </button>
              )}

              {/* 1. Baixar Currículo em PDF */}
              <button
                onClick={() => setPdfModalOpen(true)}
                className="btn btn-outline border-white/40 text-white btn-sm font-bold shadow-md flex items-center justify-center gap-2 w-full"
              >
                <Printer size={15} /> Baixar Currículo em PDF
              </button>

              {/* 2. Editar Meu Perfil (visível apenas para o dono) */}
              {isOwner && (
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="btn bg-amber-400 hover:bg-amber-500 text-slate-950 btn-sm font-extrabold shadow-lg flex items-center justify-center gap-2 border border-amber-300 transition-all cursor-pointer w-full"
                  title="Abrir formulário de edição de perfil e currículo"
                >
                  <Edit3 size={16} /> Editar Meu Perfil &amp; Currículo
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
                hasAlreadyEndorsed ? (
                  <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 w-full">
                    <CheckCircle size={14} /> Recomendação já concedida por você
                  </div>
                ) : (
                  <button
                    onClick={() => setProactiveEndorseModal(true)}
                    className="btn btn-teal btn-sm font-bold shadow-md flex items-center justify-center gap-2 w-full"
                  >
                    <Award size={16} /> Recomendar Este Aluno
                  </button>
                )
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
              Recomendações ({uniqueEndorsements.length})
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
                    hasAlreadyEndorsed ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                        <CheckCircle size={13} /> Recomendação já Concedida
                      </span>
                    ) : (
                      <button onClick={() => setProactiveEndorseModal(true)} className="btn btn-teal btn-sm text-xs font-bold flex items-center gap-1.5">
                        <Award size={13} /> Recomendar Aluno
                      </button>
                    )
                  ) : null}
                </div>

                {/* Solicitações Pendentes Enviadas pelo Aluno (Visível para o dono do perfil) */}
                {isOwner && studentRequests.filter(r => r.status === 'Pendente').length > 0 && (
                  <div className="mb-5 space-y-2.5">
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <Clock size={14} className="text-amber-500 animate-pulse" /> Solicitações Pendentes de Avaliação ({studentRequests.filter(r => r.status === 'Pendente').length})
                    </div>
                    <div className="space-y-2">
                      {studentRequests.filter(r => r.status === 'Pendente').map(req => (
                        <div key={req.id} className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="font-bold text-amber-950 dark:text-amber-200">
                              {req.profName} <span className="font-normal text-amber-800/80 dark:text-amber-400">({req.profEmail})</span>
                            </div>
                            <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                              Disciplina: <strong>{req.discipline}</strong> · Solicitado em {req.requestedAt}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] shrink-0 inline-flex items-center gap-1">
                            <Clock size={11} /> Aguardando Docente
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uniqueEndorsements.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 dark:text-slate-500">
                    <p className="font-semibold text-sm">Nenhuma recomendação avaliada ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {uniqueEndorsements.map((e, i) => (
                      <div key={e.id || i} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 gap-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-gray-800 dark:text-white text-sm">{e.profName}</div>
                            <div className="text-xs text-primary-blue dark:text-blue-400 font-medium">{e.discipline} · {e.institution}</div>
                          </div>
                          <span className="text-xs font-bold text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Check size={11} /> Verificado
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
            {uniqueEndorsements.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">Nenhuma recomendação registrada ainda.</p>
            ) : (
              <div className="space-y-4">
                {uniqueEndorsements.map((e, i) => (
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
                <Award size={20} className="text-amber-500 fill-amber-500" /> Recomendar {talent.name || 'Estudante'}
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

      {/* Banner Verde Claro de Sucesso Após Envio de Solicitação - Canto Esquerdo */}
      {successBanner && (
        <div className="fixed bottom-6 left-6 z-[300] max-w-sm w-full bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl border border-emerald-400 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm leading-tight">Solicitação Enviada!</div>
              <div className="text-[11px] sm:text-xs text-emerald-100 mt-0.5 leading-snug">{successBanner}</div>
            </div>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0 text-white cursor-pointer"
            title="Fechar notificação"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Modal: Pedir Recomendação a Professor (Para Alunos) */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => { setRequestModal(false); setNameInputFocused(false); }}>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-7 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5 border-b border-gray-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-primary-blue dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-900/50">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white">
                    Pedir Recomendação a Professor
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Solicite um parecer acadêmico institucional para valorizar seu currículo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setRequestModal(false); setNameInputFocused(false); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3.5 rounded-2xl flex items-center gap-2">
                <X size={16} className="text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isTargetTeacherAlreadyEndorsed && (
              <div className="mb-4 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 p-3.5 rounded-2xl flex items-center gap-2">
                <CheckCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Você já possui um parecer registrado deste professor(a). É permitida apenas uma recomendação por docente para cada aluno.</span>
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {/* Seletor Principal de Professores Disponíveis */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold flex items-center gap-2 text-primary-dark dark:text-white">
                    <GraduationCap size={16} className="text-primary-blue dark:text-blue-400" />
                    Selecione o Professor(a) Credenciado:
                  </label>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950/90 text-primary-blue dark:text-blue-300 px-2.5 py-0.5 rounded-full font-bold">
                    {availableTeachers.length} disponíveis
                  </span>
                </div>

                <div className="relative">
                  <select
                    className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-all cursor-pointer appearance-none pr-10"
                    style={{ backgroundImage: 'none' }}
                    value={selectedTeacher ? (selectedTeacher.email || selectedTeacher.id) : (requestForm.profEmail || '')}
                    onChange={e => {
                      const val = e.target.value;
                      if (!val) {
                        setSelectedTeacher(null);
                        return;
                      }
                      if (val === '__manual__') {
                        setSelectedTeacher(null);
                        setRequestForm({ profName: '', profEmail: '', discipline: '', message: '' });
                        return;
                      }
                      const prof = availableTeachers.find(t => 
                        (t.email || '').toLowerCase().trim() === val.toLowerCase().trim() || 
                        String(t.id) === val
                      );
                      if (prof) {
                        setSelectedTeacher(prof);
                        setRequestForm(f => ({
                          ...f,
                          profName: prof.name,
                          profEmail: prof.email,
                          discipline: prof.discipline || prof.classes?.[0] || 'Programação de Computadores'
                        }));
                      }
                    }}
                  >
                    <option value="">-- Escolha um Professor para Preenchimento Automático --</option>
                    {platformTeachers.length > 0 && (
                      <optgroup label="🌟 Professores Cadastrados na Plataforma">
                        {platformTeachers.map(t => {
                          const alreadyDone = hasTeacherEndorsedStudent(uniqueEndorsements, t);
                          return (
                            <option key={t.id || t.email} value={t.email || t.id} disabled={alreadyDone}>
                              {t.name} ({t.email}) · {t.institution || 'IFPR'} {alreadyDone ? '— ⚠️ (Já Recomendado)' : ''}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    <optgroup label="🏛️ Corpo Docente Institucional Credenciado">
                      {institutionalTeachers.map(t => {
                        const alreadyDone = hasTeacherEndorsedStudent(uniqueEndorsements, t);
                        return (
                          <option key={t.id || t.email} value={t.email || t.id} disabled={alreadyDone}>
                            {t.name} · {t.institution || 'IFPR'} ({t.discipline || 'Docente'}) {alreadyDone ? '— ⚠️ (Já Recomendado)' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                    <option value="__manual__">✍️ Outro Professor (Preencher manualmente)</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Card de Dados do Professor Vinculado */}
                {selectedTeacher && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                        <CheckCircle size={13} /> Vinculado: {selectedTeacher.institution}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                        {selectedTeacher.degree || 'Docente'}
                      </span>
                    </div>

                    {Array.isArray(selectedTeacher.classes) && selectedTeacher.classes.length > 0 && (
                      <div>
                        <span className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold block mb-1">
                          Disciplinas ministradas pelo docente (clique para escolher):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTeacher.classes.map(cls => (
                            <button
                              key={cls}
                              type="button"
                              onClick={() => setRequestForm(f => ({ ...f, discipline: cls }))}
                              className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border transition-all cursor-pointer ${
                                requestForm.discipline === cls
                                  ? 'bg-primary-blue text-white border-primary-blue shadow-2xs font-bold'
                                  : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary-blue'
                              }`}
                            >
                              {cls}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Campo: Nome do Professor */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User size={13} className="text-gray-400" /> Nome do Professor(a)
                </label>
                <input
                  type="text"
                  value={requestForm.profName}
                  onFocus={() => setNameInputFocused(true)}
                  onChange={e => {
                    const val = e.target.value;
                    setRequestForm(f => ({ ...f, profName: val }));
                    setNameInputFocused(true);
                  }}
                  className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-all"
                  placeholder="Ex: Prof. Dr. Ronan Silva"
                  required
                />

                {/* Sugestões ao digitar */}
                {nameInputFocused && requestForm.profName && requestForm.profName.trim().length >= 2 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 space-y-1 max-h-48 overflow-y-auto">
                    <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500 px-2 py-0.5">
                      Docentes Disponíveis Correspondentes:
                    </div>
                    {availableTeachers
                      .filter(t =>
                        t.name.toLowerCase().includes(requestForm.profName.toLowerCase()) ||
                        t.email.toLowerCase().includes(requestForm.profName.toLowerCase()) ||
                        (t.discipline && t.discipline.toLowerCase().includes(requestForm.profName.toLowerCase()))
                      )
                      .slice(0, 4)
                      .map(t => {
                        const alreadyDone = hasTeacherEndorsedStudent(uniqueEndorsements, t);
                        return (
                          <button
                            key={t.id || t.email}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedTeacher(t);
                              setRequestForm(f => ({
                                ...f,
                                profName: t.name,
                                profEmail: t.email,
                                discipline: t.discipline || t.classes?.[0] || 'Programação de Computadores'
                              }));
                              setNameInputFocused(false);
                            }}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors cursor-pointer"
                          >
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                {t.name}
                                {alreadyDone && (
                                  <span className="text-[9px] bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                                    Já Recomendou
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-slate-400">{t.email} · {t.institution}</div>
                              <div className="text-[10px] text-primary-blue dark:text-blue-400 font-semibold">{t.discipline}</div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                              alreadyDone
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-300'
                            }`}>
                              {alreadyDone ? 'Já Avaliado' : 'Selecionar'}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Campo: E-mail Educacional do Professor */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail size={13} className="text-gray-400" /> E-mail Educacional do Professor
                </label>
                <input
                  type="email"
                  value={requestForm.profEmail}
                  onChange={e => setRequestForm(f => ({ ...f, profEmail: e.target.value }))}
                  className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-all"
                  placeholder="Ex: ronan.silva@ifpr.edu.br"
                  required
                />
              </div>

              {/* Campo: Disciplina / Matéria Ministrada */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-gray-400" /> Disciplina / Matéria Ministrada
                </label>
                <input
                  type="text"
                  value={requestForm.discipline}
                  onChange={e => setRequestForm(f => ({ ...f, discipline: e.target.value }))}
                  className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-all"
                  placeholder="Ex: Programação de Computadores"
                  required
                />
              </div>

              {/* Alerta se já existe solicitação pendente para este professor */}
              {hasPendingRequestForTeacher && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                  <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Você já possui uma solicitação pendente aguardando avaliação deste docente. Não é necessário enviar novamente.</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setRequestModal(false); setNameInputFocused(false); }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-gray-200 dark:border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isTargetTeacherAlreadyEndorsed || hasPendingRequestForTeacher || isSubmittingRequest}
                  className="btn btn-teal text-xs font-bold px-6 py-2.5 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingRequest ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Enviar Solicitação
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pré-visualização e Impressão de CV em PDF */}
      {pdfModalOpen && (
        <ResumePDFModal
          talent={{
            ...talent,
            endorsements: uniqueEndorsements && uniqueEndorsements.length > 0 ? uniqueEndorsements : talent?.endorsements,
            email: talent?.email || (isOwner ? currentUser?.email : ''),
            phone: talent?.phone || (isOwner ? currentUser?.phone : '')
          }}
          onClose={() => setPdfModalOpen(false)}
        />
      )}

      {/* Modal: Edição Completa de Perfil & Currículo Estilo Gupy */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editData={editData}
        setEditData={setEditData}
        role={currentUser?.role || talent?.role || 'aluno'}
        handleSaveProfile={handleSaveProfile}
        handleAvatarFileChange={handleAvatarFileChange}
        addExperience={addExperience}
        removeExperience={removeExperience}
        addProject={addProject}
        removeProject={removeProject}
        newExp={newExp}
        setNewExp={setNewExp}
        newProj={newProj}
        setNewProj={setNewProj}
      />
    </>
  );
}
