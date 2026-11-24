import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Settings, Bell, Lock, Eye, EyeOff, Shield, LogOut, ArrowLeft,
  FileCheck, CheckCircle2, Mail, ShieldCheck, Upload,
  Building2, Search, Loader2, AlertCircle, RefreshCw, Check,
  Briefcase, GraduationCap, Save, ExternalLink, Globe,
  Share2, AlertTriangle, Trash2, Power, Download,
  Copy
} from 'lucide-react';

function LinkedInIcon({ className = 'w-4 h-4 fill-current' }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
    </svg>
  );
}

function GitHubIcon({ className = 'w-4 h-4 fill-current' }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
    </svg>
  );
}
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAppStore from '../store/useAppStore';
import {
  updateAuthUser,
  submitCompanyVerification,
  sendStudentVerificationEmail,
  checkStudentVerification,
  validateStudentEmail,
  uploadUserDocument,
  maskCNPJ,
  cleanCNPJ,
  validateCNPJ,
  fetchCNPJData,
  updateUserPassword,
  updateUserEmail,
  deactivateUserAccount,
  deleteUserAccount,
  isGoogleOnlyAuthUser,
  getUserNotificationPreferences,
  saveUserNotificationPreferences,
  getUserPrivacySettings,
  saveUserPrivacySettings,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_PRIVACY_SETTINGS,
  exportUserDataAsJSON
} from '../lib/ivaiConecta';
import {
  validateAccountEmail,
  validateAccountLinkedIn,
  validateAccountGitHubOrPortfolio,
  validateStudentRA,
  validatePasswordChange
} from '../utils/formValidation';

export default function Configuracoes() {
  const { currentUser, setCurrentUser, logout, showToast } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Abas disponíveis de acordo com o papel do usuário
  const userRole = currentUser?.role || 'candidato';
  const isAdmin = userRole === 'admin';
  const isEmpresa = userRole === 'empresa';
  const isAluno = userRole === 'aluno';
  const isProfessor = userRole === 'professor' || userRole === 'docente';

  // Define a aba inicial padrão
  const defaultTab = isAdmin ? 'account' : 'links';
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedTab = params.get('tab');
    const availableTabs = [
      !isAdmin ? 'links' : null,
      isAluno ? 'verification' : null,
      isEmpresa ? 'company' : null,
      'account',
      'notifications',
      'privacy'
    ].filter(Boolean);

    if (requestedTab && availableTabs.includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [location.search, isAdmin, isAluno, isEmpresa]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: false });
  };

  // ─── ESTADO: INFORMAÇÕES E REDES SOCIAIS (LINKS PROFISSIONAIS) ──────
  const [linkedin, setLinkedin] = useState(currentUser?.linkedin || '');
  const [github, setGithub] = useState(currentUser?.github || '');
  const [portfolio, setPortfolio] = useState(currentUser?.portfolio || currentUser?.website || '');
  const [additionalLink, setAdditionalLink] = useState(currentUser?.additionalLink || '');
  const [raNumber, setRaNumber] = useState(currentUser?.raNumber || '');
  const [linksErrors, setLinksErrors] = useState({});
  const [submittingLinks, setSubmittingLinks] = useState(false);

  // ─── ESTADO: CONFIGURAÇÕES DA CONTA ─────────────────────────────────
  const [currentEmailDisplay, setCurrentEmailDisplay] = useState(currentUser?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [emailPasswordConfirm, setEmailPasswordConfirm] = useState('');
  const [showEmailPassConfirm, setShowEmailPassConfirm] = useState(false);
  const [submittingEmailChange, setSubmittingEmailChange] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [pendingEmailNotice, setPendingEmailNotice] = useState(currentUser?.pendingEmail || null);

  // Alteração de Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Desativação e Exclusão
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [submittingDeactivation, setSubmittingDeactivation] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [submittingDeletion, setSubmittingDeletion] = useState(false);

  // ─── ESTADO: NOTIFICAÇÕES & PREFERÊNCIAS DE E-MAIL ─────────────────
  const [notifPrefs, setNotifPrefs] = useState({ ...DEFAULT_NOTIFICATION_PREFERENCES });
  const [savingNotifPrefs, setSavingNotifPrefs] = useState(false);

  // ─── ESTADO: PRIVACIDADE & LGPD ─────────────────────────────────────
  const [privacySettings, setPrivacySettings] = useState({ ...DEFAULT_PRIVACY_SETTINGS });
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  // ─── ESTADO: VERIFICAÇÃO ESTUDANTIL (ALUNO) ─────────────────────────
  const [verificationSubmitted, setVerificationSubmitted] = useState(currentUser?.isVerifiedStudent || false);
  const [studentInstEmail, setStudentInstEmail] = useState(
    currentUser?.studentEmail || (currentUser?.email && (validateStudentEmail(currentUser.email)?.isValid || currentUser.email.includes('estudante') || currentUser.email.includes('.edu')) ? currentUser.email : '')
  );
  const [submittingStudentEmail, setSubmittingStudentEmail] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(Boolean(currentUser?.studentEmailVerificationSentAt));
  const [checkingStatusManual, setCheckingStatusManual] = useState(false);

  // ─── ESTADO: VERIFICAÇÃO DE CNPJ (EMPRESA) ──────────────────────────
  const [cnpj, setCnpj] = useState(currentUser?.cnpj || '');
  const [companyFile, setCompanyFile] = useState(null);
  const [companyVerified, setCompanyVerified] = useState(
    currentUser?.companyVerificationStatus === 'VALIDADA' && currentUser?.isVerifiedCompany === true
  );
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjData, setCnpjData] = useState(null);
  const [cnpjError, setCnpjError] = useState('');
  const [isEditingCnpj, setIsEditingCnpj] = useState(false);
  const [submittingCompany, setSubmittingCompany] = useState(false);
  const companyFileInputRef = useRef(null);

  // Sincroniza dados com o Firestore ao montar ou trocar de usuário
  useEffect(() => {
    const uid = currentUser?.uid || currentUser?.id;
    if (!uid) return;

    let isMounted = true;

    // 1. Busca dados do documento do usuário
    const userDocRef = doc(db, 'users', String(uid));
    getDoc(userDocRef).then((snap) => {
      if (!isMounted || !snap.exists()) return;
      const data = snap.data();

      if (data.email) setCurrentEmailDisplay(data.email);
      if (data.pendingEmail) setPendingEmailNotice(data.pendingEmail);
      if (data.linkedin !== undefined) setLinkedin(data.linkedin || '');
      if (data.github !== undefined) setGithub(data.github || '');
      if (data.portfolio !== undefined) setPortfolio(data.portfolio || '');
      else if (data.website) setPortfolio(data.website);
      if (data.additionalLink !== undefined) setAdditionalLink(data.additionalLink || '');
      if (data.raNumber !== undefined) setRaNumber(data.raNumber || '');
      if (data.cnpj) setCnpj(data.cnpj);
      if (data.isVerifiedCompany != null || data.companyVerificationStatus != null) {
        setCompanyVerified(
          data.companyVerificationStatus === 'VALIDADA' && data.isVerifiedCompany === true
        );
      }
      if (data.isVerifiedStudent != null) {
        setVerificationSubmitted(Boolean(isAluno && (data.isVerifiedStudent || data.institutionalValidationStatus === 'VALIDADO')));
      }
      if (data.studentEmail) setStudentInstEmail(data.studentEmail);

      if (data.notificationPreferences) {
        setNotifPrefs({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...data.notificationPreferences });
      }
      if (data.privacySettings) {
        setPrivacySettings({ ...DEFAULT_PRIVACY_SETTINGS, ...data.privacySettings });
      }
    }).catch(err => console.warn('[Configuracoes] Erro ao sincronizar dados com Firestore:', err));

    // 2. Carrega preferências de notificação
    getUserNotificationPreferences(uid).then(prefs => {
      if (isMounted && prefs) setNotifPrefs(prefs);
    });

    // 3. Carrega preferências de privacidade
    getUserPrivacySettings(uid).then(priv => {
      if (isMounted && priv) setPrivacySettings(priv);
    });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid, currentUser?.id, isAluno]);

  const isStudentVerified = Boolean(
    currentUser?.isVerifiedStudent === true ||
    currentUser?.institutionalValidationStatus === 'VALIDADO' ||
    verificationSubmitted
  );

  useEffect(() => {
    if (!isAluno || isStudentVerified) return;

    let isMounted = true;
    let isCheckingAutomatically = false;
    let lastCheckAt = 0;

    const checkAutomatically = async () => {
      if (!isMounted || isCheckingAutomatically) return;
      const now = Date.now();
      // Não executa mais de uma vez a cada 3 segundos para evitar rate limiting e flicker
      if (now - lastCheckAt < 3000) return;
      lastCheckAt = now;
      isCheckingAutomatically = true;
      try {
        const result = await checkStudentVerification();
        if (isMounted && result.success && result.verified) {
          setVerificationSubmitted(true);
          setVerificationEmailSent(false);
          if (result.user) {
            setCurrentUser(result.user);
          } else {
            setCurrentUser(prev => ({
              ...prev,
              isVerifiedStudent: true,
              institutionalValidationStatus: 'VALIDADO',
              emailVerified: true
            }));
          }
          showToast('🎉 Seu e-mail institucional foi validado com sucesso!');
        }
      } catch {
        // Falha silenciosa; a verificação poderá ser tentada manualmente ou ao focar a aba
      } finally {
        if (isMounted) {
          isCheckingAutomatically = false;
        }
      }
    };

    // Polling contínuo de 4s somente se o envio do e-mail de verificação já tiver ocorrido
    const hasSentEmail = verificationEmailSent || Boolean(currentUser?.studentEmailVerificationSentAt);
    let intervalId = null;
    if (hasSentEmail) {
      intervalId = window.setInterval(checkAutomatically, 4000);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAutomatically();
      }
    };

    window.addEventListener('focus', checkAutomatically);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener('focus', checkAutomatically);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAluno, isStudentVerified, verificationEmailSent, currentUser?.studentEmailVerificationSentAt, setCurrentUser, showToast]);

  if (!currentUser) {
    return (
      <div className="container section text-center py-24">
        <Settings size={54} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
        <h2 className="font-heading text-2xl font-bold text-gray-700 dark:text-white mb-2">Acesso restrito</h2>
        <p className="text-gray-500 dark:text-slate-300 mb-6">Você precisa estar logado para acessar as configurações da sua conta.</p>
        <Link to="/login" className="btn btn-primary px-6 py-2.5 font-bold">Entrar na Conta</Link>
      </div>
    );
  }

  // ─── HANDLERS: INFORMAÇÕES E REDES SOCIAIS ──────────────────────────
  const handleSaveLinks = async (e) => {
    e.preventDefault();
    if (submittingLinks) return;

    const errors = {};
    if (linkedin?.trim()) {
      const v = validateAccountLinkedIn(linkedin.trim());
      if (!v.valid) errors.linkedin = v.error;
    }
    if (github?.trim()) {
      const v = validateAccountGitHubOrPortfolio(github.trim());
      if (!v.valid) errors.github = v.error;
    }
    if (portfolio?.trim()) {
      const v = validateAccountGitHubOrPortfolio(portfolio.trim());
      if (!v.valid) errors.portfolio = v.error;
    }
    if (additionalLink?.trim()) {
      const v = validateAccountGitHubOrPortfolio(additionalLink.trim());
      if (!v.valid) errors.additionalLink = v.error;
    }
    if (raNumber?.trim() && isAluno) {
      const v = validateStudentRA(raNumber.trim());
      if (!v.valid) errors.raNumber = v.error;
    }

    if (Object.keys(errors).length > 0) {
      setLinksErrors(errors);
      showToast('Por favor, verifique os links informados.', 'error');
      return;
    }
    setLinksErrors({});

    setSubmittingLinks(true);
    try {
      const patch = {
        linkedin: linkedin.trim(),
        github: github.trim(),
        portfolio: portfolio.trim(),
        website: portfolio.trim(),
        additionalLink: additionalLink.trim(),
        ...(isAluno ? { raNumber: raNumber.trim() } : {})
      };

      const updated = await updateAuthUser(patch, currentUser);
      if (updated) {
        setCurrentUser(updated);
        showToast('Links profissionais atualizados com sucesso!', 'success');
      }
    } catch (err) {
      showToast(err?.message || 'Erro ao salvar links profissionais.', 'error');
    } finally {
      setSubmittingLinks(false);
    }
  };

  // ─── HANDLERS: ALTERAÇÃO DE E-MAIL ──────────────────────────────────
  const handleSaveEmail = async (e) => {
    e.preventDefault();
    if (submittingEmailChange) return;

    setEmailError('');
    const v = validateAccountEmail(newEmail);
    if (!v.valid) {
      setEmailError(v.error);
      return;
    }

    setSubmittingEmailChange(true);
    try {
      const res = await updateUserEmail(newEmail, emailPasswordConfirm);
      if (res.success) {
        showToast(res.message, 'success', 6000);
        setPendingEmailNotice(newEmail.toLowerCase().trim());
        setNewEmail('');
        setEmailPasswordConfirm('');
      } else {
        setEmailError(res.error || 'Não foi possível solicitar a alteração de e-mail.');
        showToast(res.error || 'Erro ao alterar e-mail.', 'error');
      }
    } catch (err) {
      setEmailError(err?.message || 'Erro inesperado.');
      showToast('Erro ao atualizar e-mail: ' + (err?.message || 'Tente novamente.'), 'error');
    } finally {
      setSubmittingEmailChange(false);
    }
  };

  // ─── HANDLERS: ALTERAÇÃO DE SENHA ───────────────────────────────────
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (submittingPassword) return;

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
      } else {
        showToast(res.error || 'Não foi possível alterar a senha.', 'error');
      }
    } catch (err) {
      showToast('Erro ao atualizar senha: ' + (err?.message || 'Tente novamente.'), 'error');
    } finally {
      setSubmittingPassword(false);
    }
  };

  // ─── HANDLERS: DESATIVAÇÃO DE CONTA ─────────────────────────────────
  const handleConfirmDeactivate = async () => {
    setSubmittingDeactivation(true);
    try {
      const res = await deactivateUserAccount(deactivationReason);
      if (res.success) {
        setIsDeactivateModalOpen(false);
        showToast(res.message, 'info', 6000);
        navigate('/');
      } else {
        showToast(res.error || 'Não foi possível desativar a conta.', 'error');
      }
    } catch (err) {
      showToast('Erro na desativação: ' + (err?.message || 'Tente novamente.'), 'error');
    } finally {
      setSubmittingDeactivation(false);
    }
  };

  // ─── HANDLERS: EXCLUSÃO DE CONTA ────────────────────────────────────
  const handleConfirmDelete = async () => {
    const isGoogle = isGoogleOnlyAuthUser();
    if (!isGoogle && !deletePassword.trim()) {
      showToast('Por favor, informe sua senha atual para confirmar a exclusão.', 'error');
      return;
    }
    if (isGoogle && deleteConfirmationInput.trim().toUpperCase() !== 'EXCLUIR') {
      showToast('Digite a palavra EXCLUIR para confirmar a ação irreversível.', 'error');
      return;
    }

    setSubmittingDeletion(true);
    try {
      const res = await deleteUserAccount(deletePassword);
      if (res.success) {
        setIsDeleteModalOpen(false);
        showToast('Sua conta foi excluída com sucesso. Sentiremos sua falta!', 'info', 6000);
        navigate('/');
      } else {
        showToast(res.error || 'Não foi possível excluir a conta.', 'error');
      }
    } catch (err) {
      showToast('Erro ao excluir conta: ' + (err?.message || 'Tente novamente.'), 'error');
    } finally {
      setSubmittingDeletion(false);
    }
  };

  // ─── HANDLERS: NOTIFICAÇÕES ─────────────────────────────────────────
  const handleSaveNotifications = async (e) => {
    if (e) e.preventDefault();
    const uid = currentUser?.uid || currentUser?.id;
    if (!uid) return;
    if (savingNotifPrefs) return;

    setSavingNotifPrefs(true);
    try {
      const res = await saveUserNotificationPreferences(uid, notifPrefs);
      if (res.success) {
        showToast('Preferências de notificação salvas com sucesso!', 'success');
      } else {
        showToast(res.error || 'Erro ao salvar preferências.', 'error');
      }
    } catch (err) {
      showToast(err?.message || 'Erro ao salvar preferências de notificação.', 'error');
    } finally {
      setSavingNotifPrefs(false);
    }
  };

  // ─── HANDLERS: PRIVACIDADE ──────────────────────────────────────────
  const handleSavePrivacy = async (e) => {
    if (e) e.preventDefault();
    const uid = currentUser?.uid || currentUser?.id;
    if (!uid) return;
    if (savingPrivacy) return;

    setSavingPrivacy(true);
    try {
      const res = await saveUserPrivacySettings(uid, privacySettings);
      if (res.success) {
        showToast('Configurações de privacidade salvas com sucesso!', 'success');
      } else {
        showToast(res.error || 'Erro ao salvar privacidade.', 'error');
      }
    } catch (err) {
      showToast(err?.message || 'Erro ao salvar configurações de privacidade.', 'error');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      await exportUserDataAsJSON(currentUser);
      showToast('Download do arquivo de dados pessoais (LGPD) iniciado com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao exportar dados: ' + (err?.message || 'Tente novamente.'), 'error');
    } finally {
      setExportingData(false);
    }
  };

  // ─── HANDLERS: VERIFICAÇÃO ESTUDANTIL (ALUNO) ───────────────────────
  const handleSendVerificationEmail = async (e) => {
    if (e) e.preventDefault();
    if (submittingStudentEmail) return;
    setSubmittingStudentEmail(true);
    try {
      const emailToVerify = studentInstEmail.trim() || currentUser?.studentEmail || currentUser?.email;
      const response = await sendStudentVerificationEmail(emailToVerify);
      if (response.success) {
        setVerificationEmailSent(true);
        showToast(response.message || 'Enviamos o link de validação para seu e-mail institucional.');
      }
      else showToast(response.error || 'Não foi possível enviar o link de validação.');
    } catch (err) {
      showToast(err?.message || 'Não foi possível enviar o link de validação.');
    } finally {
      setSubmittingStudentEmail(false);
    }
  };

  const handleCheckVerificationManually = async () => {
    if (checkingStatusManual) return;
    setCheckingStatusManual(true);
    try {
      const result = await checkStudentVerification();
      if (result.success && result.verified) {
        setVerificationSubmitted(true);
        setVerificationEmailSent(false);
        if (result.user) {
          setCurrentUser(result.user);
        } else {
          setCurrentUser(prev => ({
            ...prev,
            isVerifiedStudent: true,
            institutionalValidationStatus: 'VALIDADO',
            emailVerified: true
          }));
        }
        showToast(result.message || '🎉 Validação confirmada! Seu Selo de Estudante foi ativado com sucesso.');
      } else {
        showToast(result.message || '⚠️ Confirmação ainda não detectada. Abra a mensagem em sua caixa postal e clique no link de ativação.');
      }
    } catch (err) {
      console.warn('[Configuracoes] Erro na checagem manual:', err);
      showToast('Erro ao consultar verificação. Tente novamente em instantes.');
    } finally {
      setCheckingStatusManual(false);
    }
  };

  // ─── HANDLERS: VERIFICAÇÃO DE CNPJ (EMPRESA) ────────────────────────
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

  const handleCompanyVerificationSubmit = async (e) => {
    e.preventDefault();
    if (submittingCompany) return;
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
      if (!companyFile) {
        showToast('⚠️ O documento comprobatório é obrigatório.');
        return;
      }

      const uploadRes = await uploadUserDocument(
        companyFile,
        currentUser.uid || currentUser.id,
        'cnpj_proof'
      );
      if (!uploadRes.success || !uploadRes.url) {
        showToast(`⚠️ ${uploadRes.error || 'Não foi possível armazenar o documento. Envie novamente.'}`);
        return;
      }
      const uploadedCnpjUrl = uploadRes.url;

      const res = await submitCompanyVerification(cnpj, companyFile, {
        razaoSocial: cnpjData?.razaoSocial,
        nomeFantasia: cnpjData?.nomeFantasia,
        situacaoCadastral: cnpjData?.situacaoCadastral || 'ATIVA',
        cnpjProofUrl: uploadedCnpjUrl
      });

      if (res.success) {
        setCompanyVerified(false);
        setIsEditingCnpj(false);
        if (res.user) {
          setCurrentUser(res.user);
        }
        showToast('Solicitação enviada! O selo será concedido após análise administrativa.');
      } else {
        showToast(`⚠️ ${res.error}`);
      }
    } catch (err) {
      showToast(`⚠️ ${err?.message || 'Não foi possível enviar a solicitação de verificação.'}`, 'error');
    } finally {
      setSubmittingCompany(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Sessão encerrada com sucesso.');
    navigate('/');
  };

  const copyUidToClipboard = () => {
    const uid = currentUser?.uid || currentUser?.id || '';
    if (uid && navigator.clipboard) {
      navigator.clipboard.writeText(uid);
      showToast('ID da conta copiado para a área de transferência!');
    }
  };

  return (
    <>
      {/* ── HEADER SUPERIOR ELEGANTE ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.15),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white mb-4 bg-white/10 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Voltar para a tela anterior
          </button>

          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-heading font-extrabold text-white mb-3 tracking-tight">
              Configurações da Conta
            </h1>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              Gerencie a segurança da sua conta, suas redes profissionais, preferências de notificação por e-mail e privacidade dos dados.
            </p>
          </div>
        </div>
      </header>

      <div className="container section">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ── NAVEGAÇÃO POR ABAS COESA E ADAPTÁVEL ── */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none w-full max-w-full">
            {!isAdmin && (
              <button
                type="button"
                onClick={() => changeTab('links')}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'links'
                    ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                {isEmpresa ? <Building2 size={16} /> : <Share2 size={16} />}
                <span>{isEmpresa ? 'Canais & Redes' : 'Informações & Redes Sociais'}</span>
              </button>
            )}

            {isAluno && (
              <button
                type="button"
                onClick={() => changeTab('verification')}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'verification'
                    ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <FileCheck size={16} />
                <span>Verificação de Estudante</span>
                {verificationSubmitted && (
                  <span className="text-[10px] bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Check size={10} /> Verificado
                  </span>
                )}
              </button>
            )}

            {isEmpresa && (
              <button
                type="button"
                onClick={() => changeTab('company')}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'company'
                    ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <ShieldCheck size={16} />
                <span>Verificação de CNPJ</span>
                {companyVerified && (
                  <span className="text-[10px] bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Check size={10} /> CNPJ Ok
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => changeTab('account')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'account'
                  ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Lock size={16} />
              <span>Configurações da Conta</span>
            </button>

            <button
              type="button"
              onClick={() => changeTab('notifications')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'notifications'
                  ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Bell size={16} />
              <span>Notificações por E-mail</span>
            </button>

            <button
              type="button"
              onClick={() => changeTab('privacy')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'privacy'
                  ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Shield size={16} />
              <span>Privacidade &amp; LGPD</span>
            </button>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── ABA 1: INFORMAÇÕES E REDES SOCIAIS (LINKS PROFISSIONAIS) ─ */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'links' && !isAdmin && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Card Orientativo: Separação de Perfil Público vs Configurações */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-primary-blue dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Links Profissionais &amp; Presença Online
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      Gerencie os canais de contato e portfólios que complementam seu perfil profissional.
                    </p>
                  </div>
                </div>

                <Link
                  to={isEmpresa ? '/empresa' : isProfessor ? '/professor' : userRole === 'freelancer' ? '/freelancer' : '/perfil'}
                  className="btn btn-outline btn-sm text-xs font-bold shrink-0 flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
                >
                  <span>Editar Perfil Público</span>
                  <ExternalLink size={13} />
                </Link>
              </div>

              {/* Formulário de Links Profissionais */}
              <div className="card p-6 sm:p-8 space-y-6">
                <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                  <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white">
                    {isEmpresa ? 'Canais Oficiais da Empresa' : isProfessor ? 'Canais Acadêmicos & Redes' : 'Redes Sociais & Portfólio Profissional'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    {isEmpresa
                      ? 'Adicione os canais digitais onde candidatos e parceiros podem conhecer sua atuação.'
                      : isProfessor
                        ? 'Mantenha seus links acadêmicos atualizados para facilitar o contato de estudantes e instituições parceiras.'
                        : 'Mantenha seus links sempre atualizados para facilitar a avaliação de recrutadores e empresas parceiras.'}
                  </p>
                </div>

                <form onSubmit={handleSaveLinks} className="space-y-4" noValidate>
                  {/* LinkedIn */}
                  <div className="form-group">
                    <label className="form-label flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <LinkedInIcon className="w-4 h-4 text-[#0A66C2] fill-current" />
                        {isEmpresa ? 'Página da Empresa no LinkedIn' : 'Perfil do LinkedIn'}
                      </span>
                      <span className="text-[11px] font-normal text-gray-400">Opcional</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={linkedin}
                        onChange={e => {
                          setLinkedin(e.target.value);
                          if (linksErrors.linkedin) setLinksErrors(prev => ({ ...prev, linkedin: undefined }));
                        }}
                        className={`form-control ${linksErrors.linkedin ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''}`}
                        placeholder="https://linkedin.com/in/seu-nome ou linkedin.com/company/sua-empresa"
                      />
                    </div>
                    {linksErrors.linkedin ? (
                      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{linksErrors.linkedin}</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                        Exemplo: https://linkedin.com/in/seu-usuario
                      </p>
                    )}
                  </div>

                  {/* GitHub ou Website Corporativo */}
                  <div className="form-group">
                    <label className="form-label flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <GitHubIcon className="w-4 h-4 fill-current text-gray-800 dark:text-white" />
                        {isEmpresa ? 'Repositório Oficial / GitHub Organizacional' : 'Perfil do GitHub'}
                      </span>
                      <span className="text-[11px] font-normal text-gray-400">Opcional</span>
                    </label>
                    <input
                      type="text"
                      value={github}
                      onChange={e => {
                        setGithub(e.target.value);
                        if (linksErrors.github) setLinksErrors(prev => ({ ...prev, github: undefined }));
                      }}
                      className={`form-control ${linksErrors.github ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''}`}
                      placeholder="https://github.com/seu-usuario ou seu-usuario"
                    />
                    {linksErrors.github && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{linksErrors.github}</span>
                      </div>
                    )}
                  </div>

                  {/* Portfólio Web / Website Oficial */}
                  <div className="form-group">
                    <label className="form-label flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Globe size={16} className="text-primary-blue dark:text-blue-400" />
                        {isEmpresa ? 'Website Oficial da Empresa' : 'Portfólio Pessoal ou Site Profissional'}
                      </span>
                      <span className="text-[11px] font-normal text-gray-400">Opcional</span>
                    </label>
                    <input
                      type="text"
                      value={portfolio}
                      onChange={e => {
                        setPortfolio(e.target.value);
                        if (linksErrors.portfolio) setLinksErrors(prev => ({ ...prev, portfolio: undefined }));
                      }}
                      className={`form-control ${linksErrors.portfolio ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''}`}
                      placeholder={isEmpresa ? 'https://suaempresa.com.br' : 'https://seuportfoliopessoal.dev'}
                    />
                    {linksErrors.portfolio && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{linksErrors.portfolio}</span>
                      </div>
                    )}
                  </div>

                  {/* Link Profissional Adicional */}
                  <div className="form-group">
                    <label className="form-label flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Share2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                        Outro Link Profissional (Lattes, Behance, Dribbble, Medium)
                      </span>
                      <span className="text-[11px] font-normal text-gray-400">Opcional</span>
                    </label>
                    <input
                      type="text"
                      value={additionalLink}
                      onChange={e => {
                        setAdditionalLink(e.target.value);
                        if (linksErrors.additionalLink) {
                          setLinksErrors(prev => ({ ...prev, additionalLink: null }));
                        }
                      }}
                      className={`form-control ${linksErrors.additionalLink ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="https://behance.net/seu-perfil ou currículo Lattes"
                    />
                    {linksErrors.additionalLink && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {linksErrors.additionalLink}
                      </p>
                    )}
                  </div>

                  {/* Campo de Matrícula (Exclusivo para Aluno) */}
                  {isAluno && (
                    <div className="form-group pt-2 border-t border-gray-100 dark:border-slate-800">
                      <label className="form-label flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <GraduationCap size={16} className="text-green-600" />
                          RA / Matrícula Acadêmica
                        </span>
                        <span className="text-[11px] font-normal text-gray-400">Opcional</span>
                      </label>
                      <input
                        type="text"
                        value={raNumber}
                        onChange={e => {
                          setRaNumber(e.target.value);
                          if (linksErrors.raNumber) setLinksErrors(prev => ({ ...prev, raNumber: undefined }));
                        }}
                        className={`form-control ${linksErrors.raNumber ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''}`}
                        placeholder="Ex: IFPR-2024-8891 ou UNIVALE-2025-102"
                      />
                      {linksErrors.raNumber && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{linksErrors.raNumber}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={submittingLinks}
                      className="btn btn-primary btn-sm font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {submittingLinks ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Salvando links...</span>
                        </>
                      ) : (
                        <>
                          <Save size={15} />
                          <span>Salvar Links Profissionais</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── ABA 2: CONFIGURAÇÕES DA CONTA (GERENCIAMENTO REAL) ─────── */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Cartão de Resumo e Metadados da Conta */}
              <div className="card p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white flex items-center gap-2">
                      <Lock size={22} className="text-primary-blue dark:text-blue-400" />
                      Informações da Conta
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                      Dados cadastrais do seu acesso no Firebase Authentication.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={13} /> Conta Ativa
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200/80 dark:border-slate-700/80">
                    <span className="text-gray-500 dark:text-slate-400 block font-medium">E-mail Cadastrado</span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm break-all font-mono mt-0.5 block">
                      {currentEmailDisplay || currentUser.email}
                    </span>
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200/80 dark:border-slate-700/80">
                    <span className="text-gray-500 dark:text-slate-400 block font-medium">Tipo de Conta</span>
                    <span className="font-bold text-primary-blue dark:text-blue-400 text-sm mt-0.5 block">
                      {currentUser.badge || currentUser.role}
                    </span>
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200/80 dark:border-slate-700/80">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-slate-400 font-medium">Identificador Único (UID)</span>
                      <button
                        type="button"
                        onClick={copyUidToClipboard}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                        title="Copiar ID"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                    <span className="font-mono text-xs font-semibold text-gray-700 dark:text-slate-300 mt-1 block truncate">
                      {currentUser.uid || currentUser.id}
                    </span>
                  </div>
                </div>

                {/* Aviso se houver troca de e-mail pendente */}
                {pendingEmailNotice && (
                  <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 dark:text-amber-200">
                      <p className="font-bold">Confirmação de novo e-mail pendente!</p>
                      <p className="mt-0.5 leading-relaxed">
                        Uma solicitação para alterar seu login para <strong>{pendingEmailNotice}</strong> foi enviada. Abra a caixa de entrada desse novo endereço e clique no link de validação para efetivar a mudança.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── SEÇÃO: ALTERAR ENDEREÇO DE E-MAIL ── */}
              <div className="card p-6 sm:p-8 space-y-4">
                <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
                  <h4 className="font-heading font-bold text-lg text-primary-dark dark:text-white flex items-center gap-2">
                    <Mail size={18} className="text-primary-blue dark:text-blue-400" />
                    Alterar Endereço de E-mail
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    A alteração é validada pelo Firebase Authentication via Prova de Propriedade (envio de link de confirmação para a nova caixa postal).
                  </p>
                </div>

                <form onSubmit={handleSaveEmail} className="space-y-4 max-w-md" noValidate>
                  <div className="form-group">
                    <label className="form-label">Novo Endereço de E-mail *</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => {
                        setNewEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      className={`form-control ${emailError ? 'border-red-500 focus:border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''}`}
                      placeholder="novo.email@exemplo.com"
                      required
                    />
                    {emailError && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 dark:text-red-400 text-xs font-semibold">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{emailError}</span>
                      </div>
                    )}
                  </div>

                  {!isGoogleOnlyAuthUser() && (
                    <div className="form-group">
                      <label className="form-label flex items-center justify-between">
                        <span>Senha Atual (Reautenticação de Segurança)</span>
                        <span className="text-[11px] font-normal text-gray-400">Obrigatória</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showEmailPassConfirm ? 'text' : 'password'}
                          value={emailPasswordConfirm}
                          onChange={e => setEmailPasswordConfirm(e.target.value)}
                          className="form-control pr-10"
                          placeholder="Digite sua senha atual"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmailPassConfirm(!showEmailPassConfirm)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                        >
                          {showEmailPassConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingEmailChange || !newEmail.trim()}
                    className="btn btn-outline btn-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingEmailChange ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Enviando confirmação...</span>
                      </>
                    ) : (
                      <>
                        <Mail size={14} />
                        <span>Solicitar Alteração de E-mail</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* ── SEÇÃO: ALTERAR SENHA ── */}
              <div className="card p-6 sm:p-8 space-y-4">
                <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
                  <h4 className="font-heading font-bold text-lg text-primary-dark dark:text-white flex items-center gap-2">
                    <ShieldCheck size={18} className="text-primary-blue dark:text-blue-400" />
                    Alteração de Senha
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Atualize sua senha de acesso vinculada com segurança ao Firebase Authentication.
                  </p>
                </div>

                {isGoogleOnlyAuthUser() && (
                  <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                    <AlertCircle size={16} className="text-primary-blue dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Conta vinculada via Google:</span> Você pode definir uma senha abaixo caso queira também acessar sua conta digitando e-mail e senha diretamente.
                    </div>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md" noValidate>
                  {!isGoogleOnlyAuthUser() && (
                    <div className="form-group">
                      <label className="form-label">Senha Atual</label>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={e => {
                            setCurrentPassword(e.target.value);
                            if (passwordErrors.currentPassword) {
                              setPasswordErrors(prev => ({ ...prev, currentPassword: undefined }));
                            }
                          }}
                          className={`form-control pr-10 ${passwordErrors.currentPassword ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10' : ''}`}
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                        >
                          {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs font-semibold">
                          <AlertCircle size={13} />
                          <span>{passwordErrors.currentPassword}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Nova Senha (Mínimo de 6 caracteres)</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => {
                          setNewPassword(e.target.value);
                          if (passwordErrors.newPassword) {
                            setPasswordErrors(prev => ({ ...prev, newPassword: undefined }));
                          }
                        }}
                        className={`form-control pr-10 ${passwordErrors.newPassword ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''}`}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs font-semibold">
                        <AlertCircle size={13} />
                        <span>{passwordErrors.newPassword}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirmar Nova Senha</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => {
                          setConfirmPassword(e.target.value);
                          if (passwordErrors.confirmPassword) {
                            setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }));
                          }
                        }}
                        className={`form-control pr-10 ${passwordErrors.confirmPassword ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : ''}`}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs font-semibold">
                        <AlertCircle size={13} />
                        <span>{passwordErrors.confirmPassword}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPassword}
                    className="btn btn-primary btn-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {submittingPassword ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Atualizando senha...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        <span>Atualizar Senha</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* ── SEÇÃO: DESATIVAÇÃO TEMPORÁRIA DA CONTA ── */}
              <div className="card p-6 sm:p-8 space-y-4 border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/15">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Power size={20} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-lg text-amber-950 dark:text-amber-200">
                      Desativação Temporária da Conta
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                      Se você deseja pausar suas atividades temporariamente, desative seu perfil. Seus dados e histórico permanecem totalmente preservados para quando você decidir retornar.
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-amber-900/80 dark:text-amber-300/80 pl-13">
                  <p>• {isProfessor ? 'Seu perfil docente ficará oculto para solicitações de parecer durante a pausa;' : 'Seu perfil não aparecerá em buscas ou no Banco de Talentos durante a pausa;'}</p>
                  <p>• {isProfessor ? 'Seus pareceres já emitidos permanecerão vinculados aos alunos;' : 'Suas candidaturas em andamento ficarão suspensas;'}</p>
                  <p>• Você poderá reativar seu acesso a qualquer momento ao fazer login novamente.</p>
                </div>

                <div className="pt-2 pl-13">
                  <button
                    type="button"
                    onClick={() => setIsDeactivateModalOpen(true)}
                    className="btn btn-outline btn-sm text-xs font-bold border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
                  >
                    Desativar Conta Temporariamente
                  </button>
                </div>
              </div>

              {/* ── SEÇÃO: EXCLUSÃO PERMANENTE (ZONA DE PERIGO / LGPD) ── */}
              {!isAdmin && (
                <div className="card p-6 sm:p-8 space-y-4 border-red-300 dark:border-red-900/80 bg-red-50/40 dark:bg-red-950/25">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-heading font-bold text-lg text-red-700 dark:text-red-300">
                          Zona de Perigo: Exclusão Permanente da Conta
                        </h4>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-200 dark:bg-red-900/80 text-red-900 dark:text-red-200">
                          LGPD · Ação Irreversível
                        </span>
                      </div>
                      <p className="text-xs text-red-800 dark:text-red-300/90 mt-1 leading-relaxed">
                        {isProfessor
                          ? 'Excluir permanentemente sua conta removerá todos os seus dados pessoais do Ivaí Conecta, incluindo perfil docente, matérias cadastradas e credenciais de acesso. Esta operação é irreversível.'
                          : 'Excluir permanentemente sua conta removerá todos os seus dados pessoais do Ivaí Conecta, incluindo perfil, currículo, candidaturas ativas e credenciais de acesso. Esta operação é irreversível.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 pl-13">
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="btn btn-danger btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Excluir Minha Conta Definitivamente</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── ABA 3: NOTIFICAÇÕES & PREFERÊNCIAS DE E-MAIL ──────────── */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="card p-6 sm:p-8 space-y-6">
                <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                  <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white flex items-center gap-2">
                    <Bell size={22} className="text-primary-blue dark:text-blue-400" />
                    Preferências de Notificações por E-mail
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    Escolha quando e como deseja ser avisado sobre o andamento de oportunidades, processos seletivos e mensagens.
                  </p>
                </div>

                <form onSubmit={handleSaveNotifications} className="space-y-6">
                  {/* Chave Mestra: Habilitar/Desabilitar Geral */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        Notificações por E-mail (Geral)
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Permitir que o sistema envie alertas transacionais para sua caixa de entrada ({currentEmailDisplay || currentUser.email}).
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={notifPrefs.emailNotifications}
                        onChange={e => setNotifPrefs(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  {/* Categorias Granulares de Notificação */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Categorias de Alertas
                    </h4>

                    {/* Processo Seletivo (Candidato/Aluno/Freelancer) */}
                    {!isEmpresa && !isProfessor && (
                      <div className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-white">
                            Atualizações de Processos Seletivos
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Seja avisado sempre que uma empresa parceira alterar a etapa da sua candidatura (ex: Triagem, Em Análise, Aprovado).
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            disabled={!notifPrefs.emailNotifications}
                            checked={notifPrefs.applicationUpdates && notifPrefs.emailNotifications}
                            onChange={e => setNotifPrefs(prev => ({ ...prev, applicationUpdates: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-gray-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary-blue peer-disabled:opacity-40"></div>
                        </label>
                      </div>
                    )}

                    {/* Convites para Entrevistas */}
                    {!isProfessor && (
                      <div className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-white">
                            Convites e Agendamentos de Entrevistas
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Receba avisos por e-mail com data, horário e link oficial de salas virtuais agendadas.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            disabled={!notifPrefs.emailNotifications}
                            checked={notifPrefs.interviewInvites && notifPrefs.emailNotifications}
                            onChange={e => setNotifPrefs(prev => ({ ...prev, interviewInvites: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-gray-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary-blue peer-disabled:opacity-40"></div>
                        </label>
                      </div>
                    )}

                    {/* Novas Candidaturas (Empresa) */}
                    {isEmpresa && (
                      <div className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-white">
                            Novas Inscrições em Vagas Abertas
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Receba alertas quando novos estudantes ou profissionais se candidatarem às vagas da sua empresa.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            disabled={!notifPrefs.emailNotifications}
                            checked={notifPrefs.newApplicants && notifPrefs.emailNotifications}
                            onChange={e => setNotifPrefs(prev => ({ ...prev, newApplicants: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-gray-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary-blue peer-disabled:opacity-40"></div>
                        </label>
                      </div>
                    )}

                    {/* Solicitações de Parecer Pedagógico (Professor) */}
                    {isProfessor && (
                      <div className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-white">
                            Solicitações de Parecer Pedagógico
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Receba alertas quando um estudante solicitar sua recomendação acadêmica.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            disabled={!notifPrefs.emailNotifications}
                            checked={(notifPrefs.recommendationRequests ?? true) && notifPrefs.emailNotifications}
                            onChange={e => setNotifPrefs(prev => ({ ...prev, recommendationRequests: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-gray-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary-blue peer-disabled:opacity-40"></div>
                        </label>
                      </div>
                    )}

                    {/* Mensagens Diretas das Empresas */}
                    <div className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-800 dark:text-white">
                          Mensagens Diretas &amp; Comunicação
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          Notificações quando {isEmpresa ? 'candidatos' : isProfessor ? 'alunos, empresas ou colegas docentes' : 'empresas ou recrutadores'} enviarem mensagens no chat.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          disabled={!notifPrefs.emailNotifications}
                          checked={notifPrefs.companyMessages && notifPrefs.emailNotifications}
                          onChange={e => setNotifPrefs(prev => ({ ...prev, companyMessages: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5.5 bg-gray-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary-blue peer-disabled:opacity-40"></div>
                      </label>
                    </div>

                    {/* Comunicados da Plataforma */}
                    <div className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-800 dark:text-white">
                          Comunicados Importantes da Plataforma
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          Avisos sobre eventos acadêmicos, programas regionais e oportunidades de capacitação do Ivaí Conecta.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          disabled={!notifPrefs.emailNotifications}
                          checked={notifPrefs.platformAnnouncements && notifPrefs.emailNotifications}
                          onChange={e => setNotifPrefs(prev => ({ ...prev, platformAnnouncements: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5.5 bg-gray-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary-blue peer-disabled:opacity-40"></div>
                      </label>
                    </div>
                  </div>

                  {/* Frequência de Envio */}
                  <div className="form-group pt-2 border-t border-gray-100 dark:border-slate-800">
                    <label className="form-label">Frequência de Notificações por E-mail</label>
                    <select
                      value={notifPrefs.frequency || 'instant'}
                      onChange={e => setNotifPrefs(prev => ({ ...prev, frequency: e.target.value }))}
                      disabled={!notifPrefs.emailNotifications}
                      className="form-control text-xs sm:text-sm font-medium"
                    >
                      <option value="instant" className="dark:bg-slate-800">Envio em tempo real (Imediato a cada atualização)</option>
                      <option value="daily" className="dark:bg-slate-800">Resumo consolidado diário</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingNotifPrefs}
                      className="btn btn-primary btn-sm font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {savingNotifPrefs ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Salvando preferências...</span>
                        </>
                      ) : (
                        <>
                          <Save size={15} />
                          <span>Salvar Preferências de Notificação</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── ABA 4: PRIVACIDADE & DADOS PESSOAIS (LGPD) ─────────────── */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="card p-6 sm:p-8 space-y-6">
                <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                  <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white flex items-center gap-2">
                    <Shield size={22} className="text-primary-blue dark:text-blue-400" />
                    Privacidade &amp; Controle de Dados Pessoais
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    Defina a visibilidade do seu perfil no Vale do Ivaí e exerça seus direitos garantidos pela LGPD (Lei Geral de Proteção de Dados).
                  </p>
                </div>

                <form onSubmit={handleSavePrivacy} className="space-y-6">
                  {/* Visibilidade no Banco de Talentos */}
                  {!isEmpresa && !isProfessor && (
                    <div className="form-group">
                      <label className="form-label">Visibilidade no Banco de Talentos Regional</label>
                      <select
                        value={privacySettings.talentDirectoryVisibility || 'public'}
                        onChange={e => setPrivacySettings(prev => ({ ...prev, talentDirectoryVisibility: e.target.value }))}
                        className="form-control text-xs sm:text-sm font-medium appearance-none"
                      >
                        <option value="public" className="dark:bg-slate-800">
                          Público: Visível para todas as empresas contratantes do ecossistema
                        </option>
                        <option value="verified_only" className="dark:bg-slate-800">
                          Restrito: Apenas empresas com selo oficial de CNPJ Verificado
                        </option>
                        <option value="private" className="dark:bg-slate-800">
                          Oculto / Privado: Visível exclusivamente quando você se candidatar a uma vaga
                        </option>
                      </select>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                        Controla se recrutadores podem encontrar seu currículo por buscas ativas no Banco de Talentos.
                      </p>
                    </div>
                  )}

                  {/* Exibição de Contatos */}
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-white">
                        {isProfessor ? 'Exibição de Canais Acadêmicos' : 'Exibição de Canais Profissionais para Recrutadores'}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        {isProfessor
                          ? 'Permitir que estudantes e instituições visualizem seus links acadêmicos e de contato no seu perfil.'
                          : 'Permitir que empresas parceiras visualizem seus links de LinkedIn e GitHub no seu currículo.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={privacySettings.showContactInfo}
                        onChange={e => setPrivacySettings(prev => ({ ...prev, showContactInfo: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5.5 bg-gray-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  {/* Mensagens Diretas */}
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-white">
                        Recebimento de Mensagens no Chat Interno
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        {isProfessor
                          ? 'Permitir que estudantes, empresas e colegas docentes iniciem conversas diretamente no sistema.'
                          : 'Permitir que empresas iniciem conversas sobre oportunidades diretamente no sistema.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={privacySettings.allowDirectMessages}
                        onChange={e => setPrivacySettings(prev => ({ ...prev, allowDirectMessages: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5.5 bg-gray-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingPrivacy}
                      className="btn btn-primary btn-sm font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {savingPrivacy ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Salvando privacidade...</span>
                        </>
                      ) : (
                        <>
                          <Save size={15} />
                          <span>Salvar Configurações de Privacidade</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* ── SEÇÃO LGPD: PORTABILIDADE E EXPORTAÇÃO DE DADOS ── */}
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Download size={16} className="text-primary-blue" />
                        Portabilidade de Dados Pessoais (LGPD - Art. 18, V)
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Você tem o direito de baixar uma cópia completa dos seus dados cadastrais armazenados na plataforma em formato aberto (.JSON).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportData}
                      disabled={exportingData}
                      className="btn btn-outline btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {exportingData ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      <span>Exportar Meus Dados (JSON)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── ABA 5: VERIFICAÇÃO DE ESTUDANTE (EXCLUSIVA ALUNOS) ────── */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'verification' && isAluno && (
            <div className="card p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white flex items-center gap-2">
                  <GraduationCap size={22} className="text-primary-blue dark:text-blue-400" />
                  Autenticação Oficial de Estudante
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Confirme seu e-mail institucional oficial (IFPR, Univale, UENP, UTFPR ou faculdade com domínio <strong>.edu.br</strong>) para validar sua matrícula acadêmica e ativar o <strong>Selo de Estudante Verificado</strong>.
                </p>
              </div>

              {verificationSubmitted ? (
                <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
                    <ShieldCheck size={28} />
                  </div>
                  <h4 className="font-heading font-bold text-lg text-emerald-900 dark:text-emerald-300">
                    Estudante Autenticado com Sucesso!
                  </h4>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 max-w-md mx-auto leading-relaxed">
                    Seu vínculo acadêmico foi confirmado oficialmente via Firebase Auth. Seu perfil recebe destaque para vagas de estágio e oportunidades no Vale do Ivaí.
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
                      E-mail institucional cadastrado. Enviaremos um link seguro pelo Firebase exclusivamente para este endereço.
                    </p>

                    <form onSubmit={handleSendVerificationEmail} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={studentInstEmail}
                        className="form-control text-xs sm:text-sm flex-1"
                        readOnly
                        disabled
                      />
                      <button
                        type="submit"
                        disabled={submittingStudentEmail}
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
                            <span>{verificationEmailSent ? 'Reenviar link' : 'Enviar link de validação'}</span>
                          </>
                        )}
                      </button>
                    </form>

                    {(verificationEmailSent || currentUser?.studentEmailVerificationSentAt) && (
                      <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
                        <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                          <AlertCircle size={17} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-semibold">Confirmação pendente na sua caixa postal institucional!</p>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                              Enviamos um link para <strong>{studentInstEmail || currentUser?.studentEmail || currentUser?.email}</strong>. Abra-o e confirme seu endereço.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                            <Loader2 size={14} className="animate-spin text-emerald-600 dark:text-emerald-400" />
                            <span>Verificando automaticamente após confirmação...</span>
                          </div>

                          <button
                            type="button"
                            onClick={handleCheckVerificationManually}
                            disabled={checkingStatusManual}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-primary-blue hover:bg-primary-hover text-white transition-all shadow-xs disabled:opacity-60 cursor-pointer"
                          >
                            {checkingStatusManual ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Checando...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw size={13} />
                                <span>Já confirmei meu e-mail</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── ABA 6: VERIFICAÇÃO DE CNPJ (EXCLUSIVA EMPRESAS) ────────── */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'company' && isEmpresa && (
            <div className="card p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white flex items-center gap-2">
                    <Building2 size={22} className="text-primary-blue dark:text-blue-400" />
                    Autenticação Oficial de CNPJ da Empresa
                  </h3>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Módulo 11 + BrasilAPI
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Confirme o CNPJ da sua organização com validação oficial da Receita Federal para receber o selo <strong>"Empresa Verificada"</strong> e transmitir máxima segurança aos candidatos.
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
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="company-cnpj-proof">
                      Anexar Comprovante / Cartão CNPJ (obrigatório - PDF ou Imagem)
                    </label>
                    <input
                      id="company-cnpj-proof"
                      type="file"
                      ref={companyFileInputRef}
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={e => setCompanyFile(e.target.files?.[0])}
                      className="hidden"
                    />
                    <div
                      onClick={() => companyFileInputRef.current?.click()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          companyFileInputRef.current?.click();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="Selecionar comprovante ou cartão CNPJ"
                      className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-6 text-center bg-gray-50 dark:bg-slate-800/80 hover:bg-gray-100/80 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <Upload size={32} className="mx-auto mb-2 text-primary-blue dark:text-blue-400" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                        {companyFile ? `📄 ${companyFile.name} (${(companyFile.size / (1024 * 1024)).toFixed(2)} MB)` : 'Clique para anexar o Cartão CNPJ da Receita Federal (PDF/Imagem)'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Formatos aceitos: PDF, PNG, JPG (Máx. 5MB)</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {isEditingCnpj && (
                      <button
                        type="button"
                        onClick={() => setIsEditingCnpj(false)}
                        className="btn btn-outline btn-sm font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submittingCompany}
                      className="btn btn-primary btn-sm font-bold shadow-md ml-auto flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck size={16} />
                      <span>{submittingCompany ? 'Autenticando CNPJ...' : 'Autenticar & Obter Selo Verificado'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── CARD DE ENCERRAMENTO DE SESSÃO ── */}
          <div className="card p-6 border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="font-heading font-bold text-base text-gray-800 dark:text-slate-200 flex items-center gap-2">
                <Shield size={18} className="text-primary-blue" />
                Sessão Conectada no Dispositivo
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Sua conta continuará segura. Você poderá acessar novamente a qualquer momento com suas credenciais.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-danger btn-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={15} />
              <span>Sair da Conta</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── MODAL: DESATIVAÇÃO TEMPORÁRIA DA CONTA ── */}
      {isDeactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-amber-200 dark:border-amber-800/60 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Power size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                  Desativar Conta Temporariamente?
                </h3>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Seus dados continuam preservados
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                Ao confirmar a desativação:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-gray-500 dark:text-slate-400">
                <li>Seu perfil não aparecerá em pesquisas de vagas ou no banco de talentos;</li>
                <li>Suas candidaturas ativas ficarão pausadas;</li>
                <li>Sua sessão será encerrada agora neste dispositivo;</li>
                <li>Você poderá reativar a sua conta a qualquer momento simplesmente realizando login.</li>
              </ul>
            </div>

            <div className="form-group pt-1">
              <label className="form-label text-xs">Motivo da desativação (Opcional):</label>
              <input
                type="text"
                value={deactivationReason}
                onChange={e => setDeactivationReason(e.target.value)}
                placeholder="Ex: Emprego conquistado, pausa nos estudos..."
                className="form-control text-xs"
                maxLength={100}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeactivateModalOpen(false)}
                disabled={submittingDeactivation}
                className="btn btn-outline btn-sm text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={submittingDeactivation}
                className="btn btn-sm text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {submittingDeactivation ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                <span>Confirmar Desativação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EXCLUSÃO PERMANENTE DA CONTA (LGPD) ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-red-300 dark:border-red-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-red-700 dark:text-red-300">
                  Excluir Conta Permanentemente?
                </h3>
                <span className="text-xs font-extrabold uppercase text-red-600 dark:text-red-400">
                  Ação Irreversível · LGPD
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                Esta ação apagará em definitivo seus dados pessoais, credenciais, histórico de candidaturas e preferências de privacidade.
              </p>
              <p className="font-semibold text-red-600 dark:text-red-400">
                Não será possível recuperar seu acesso após confirmar.
              </p>
            </div>

            {isGoogleOnlyAuthUser() ? (
              <div className="form-group pt-1">
                <label className="form-label text-xs">
                  Para confirmar, digite a palavra <strong>EXCLUIR</strong>:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationInput}
                  onChange={e => setDeleteConfirmationInput(e.target.value)}
                  placeholder="EXCLUIR"
                  className="form-control text-xs font-mono font-bold"
                />
              </div>
            ) : (
              <div className="form-group pt-1">
                <label className="form-label text-xs">
                  Confirme sua senha atual para autorizar a exclusão:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Sua senha atual"
                  className="form-control text-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletePassword('');
                  setDeleteConfirmationInput('');
                }}
                disabled={submittingDeletion}
                className="btn btn-outline btn-sm text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submittingDeletion}
                className="btn btn-danger btn-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {submittingDeletion ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>Excluir Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
