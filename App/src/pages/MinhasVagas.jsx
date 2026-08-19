import { Briefcase, Building2, MapPin, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { getUserApplications } from '../lib/ivaiConecta';
import { generateWhatsAppLink } from '../lib/ivaiConecta';
import useAppStore from '../store/useAppStore';
import { Link } from 'react-router-dom';

export default function MinhasVagas() {
  const { currentUser } = useAppStore();
  const apps = getUserApplications();

  if (!currentUser) {
    return (
      <main className="container section text-center py-20">
        <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />
        <h2 className="font-heading text-2xl font-bold text-gray-700 mb-2">Acesso restrito</h2>
        <p className="text-gray-500 mb-6">Você precisa estar logado para ver suas candidaturas.</p>
        <Link to="/login" className="btn btn-primary">Entrar / Cadastrar</Link>
      </main>
    );
  }

  return (
    <>
      <header className="bg-gradient-to-r from-primary-dark to-primary-blue text-white py-14">
        <div className="container">
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Minhas Candidaturas</h1>
          <p className="text-gray-300">Acompanhe o status de todas as suas candidaturas a vagas no Vale do Ivaí.</p>
        </div>
      </header>

      <main className="container section">
        {apps.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-semibold">Você ainda não se candidatou a nenhuma vaga.</p>
            <Link to="/vagas" className="btn btn-primary btn-sm mt-4">Explorar Vagas</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {apps.map(app => {
              const waLink = generateWhatsAppLink(app.recruiterPhone, app.title, app.company, app.city);
              return (
                <div key={app.id} className="card gap-4">
                  {/* Top */}
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-primary-dark">{app.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Building2 size={14} />{app.company}
                        <span>·</span>
                        <MapPin size={14} />{app.city}
                        <span>·</span>
                        {app.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        app.matchScore >= 85 ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-primary-blue'
                      }`}>
                        {app.matchScore}% Match
                      </span>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        app.status.includes('Entrevista') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress stages */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {app.stages.map((stage, i) => (
                      <div key={i} className="flex items-center gap-2 shrink-0">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          stage.completed ? 'bg-green-100 text-green-700'
                          : stage.active   ? 'bg-primary-blue text-white'
                          : 'bg-gray-100 text-gray-400'
                        }`}>
                          {stage.completed ? <CheckCircle size={11} /> : <Clock size={11} />}
                          {stage.name}
                        </div>
                        {i < app.stages.length - 1 && (
                          <ArrowRight size={12} className="text-gray-300 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Next step note */}
                  {app.nextStepNote && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-primary-blue">
                      📌 {app.nextStepNote}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
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
