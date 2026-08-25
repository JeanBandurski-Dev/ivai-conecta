import { useState } from 'react';
import {
  X, MapPin, Building2, Clock, DollarSign, CheckCircle2,
  Sparkles, Briefcase, Gift, Send, PhoneCall, ShieldCheck
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { applyToJob, generateWhatsAppLink, calculateMatchScore } from '../lib/ivaiConecta';

export default function JobDetailModal({ job, onClose, matchScore }) {
  const { currentUser, showToast } = useAppStore();
  const [applied, setApplied] = useState(false);

  if (!job) return null;

  const canSeeMatch = currentUser && (currentUser.role === 'aluno' || currentUser.role === 'candidato');
  const userSkills = currentUser?.skills || [];
  const calculatedScore = matchScore ?? (canSeeMatch ? calculateMatchScore(userSkills, job.requiredSkills || [], { userCity: currentUser?.city, jobCity: job.city, isVerifiedStudent: currentUser?.isVerifiedStudent }) : null);

  const handleApply = () => {
    if (!currentUser) {
      showToast('Faça login como Aluno ou Candidato para se candidatar!');
      return;
    }
    const res = applyToJob(job.id, currentUser);
    if (res.success) {
      setApplied(true);
      showToast('🎉 Candidatura realizada com sucesso!');
    } else {
      showToast(res.message);
    }
  };

  const waLink = generateWhatsAppLink(job.recruiterPhone || '5543999887766', job.title, job.company, job.city);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-brand-xl w-full max-w-2xl overflow-hidden my-8 border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}>
        
        {/* Header Visual estilo Gupy */}
        <div className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_50%,#0052FF_100%)] text-white p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4 sm:gap-5">
            <img
              src={job.companyLogo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150'}
              alt={job.company}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/30 object-cover shadow-brand-md shrink-0 bg-white"
            />
            <div className="pr-8">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-accent-sky bg-white/10 px-2.5 py-0.5 rounded-md">
                  {job.company}
                </span>
                <span className="bg-green-500/20 text-green-300 border border-green-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> Vaga Verificada
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white leading-tight mb-2">
                {job.title}
              </h2>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-200 flex-wrap">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-accent-sky" />{job.city}</span>
                <span>·</span>
                <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-accent-sky" />{job.type}</span>
              </div>
            </div>
          </div>

          {/* Banner de Compatibilidade (Match Score Gupy) */}
          {canSeeMatch && calculatedScore != null ? (
            <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-400 shrink-0" size={18} />
                <span className="text-xs sm:text-sm font-medium text-gray-200">Compatibilidade com seu Perfil:</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-400 to-green-400 h-full rounded-full" style={{ width: `${calculatedScore}%` }} />
                </div>
                <span className="text-sm font-extrabold text-green-300 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/20">
                  {calculatedScore}% Match
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-6 pt-3 border-t border-white/15 text-xs text-gray-300 flex items-center gap-2">
              <span>💡</span> Entre como Aluno ou Candidato para ver seu cálculo de compatibilidade com esta vaga.
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Informações Rápidas (Horário, Salário) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-400 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">Horário de Trabalho</div>
                <div className="text-sm font-bold text-gray-800 dark:text-white">{job.workingHours || '08:00 às 18:00 (Segunda a Sexta)'}</div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <DollarSign size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">Faixa Salarial / Remuneração</div>
                <div className="text-sm font-bold text-gray-800 dark:text-white">{job.salary || 'A combinar / Compatível com mercado'}</div>
              </div>
            </div>
          </div>

          {/* Descrição Completa */}
          <div>
            <h3 className="font-heading font-bold text-base text-primary-dark dark:text-white mb-2 flex items-center gap-2">
              <Briefcase size={17} className="text-primary-blue dark:text-blue-400" /> Descrição da Oportunidade
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              {job.description || 'Esta vaga tem como objetivo integrar novos talentos à equipe da empresa, proporcionando desenvolvimento profissional contínuo.'}
            </p>
          </div>

          {/* Responsabilidades */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div>
              <h3 className="font-heading font-bold text-base text-primary-dark dark:text-white mb-2.5">Principais Atividades &amp; Responsabilidades</h3>
              <ul className="space-y-2">
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-slate-300">
                    <span className="text-primary-blue dark:text-blue-400 font-bold shrink-0">•</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vales e Benefícios */}
          <div>
            <h3 className="font-heading font-bold text-base text-primary-dark dark:text-white mb-2.5 flex items-center gap-2">
              <Gift size={17} className="text-primary-blue dark:text-blue-400" /> Vales e Benefícios Oferecidos
            </h3>
            <div className="flex flex-wrap gap-2">
              {(job.benefits || ['Vale Transporte', 'Vale Refeição', 'Plano de Saúde', 'Ambiente Colaborativo']).map((benefit, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200/70 dark:border-green-800/60 px-3 py-1.5 rounded-xl text-xs font-semibold">
                  <CheckCircle2 size={13} className="text-green-600 dark:text-green-400 shrink-0" />
                  {benefit}
                </span>
              ))}
            </div>
          </div>

          {/* Requisitos vs Habilidades */}
          <div>
            <h3 className="font-heading font-bold text-base text-primary-dark dark:text-white mb-2.5">Habilidades Exigidas</h3>
            <div className="flex flex-wrap gap-2">
              {(job.requiredSkills || []).map(skill => {
                const isMatched = userSkills.includes(skill);
                return (
                  <span key={skill} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${
                    isMatched
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-primary-blue dark:text-blue-400 border-blue-200 dark:border-blue-800 font-bold'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                  }`}>
                    {isMatched && <CheckCircle2 size={13} className="text-primary-blue dark:text-blue-400" />}
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <button onClick={onClose} className="btn btn-outline btn-sm font-semibold text-gray-600 dark:text-slate-300">
            Fechar
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-sm text-xs font-bold"
            >
              <PhoneCall size={14} /> Contatar no WhatsApp
            </a>

            {applied ? (
              <button disabled className="btn bg-green-600 text-white btn-sm text-xs font-bold cursor-default flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Candidatura Enviada!
              </button>
            ) : (
              <button onClick={handleApply} className="btn btn-primary btn-sm text-xs font-bold shadow-md flex items-center gap-1.5">
                <Send size={14} /> Candidatar-se à Vaga
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
