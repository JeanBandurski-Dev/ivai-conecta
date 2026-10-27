import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Settings, Bell, Lock, Eye, EyeOff, Shield, LogOut, ArrowLeft,
  FileCheck, CheckCircle2, User, Mail, ShieldCheck, Upload,
  Building2, Camera,
  Search, Loader2, AlertCircle, RefreshCw, Check,
  Wrench, Briefcase, GraduationCap, Save
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAppStore from '../store/useAppStore';
import {
  updateAuthUser,
  submitCompanyVerification,
  sendStudentVerificationEmail,
  checkStudentVerification,
  validateStudentEmail,
  uploadUserProfilePicture,
  uploadUserDocument,
  maskCNPJ,
  cleanCNPJ,
  validateCNPJ,
  fetchCNPJData,
  updateUserPassword,
  isGoogleOnlyAuthUser
} from '../lib/ivaiConecta';
import { isGenericPlaceholderAvatar, getAvatarGradient } from '../services/chatService';
import {
  validateAccountName,
  validateAccountEmail,
  validateAccountLinkedIn,
  validateAccountGitHubOrPortfolio,
  validateStudentRA,
  validatePasswordChange,
  validateAccountSettingsForm
} from '../utils/formValidation';

export default function Configuracoes() {
  const { currentUser, setCurrentUser, logout, showToast, showConfirm } = useAppStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account'); // 'account', 'verification', 'company', 'security', 'privacy'

  // Account form
  const [name, setName] = useState(
    (currentUser?.role === 'empresa'
      ? (currentUser?.razaoSocial || currentUser?.nomeFantasia || currentUser?.name)
      : currentUser?.name) || ''
  );
  const [email, setEmail] = useState(currentUser?.email || '');
  const [linkedin, setLinkedin] = useState(currentUser?.linkedin || '');
  const [github, setGithub] = useState(currentUser?.github || '');
  const [avatar, setAvatar] = useState(
    isGenericPlaceholderAvatar(currentUser?.avatar) ? '' : (currentUser?.avatar || '')
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentUser?.role || 'candidato');
  const [switchingRole, setSwitchingRole] = useState(false);

  // Estados de Validação dos Formulários
  const [accountErrors, setAccountErrors] = useState({});
  const [accountSubmitAttempted, setAccountSubmitAttempted] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSubmitAttempted, setPasswordSubmitAttempted] = useState(false);

  const accountErrorCount = useMemo(() => {
    return Object.values(accountErrors).filter(Boolean).length;
  }, [accountErrors]);

  const passwordErrorCount = useMemo(() => {
    return Object.values(passwordErrors).filter(Boolean).length;
  }, [passwordErrors]);

  useEffect(() => {
    if (currentUser?.avatar) {
      if (!isGenericPlaceholderAvatar(currentUser.avatar)) {
        setAvatar(currentUser.avatar);
      } else {
        setAvatar('');
      }
    }
  }, [currentUser?.avatar]);

  useEffect(() => {
    if (currentUser?.role) {
      setSelectedRole(currentUser.role);
    }
  }, [currentUser?.role]);

  // Verification form (Student)
  const [raNumber, setRaNumber] = useState(currentUser?.raNumber || '');
  const [verificationSubmitted, setVerificationSubmitted] = useState(currentUser?.isVerifiedStudent || false);
  const [studentInstEmail, setStudentInstEmail] = useState(
    currentUser?.studentEmail || (currentUser?.email && (validateStudentEmail(currentUser.email)?.isValid || currentUser.email.includes('estudante') || currentUser.email.includes('.edu')) ? currentUser.email : '')
  );
  const [submittingStudentEmail, setSubmittingStudentEmail] = useState(false);
  const [checkingStudentStatus, setCheckingStudentStatus] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(Boolean(currentUser?.studentEmailVerificationSentAt));

  // Sincroniza estados do formulário sempre que o currentUser é carregado ou atualizado
  useEffect(() => {
    if (!currentUser) return;
    const currentDisplayName = currentUser.role === 'empresa'
      ? (currentUser.razaoSocial || currentUser.nomeFantasia || currentUser.name || '')
      : (currentUser.name || '');
    if (currentDisplayName) setName(currentDisplayName);
    if (currentUser.email) setEmail(currentUser.email);
    if (currentUser.linkedin) setLinkedin(currentUser.linkedin);
    if (currentUser.github) setGithub(currentUser.github);
    if (currentUser.avatar) setAvatar(currentUser.avatar);
    if (currentUser.raNumber) setRaNumber(currentUser.raNumber);
    if (currentUser.isVerifiedStudent != null) setVerificationSubmitted(Boolean(currentUser.isVerifiedStudent || currentUser.emailVerified));
    if (currentUser.studentEmail) {
      setStudentInstEmail(currentUser.studentEmail);
    } else if (currentUser.email && (validateStudentEmail(currentUser.email)?.isValid || currentUser.email.includes('estudante') || currentUser.email.includes('.edu'))) {
      setStudentInstEmail(currentUser.email);
    }
    if (currentUser.studentEmailVerificationSentAt) {
      setVerificationEmailSent(true);
    }
  }, [currentUser]);

  // Consulta direta ao Firestore para garantir consistência em navegadores novos ou abas anônimas
  useEffect(() => {
    const uid = currentUser?.uid || currentUser?.id;
    if (!uid) return;

    let isMounted = true;
    const userDocRef = doc(db, 'users', String(uid));
    getDoc(userDocRef).then((snap) => {
      if (!isMounted || !snap.exists()) return;
      const data = snap.data();
      const currentDisplayName = (data.role || currentUser?.role) === 'empresa'
        ? (data.razaoSocial || data.nomeFantasia || data.name || '')
        : (data.name || '');
      if (currentDisplayName) setName(currentDisplayName);
      if (data.email) setEmail(data.email);
      if (data.linkedin) setLinkedin(data.linkedin);
      if (data.github) setGithub(data.github);
      if (data.avatar) setAvatar(data.avatar);
      if (data.raNumber) setRaNumber(data.raNumber);
      if (data.isVerifiedStudent != null) setVerificationSubmitted(Boolean(data.isVerifiedStudent || data.emailVerified));
      if (data.studentEmail) {
        setStudentInstEmail(data.studentEmail);
      } else if (data.email && (validateStudentEmail(data.email)?.isValid || data.email.includes('estudante'))) {
        setStudentInstEmail(data.email);
      }
    }).catch((err) => console.warn('[Configuracoes] Erro ao sincronizar dados com Firestore:', err));

    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid, currentUser?.id, currentUser?.role]);

  const handleSendVerificationEmail = async (e) => {
    if (e) e.preventDefault();
    const emailToVerify = studentInstEmail.trim() || currentUser?.studentEmail || currentUser?.email;
    if (!emailToVerify) {
      showToast('Por favor, informe seu e-mail estudantil institucional.');
      return;
    }
    setSubmittingStudentEmail(true);
    try {
      const res = await sendStudentVerificationEmail(emailToVerify);
      if (res.success) {
        setVerificationEmailSent(true);
        if (res.alreadyVerified) {
          await handleCheckStudentStatus();
        } else {
          showToast(res.message);
        }
      } else {
        showToast(res.error || 'Erro ao enviar e-mail de verificação.');
      }
    } catch (err) {
      showToast('Erro ao disparar verificação: ' + (err.message || 'Tente novamente.'));
    } finally {
      setSubmittingStudentEmail(false);
    }
  };

  const handleCheckStudentStatus = async () => {
    setCheckingStudentStatus(true);
    try {
      const res = await checkStudentVerification();
      if (res.success && res.verified) {
        setVerificationSubmitted(true);
        if (res.user) {
          setCurrentUser(res.user);
        }
        showToast(res.message);
      } else {
        showToast(res.message || 'O e-mail ainda não foi confirmado. Acesse sua caixa de entrada e clique no link de validação.');
      }
    } catch (err) {
      showToast('Erro ao verificar status no Firebase: ' + (err.message || 'Tente novamente.'));
    } finally {
      setCheckingStudentStatus(false);
    }
  };

  // Company verification form (Empresa)
  const [cnpj, setCnpj] = useState(currentUser?.cnpj || '');
  const [companyFile, setCompanyFile] = useState(null);
  const [companyVerified, setCompanyVerified] = useState(currentUser?.isVerifiedCompany || false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjData, setCnpjData] = useState(null);
  const [cnpjError, setCnpjError] = useState('');
  const [isEditingCnpj, setIsEditingCnpj] = useState(false);
  const companyFileInputRef = useRef(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordReauthRequired, setPasswordReauthRequired] = useState(false);

  const [submittingCompany, setSubmittingCompany] = useState(false);

  if (!currentUser) {
    return (
      <main className="container section text-center py-24">
        <Settings size={54} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
        <h2 className="font-heading text-2xl font-bold text-gray-700 dark:text-white mb-2">Acesso restrito</h2>
        <p className="text-gray-500 dark:text-slate-300 mb-6">Você precisa estar logado para acessar as configurações da sua conta.</p>
        <Link to="/login" className="btn btn-primary px-6 py-2.5 font-bold">Entrar na Conta</Link>
      </main>
    );
  }

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    showToast('Processando foto de perfil...');
    try {
      const res = await uploadUserProfilePicture(file, currentUser.uid || currentUser.id);
      if (res.success) {
        setAvatar(res.url);
        setCurrentUser({ ...currentUser, avatar: res.url });
        showToast('Foto de perfil salva com sucesso!');
      } else {
        showToast(res.error || 'Erro ao enviar imagem.');
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handlers com validação em tempo real para os campos de Conta & Perfil
  const handleNameChange = (val) => {
    setName(val);
    const res = validateAccountName(val, currentUser?.role || 'candidato');
    setAccountErrors(prev => ({ ...prev, name: res.valid ? undefined : res.error }));
  };

  const handleNameBlur = () => {
    const res = validateAccountName(name, currentUser?.role || 'candidato');
    setAccountErrors(prev => ({ ...prev, name: res.valid ? undefined : res.error }));
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    const res = validateAccountEmail(val, { required: true });
    setAccountErrors(prev => ({ ...prev, email: res.valid ? undefined : res.error }));
  };

  const handleEmailBlur = () => {
    const res = validateAccountEmail(email, { required: true });
    setAccountErrors(prev => ({ ...prev, email: res.valid ? undefined : res.error }));
  };

  const handleLinkedinChange = (val) => {
    setLinkedin(val);
    if (val?.trim()) {
      const res = validateAccountLinkedIn(val, { required: false });
      setAccountErrors(prev => ({ ...prev, linkedin: res.valid ? undefined : res.error }));
    } else {
      setAccountErrors(prev => ({ ...prev, linkedin: undefined }));
    }
  };

  const handleLinkedinBlur = () => {
    if (linkedin?.trim()) {
      const res = validateAccountLinkedIn(linkedin, { required: false });
      setAccountErrors(prev => ({ ...prev, linkedin: res.valid ? undefined : res.error }));
    } else {
      setAccountErrors(prev => ({ ...prev, linkedin: undefined }));
    }
  };

  const handleGithubChange = (val) => {
    setGithub(val);
    if (val?.trim()) {
      const res = validateAccountGitHubOrPortfolio(val, { required: false });
      setAccountErrors(prev => ({ ...prev, github: res.valid ? undefined : res.error }));
    } else {
      setAccountErrors(prev => ({ ...prev, github: undefined }));
    }
  };

  const handleGithubBlur = () => {
    if (github?.trim()) {
      const res = validateAccountGitHubOrPortfolio(github, { required: false });
      setAccountErrors(prev => ({ ...prev, github: res.valid ? undefined : res.error }));
    } else {
      setAccountErrors(prev => ({ ...prev, github: undefined }));
    }
  };

  const handleRaChange = (val) => {
    setRaNumber(val);
    if (val?.trim()) {
      const res = validateStudentRA(val);
      setAccountErrors(prev => ({ ...prev, raNumber: res.valid ? undefined : res.error }));
    } else {
      setAccountErrors(prev => ({ ...prev, raNumber: undefined }));
    }
  };

  const handleRaBlur = () => {
    if (raNumber?.trim()) {
      const res = validateStudentRA(raNumber);
      setAccountErrors(prev => ({ ...prev, raNumber: res.valid ? undefined : res.error }));
    } else {
      setAccountErrors(prev => ({ ...prev, raNumber: undefined }));
    }
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (submittingAccount) return;

    setAccountSubmitAttempted(true);

    const targetRole = selectedRole || currentUser?.role || 'candidato';

    const check = validateAccountSettingsForm({
      name,
      email,
      linkedin,
      github,
      raNumber,
      role: targetRole
    });

    if (!check.isValid) {
      setAccountErrors(check.errors);
      const firstMsg = check.errors[check.firstErrorKey] || 'Verifique as informações preenchidas.';
      showToast(firstMsg, 'error');
      return;
    }

    setAccountErrors({});
    const roleBadges = {
      candidato: 'Candidato / Profissional',
      freelancer: 'Prestador de Serviço Autônomo',
      aluno: 'Estudante (IFPR/UENP/Univale)',
      empresa: 'Empresa / Recrutador',
      professor: 'Docente (IFPR/UENP/Univale)'
    };
    const targetBadge = roleBadges[targetRole] || currentUser?.badge;

    const trimmedName = name.trim();
    const isEmpresa = targetRole === 'empresa';

    const companyFields = isEmpresa ? {
      name: trimmedName,
      razaoSocial: trimmedName,
      nomeFantasia: (!currentUser?.nomeFantasia || currentUser?.nomeFantasia === currentUser?.name || currentUser?.nomeFantasia === currentUser?.razaoSocial)
        ? trimmedName
        : currentUser.nomeFantasia
    } : {
      name: trimmedName
    };

    const updatePayload = {
      ...companyFields,
      email: email.trim(),
      linkedin: linkedin.trim(),
      github: github.trim(),
      avatar,
      ...(currentUser?.role === 'aluno' ? { raNumber: raNumber.trim() } : {}),
      role: targetRole,
      activeRole: targetRole,
      selectedRole: targetRole,
      profileType: targetRole,
      badge: targetBadge
    };

    setSubmittingAccount(true);
    try {
      const updated = await updateAuthUser(updatePayload, currentUser);

      if (updated) {
        setCurrentUser(updated);
        showToast('Dados da conta e perfil atualizados com sucesso!', 'success');
      }
    } catch (err) {
      showToast(err?.message || 'Erro ao salvar alterações da conta.', 'error');
    } finally {
      setSubmittingAccount(false);
    }
  };

  const handleSwitchRole = async (newRole) => {
    const roleBadges = {
      candidato: 'Candidato / Profissional',
      freelancer: 'Prestador de Serviço Autônomo',
      aluno: 'Estudante (IFPR/UENP/Univale)'
    };
    if (!roleBadges[newRole]) return;

    const roleDetails = {
      candidato: {
        title: 'Mudar perfil para Candidato',
        message: 'Deseja alterar seu perfil para Candidato?\nVocê passará a concorrer a vagas de emprego formal (CLT / Meio Período).',
        confirmText: 'Alterar para Candidato'
      },
      freelancer: {
        title: 'Mudar perfil para Freelancer',
        message: 'Deseja alterar seu perfil para Freelancer?\nVocê passará a concorrer a demandas e vagas PJ no Marketplace de Serviços.',
        confirmText: 'Alterar para Freelancer'
      },
      aluno: {
        title: 'Mudar perfil para Estudante',
        message: 'Deseja alterar seu perfil para Estudante?\nVocê terá acesso prioritário a programas de estágio e capacitação regional.',
        confirmText: 'Alterar para Estudante'
      }
    };

    const targetConfig = roleDetails[newRole] || {
      title: 'Alterar Perfil',
      message: 'Deseja alterar seu tipo de perfil?',
      confirmText: 'Confirmar'
    };

    const confirmed = await showConfirm({
      title: targetConfig.title,
      message: targetConfig.message,
      confirmText: targetConfig.confirmText,
      cancelText: 'Cancelar',
      variant: 'primary',
      badge: 'Transição de Perfil'
    });
    if (!confirmed) return;

    setSwitchingRole(true);
    try {
      const updated = await updateAuthUser({
        role: newRole,
        activeRole: newRole,
        selectedRole: newRole,
        profileType: newRole,
        badge: roleBadges[newRole]
      }, currentUser);

      if (updated) {
        setCurrentUser(updated);
        setSelectedRole(newRole);
        showToast(`Perfil alterado com sucesso para ${roleBadges[newRole]}!`, 'success');
      } else {
        showToast('Não foi possível atualizar o perfil no momento.', 'error');
      }
    } catch (err) {
      console.error('Erro ao alternar perfil:', err);
      showToast('Erro ao atualizar tipo de perfil.', 'error');
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleCnpjChange = (e) => {
    const raw = e.target.value;
    const masked = maskCNPJ(raw);
    setCnpj(masked);
    setCnpjError('');

    const digits = cleanCNPJ(raw);
    if (digits.length === 14) {
      consultarCnpjReceita(digits);
    } else {
      setCnpjData(null);
    }
  };

  const consultarCnpjReceita = async (digitsToConsult) => {
    const digits = digitsToConsult || cleanCNPJ(cnpj);
    if (digits.length !== 14) {
      setCnpjError('O CNPJ deve conter 14 dígitos numéricos.');
      return;
    }

    if (!validateCNPJ(digits)) {
      setCnpjError('Dígitos verificadores do CNPJ incorretos (Módulo 11 da Receita Federal).');
      return;
    }

    setCnpjLoading(true);
    setCnpjError('');

    const res = await fetchCNPJData(digits);
    setCnpjLoading(false);

    if (res.success && res.data) {
      setCnpjData(res.data);
      showToast(`🏢 CNPJ Encontrado: ${res.data.razaoSocial} (${res.data.situacaoCadastral})`);
    } else {
      setCnpjError(res.error || 'Não foi possível validar os dados do CNPJ na Receita Federal.');
    }
  };

  // Company CNPJ Submission
  const handleCompanyVerificationSubmit = async (e) => {
    e.preventDefault();
    const cleanDigits = cleanCNPJ(cnpj);
    if (!cleanDigits || cleanDigits.length !== 14) {
      showToast('Por favor, informe um CNPJ válido com 14 dígitos.');
      return;
    }

    if (!validateCNPJ(cleanDigits)) {
      showToast('⚠️ CNPJ inválido pelos cálculos oficiais da Receita Federal.');
      return;
    }

    setSubmittingCompany(true);
    showToast('⏳ Validando e processando CNPJ e documentos...');

    try {
      let uploadedCnpjUrl = null;
      if (companyFile) {
        const uploadRes = await uploadUserDocument(companyFile, currentUser.uid || currentUser.id, 'cnpj_proof');
        if (uploadRes.success) {
          uploadedCnpjUrl = uploadRes.url;
        }
      }

      const res = submitCompanyVerification(cnpj, companyFile, {
        razaoSocial: cnpjData?.razaoSocial,
        nomeFantasia: cnpjData?.nomeFantasia,
        situacaoCadastral: cnpjData?.situacaoCadastral || 'ATIVA',
        cnpjProofUrl: uploadedCnpjUrl
      });

      if (res.success) {
        setCompanyVerified(true);
        setIsEditingCnpj(false);
        const updated = updateAuthUser({
          cnpj: maskCNPJ(cleanDigits),
          isVerifiedCompany: true,
          razaoSocial: cnpjData?.razaoSocial || currentUser?.razaoSocial || currentUser?.name,
          nomeFantasia: cnpjData?.nomeFantasia || currentUser?.nomeFantasia || currentUser?.name,
          situacaoCnpj: cnpjData?.situacaoCadastral || 'ATIVA',
          cnpjProofUrl: uploadedCnpjUrl,
          companyProofFile: companyFile?.name || currentUser?.companyProofFile || 'Cartao_CNPJ.pdf'
        });
        if (updated) {
          setCurrentUser(updated);
        }
        showToast('CNPJ autenticado! Sua empresa recebeu o Selo de Empresa Verificada.');
      } else {
        showToast(`⚠️ ${res.error}`);
      }
    } finally {
      setSubmittingCompany(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordSubmitAttempted(true);

    const check = validatePasswordChange({
      currentPassword,
      newPassword,
      confirmPassword,
      isGoogleOnly: isGoogleOnlyAuthUser()
    });

    if (!check.isValid) {
      setPasswordErrors(check.errors);
      const firstMsg = check.errors[check.firstErrorKey] || 'Verifique os dados da nova senha.';
      showToast(firstMsg, 'error');
      return;
    }

    setPasswordErrors({});
    setSubmittingPassword(true);
    try {
      const res = await updateUserPassword(currentPassword, newPassword);
      if (res.success) {
        showToast(res.message || 'Senha alterada com sucesso!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordReauthRequired(false);
        setPasswordSubmitAttempted(false);
      } else {
        if (res.requiresReauth) {
          setPasswordReauthRequired(true);
        }
        showToast(res.error || 'Não foi possível alterar a senha.', 'error');
      }
    } catch (err) {
      showToast('Erro ao atualizar senha: ' + (err.message || 'Tente novamente.'), 'error');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Sessão encerrada com sucesso.');
    navigate('/');
  };

  return (
    <>
      {/* HEADER */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.15),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white mb-4 bg-white/10 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para a tela anterior
          </button>

          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-heading font-extrabold text-white mb-3 tracking-tight">
              Configurações &amp; Autenticação
            </h1>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              Gerencie seus dados pessoais, verificação de matrícula acadêmica, CNPJ e preferências de segurança.
            </p>
          </div>
        </div>
      </header>

      <main className="container section">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Nav Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none w-full max-w-full">
            <button
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'account' ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <User size={16} /> Conta &amp; Redes Sociais
              {accountErrorCount > 0 && (
                <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1.5 py-0.2 rounded-full font-extrabold flex items-center gap-1">
                  <AlertCircle size={10} /> {accountErrorCount}
                </span>
              )}
            </button>

            {currentUser.role === 'aluno' && (
              <button
                onClick={() => setActiveTab('verification')}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'verification' ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <FileCheck size={16} /> Verificação de Estudante
                {verificationSubmitted && <span className="text-[10px] bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Check size={10} /> Verificado</span>}
              </button>
            )}

            {currentUser.role === 'empresa' && (
              <button
                onClick={() => setActiveTab('company')}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'company' ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <Building2 size={16} /> Verificação de CNPJ
                {companyVerified && <span className="text-[10px] bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Check size={10} /> CNPJ Ok</span>}
              </button>
            )}

            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'security' ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Lock size={16} /> Segurança &amp; Senha
              {passwordErrorCount > 0 && (
                <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1.5 py-0.2 rounded-full font-extrabold flex items-center gap-1">
                  <AlertCircle size={10} /> {passwordErrorCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'privacy' ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Bell size={16} /> Notificações &amp; Privacidade
            </button>
          </div>

          {/* ── ABA 1: CONTA & PERFIL ── */}
          {activeTab === 'account' && (
            <div className="card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white">Informações Gerais &amp; Redes Sociais</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Atualize seu nome de exibição, e-mail e perfis do LinkedIn / GitHub.</p>
                </div>
                <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={13} /> E-mail Confirmado
                </span>
              </div>

              <form onSubmit={handleSaveAccount} className="space-y-4" noValidate>
                {accountSubmitAttempted && accountErrorCount > 0 && (
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in duration-200">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Atenção:</span> Existem campos com informações inválidas ou pendentes ({accountErrorCount} erro{accountErrorCount > 1 ? 's' : ''}). Por favor, corrija antes de salvar.
                    </div>
                  </div>
                )}

                {/* Foto de Perfil / Avatar com Firebase Storage */}
                <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-5">
                  <div className="relative shrink-0">
                    {avatar && !isGenericPlaceholderAvatar(avatar) ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-blue shadow-sm bg-white dark:bg-slate-800"
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(name)} text-white font-extrabold text-xl flex items-center justify-center border-2 border-primary-blue shadow-sm`}
                      >
                        {(name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white text-[10px] font-bold">
                        Enviando...
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-[200px]">
                    <div className="font-bold text-sm text-gray-900 dark:text-white">Foto do Perfil</div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Envie uma imagem JPG, PNG ou WEBP (máx. 5MB).
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <label className="btn btn-outline btn-sm text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5">
                        <Camera size={13} /> {uploadingAvatar ? 'Enviando foto...' : 'Escolher Arquivo do PC'}
                        <input type="file" accept="image/*" onChange={handleAvatarFile} disabled={uploadingAvatar} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center justify-between">
                    <span>{currentUser?.role === 'empresa' ? 'Razão Social / Nome Oficial' : 'Nome Completo'} *</span>
                    <span className="text-[11px] font-normal text-gray-400">
                      {currentUser?.role === 'empresa' ? 'Nome oficial da organização' : 'Nome e sobrenome'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => handleNameChange(e.target.value)}
                    onBlur={handleNameBlur}
                    className={`form-control ${
                      accountErrors.name ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''
                    }`}
                    maxLength={100}
                    placeholder={currentUser?.role === 'empresa' ? 'Ex: Ivaí Tech Soluções Ltda' : 'Ex: João da Silva'}
                    required
                  />
                  {accountErrors.name && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{accountErrors.name}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail de Acesso *</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={e => handleEmailChange(e.target.value)}
                      onBlur={handleEmailBlur}
                      className={`form-control pr-10 ${
                        accountErrors.email ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''
                      }`}
                      placeholder="exemplo@email.com"
                      required
                    />
                    <Mail size={16} className="absolute right-3 top-3.5 text-gray-400 dark:text-slate-500" />
                  </div>
                  {accountErrors.email && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{accountErrors.email}</span>
                    </div>
                  )}
                </div>

                {/* Redes Sociais Opcionais */}
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="form-group">
                    <label className="form-label">Perfil do LinkedIn (Opcional)</label>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={e => handleLinkedinChange(e.target.value)}
                      onBlur={handleLinkedinBlur}
                      className={`form-control ${
                        accountErrors.linkedin ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''
                      }`}
                      placeholder="https://linkedin.com/in/seu-nome"
                    />
                    {accountErrors.linkedin && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{accountErrors.linkedin}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Perfil do GitHub / Portfólio (Opcional)</label>
                    <input
                      type="text"
                      value={github}
                      onChange={e => handleGithubChange(e.target.value)}
                      onBlur={handleGithubBlur}
                      className={`form-control ${
                        accountErrors.github ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''
                      }`}
                      placeholder="https://github.com/seu-usuario ou portfólio"
                    />
                    {accountErrors.github && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{accountErrors.github}</span>
                      </div>
                    )}
                  </div>
                </div>

                {currentUser?.role === 'aluno' && (
                  <div className="form-group">
                    <label className="form-label">RA / Matrícula Acadêmica (Opcional)</label>
                    <input
                      type="text"
                      value={raNumber}
                      onChange={e => handleRaChange(e.target.value)}
                      onBlur={handleRaBlur}
                      className={`form-control ${
                        accountErrors.raNumber ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''
                      }`}
                      placeholder="Ex: IFPR-2024-8891 ou UNIVALE-2025-102"
                    />
                    {accountErrors.raNumber ? (
                      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{accountErrors.raNumber}</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                        Identificador acadêmico opcional exibido no seu currículo e para recrutadores.
                      </p>
                    )}
                  </div>
                )}

                <div className="form-group space-y-3">
                  <div>
                    <label className="form-label">Tipo de Conta &amp; Regras de Candidatura</label>
                    <input
                      type="text"
                      value={currentUser.badge || currentUser.role}
                      disabled
                      className="form-control bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold border-gray-200 dark:border-slate-700 cursor-not-allowed"
                    />
                  </div>

                  {/* Cartão de Regras de Candidatura do Perfil */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-4.5 space-y-3">
                    <div className="flex items-start gap-2.5">
                      {currentUser.role === 'freelancer' ? (
                        <Wrench size={18} className="text-amber-500 shrink-0 mt-0.5" />
                      ) : currentUser.role === 'candidato' ? (
                        <Briefcase size={18} className="text-primary-blue shrink-0 mt-0.5" />
                      ) : currentUser.role === 'aluno' ? (
                        <GraduationCap size={18} className="text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <Building2 size={18} className="text-sky-500 shrink-0 mt-0.5" />
                      )}
                      <div className="text-xs leading-relaxed space-y-1">
                        <div className="font-bold text-gray-900 dark:text-white">
                          Diretrizes de Candidatura para seu Perfil:
                        </div>
                        {currentUser.role === 'freelancer' && (
                          <div className="text-gray-600 dark:text-slate-300">
                            Perfis <strong>Freelancer / Autônomo</strong> concorrem a oportunidades no modelo <strong>Prestador de Serviço (PJ)</strong> e projetos técnicos sob demanda. Não realizam candidaturas diretas a vagas de emprego formal (CLT / Estágio). Se você deseja buscar emprego formal com carteira assinada, altere seu tipo de perfil abaixo.
                          </div>
                        )}
                        {currentUser.role === 'candidato' && (
                          <div className="text-gray-600 dark:text-slate-300">
                            Perfis <strong>Candidato</strong> podem se candidatar a vagas de <strong>Emprego Formal CLT</strong> (Tempo Integral e Meio Período) e <strong>Prestador PJ</strong>. Vagas de <strong>Estágio</strong> são exclusivas para estudantes com matrícula acadêmica ativa.
                          </div>
                        )}
                        {currentUser.role === 'aluno' && (
                          <div className="text-gray-600 dark:text-slate-300">
                            Perfis <strong>Aluno / Estudante</strong> podem se candidatar a vagas de <strong>Estágio</strong> (mediante envio de declaração de matrícula), além de oportunidades CLT, Meio Período e PJ.
                          </div>
                        )}
                        {currentUser.role === 'empresa' && (
                          <div className="text-gray-600 dark:text-slate-300">
                            Perfis <strong>Empresa</strong> publicam oportunidades, realizam triagem de currículos e gerenciam processos seletivos. Não realizam candidaturas.
                          </div>
                        )}
                        {currentUser.role === 'professor' && (
                          <div className="text-gray-600 dark:text-slate-300">
                            Perfis <strong>Docente / Professor</strong> acompanham oportunidades acadêmicas e emitem recomendações de parecer pedagógico para estudantes.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ação de Alternância de Perfil (Aluno, Freelancer ou Candidato) */}
                    {['aluno', 'candidato', 'freelancer'].includes(currentUser.role) && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <span className="font-semibold text-gray-700 dark:text-slate-300">
                            Alternar Tipo de Perfil:
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-slate-400">
                            Escolha um perfil para testar as regras de candidatura
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleSwitchRole('aluno')}
                            disabled={currentUser.role === 'aluno' || switchingRole}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                              currentUser.role === 'aluno'
                                ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800 shadow-2xs cursor-default'
                                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-green-400'
                            }`}
                          >
                            <GraduationCap size={15} className={currentUser.role === 'aluno' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} />
                            <span>Aluno / Estudante</span>
                            {currentUser.role === 'aluno' && <Check size={13} className="text-green-600 dark:text-green-400" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSwitchRole('freelancer')}
                            disabled={currentUser.role === 'freelancer' || switchingRole}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                              currentUser.role === 'freelancer'
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 shadow-2xs cursor-default'
                                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                            }`}
                          >
                            <Wrench size={15} className={currentUser.role === 'freelancer' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'} />
                            <span>Freelancer (PJ)</span>
                            {currentUser.role === 'freelancer' && <Check size={13} className="text-amber-600 dark:text-amber-400" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSwitchRole('candidato')}
                            disabled={currentUser.role === 'candidato' || switchingRole}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                              currentUser.role === 'candidato'
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-primary-blue dark:text-blue-300 border-blue-300 dark:border-blue-800 shadow-2xs cursor-default'
                                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                            }`}
                          >
                            <Briefcase size={15} className={currentUser.role === 'candidato' ? 'text-primary-blue dark:text-blue-400' : 'text-gray-400'} />
                            <span>Candidato (CLT)</span>
                            {currentUser.role === 'candidato' && <Check size={13} className="text-primary-blue dark:text-blue-400" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={submittingAccount}
                    className="btn btn-primary btn-sm font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submittingAccount ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Salvando alterações...</span>
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        <span>Salvar Alterações</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── ABA 2: VERIFICAÇÃO DE ESTUDANTE (ALUNOS) ── */}
          {activeTab === 'verification' && currentUser.role === 'aluno' && (
            <div className="card p-6 sm:p-8 space-y-6">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white flex items-center gap-2">
                  <GraduationCap size={22} className="text-primary-blue dark:text-blue-400" /> Autenticação Oficial de Estudante
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Confirme seu e-mail institucional oficial (IFPR, Univale, UENP, UTFPR ou qualquer faculdade parceira com domínio <strong>.edu.br</strong>) para liberar candidaturas e ativar o <strong>Selo de Estudante Verificado</strong>.
                </p>
              </div>

              {verificationSubmitted ? (
                <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
                    <ShieldCheck size={28} />
                  </div>
                  <h4 className="font-heading font-bold text-lg text-emerald-900 dark:text-emerald-300">Estudante Autenticado com Sucesso!</h4>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 max-w-md mx-auto leading-relaxed">
                    Seu vínculo acadêmico foi confirmado oficialmente via Firebase Auth. Seu perfil está <strong>VISÍVEL</strong> para recrutadores e você pode se candidatar a todas as vagas do ecossistema.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {(currentUser.studentEmail || validateStudentEmail(currentUser.email)?.isValid) && (
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                        <GraduationCap size={14} className="text-emerald-600" />
                        <span>E-mail Estudantil: <strong>{currentUser.studentEmail || currentUser.email}</strong></span>
                      </div>
                    )}
                    {currentUser.institution && (
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                        Instituição: <strong>{currentUser.institution}</strong>
                      </div>
                    )}
                    {raNumber && (
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                        RA / Matrícula: {raNumber}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Autenticação Oficial por E-mail Estudantil (Prova de Propriedade) */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-800 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <GraduationCap size={18} className="text-primary-blue dark:text-blue-400" />
                        Validação Direta por E-mail Institucional
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                        Oficial Firebase Auth
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                      Informe seu e-mail institucional acadêmico (ex: <strong>@estudante.ifpr.edu.br</strong>, <strong>@aluno.uenp.edu.br</strong>, <strong>@univale.edu.br</strong>, <strong>@utfpr.edu.br</strong> ou qualquer domínio <strong>.edu.br</strong>). Enviaremos um link de confirmação para a sua caixa postal institucional para validar sua titularidade instantaneamente.
                    </p>

                    <form onSubmit={handleSendVerificationEmail} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={studentInstEmail}
                        onChange={e => setStudentInstEmail(e.target.value)}
                        placeholder="seu.nome@estudante.ifpr.edu.br"
                        className="form-control text-xs sm:text-sm flex-1"
                        required
                        disabled={submittingStudentEmail || checkingStudentStatus}
                      />
                      <button
                        type="submit"
                        disabled={submittingStudentEmail || checkingStudentStatus}
                        className="btn btn-primary btn-sm font-bold shrink-0 flex items-center justify-center gap-1.5"
                      >
                        {submittingStudentEmail ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Mail size={15} />
                            <span>{verificationEmailSent ? 'Reenviar Link' : 'Enviar Link de Validação'}</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Banner de Verificação Pendente & Botão de Checagem */}
                    {(verificationEmailSent || currentUser?.studentEmailVerificationSentAt) && (
                      <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
                        <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                          <AlertCircle size={17} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-semibold">Confirmação pendente na sua caixa postal institucional!</p>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                              Um link de validação foi enviado para <strong>{studentInstEmail || currentUser?.studentEmail || currentUser?.email}</strong>. Abra seu e-mail institucional, clique no link oficial do Firebase e em seguida clique no botão abaixo para ativar seu Selo de Estudante.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCheckStudentStatus}
                            disabled={checkingStudentStatus || submittingStudentEmail}
                            className="btn btn-primary btn-sm font-bold text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl shadow-xs"
                          >
                            {checkingStudentStatus ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Verificando com o Firebase...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={15} />
                                <span>Já confirmei meu e-mail (Verificar Status)</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleSendVerificationEmail}
                            disabled={submittingStudentEmail || checkingStudentStatus}
                            className="btn btn-ghost btn-sm text-xs font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1.5"
                          >
                            <RefreshCw size={13} className={submittingStudentEmail ? 'animate-spin' : ''} />
                            <span>Reenviar link</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ABA 3: VERIFICAÇÃO EMPRESARIAL CNPJ (EMPRESAS) ── */}
          {activeTab === 'company' && currentUser.role === 'empresa' && (
            <div className="card p-6 sm:p-8 space-y-6">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white flex items-center gap-2">
                    <Building2 size={22} className="text-primary-blue dark:text-blue-400" /> Autenticação Oficial de CNPJ da Empresa
                  </h3>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Módulo 11 + BrasilAPI
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Confirme o CNPJ da sua organização com validação oficial da Receita Federal para receber o selo **"Empresa Verificada"** e transmitir máxima segurança aos candidatos.
                </p>
              </div>

              {companyVerified && !isEditingCnpj ? (
                <div className="space-y-6">
                  <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-3xl p-6 sm:p-8 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/60 text-green-600 dark:text-green-400 mx-auto flex items-center justify-center shadow-inner">
                      <ShieldCheck size={32} />
                    </div>
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-green-200 dark:bg-green-900/80 text-green-900 dark:text-green-200 mb-2">
                        CNPJ Validado · Empresa Oficial
                      </span>
                      <h4 className="font-heading font-extrabold text-xl text-green-950 dark:text-green-200">
                        {currentUser?.razaoSocial || currentUser?.name}
                      </h4>
                      <p className="text-sm text-green-800 dark:text-green-300 max-w-lg mx-auto mt-1 leading-relaxed">
                        Sua organização possui o selo oficial de verificação. Todas as suas vagas publicadas no Vale do Ivaí ganham destaque e credibilidade.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left pt-2">
                      <div className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-green-200 dark:border-green-800/60 text-xs">
                        <span className="text-gray-500 dark:text-slate-400 block font-medium">CNPJ Cadastrado</span>
                        <span className="font-bold text-gray-800 dark:text-white font-mono text-sm">{currentUser?.cnpj || cnpj}</span>
                      </div>
                      <div className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-green-200 dark:border-green-800/60 text-xs">
                        <span className="text-gray-500 dark:text-slate-400 block font-medium">Situação Cadastral</span>
                        <span className="font-bold text-green-600 dark:text-green-400 font-mono text-sm">
                          {currentUser?.situacaoCnpj || 'ATIVA ✓'}
                        </span>
                      </div>
                    </div>

                    {currentUser?.companyProofFile && (
                      <div className="text-xs text-green-700 dark:text-green-400">
                        📄 Documento comprobatório: <strong>{currentUser.companyProofFile}</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingCnpj(true)}
                      className="btn btn-outline btn-sm text-xs font-semibold gap-1.5"
                    >
                      <RefreshCw size={13} /> Atualizar / Revalidar CNPJ
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCompanyVerificationSubmit} className="space-y-5">
                  <div className="form-group">
                    <label className="form-label flex items-center justify-between">
                      <span>CNPJ da Empresa (14 dígitos)</span>
                      <span className="text-xs font-normal text-gray-400">Ex: 12.345.678/0001-90</span>
                    </label>
                    <div className="flex gap-2.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={cnpj}
                          onChange={handleCnpjChange}
                          className="form-control pr-10 font-mono text-base font-semibold"
                          placeholder="00.000.000/0000-00"
                          maxLength={18}
                          required
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {cnpjLoading && <Loader2 size={18} className="animate-spin text-primary-blue" />}
                          {!cnpjLoading && cnpjData && <CheckCircle2 size={18} className="text-green-500" />}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => consultarCnpjReceita()}
                        disabled={cnpjLoading || !cnpj}
                        className="btn btn-outline btn-sm shrink-0 text-xs font-bold gap-1.5 px-4"
                      >
                        {cnpjLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        Consultar Receita
                      </button>
                    </div>

                    {cnpjError && (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                        <AlertCircle size={14} className="shrink-0" />
                        {cnpjError}
                      </div>
                    )}
                  </div>

                  {/* Informações retornadas pela BrasilAPI em Tempo Real */}
                  {cnpjData && (
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-green-200 dark:border-green-800/80 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-200 dark:border-slate-700 pb-2.5">
                        <span className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                          <CheckCircle2 size={15} /> Dados Autenticados na Base da Receita Federal
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          cnpjData.isAtiva
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                        }`}>
                          {cnpjData.situacaoCadastral}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-slate-400 block font-medium">Razão Social:</span>
                          <span className="font-bold text-gray-900 dark:text-white text-sm">{cnpjData.razaoSocial}</span>
                        </div>
                        {cnpjData.nomeFantasia && cnpjData.nomeFantasia !== cnpjData.razaoSocial && (
                          <div>
                            <span className="text-gray-500 dark:text-slate-400 block font-medium">Nome Fantasia:</span>
                            <span className="font-bold text-gray-800 dark:text-slate-200">{cnpjData.nomeFantasia}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500 dark:text-slate-400 block font-medium">Município / Estado:</span>
                          <span className="font-semibold text-gray-800 dark:text-slate-200">{cnpjData.cidade} / {cnpjData.uf}</span>
                        </div>
                        {cnpjData.cnae && (
                          <div>
                            <span className="text-gray-500 dark:text-slate-400 block font-medium">Atividade Principal:</span>
                            <span className="font-semibold text-gray-800 dark:text-slate-200 line-clamp-1">{cnpjData.cnae}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Anexar Comprovante / Cartão CNPJ (Opcional - PDF ou Imagem)</label>
                    <input
                      type="file"
                      ref={companyFileInputRef}
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={e => setCompanyFile(e.target.files?.[0])}
                      className="hidden"
                    />
                    <div
                      onClick={() => companyFileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-6 text-center bg-gray-50 dark:bg-slate-800/80 hover:bg-gray-100/80 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <Upload size={32} className="mx-auto mb-2 text-primary-blue dark:text-blue-400" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                        {companyFile ? `📄 ${companyFile.name} (${(companyFile.size / (1024 * 1024)).toFixed(2)} MB)` : 'Clique para selecionar o Cartão CNPJ da Receita Federal (PDF/Imagem)'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Formatos aceitos: PDF, PNG, JPG (Máx. 5MB)</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {isEditingCnpj && (
                      <button
                        type="button"
                        onClick={() => setIsEditingCnpj(false)}
                        className="btn btn-outline btn-sm font-semibold"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submittingCompany}
                      className="btn btn-primary btn-sm font-bold shadow-md ml-auto flex items-center gap-1.5"
                    >
                      <ShieldCheck size={16} /> {submittingCompany ? 'Autenticando CNPJ...' : 'Autenticar & Obter Selo Verificado'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── ABA 4: SEGURANÇA & SENHA ── */}
          {activeTab === 'security' && (
            <div className="card p-6 sm:p-8 space-y-6">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white flex items-center gap-2">
                  <ShieldCheck size={22} className="text-primary-blue dark:text-blue-400" />
                  Alteração de Senha
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Gerencie sua senha de acesso conectada diretamente ao Firebase Authentication.
                </p>
              </div>

              {isGoogleOnlyAuthUser() && (
                <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-3">
                  <AlertCircle size={18} className="text-primary-blue dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-bold">Conta vinculada com Google</p>
                    <p className="mt-0.5 opacity-90">
                      Você pode criar uma senha abaixo caso queira também acessar sua conta digitando e-mail e senha diretamente.
                    </p>
                  </div>
                </div>
              )}

              {passwordReauthRequired && (
                <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex items-start gap-3 animate-shake">
                  <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                    <p className="font-bold">Reautenticação Necessária</p>
                    <p className="mt-0.5">
                      Por motivos de segurança do Firebase Auth, confirme sua <strong>Senha Atual</strong> no campo abaixo para autorizar a modificação.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md" noValidate>
                {passwordSubmitAttempted && passwordErrorCount > 0 && (
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in duration-200">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Atenção:</span> Existem campos com informações inválidas na senha.
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Senha Atual</label>
                    {passwordReauthRequired && (
                      <span className="text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                        Obrigatória
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => {
                        setCurrentPassword(e.target.value);
                        if (passwordErrors.currentPassword) {
                          setPasswordErrors(prev => ({ ...prev, currentPassword: undefined }));
                        }
                        if (passwordReauthRequired && e.target.value.length > 0) {
                          setPasswordReauthRequired(false);
                        }
                      }}
                      className={`form-control pl-10 pr-10 ${
                        passwordErrors.currentPassword || passwordReauthRequired ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/10' : ''
                      }`}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-blue transition-colors pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
                      title={showCurrentPass ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword ? (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{passwordErrors.currentPassword}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-1">
                      Necessária para confirmar a sua identidade caso sua sessão não seja recente.
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Nova Senha</label>
                  <div className="relative group">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => {
                        setNewPassword(e.target.value);
                        if (passwordErrors.newPassword) {
                          setPasswordErrors(prev => ({ ...prev, newPassword: undefined }));
                        }
                      }}
                      className={`form-control pl-10 pr-10 ${
                        passwordErrors.newPassword ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''
                      }`}
                      placeholder="Mínimo de 6 caracteres"
                      required
                      autoComplete="new-password"
                    />
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-blue transition-colors pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
                      title={showNewPass ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{passwordErrors.newPassword}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmar Nova Senha</label>
                  <div className="relative group">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value);
                        if (passwordErrors.confirmPassword) {
                          setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }));
                        }
                      }}
                      className={`form-control pl-10 pr-10 ${
                        passwordErrors.confirmPassword ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''
                      }`}
                      placeholder="Repita a nova senha"
                      required
                      autoComplete="new-password"
                    />
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-blue transition-colors pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
                      title={showConfirmPass ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{passwordErrors.confirmPassword}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-start pt-2">
                  <button
                    type="submit"
                    disabled={submittingPassword}
                    className="btn btn-primary btn-sm font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {submittingPassword ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Atualizando no Firebase...
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        Atualizar Senha
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── ABA 5: NOTIFICAÇÕES & PRIVACIDADE ── */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="card p-6 sm:p-8 space-y-4">
                <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white flex items-center gap-2">
                  <Bell size={20} className="text-primary-blue dark:text-blue-400" /> Alertas por E-mail
                </h3>
                <div className="form-group">
                  <label className="form-label">Frequência de Notificações</label>
                  <select className="form-control font-medium">
                    <option value="all" className="dark:bg-slate-800 dark:text-white">Receber alertas diários de vagas combinantes e mensagens</option>
                    <option value="important" className="dark:bg-slate-800 dark:text-white">Apenas convites diretos para entrevistas</option>
                    <option value="none" className="dark:bg-slate-800 dark:text-white">Desativar notificações por e-mail</option>
                  </select>
                </div>
              </div>

              <div className="card p-6 sm:p-8 space-y-4">
                <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white flex items-center gap-2">
                  <Eye size={20} className="text-primary-blue dark:text-blue-400" /> Visibilidade no Banco de Talentos
                </h3>
                <div className="form-group">
                  <label className="form-label">Visibilidade do seu Perfil</label>
                  <select className="form-control font-medium">
                    <option value="public" className="dark:bg-slate-800 dark:text-white">Visível para todas as empresas contratantes do Vale do Ivaí (Requer Matrícula Verificada)</option>
                    <option value="verified_only" className="dark:bg-slate-800 dark:text-white">Apenas empresas com selo de CNPJ verificado</option>
                    <option value="private" className="dark:bg-slate-800 dark:text-white">Privado (Apenas quando você enviar candidatura)</option>
                  </select>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => showToast('Preferências de privacidade salvas!')} className="btn btn-primary btn-sm font-bold">
                    Salvar Preferências
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Zona de Encerramento */}
          <div className="card p-6 border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="font-heading font-bold text-base text-red-600 dark:text-red-400 flex items-center gap-2">
                <Shield size={18} /> Encerrar Sessão no Dispositivo
              </h4>
              <p className="text-xs text-gray-600 dark:text-slate-400">Sua conta continuará segura. Você poderá acessar novamente a qualquer momento.</p>
            </div>
            <button onClick={handleLogout} className="btn btn-danger btn-sm font-bold">
              <LogOut size={15} /> Sair da Conta
            </button>
          </div>

        </div>
      </main>
    </>
  );
}
