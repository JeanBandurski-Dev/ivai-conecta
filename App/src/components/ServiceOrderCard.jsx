import { MapPin, Phone, DollarSign, Calendar, Star, Check, Play, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

const LIFECYCLE_STEPS = [
  { key: 'solicitado', label: '1. Solicitado' },
  { key: 'aceito', label: '2. Aceito' },
  { key: 'em_andamento', label: '3. Em Andamento' },
  { key: 'concluido', label: '4. Concluído' },
  { key: 'avaliado', label: '5. Avaliado' },
];

export default function ServiceOrderCard({ order, isProvider, onTransition, onEvaluate }) {
  const stepIdx = (status) => {
    if (status === 'solicitado') return 0;
    if (status === 'aceito') return 1;
    if (status === 'em_andamento') return 2;
    if (status === 'concluido') return 3;
    if (status === 'avaliado') return 4;
    return -1;
  };

  const currentIdx = stepIdx(order.status);
  const isRecusado = order.status === 'recusado';

  return (
    <div className="card p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl space-y-4 hover:border-primary-blue/30 transition-all shadow-sm">
      
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold text-primary-blue bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              {order.serviceTitle || 'Serviço Profissional'}
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Solicitado em: {order.createdAt || 'Hoje'}
            </span>
          </div>
          <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">
            {isProvider ? `Cliente: ${order.clientName || 'Cliente'}` : `Prestador: ${order.providerName || 'Profissional'}`}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mt-1 flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={13} className="text-primary-blue" /> {order.city || 'Ivaiporã'}</span>
            {order.clientPhone && <span className="flex items-center gap-1"><Phone size={13} className="text-green-600" /> {order.clientPhone}</span>}
            {order.budget && <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-slate-300"><DollarSign size={13} className="text-amber-500" /> Orçamento: {order.budget}</span>}
            {order.deadline && <span className="flex items-center gap-1"><Calendar size={13} className="text-purple-500" /> Prazo: {order.deadline}</span>}
          </div>
        </div>

        <div>
          {isRecusado ? (
            <span className="text-xs font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 px-3 py-1 rounded-full flex items-center gap-1">
              <XCircle size={13} /> Recusado
            </span>
          ) : (
            <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${
              order.status === 'avaliado' ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300' :
              order.status === 'concluido' ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/60 dark:text-green-300' :
              order.status === 'em_andamento' ? 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300' :
              order.status === 'aceito' ? 'bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300' :
              'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300'
            }`}>
              {order.status === 'solicitado' && <><Clock size={12} /> Aguardando Aceite</>}
              {order.status === 'aceito' && <><Check size={12} /> Pedido Aceito</>}
              {order.status === 'em_andamento' && <><Play size={12} /> Em Execução</>}
              {order.status === 'concluido' && <><CheckCircle2 size={12} /> Concluído</>}
              {order.status === 'avaliado' && <><Star size={12} className="fill-amber-400" /> Concluído & Avaliado</>}
            </span>
          )}
        </div>
      </div>

      {/* Description Box */}
      <div className="p-3.5 bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-800 rounded-2xl text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
        <strong className="block text-gray-900 dark:text-white font-semibold mb-1">Descrição do Pedido / Escopo:</strong>
        "{order.description}"
      </div>

      {/* Lifecycle Progress Stepper */}
      {!isRecusado && (
        <div className="py-2.5 px-2 bg-gray-50/70 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800/80">
          <div className="grid grid-cols-5 gap-1 text-center items-center">
            {LIFECYCLE_STEPS.map((s, idx) => {
              const isCompleted = currentIdx > idx;
              const isCurrent = currentIdx === idx;
              return (
                <div key={s.key} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-green-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-primary-blue text-white ring-4 ring-primary-blue/20'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                  }`}>
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                  </div>
                  <span className={`text-[10px] sm:text-xs mt-1 font-bold truncate max-w-full px-1 ${
                    isCurrent ? 'text-primary-blue dark:text-blue-400' : isCompleted ? 'text-green-700 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Box if evaluated */}
      {order.status === 'avaliado' && order.review && (
        <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span>Avaliação do Cliente: {order.review.rating}.0 / 5.0 estrelas</span>
            </div>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">{order.review.date}</span>
          </div>
          <p className="text-xs text-amber-900 dark:text-amber-200 italic">
            "{order.review.comment}"
          </p>
          <span className="text-[10px] text-gray-500 dark:text-slate-400 block pt-0.5">
            Por {order.review.author || 'Cliente'}
          </span>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-gray-500 dark:text-slate-400">
          {order.history && order.history.length > 0 && (
            <span>Histórico: {order.history[order.history.length - 1]?.note}</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isProvider ? (
            // Ações do Prestador
            order.status === 'solicitado' ? (
              <>
                <button
                  type="button"
                  onClick={() => onTransition(order.firestoreId || order.id, 'recusado', 'Prestador recusou a demanda.')}
                  className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40 btn-sm text-xs font-bold"
                >
                  Recusar
                </button>
                <button
                  type="button"
                  onClick={() => onTransition(order.firestoreId || order.id, 'aceito', 'Prestador aceitou a demanda de serviço.')}
                  className="btn btn-primary btn-sm text-xs font-bold shadow-md"
                >
                  Aceitar Demanda
                </button>
              </>
            ) : order.status === 'aceito' ? (
              <button
                type="button"
                onClick={() => onTransition(order.firestoreId || order.id, 'em_andamento', 'Prestador iniciou a execução do serviço.')}
                className="btn btn-teal btn-sm text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Play size={13} /> Iniciar Atendimento
              </button>
            ) : order.status === 'em_andamento' ? (
              <button
                type="button"
                onClick={() => onTransition(order.firestoreId || order.id, 'concluido', 'Serviço finalizado pelo prestador.')}
                className="btn bg-green-600 hover:bg-green-700 text-white btn-sm text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} /> Concluir Atendimento
              </button>
            ) : order.status === 'concluido' ? (
              <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-3 py-1.5 rounded-xl border border-green-200 dark:border-green-800 flex items-center gap-1.5">
                <Clock size={13} /> Concluído • Aguardando avaliação do cliente
              </span>
            ) : null
          ) : (
            // Ações do Cliente
            order.status === 'concluido' ? (
              <button
                type="button"
                onClick={() => onEvaluate(order)}
                className="btn bg-amber-500 hover:bg-amber-600 text-white btn-sm text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Star size={13} className="fill-white" /> ⭐ Avaliar Atendimento
              </button>
            ) : order.status === 'recusado' ? (
              <span className="text-xs text-red-500 font-medium">Demanda não pôde ser atendida pelo prestador.</span>
            ) : order.status === 'avaliado' ? (
              <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={13} /> Atendimento finalizado e avaliado
              </span>
            ) : (
              <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock size={13} /> Acompanhando status com o prestador
              </span>
            )
          )}
        </div>
      </div>

    </div>
  );
}
