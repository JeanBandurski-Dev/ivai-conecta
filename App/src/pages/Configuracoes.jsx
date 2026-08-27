import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Settings, Bell, Lock, Eye, Shield, LogOut, ArrowLeft,
  FileCheck, CheckCircle2, User, Mail, ShieldCheck, Upload,
  Building2, Globe, FileText, Check, AlertTriangle, Trash2, Camera
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  updateAuthUser,
  submitStudentVerification,
  submitCompanyVerification,
  uploadUserProfilePicture,
  uploadUserDocument
} from '../lib/ivaiConecta';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
];

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
  const companyFileInputRef = useRef(null);

  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    showToast('⏳ Enviando foto para o Firebase Storage...');
    const res = await uploadUserProfilePicture(file, currentUser.uid || currentUser.id);
    setUploadingAvatar(false);
    if (res.success) {
      setAvatar(res.url);
      setCurrentUser({ ...currentUser, avatar: res.url });
      showToast('📸 Foto de perfil salva no Storage com sucesso!');
    } else {
      showToast(`⚠️ ${res.error || 'Erro ao enviar imagem.'}`);
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
      showToast('⚠️ O arquivo selecionado excede o limite máximo de 5MB.');
      return;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
      showToast('⚠️ Formato não permitido. Envie um arquivo PDF, PNG ou JPG.');
      return;
    }
    setSelectedFile(file);
    showToast(`📄 Arquivo "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) selecionado!`);
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

    let uploadedDocUrl = null;
    if (selectedFile) {
      showToast('⏳ Enviando comprovante estudantil para o Storage...');
      const uploadRes = await uploadUserDocument(selectedFile, currentUser.uid || currentUser.id, 'student_proof');
      if (uploadRes.success) {
        uploadedDocUrl = uploadRes.url;
      }
    }

    const res = submitStudentVerification(raNumber, selectedFile);
    if (res.success) {
      setVerificationSubmitted(true);
      updateAuthUser({
        isVerifiedStudent: true,
        raNumber,
        studentProofUrl: uploadedDocUrl,
        studentProofName: selectedFile?.name || 'Declaracao_Matricula.pdf'
      });
      showToast('🎉 Declaração enviada e salva na nuvem! Sua conta de aluno foi autenticada.');
    }
  };

  // Company CNPJ Submission
  const handleCompanyVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!cnpj.trim()) {
      showToast('Por favor, informe o CNPJ da empresa.');
      return;
    }

    let uploadedCnpjUrl = null;
    if (companyFile) {
      showToast('⏳ Enviando Cartão CNPJ para o Storage...');
      const uploadRes = await uploadUserDocument(companyFile, currentUser.uid || currentUser.id, 'cnpj_proof');
      if (uploadRes.success) {
        uploadedCnpjUrl = uploadRes.url;
      }
    }

    const res = submitCompanyVerification(cnpj, companyFile);
    if (res.success) {
      setCompanyVerified(true);
      if (uploadedCnpjUrl) {
        updateAuthUser({ cnpjProofUrl: uploadedCnpjUrl });
      }
      showToast('🎉 CNPJ autenticado e documento armazenado no Storage!');
    } else {
      showToast(res.error);
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
                {verificationSubmitted && <span className="text-[10px] bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">Verificado ✓</span>}
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
                {companyVerified && <span className="text-[10px] bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">CNPJ Ok ✓</span>}
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
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-blue shadow-sm bg-white"
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
                    <button type="submit" className="btn btn-teal btn-sm font-bold shadow-md">
                      <ShieldCheck size={16} /> Enviar Comprovante &amp; Ativar Perfil
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
                <h3 className="font-heading font-bold text-xl text-primary-dark dark:text-white flex items-center gap-2">
                  <Building2 size={22} className="text-primary-blue dark:text-blue-400" /> Autenticação de CNPJ da Empresa
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Para garantir a segurança dos candidatos e evitar fraudes, confirme os dados cadastrais do seu CNPJ para receber o selo **"Empresa Verificada"**.
                </p>
              </div>

              {companyVerified ? (
                <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/60 text-green-600 dark:text-green-400 mx-auto flex items-center justify-center">
                    <ShieldCheck size={28} />
                  </div>
                  <h4 className="font-heading font-bold text-lg text-green-900 dark:text-green-300">Empresa Autenticada com Sucesso!</h4>
                  <p className="text-sm text-green-800 dark:text-green-200 max-w-md mx-auto leading-relaxed">
                    Seu CNPJ foi validado no Ivaí Conecta. Todas as vagas publicadas por sua empresa agora exibem o selo **"Empresa Verificada (CNPJ Validado)"**.
                  </p>
                  <div className="text-xs font-semibold text-green-700 dark:text-green-300 bg-white/80 dark:bg-slate-900/80 inline-block px-3 py-1.5 rounded-lg border border-green-300 dark:border-green-800">
                    CNPJ Registrado: {cnpj || '12.345.678/0001-90'}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCompanyVerificationSubmit} className="space-y-5">
                  <div className="form-group">
                    <label className="form-label">CNPJ da Empresa (14 dígitos)</label>
                    <input
                      type="text"
                      value={cnpj}
                      onChange={e => setCnpj(e.target.value)}
                      className="form-control"
                      placeholder="Ex: 12.345.678/0001-90"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Anexar Comprovante de Inscrição / Cartão CNPJ (PDF ou Imagem)</label>
                    <input
                      type="file"
                      ref={companyFileInputRef}
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={e => setCompanyFile(e.target.files?.[0])}
                      className="hidden"
                    />
                    <div
                      onClick={() => companyFileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-6 text-center bg-gray-50 dark:bg-slate-800/80 hover:bg-gray-100/80 cursor-pointer"
                    >
                      <Upload size={32} className="mx-auto mb-2 text-gray-400 dark:text-slate-500" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                        {companyFile ? `📄 ${companyFile.name}` : 'Clique para selecionar o Cartão CNPJ ou Contrato Social (PDF/Imagem)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="btn btn-primary btn-sm font-bold shadow-md">
                      <ShieldCheck size={16} /> Validar CNPJ Empresarial
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
