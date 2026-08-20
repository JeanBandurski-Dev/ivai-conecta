import { Briefcase, Building2, MapPin, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { getUserApplications, generateWhatsAppLink } from '../lib/ivaiConecta';
import useAppStore from '../store/useAppStore';
import { Link } from 'react-router-dom';

export default function MinhasVagas() {
  const { currentUser } = useAppStore();
  const apps = getUserApplications();

  if (!currentUser) {
    return (
      <main className="container section text-center py-24">
        <Briefcase size={54} className="mx-auto mb-4 text-gray-300" />
        <h2 className="font-heading text-2xl font-bold text-gray-700 mb-2">Acesso restrito</h2>
        <p className="text-gray-500 mb-6">Você precisa estar logado para ver suas candidaturas.</p>
        <Link to="/login" className="btn btn-primary px-6 py-2.5">Entrar / Cadastrar</Link>
      </main>
    );
  }

  return (
    <>
      {/* ── HEADER: ALINHADO À ESQUERDA COM ESCRITA GRANDE ── */}
      <header className="relative bg-[linear-gradient(135deg,#0A1128_0%,#051944_45%,#0052FF_100%)] text-white py-12 lg:py-16 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.15),transparent_50%)] pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-heading font-extrabold text-white mb-3 tracking-tight">
              Minhas Candidaturas
            </h1>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              Acompanhe o status e a evolução de todas as suas candidaturas no Vale do Ivaí.
            </p>
          </div>
        </div>
      </header>

      <main className="container section">
        {apps.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Briefcase size={54} className="mx-auto mb-4 text-gray-300" />
            <p className="font-bold text-lg text-gray-600">Você ainda não se candidatou a nenhuma vaga.</p>
            <Link to="/vagas" className="btn btn-primary btn-sm mt-5">Explorar Vagas</Link>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl">
            {apps.map(app => {
              const waLink = generateWhatsAppLink(app.recruiterPhone, app.title, app.company, app.city);
              return (
                <div key={app.id} className="card gap-4 p-5 sm:p-6">
                  {/* Top */}
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="font-heading text-lg sm:text-xl font-bold text-primary-dark">{app.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Building2 size={15} />{app.company}
                        <span>·</span>
                        <MapPin size={15} />{app.city}
                        <span>·</span>
                        <span className="font-medium text-gray-600">{app.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        app.matchScore >= 85 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-50 text-primary-blue border border-blue-200'
                      }`}>
                        {app.matchScore}% Match
                      </span>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        app.status.includes('Entrevista') ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress stages */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                    {app.stages.map((stage, i) => (
                      <div key={i} className="flex items-center gap-2 shrink-0">
                        <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                          stage.completed ? 'bg-green-100 text-green-700'
                          : stage.active   ? 'bg-primary-blue text-white shadow-xs'
                          : 'bg-gray-100 text-gray-400'
                        }`}>
                          {stage.completed ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {stage.name}
                        </div>
                        {i < app.stages.length - 1 && (
                          <ArrowRight size={13} className="text-gray-300 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Next step note */}
                  {app.nextStepNote && (
                    <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl px-4 py-3 text-sm text-primary-blue font-medium">
                      📌 {app.nextStepNote}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Candidatado em {app.appliedAt}</span>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm text-xs">
                      Contatar Recrutador
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
