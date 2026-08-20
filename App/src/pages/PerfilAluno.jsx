import { useParams } from 'react-router-dom';
import { CheckCircle, Mail, Building2, BookOpen, MapPin, Edit3, X } from 'lucide-react';
import { useState } from 'react';
import { getTalentById, addEndorsementToTalent, validateEndorsement, createEndorsementPayload } from '../lib/ivaiConecta';
import useAppStore from '../store/useAppStore';

export default function PerfilAluno() {
  const { id }  = useParams();
  const talent   = getTalentById(id || '1');
  const { currentUser, showToast } = useAppStore();

  const [endorseModal, setEndorseModal] = useState(false);
  const [form, setForm] = useState({ profName: '', profEmail: '', institution: '', discipline: '', quote: '' });
  const [error, setError] = useState('');
  const [, forceUpdate] = useState(0);

  const freshTalent = getTalentById(id || '1');

  const handleEndorse = (e) => {
    e.preventDefault();
    const v = validateEndorsement(form);
    if (!v.isValid) { setError(v.error); return; }
    const payload = createEndorsementPayload(form);
    addEndorsementToTalent(talent.id, payload);
    setEndorseModal(false);
    setForm({ profName: '', profEmail: '', institution: '', discipline: '', quote: '' });
    setError('');
    showToast('Recomendação enviada com sucesso!');
    forceUpdate(n => n + 1);
  };

  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-dark via-[#071330] to-primary-blue text-white py-8 sm:py-10">
        <div className="container">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <img src={freshTalent.avatar} alt={freshTalent.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/30 object-cover shadow-brand-md shrink-0" />
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-white mb-0.5">{freshTalent.name}</h1>
              <div className="text-accent-sky font-semibold text-sm mb-0.5">{freshTalent.course}</div>
              <div className="flex items-center gap-2 text-gray-300 text-xs sm:text-sm">
                <Building2 size={13} />{freshTalent.institution}
                <span>·</span>
                <MapPin size={13} />{freshTalent.city}
              </div>
            </div>
            <div className="ml-auto flex gap-2.5 flex-wrap">
              <button onClick={() => setEndorseModal(true)} className="btn btn-teal btn-sm">
                <CheckCircle size={14} /> Enviar Recomendação
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="container section">
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Left column */}
          <div className="space-y-6">
            {/* Skills */}
            <div className="card">
              <h3 className="font-heading font-bold text-primary-dark mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-primary-blue" /> Habilidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {freshTalent.skills.map(s => (
                  <span key={s} className="tag tag-blue">{s}</span>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="card">
              <h3 className="font-heading font-bold text-primary-dark mb-4">Contato</h3>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail size={15} className="text-primary-blue shrink-0" />
                <span>{freshTalent.name.toLowerCase().split(' ').join('.')}@example.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-3">
                <MapPin size={15} className="text-primary-blue shrink-0" />
                <span>{freshTalent.city}, PR</span>
              </div>
            </div>
          </div>

          {/* Right column — Endorsements */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-primary-dark">
                Recomendações Verificadas ({freshTalent.endorsements?.length || 0})
              </h2>
              <button onClick={() => setEndorseModal(true)}
                className="btn btn-outline btn-sm text-xs">
                <CheckCircle size={13} /> + Adicionar
              </button>
            </div>

            {(!freshTalent.endorsements || freshTalent.endorsements.length === 0) ? (
              <div className="card text-center py-10 text-gray-400">
                <CheckCircle size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="font-semibold">Nenhuma recomendação ainda.</p>
                <p className="text-sm mt-1">Seja o primeiro a recomendar este talento!</p>
              </div>
            ) : (
              freshTalent.endorsements.map((e, i) => (
                <div key={e.id || i} className="card gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                      <CheckCircle size={18} className="text-primary-blue" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{e.profName}</div>
                      <div className="text-xs text-primary-blue font-medium">{e.discipline}</div>
                      {e.institution && <div className="text-xs text-gray-500 mt-0.5">{e.institution}</div>}
                    </div>
                    {e.isVerified && (
                      <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full shrink-0">
                        ✓ Verificado
                      </span>
                    )}
                  </div>
                  <blockquote className="text-sm text-gray-600 italic leading-relaxed pl-13 ml-13">
                    "{e.quote}"
                  </blockquote>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Endorsement Modal */}
      {endorseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEndorseModal(false)}>
          <div className="bg-white rounded-2xl shadow-brand-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-xl font-bold text-primary-dark">Enviar Recomendação</h3>
              <button onClick={() => setEndorseModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            {error && (
              <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
            )}
            <form onSubmit={handleEndorse} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Seu Nome Completo</label>
                <input type="text" value={form.profName} onChange={e => setForm(f => ({...f, profName: e.target.value}))}
                  className="form-control" placeholder="Ex: Prof. Dr. Ricardo Oliveira" required />
              </div>
              <div className="form-group">
                <label className="form-label">Seu E-mail de Contato</label>
                <input type="email" value={form.profEmail} onChange={e => setForm(f => ({...f, profEmail: e.target.value}))}
                  className="form-control" placeholder="Ex: professor@ifpr.edu.br" required />
              </div>
              <div className="form-group">
                <label className="form-label">Instituição / Empresa</label>
                <input type="text" value={form.institution} onChange={e => setForm(f => ({...f, institution: e.target.value}))}
                  className="form-control" placeholder="Ex: IFPR Campus Ivaiporã" />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo, Disciplina ou Área</label>
                <input type="text" value={form.discipline} onChange={e => setForm(f => ({...f, discipline: e.target.value}))}
                  className="form-control" placeholder="Ex: Desenvolvimento Web & Banco de Dados" required />
              </div>
              <div className="form-group">
                <label className="form-label">Seu Parecer sobre o Talento</label>
                <textarea value={form.quote} onChange={e => setForm(f => ({...f, quote: e.target.value}))}
                  className="form-control" rows={3} placeholder="Descreva as qualidades técnicas e profissionais..." required />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEndorseModal(false)} className="btn btn-outline btn-sm">Cancelar</button>
                <button type="submit" className="btn btn-teal btn-sm">Enviar Recomendação</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
