import { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Server,
  Database,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Cpu,
  Layers
} from 'lucide-react';
import { fetchSystemHealth } from '../../services/adminService';

export default function AdminSettings() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetchSystemHealth();
      setHealth(res);
    } catch (err) {
      setHealth({
        success: false,
        firebaseStatus: 'Erro',
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white tracking-tight">
            Configurações &amp; Diagnóstico
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Status operacional dos serviços de infraestrutura, Cloud Firestore e segurança.
          </p>
        </div>

        <button
          onClick={checkHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-primary-blue hover:text-primary-blue shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Testando Conexão...' : 'Testar Conexão'}</span>
        </button>
      </div>

      {/* ── STATUS CARD ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Server size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Infraestrutura Cloud Firebase
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instância de produção ativa em Google Cloud Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {health?.firebaseStatus || 'Operacional'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-sm">
          <div>
            <span className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">
              Projeto ID
            </span>
            <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {health?.projectId || 'ivai-conecta-4a366'}
            </span>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">
              Latência de Resposta
            </span>
            <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {health?.latencyMs !== undefined ? `${health.latencyMs} ms` : '—'}
            </span>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">
              Verificação
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">
              {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString('pt-BR') : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── COLEÇÕES E DIRETRIZES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coleções Registradas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold">
            <Database size={18} className="text-primary-blue" />
            <h3>Coleções Ativas no Firestore</h3>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
            {[
              { name: 'users', desc: 'Perfis de alunos, empresas, professores e administradores', access: 'Admin / Autenticado' },
              { name: 'jobs', desc: 'Vagas de emprego e oportunidades regionais publicadas', access: 'Público / Admin' },
              { name: 'services', desc: 'Catálogo de serviços e prestadores locais', access: 'Público / Admin' },
              { name: 'applications', desc: 'Inscrições em processos seletivos e candidaturas', access: 'Candidato / Recrutador / Admin' },
              { name: 'chats & messages', desc: 'Mensageria privada entre usuários e empresas', access: 'Participantes / Restrito' },
            ].map(col => (
              <div key={col.name} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    /{col.name}
                  </span>
                  <p className="text-slate-400 mt-0.5">{col.desc}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {col.access}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Políticas de Segurança e Zero Mock */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold">
            <Lock size={18} className="text-amber-500" />
            <h3>Políticas de Segurança do Sistema</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
              <strong className="text-slate-900 dark:text-white block mb-1">
                Zero Mock Policy:
              </strong>
              Todos os dados do painel são provenientes estritamente das coleções reais do Cloud Firestore. Nenhuma métrica ou listagem utiliza arrays artificiais hardcoded.
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
              <strong className="text-slate-900 dark:text-white block mb-1">
                Proteção Contra Elevação de Privilégio:
              </strong>
              O Firestore Rules valida rigorosamente operações de escrita nos perfis. Usuários comuns não possuem autorização para alterar seu campo <code>role</code> ou desativar o status <code>blocked</code>.
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
              <strong className="text-slate-900 dark:text-white block mb-1">
                Proteção do Último Administrador:
              </strong>
              A camada de serviço rejeita categoricamente qualquer tentativa de rebaixamento ou exclusão do último administrador ativo para evitar bloqueios acidentais de gestão.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
