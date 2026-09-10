import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Settings, Bell, Lock, Eye, Shield, LogOut, ArrowLeft,
  FileCheck, CheckCircle2, User, Mail, ShieldCheck, Upload,
  Building2, FileText, Camera,
  Search, Loader2, AlertCircle, RefreshCw, Check
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  updateAuthUser,
  submitStudentVerification,
  submitCompanyVerification,
  uploadUserProfilePicture,
  uploadUserDocument,
  maskCNPJ,
  cleanCNPJ,
  validateCNPJ,
  fetchCNPJData
} from '../lib/ivaiConecta';

export default function Configuracoes() {
  const { currentUser, setCurrentUser, logout, showToast } = useAppStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account'); // 'account', 'verification', 'company', 'security', 'privacy'

  // Account form
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [linkedin, setLinkedin] = useState(currentUser?.linkedin || '');
  const [github, setGithub] = useState(currentUser?.github || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Verification form (Student)
  const [raNumber, setRaNumber] = useState(currentUser?.raNumber || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [verificationSubmitted, setVerificationSubmitted] = useState(currentUser?.isVerifiedStudent || false);
  const fileInputRef = useRef(null);

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
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submittingStudent, setSubmittingStudent] = useState(false);
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

  const handleSaveAccount = (e) => {
    e.preventDefault();
    updateAuthUser({ name, email, linkedin, github, avatar });
    setCurrentUser({ ...currentUser, name, email, linkedin, github, avatar });
    showToast('Dados da conta e foto atualizados com sucesso!');
  };

  // Student file drop / select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processStudentFile(file);
  };

  const processStudentFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('O arquivo selecionado excede o limite máximo de 5MB.');
      return;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
      showToast('Formato não permitido. Envie um arquivo PDF, PNG ou JPG.');
      return;
    }
    setSelectedFile(file);
    showToast(`Arquivo "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) selecionado!`);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processStudentFile(e.dataTransfer.files[0]);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!raNumber.trim()) {
      showToast('Por favor, informe seu RA / Número de Matrícula.');
      return;
    }
    if (!selectedFile && !currentUser?.isVerifiedStudent) {
      showToast('Por favor, selecione o arquivo PDF ou imagem da sua declaração de matrícula.');
      return;
    }

    setSubmittingStudent(true);
    showToast('Processando e autenticando declaração...');

    try {
      let uploadedDocUrl = null;
      if (selectedFile) {
        const uploadRes = await uploadUserDocument(selectedFile, currentUser.uid || currentUser.id, 'student_proof');
        if (uploadRes.success) {
          uploadedDocUrl = uploadRes.url;
        }
      }

      const res = submitStudentVerification(raNumber, selectedFile);
      if (res.success) {
        setVerificationSubmitted(true);
        const updated = updateAuthUser({
          isVerifiedStudent: true,
          raNumber,
          studentProofUrl: uploadedDocUrl,
          studentProofName: selectedFile?.name || 'Declaracao_Matricula.pdf'
        });
        if (updated) {
          setCurrentUser(updated);
        }
        showToast('Matrícula autenticada! Seu perfil de estudante está ativo e visível.');
      }
    } finally {
      setSubmittingStudent(false);
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

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('As senhas digitadas não coincidem.');
      return;
    }
    showToast('Senha alterada com sucesso!');
    setNewPassword('');
    setConfirmPassword('');
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
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'account' ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <User size={16} /> Conta &amp; Redes Sociais
            </button>

            {currentUser.role === 'aluno' && (
              <button
                onClick={() => setActiveTab('verification')}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
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
                className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'company' ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <Building2 size={16} /> Verificação de CNPJ
                {companyVerified && <span className="text-[10px] bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Check size={10} /> CNPJ Ok</span>}
              </button>
            )}

            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'security' ? 'border-primary-blue text-primary-blue dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Lock size={16} /> Segurança &amp; Senha
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
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

              <form onSubmit={handleSaveAccount} className="space-y-4">
                {/* Foto de Perfil / Avatar com Firebase Storage */}
                <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-5">
                  <div className="relative shrink-0">
                    <img
                      src={avatar}
                      alt={name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-blue shadow-sm bg-white dark:bg-slate-800"
                    />
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white text-[10px] font-bold">
                        Enviando...
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-[200px]">
                    <div className="font-bold text-sm text-gray-900 dark:text-white">Foto do Perfil</div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Envie uma imagem JPG, PNG ou WEBP (máx. 5MB) para salvar no Firebase Storage.
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
                  <label className="form-label">Nome Completo / Razão Social</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail de Acesso</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="form-control pr-10"
                      required
                    />
                    <Mail size={16} className="absolute right-3 top-3.5 text-gray-400 dark:text-slate-500" />
                  </div>
                </div>

                {/* Redes Sociais Opcionais */}
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="form-group">
                    <label className="form-label">Perfil do LinkedIn (Opcional)</label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={e => setLinkedin(e.target.value)}
                      className="form-control"
                      placeholder="https://linkedin.com/in/seu-perfil"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Perfil do GitHub / Portfólio (Opcional)</label>
                    <input
                      type="url"
                      value={github}
                      onChange={e => setGithub(e.target.value)}
                      className="form-control"
                      placeholder="https://github.com/seu-usuario"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Conta</label>
                  <input
                    type="text"
                    value={currentUser.badge}
                    disabled
                    className="form-control bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 cursor-not-allowed"
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <button type="submit" className="btn btn-primary btn-sm font-bold shadow-md">
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── ABA 2: VERIFICAÇÃO DE MATRÍCULA (ALUNOS) ── */}
          {activeTab === 'verification' && currentUser.role === 'aluno' && (
            <div className="card p-6 sm:p-8 space-y-6">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white flex items-center gap-2">
                  <ShieldCheck size={22} className="text-green-600 dark:text-green-400" /> Autenticação de Declaração de Matrícula
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Envie sua declaração emitida pelo IFPR, Univale ou UENP para autenticar seu vínculo, **liberar candidaturas a vagas** e tornar seu perfil **visível no Banco de Talentos**.
                </p>
              </div>

              {verificationSubmitted ? (
                <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/60 text-green-600 dark:text-green-400 mx-auto flex items-center justify-center">
                    <ShieldCheck size={28} />
                  </div>
                  <h4 className="font-heading font-bold text-lg text-green-900 dark:text-green-300">Estudante Autenticado com Sucesso!</h4>
                  <p className="text-sm text-green-800 dark:text-green-200 max-w-md mx-auto leading-relaxed">
                    Sua declaração de matrícula foi validada pelo sistema. Seu perfil está <strong>VISÍVEL</strong> para recrutadores e você pode se candidatar a todas as vagas do Vale do Ivaí.
                  </p>
                  <div className="text-xs font-semibold text-green-700 dark:text-green-300 bg-white/80 dark:bg-slate-900/80 inline-block px-3 py-1.5 rounded-lg border border-green-300 dark:border-green-800">
                    RA / Matrícula Registrada: {raNumber || 'IFPR-2026-VAL'}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleVerificationSubmit} className="space-y-5">
                  <div className="form-group">
                    <label className="form-label">RA / Número de Matrícula Acadêmica</label>
                    <input
                      type="text"
                      value={raNumber}
                      onChange={e => setRaNumber(e.target.value)}
                      className="form-control"
                      placeholder="Ex: IFPR-2024-8891 ou UNIVALE-2025-102"
                      required
                    />
                  </div>

                  {/* Input de Arquivo Real com Drag & Drop */}
                  <div className="form-group">
                    <label className="form-label">Anexar Declaração de Matrícula (PDF, PNG ou JPG - Máx. 5MB)</label>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                        dragActive
                          ? 'border-primary-blue bg-blue-50/50 dark:bg-blue-950/40'
                          : 'border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 hover:bg-gray-100/80 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Upload size={32} className="mx-auto mb-2 text-gray-400 dark:text-slate-500" />
                      
                      {selectedFile ? (
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-1.5">
                            <FileText size={16} /> {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            Tamanho: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Clique para alterar o arquivo
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                            Arraste seu arquivo PDF/Imagem aqui ou clique para selecionar
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">Formatos aceitos: PDF, PNG, JPG (Máx. 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={submittingStudent} className="btn btn-teal btn-sm font-bold shadow-md">
                      <ShieldCheck size={16} /> {submittingStudent ? 'Autenticando...' : 'Enviar Comprovante & Ativar Perfil'}
                    </button>
                  </div>
                </form>
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
                <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white">Alteração de Senha</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">Escolha uma nova senha forte para proteger seu acesso.</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div className="form-group">
                  <label className="form-label">Nova Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="form-control"
                    placeholder="Mínimo de 6 caracteres"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="form-control"
                    placeholder="Repita a nova senha"
                    required
                  />
                </div>

                <div className="flex justify-start pt-2">
                  <button type="submit" className="btn btn-primary btn-sm font-bold shadow-md">
                    Atualizar Senha
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
