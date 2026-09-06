import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { CITIES, completeUserProfile } from '../lib/ivaiConecta';
import { auth } from '../lib/firebase';
import { User, MapPin, CheckCircle2, ArrowRight, GraduationCap, UserCheck, Wrench, Briefcase, Building2, Sparkles } from 'lucide-react';

const ROLES = [
  { id: 'aluno',      label: 'Aluno / Estudante',       icon: GraduationCap, desc: 'Acesse vagas de estágio e endossos acadêmicos' },
  { id: 'professor',  label: 'Professor / Docente',     icon: UserCheck,     desc: 'Emita pareceres pedagógicos para seus alunos' },
  { id: 'freelancer', label: 'Freelancer / Autônomo',    icon: Wrench,        desc: 'Divulgue seus serviços no marketplace local' },
  { id: 'candidato',  label: 'Candidato Geral',          icon: Briefcase,     desc: 'Encontre vagas com cálculo de matching' },
  { id: 'empresa',    label: 'Empresa / Recrutador',     icon: Building2,     desc: 'Publique vagas e encontre talentos qualificados' },
];

export default function CompletarPerfil() {
  const { currentUser, showToast, setCurrentUser } = useAppStore();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('aluno');
  const [name, setName]                 = useState(currentUser?.name || auth.currentUser?.displayName || '');
  const [city, setCity]                 = useState(currentUser?.city || 'Ivaiporã');
  const [loading, setLoading]           = useState(false);
  const [alert, setAlert]               = useState('');

  useEffect(() => {
    // Se não houver usuário no Google ou no store, volta para login
    if (!currentUser && !auth.currentUser) {
      navigate('/login');
    } else if (currentUser?.name && !name) {
      setName(currentUser.name);
    }
  }, [currentUser, navigate]);

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

    setLoading(true);

    const res = await completeUserProfile(uid, {
      name: name.trim(),
      email: email,
      city: city,
      role: selectedRole,
      avatar: auth.currentUser?.photoURL || currentUser?.avatar
    });

    setLoading(false);

    if (!res.success) {
      setAlert('Não foi possível salvar seu perfil: ' + (res.error || 'Erro inesperado'));
      return;
    }

    if (res.user) {
      setCurrentUser(res.user);
    }

    showToast(`Cadastro finalizado com sucesso! Bem-vindo(a) ao Ivaí Conecta, ${name}!`);
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
