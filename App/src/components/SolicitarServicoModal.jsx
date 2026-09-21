import { useState } from 'react';
import { X, Send, Sparkles, AlertCircle, Building2, MapPin, DollarSign, Calendar, Phone } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { createServiceOrder, maskPhone, CITIES } from '../lib/ivaiConecta';

export default function SolicitarServicoModal({ service, onClose, onSuccess }) {
  const { currentUser, showToast } = useAppStore();

  const [description, setDescription] = useState('');
  const [city, setCity] = useState(currentUser?.city || service?.city || 'Ivaiporã');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone ? maskPhone(currentUser.phone) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!service) return null;

  const serviceTitle = service.title || service.name || 'Serviço Profissional';
  const providerName = service.providerName || 'Profissional Regional';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Você precisa estar logado para solicitar um serviço!');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Por favor, descreva brevemente a sua demanda ou projeto.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const order = await createServiceOrder({
        serviceId: service.firestoreId || service.id,
        serviceTitle,
        providerId: service.createdBy || service.providerUid || '',
        providerName,
        providerEmail: service.providerEmail || '',
        clientId: currentUser.uid || currentUser.id || 'usr_guest',
        clientName: currentUser.name || 'Cliente Ivaí Conecta',
        clientEmail: currentUser.email || '',
        clientPhone: phone || currentUser.phone || '',
        city,
        description: description.trim(),
        budget: budget.trim() || 'A combinar',
        deadline: deadline.trim() || 'A combinar'
      });

      showToast('Demanda de serviço enviada com sucesso! O prestador receberá a notificação.');
      if (onSuccess) onSuccess(order);
      onClose();
    } catch (err) {
      console.error('[SolicitarServicoModal] Erro ao enviar solicitação:', err);
      setErrorMsg('Erro ao registrar a solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop z-50 flex items-center justify-center p-4">
      <div className="modal-box w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 mb-1.5">
            <Sparkles size={14} /> Solicitação Formal de Serviço
          </div>
          <h2 className="text-xl font-bold font-heading">{serviceTitle}</h2>
          <p className="text-xs text-blue-200 mt-0.5">
            Prestador: <span className="font-semibold text-white">{providerName}</span> • {service.city || 'Vale do Ivaí'}
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2 text-xs font-medium text-red-700 dark:text-red-300">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
              Descrição da Demanda / O que você precisa? <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Preciso de uma reforma na fiação do escritório com 4 tomadas novas..."
              className="input w-full text-sm resize-none rounded-2xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Cidade do Atendimento
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="input pl-9 w-full text-xs font-semibold rounded-xl"
                >
                  {CITIES.filter(c => c !== 'Todas as Cidades').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Seu WhatsApp / Telefone
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(maskPhone(e.target.value))}
                  placeholder="(43) 99999-0000"
                  className="input pl-9 w-full text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Orçamento Estimado (Opcional)
              </label>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="Ex: R$ 350,00 ou A combinar"
                  className="input pl-9 w-full text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Prazo Desejado (Opcional)
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  placeholder="Ex: Até sexta-feira / Imediato"
                  className="input pl-9 w-full text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-outline btn-sm text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Send size={14} />
              {isSubmitting ? 'Enviando Solicitação...' : 'Enviar Demanda ao Prestador'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
