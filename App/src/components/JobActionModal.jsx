import { useState } from 'react';
import {
  AlertTriangle, Clock, Trash2, X, Check, Loader2,
  Briefcase, MapPin, Users, ShieldAlert, Archive
} from 'lucide-react';

/**
 * JobActionModal - Modal moderno para Encerrar ou Excluir vaga
 * Substitui o window.confirm nativo do navegador por uma interface
 * corporativa elegante com feedback em tempo real e opções claras.
 */
export default function JobActionModal({
  isOpen,
  onClose,
  job,
  onCloseJob,
  onDeleteJob
}) {
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !job) return null;

  const handleCloseAction = async () => {
    try {
      setIsClosing(true);
      await onCloseJob(job);
      setIsClosing(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsClosing(false);
    }
  };

  const handleDeleteAction = async () => {
    try {
      setIsDeleting(true);
      await onDeleteJob(job);
      setIsDeleting(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  const isAlreadyClosed = job.status === 'Encerrada';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-brand-xl max-w-lg w-full p-6 sm:p-7 my-8 animate-in zoom-in-95 duration-150 relative space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">
                Gerenciar Oportunidade
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Escolha o que deseja fazer com este processo seletivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card Resumo da Vaga Selecionada */}
        <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
              {job.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{job.city || 'Ivaiporã'}</span>
              <span>•</span>
              <span>{job.modality || 'Presencial'}</span>
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
            job.status === 'Ativa'
              ? 'bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {job.status === 'Ativa' ? '🟢 Ativa' : '🔴 Encerrada'}
          </span>
        </div>

        {/* Opções de Ação */}
        <div className="space-y-3">
          {/* Opção 1: Encerrar Vaga (Mantém histórico e candidatos) */}
          <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-3 transition-all">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                <Clock size={16} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <span>Encerrar Processo Seletivo</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                    Recomendado
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-1 leading-relaxed">
                  A vaga sai do mural e novas inscrições são interrompidas. O histórico de candidatos, etapas do funil e avaliações continuam salvos com segurança para consulta.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleCloseAction}
                disabled={isClosing || isDeleting}
                className="btn btn-sm text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isClosing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Encerrando...</span>
                  </>
                ) : (
                  <>
                    <Archive size={13} />
                    <span>{isAlreadyClosed ? 'Manter Encerrada' : 'Encerrar Vaga Agora'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Opção 2: Excluir Permanentemente */}
          <div className="p-4 rounded-2xl border border-red-200/80 dark:border-red-800/60 bg-red-50/40 dark:bg-red-950/20 space-y-3 transition-all">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 shrink-0 mt-0.5">
                <Trash2 size={16} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-red-900 dark:text-red-200">
                  Excluir Vaga Definitivamente
                </div>
                <p className="text-[11px] text-red-700 dark:text-red-300/80 mt-1 leading-relaxed">
                  Remove a vaga do mural e apaga as inscrições associadas. A vaga sumirá imediatamente do seu painel.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleDeleteAction}
                disabled={isClosing || isDeleting}
                className="btn btn-sm text-xs font-bold px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Excluir Permanentemente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isClosing || isDeleting}
            className="btn btn-outline btn-sm text-xs font-semibold rounded-xl text-gray-600 dark:text-slate-300"
          >
            Cancelar / Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
