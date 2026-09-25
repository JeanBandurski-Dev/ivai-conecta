import { MapPin, Phone, DollarSign, Calendar, Star, Check, Play, CheckCircle2, Clock, XCircle, MessageSquare } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { generateWhatsAppLink } from '../services/servicesService';

const LIFECYCLE_STEPS = [
  { key: 'solicitado', label: 'Solicitado', desc: 'Demanda enviada' },
  { key: 'aceito', label: 'Aceito', desc: 'Prestador aceitou' },
  { key: 'em_andamento', label: 'Em Andamento', desc: 'Em execução' },
  { key: 'concluido', label: 'Concluído', desc: 'Finalizado' },
  { key: 'avaliado', label: 'Avaliado', desc: 'Avaliação & Nota' },
];

export default function ServiceOrderCard({ order, isProvider, onTransition, onEvaluate }) {
  const { currentUser, startChatWith, showToast } = useAppStore();

  const isActuallyProvider = isProvider || (
    currentUser && (
      (order.providerId && (String(currentUser.uid) === String(order.providerId) || String(currentUser.id) === String(order.providerId))) ||
      (order.providerEmail && currentUser.email && order.providerEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
      (order.providerName && currentUser.name && order.providerName.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
    )
  );

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

  const handleOpenChat = async () => {
    if (!currentUser) {
      showToast('Faça login para conversar!');
      return;
    }

    const targetUser = isActuallyProvider
      ? {
          name: order.clientName || 'Cliente',
          email: order.clientEmail || '',
          uid: order.clientId || '',
          role: 'candidato'
        }
      : {
          name: order.providerName || 'Prestador',
          email: order.providerEmail || '',
          uid: order.providerId || '',
          role: 'freelancer'
        };

    if (!targetUser.email && !targetUser.uid) {
      showToast('Contato não possui dados de chat vinculados.');
      return;
    }

    await startChatWith(
      targetUser,
      `Demanda: ${order.serviceTitle || 'Serviço'}`,
      null,
      `Olá! Gostaria de falar sobre o pedido de serviço "${order.serviceTitle || 'prestação de serviço'}": `
    );
  };

  const targetPhone = isActuallyProvider ? order.clientPhone : (order.providerPhone || order.clientPhone);
  const whatsappUrl = targetPhone ? generateWhatsAppLink(
    targetPhone,
    `Olá! Sou ${isActuallyProvider ? order.providerName : order.clientName} do Ivaí Conecta, referente ao serviço "${order.serviceTitle || 'prestação de serviços'}".`
  ) : null;

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
            {isActuallyProvider ? `Cliente: ${order.clientName || 'Cliente'}` : `Prestador: ${order.providerName || 'Profissional'}`}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mt-1 flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={13} className="text-primary-blue" /> {order.city || 'Ivaiporã'}</span>
            {targetPhone && <span className="flex items-center gap-1"><Phone size={13} className="text-green-600" /> {targetPhone}</span>}
            {order.budget && <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-slate-300"><DollarSign size={13} className="text-amber-500" /> Orçamento: {order.budget}</span>}
            {order.deadline && <span className="flex items-center gap-1"><Calendar size={13} className="text-purple-500" /> Prazo: {order.deadline}</span>}
          </div>
        </div>

        <div>
          {isRecusado ? (
            <span className="text-xs font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 px-3 py-1 rounded-full flex items-center gap-1">
              <XCircle size={13} /> Demanda Recusada
            </span>
          ) : (
            <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-xs ${
              order.status === 'avaliado' ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300' :
              order.status === 'concluido' ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/60 dark:text-green-300' :
              order.status === 'em_andamento' ? 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 animate-pulse' :
              order.status === 'aceito' ? 'bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300' :
              'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300'
            }`}>
              {order.status === 'solicitado' && <><Clock size={12} /> 1. Aguardando Aceite</>}
              {order.status === 'aceito' && <><Check size={12} /> 2. Pedido Aceito</>}
              {order.status === 'em_andamento' && <><Play size={12} /> 3. Em Execução</>}
              {order.status === 'concluido' && <><CheckCircle2 size={12} /> 4. Concluído</>}
              {order.status === 'avaliado' && <><Star size={12} className="fill-amber-400" /> 5. Concluído &amp; Avaliado</>}
            </span>
          )}
        </div>
      </div>

      {/* Description Box */}
      <div className="p-3.5 bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-800 rounded-2xl text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
        <strong className="block text-gray-900 dark:text-white font-semibold mb-1">Descrição do Pedido / Escopo:</strong>
        "{order.description}"
      </div>

      {/* Lifecycle Progress Stepper with Connecting Line */}
      {!isRecusado && (
        <div className="py-3 px-3 sm:px-6 bg-gray-50/80 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-800/80">
          <div className="relative flex items-center justify-between">
            {/* Background line */}
            <div className="absolute left-4 right-4 top-4 -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-slate-700 z-0" />
            {/* Active progress line */}
            <div
              className="absolute left-4 top-4 -translate-y-1/2 h-0.5 bg-green-500 transition-all duration-500 z-0"
              style={{
                width: currentIdx >= 0 ? `${(currentIdx / (LIFECYCLE_STEPS.length - 1)) * 100}%` : '0%'
              }}
            />

            {LIFECYCLE_STEPS.map((s, idx) => {
              const isCompleted = currentIdx > idx;
              const isCurrent = currentIdx === idx;
              return (
                <div key={s.key} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-primary-blue text-white ring-4 ring-primary-blue/20 scale-110 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500'
                  }`}>
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                  </div>
                  <span className={`text-[10px] sm:text-xs mt-1.5 font-bold truncate max-w-[70px] sm:max-w-none text-center ${
                    isCurrent
                      ? 'text-primary-blue dark:text-blue-400'
                      : isCompleted
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-gray-400 dark:text-slate-500'
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
        <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-1.5 animate-fade-in">
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
      <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
          {order.history && order.history.length > 0 && (
            <span>Histórico: <strong className="text-gray-700 dark:text-slate-300 font-semibold">{order.history[order.history.length - 1]?.note}</strong></span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Chat and WhatsApp contact buttons */}
          <button
            type="button"
            onClick={handleOpenChat}
            className="btn btn-outline btn-sm text-xs gap-1 font-bold rounded-xl border-gray-200 dark:border-slate-700 hover:border-primary-blue text-gray-700 dark:text-slate-300"
            title="Abrir chat no sistema"
          >
            <MessageSquare size={13} className="text-primary-blue" /> Chat
          </button>

          {whatsappUrl && whatsappUrl !== '#' && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline btn-sm text-xs gap-1 font-bold rounded-xl border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30"
              title="Conversar via WhatsApp"
            >
              <Phone size={13} className="text-green-600" /> WhatsApp
            </a>
          )}

          {isActuallyProvider ? (
            // ─── AÇÕES DO PRESTADOR FREELANCER ───
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
                  className="btn btn-primary btn-sm text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Check size={14} /> Aceitar Demanda
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
            ) : order.status === 'avaliado' ? (
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                <Star size={13} className="fill-amber-400 text-amber-400" /> Atendimento Concluído &amp; Avaliado
              </span>
            ) : null
          ) : (
            // ─── AÇÕES DO CLIENTE ───
            order.status === 'concluido' ? (
              <button
                type="button"
                onClick={() => onEvaluate(order)}
                className="btn bg-amber-500 hover:bg-amber-600 text-white btn-sm text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer animate-bounce"
              >
                <Star size={13} className="fill-white" /> ⭐ Avaliar Atendimento
              </button>
            ) : order.status === 'recusado' ? (
              <span className="text-xs text-red-500 font-medium">Demanda não pôde ser atendida pelo prestador.</span>
            ) : order.status === 'avaliado' ? (
              <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={13} /> Atendimento finalizado e avaliado
              </span>
            ) : order.status === 'em_andamento' ? (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <Play size={12} /> Prestador executando o serviço
              </span>
            ) : order.status === 'aceito' ? (
              <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-xl border border-teal-200 dark:border-teal-800">
                <Check size={12} /> Demanda aceita pelo prestador
              </span>
            ) : (
              <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock size={13} /> Aguardando resposta do prestador
              </span>
            )
          )}
        </div>
      </div>

    </div>
  );
}
