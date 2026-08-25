import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { CITIES, completeUserProfile } from '../lib/ivaiConecta';
import { auth } from '../lib/firebase';
import { User, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';

const ROLES = [
  { id: 'aluno',      label: 'Aluno / Estudante',       icon: '🎓', desc: 'Acesse vagas de estágio e endossos acadêmicos' },
  { id: 'professor',  label: 'Professor / Docente',     icon: '👨‍🏫', desc: 'Emita pareceres pedagógicos para seus alunos' },
  { id: 'freelancer', label: 'Freelancer / Autônomo',    icon: '🔧', desc: 'Divulgue seus serviços no marketplace local' },
  { id: 'candidato',  label: 'Candidato Geral',          icon: '💼', desc: 'Encontre vagas com cálculo de matching' },
  { id: 'empresa',    label: 'Empresa / Recrutador',     icon: '🏢', desc: 'Publique vagas e encontre talentos qualificados' },
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
      role: selectedRole
    });

    setLoading(false);

    if (!res.success) {
      setAlert('Não foi possível salvar seu perfil: ' + (res.error || 'Erro inesperado'));
      return;
    }

    if (res.user) {
      setCurrentUser(res.user);
    }

    showToast(`🎉 Cadastro finalizado com sucesso! Bem-vindo(a) ao Ivaí Conecta, ${name}!`);
    navigate('/');
  };

  return (
    <main className="container section py-12">
      <div className="max-w-[580px] mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-brand-xl p-8 sm:p-10 transition-colors duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary-blue to-accent-sky text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">✨</span>
          </div>
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
          <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-semibold rounded-xl">
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
              {ROLES.map(r => (
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
                  <span className="text-2xl shrink-0">{r.icon}</span>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">{r.label}</div>
                    <div className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-1">{r.desc}</div>
                  </div>
                </button>
              ))}
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
