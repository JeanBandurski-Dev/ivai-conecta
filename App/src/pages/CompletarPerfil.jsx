import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { CITIES, completeUserProfile, maskCNPJ, cleanCNPJ, validateCNPJ, fetchCNPJData, validateStudentEmail, isInstitutionalEmail, inferInstitutionFromEmail } from '../lib/ivaiConecta';
import { auth } from '../lib/firebase';
import { CheckCircle2, ArrowRight, GraduationCap, UserCheck, Wrench, Briefcase, Building2, Sparkles, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

const ROLES = [
  { id: 'aluno',      label: 'Aluno / Estudante',       icon: GraduationCap, desc: 'Acesse vagas de estágio e endossos acadêmicos' },
  { id: 'empresa',    label: 'Empresa / Recrutador',     icon: Building2,     desc: 'Publique vagas e encontre talentos qualificados' },
  { id: 'professor',  label: 'Professor / Docente',     icon: UserCheck,     desc: 'Emita pareceres pedagógicos para seus alunos' },
  { id: 'freelancer', label: 'Freelancer / Autônomo',    icon: Wrench,        desc: 'Divulgue seus serviços no marketplace local' },
  { id: 'candidato',  label: 'Candidato Geral',          icon: Briefcase,     desc: 'Encontre vagas com cálculo de matching' },
];

export default function CompletarPerfil() {
  const { currentUser, showToast, setCurrentUser } = useAppStore();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('aluno');
  const [name, setName]                 = useState(currentUser?.name || auth.currentUser?.displayName || '');
  const [city, setCity]                 = useState(currentUser?.city || 'Ivaiporã');
  const [loading, setLoading]           = useState(false);
  const [alert, setAlert]               = useState('');

  // Student Email State (Aluno)
  const [studentEmail, setStudentEmail] = useState('');
  const userEmail = currentUser?.email || auth.currentUser?.email || '';
  const googleStudentValidation = validateStudentEmail(userEmail);
  const inputStudentValidation = validateStudentEmail(studentEmail);

  // Teacher Email State (Professor / Docente)
  const [teacherEmail, setTeacherEmail] = useState('');
  const googleTeacherValidation = isInstitutionalEmail(userEmail);
  const inputTeacherValidation = isInstitutionalEmail(teacherEmail);

  // CNPJ Empresa State
  const [cnpj, setCnpj]                 = useState(currentUser?.cnpj || '');
  const [cnpjLoading, setCnpjLoading]   = useState(false);
  const [cnpjData, setCnpjData]         = useState(null);
  const [cnpjError, setCnpjError]       = useState('');

  useEffect(() => {
    // Se não houver usuário no Google ou no store, volta para login
    if (!currentUser && !auth.currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (currentUser?.name) {
      setName(prev => prev || currentUser.name);
    }
  }, [currentUser?.name]);

  const handleCnpjChange = (e) => {
    const rawValue = e.target.value;
    const masked = maskCNPJ(rawValue);
    setCnpj(masked);
    setCnpjError('');

    const digits = cleanCNPJ(rawValue);
    if (digits.length === 14) {
      consultarCnpj(digits);
    } else {
      setCnpjData(null);
    }
  };

  const consultarCnpj = async (digitsToConsult) => {
    const digits = digitsToConsult || cleanCNPJ(cnpj);
    if (digits.length !== 14) {
      setCnpjError('O CNPJ deve conter 14 dígitos numéricos.');
      return;
    }

    if (!validateCNPJ(digits)) {
      setCnpjError('Dígitos verificadores do CNPJ inválidos (Módulo 11 da Receita Federal).');
      return;
    }

    setCnpjLoading(true);
    setCnpjError('');

    const res = await fetchCNPJData(digits);
    setCnpjLoading(false);

    if (res.success && res.data) {
      setCnpjData(res.data);
      // Auto-preenche o nome da empresa com a razão social ou nome fantasia
      if (res.data.nomeFantasia || res.data.razaoSocial) {
        setName(res.data.nomeFantasia || res.data.razaoSocial);
      }
      // Se a cidade for do Vale do Ivaí, auto-seleciona
      if (res.data.cidade) {
        const matchedCity = CITIES.find(c => c.toLowerCase() === res.data.cidade.toLowerCase());
        if (matchedCity) {
          setCity(matchedCity);
        }
      }
    } else {
      setCnpjError(res.error || 'Não foi possível validar os dados do CNPJ na Receita Federal.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert('');

    const uid = currentUser?.uid || auth.currentUser?.uid;
    const email = currentUser?.email || auth.currentUser?.email;

    if (!uid) {
      setAlert('Sessão expirada. Por favor, entre novamente com o Google.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (!name.trim()) {
      setAlert('Por favor, informe seu nome completo ou razão social.');
      return;
    }

    if (name.trim().length > 70) {
      setAlert('O nome ou razão social deve ter no máximo 70 caracteres.');
      return;
    }

    if (selectedRole === 'empresa') {
      const cleanDigits = cleanCNPJ(cnpj);
      if (!cleanDigits || cleanDigits.length !== 14) {
        setAlert('Para contas de Empresa, é obrigatório informar um CNPJ com 14 dígitos válidos.');
        return;
      }
      if (!validateCNPJ(cleanDigits)) {
        setAlert('O CNPJ informado possui dígitos verificadores inválidos.');
        return;
      }
    }

    let isStudentVerified = false;
    let finalStudentEmail = null;
    let studentInstitution = null;

    if (selectedRole === 'aluno') {
      const googleCheck = validateStudentEmail(email);
      if (googleCheck.isValid) {
        isStudentVerified = Boolean(auth.currentUser?.emailVerified ?? true);
        finalStudentEmail = email;
        studentInstitution = googleCheck.institution;
      } else {
        const inputCheck = validateStudentEmail(studentEmail);
        if (!inputCheck.isValid) {
          setAlert(inputCheck.error || 'Para criar uma conta como Aluno, é obrigatório comprovar o vínculo com o e-mail institucional da sua faculdade (ex: @estudante.ifpr.edu.br, @aluno.uenp.edu.br, @univale.edu.br ou .edu.br).');
          return;
        }
        isStudentVerified = false;
        finalStudentEmail = studentEmail.toLowerCase().trim();
        studentInstitution = inputCheck.institution;
      }
    }

    let finalTeacherEmail = null;
    let teacherInstitution = null;

    if (selectedRole === 'professor') {
      if (isInstitutionalEmail(email)) {
        finalTeacherEmail = email.toLowerCase().trim();
        teacherInstitution = inferInstitutionFromEmail(email);
      } else {
        const cleanTeacher = (teacherEmail || '').toLowerCase().trim();
        if (!cleanTeacher || !isInstitutionalEmail(cleanTeacher)) {
          setAlert('Para atuar com o perfil de Professor/Docente, é obrigatório informar um e-mail com domínio institucional válido (ex: @ifpr.edu.br, @uenp.edu.br, @univale.edu.br, @uel.br, @uem.br, @seed.pr.gov.br ou qualquer domínio .edu.br).');
          return;
        }
        finalTeacherEmail = cleanTeacher;
        teacherInstitution = inferInstitutionFromEmail(finalTeacherEmail);
      }
    }

    setLoading(true);

    const res = await completeUserProfile(uid, {
      name: name.trim(),
      email: email,
      city: city,
      role: selectedRole,
      avatar: auth.currentUser?.photoURL || currentUser?.avatar,
      ...(selectedRole === 'aluno' && {
        isVerifiedStudent: isStudentVerified,
        studentEmail: finalStudentEmail,
        institution: studentInstitution || 'IFPR Campus Ivaiporã',
        studentEmailVerifiedAt: isStudentVerified ? new Date().toISOString() : null
      }),
      ...(selectedRole === 'professor' && {
        institution: teacherInstitution || inferInstitutionFromEmail(email),
        teacherEmail: finalTeacherEmail,
        profEmail: finalTeacherEmail,
        degree: 'Docente / Pesquisador',
        discipline: 'Docência & Orientação Acadêmica',
        verified: true
      }),
      ...(selectedRole === 'empresa' && {
        cnpj: maskCNPJ(cnpj),
        razaoSocial: cnpjData?.razaoSocial || name.trim(),
        nomeFantasia: cnpjData?.nomeFantasia || name.trim(),
        situacaoCnpj: cnpjData?.situacaoCadastral || 'ATIVA',
        isVerifiedCompany: true
      })
    });

    setLoading(false);

    if (!res.success) {
      setAlert('Não foi possível salvar seu perfil: ' + (res.error || 'Erro inesperado'));
      return;
    }

    if (res.user) {
      setCurrentUser(res.user);
    }

    if (selectedRole === 'aluno' && !isStudentVerified) {
      showToast(`Perfil atualizado! Enviamos um link de confirmação para ${finalStudentEmail}. Acesse seu e-mail institucional para ativar seu Selo de Estudante.`);
    } else {
      showToast(`Cadastro finalizado com sucesso! Bem-vindo(a) ao Ivaí Conecta, ${name}!`);
    }
    navigate('/');
  };

  return (
    <main className="container section py-12">
      <div className="max-w-[580px] mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-brand-xl p-8 sm:p-10 transition-colors duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
          {auth.currentUser?.photoURL || currentUser?.avatar ? (
            <div className="relative w-20 h-20 mx-auto mb-4">
              <img
                src={auth.currentUser?.photoURL || currentUser?.avatar}
                alt="Foto do Google"
                className="w-20 h-20 rounded-full border-3 border-primary-blue shadow-lg object-cover"
              />
              <span className="absolute bottom-0 right-0 w-6 h-6 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-xs text-xs border border-gray-200 dark:border-slate-700" title="Autenticado com Google">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </span>
            </div>
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-primary-blue to-accent-sky text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles size={28} />
            </div>
          )}
          <span className="inline-flex px-3.5 py-1 rounded-full text-xs font-bold bg-primary-light dark:bg-blue-950/70 text-primary-blue dark:text-blue-300 mb-2 border border-primary-blue/20">
            Falta Pouco!
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-primary-dark dark:text-white">
            Complete o seu Cadastro
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
            Sua conta Google foi conectada com sucesso. Preencha os dados abaixo para personalizar sua experiência no Vale do Ivaí.
          </p>
        </div>

        {alert && (
          <div className="mb-6 p-4 rounded-xl text-sm font-semibold bg-red-50 text-red-700 border border-red-200">
            {alert}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Seleção de Role */}
          <div>
            <label className="form-label mb-2.5 block text-gray-700 dark:text-slate-200 font-bold text-sm">
              1. Selecione o seu Perfil de Acesso:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLES.map(r => {
                const RoleIcon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                      selectedRole === r.id
                        ? 'border-primary-blue bg-primary-light dark:bg-blue-950/60 text-primary-blue dark:text-blue-300 shadow-xs'
                        : 'border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 hover:border-primary-blue/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-primary-blue dark:text-sky-400 shrink-0 shadow-xs border border-gray-100 dark:border-slate-600">
                      <RoleIcon size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">{r.label}</div>
                      <div className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-1">{r.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comprovação de Vínculo Estudantil (Aluno) */}
          {selectedRole === 'aluno' && googleStudentValidation.isValid && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  E-mail Estudantil Institucional Reconhecido
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                  Selo Estudante Ativo
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                Sua conta Google (<strong>{userEmail}</strong>) foi identificada como vínculo acadêmico oficial com <strong>{googleStudentValidation.institution}</strong>.
              </p>
            </div>
          )}

          {selectedRole === 'aluno' && !googleStudentValidation.isValid && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="form-label text-gray-900 dark:text-white font-bold text-sm flex items-center gap-1.5 mb-0">
                  <GraduationCap size={16} className="text-primary-blue dark:text-blue-400" />
                  E-mail Estudantil da Faculdade
                </label>
                <span className="text-[10px] font-semibold text-primary-blue dark:text-blue-400 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
                  Obrigatório para Aluno
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                Sua conta Google conectada (<strong>{userEmail}</strong>) é pessoal. Para comprovar seu vínculo como Aluno e liberar candidaturas a vagas, informe o seu e-mail institucional oficial (ex: @estudante.ifpr.edu.br, @aluno.uenp.edu.br, @univale.edu.br ou .edu.br).
              </p>

              <div className="relative">
                <input
                  type="email"
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  className={`form-control pr-10 ${
                    studentEmail.trim()
                      ? inputStudentValidation.isValid
                        ? 'border-emerald-500 focus:border-emerald-500'
                        : 'border-amber-400 focus:border-amber-500'
                      : ''
                  }`}
                  placeholder="seu.nome@estudante.ifpr.edu.br"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  {studentEmail.trim() && (
                    inputStudentValidation.isValid ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={18} className="text-amber-500" />
                    )
                  )}
                </div>
              </div>

              {studentEmail.trim() && inputStudentValidation.isValid && (
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                  <span>Instituição Confirmada: {inputStudentValidation.institution}</span>
                </div>
              )}

              {studentEmail.trim() && !inputStudentValidation.isValid && studentEmail.length > 3 && (
                <div className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0 text-amber-500" />
                  <span>{inputStudentValidation.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Comprovação de Vínculo Docente (Professor) */}
          {selectedRole === 'professor' && googleTeacherValidation && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  E-mail Institucional Docente Reconhecido
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                  Docente Verificado
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                Sua conta Google (<strong>{userEmail}</strong>) foi identificada como vínculo acadêmico oficial com <strong>{inferInstitutionFromEmail(userEmail)}</strong>.
              </p>
            </div>
          )}

          {selectedRole === 'professor' && !googleTeacherValidation && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="form-label text-gray-900 dark:text-white font-bold text-sm flex items-center gap-1.5 mb-0">
                  <UserCheck size={16} className="text-primary-blue dark:text-blue-400" />
                  E-mail Institucional do Docente
                </label>
                <span className="text-[10px] font-semibold text-primary-blue dark:text-blue-400 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
                  Obrigatório para Professor
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                Sua conta Google conectada (<strong>{userEmail}</strong>) é pessoal. Para comprovar sua atuação docente e emitir pareceres acadêmicos para seus alunos, informe seu e-mail institucional oficial (ex: @ifpr.edu.br, @uenp.edu.br, @univale.edu.br, @seed.pr.gov.br ou qualquer domínio .edu.br).
              </p>

              <div className="relative">
                <input
                  type="email"
                  value={teacherEmail}
                  onChange={e => setTeacherEmail(e.target.value)}
                  className={`form-control pr-10 ${
                    teacherEmail.trim()
                      ? inputTeacherValidation
                        ? 'border-emerald-500 focus:border-emerald-500'
                        : 'border-amber-400 focus:border-amber-500'
                      : ''
                  }`}
                  placeholder="seu.nome@ifpr.edu.br"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  {teacherEmail.trim() && (
                    inputTeacherValidation ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={18} className="text-amber-500" />
                    )
                  )}
                </div>
              </div>

              {teacherEmail.trim() && inputTeacherValidation && (
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                  <span>Instituição Confirmada: {inferInstitutionFromEmail(teacherEmail)}</span>
                </div>
              )}

              {teacherEmail.trim() && !inputTeacherValidation && teacherEmail.length > 3 && (
                <div className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0 text-amber-500" />
                  <span>Insira um domínio acadêmico oficial (@ifpr.edu.br, @uenp.edu.br, @univale.edu.br, @seed.pr.gov.br ou .edu.br).</span>
                </div>
              )}
            </div>
          )}

          {/* CNPJ Empresarial com Validação & BrasilAPI */}
          {selectedRole === 'empresa' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="form-label text-gray-900 dark:text-white font-bold text-sm flex items-center gap-1.5 mb-0">
                  <Building2 size={16} className="text-primary-blue dark:text-blue-400" />
                  CNPJ da Empresa (14 dígitos)
                </label>
                <span className="text-[11px] font-semibold text-primary-blue dark:text-blue-400 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
                  Consulta Receita Federal
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={cnpj}
                  onChange={handleCnpjChange}
                  className="form-control pr-10 font-mono"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {cnpjLoading && <Loader2 size={18} className="animate-spin text-primary-blue" />}
                  {!cnpjLoading && cnpjData && <CheckCircle2 size={18} className="text-green-500" />}
                </div>
              </div>

              {cnpjError && (
                <div className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  {cnpjError}
                </div>
              )}

              {cnpjData && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800/70 text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-700 dark:text-green-300 flex items-center gap-1">
                      <ShieldCheck size={14} /> Dados Verificados na Receita Federal
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200">
                      {cnpjData.situacaoCadastral}
                    </span>
                  </div>
                  <div className="text-gray-800 dark:text-gray-200">
                    <strong>Razão Social:</strong> {cnpjData.razaoSocial}
                  </div>
                  {cnpjData.nomeFantasia && cnpjData.nomeFantasia !== cnpjData.razaoSocial && (
                    <div className="text-gray-600 dark:text-slate-300">
                      <strong>Nome Fantasia:</strong> {cnpjData.nomeFantasia}
                    </div>
                  )}
                  <div className="text-gray-500 dark:text-slate-400">
                    <strong>Localização:</strong> {cnpjData.cidade} / {cnpjData.uf}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nome */}
          <div className="form-group">
            <label className="form-label text-gray-700 dark:text-slate-200 font-bold text-sm">
              2. Nome Completo ou Razão Social:
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-control"
              placeholder="Ex: Lucas Eduardo Silva ou ValeTech Soluções"
              maxLength={70}
              required
            />
          </div>

          {/* Cidade */}
          <div className="form-group">
            <label className="form-label text-gray-700 dark:text-slate-200 font-bold text-sm">
              3. Sua Cidade no Vale do Ivaí:
            </label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="form-control"
              required
            >
              {CITIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3.5 text-base font-bold shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? 'Salvando...' : (
              <>
                Concluir Cadastro &amp; Entrar <ArrowRight size={18} />
              </>
            )}
          </button>

        </form>
      </div>
    </main>
  );
}
