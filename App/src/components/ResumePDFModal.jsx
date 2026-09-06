import { useEffect } from 'react';
import { Printer, X, ShieldCheck, Download, GraduationCap, Building2, MapPin, Award, Lightbulb, CheckCircle2, Globe, Code } from 'lucide-react';

export default function ResumePDFModal({ talent, onClose }) {
  if (!talent) return null;

  const handlePrint = () => {
    window.print();
  };

  // Suporte a tecla ESC para fechar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-h-none print:shadow-none print:rounded-none print:w-full border border-gray-200 dark:border-slate-800"
        onClick={e => e.stopPropagation()}
      >
        
        {/* ── BARRA SUPERIOR FIXA (Oculta na Impressão) ── */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary-blue flex items-center justify-center">
              <Printer size={16} />
            </span>
            <h3 className="font-heading font-bold text-sm sm:text-base">
              Currículo de {talent.name} (Folha A4 / PDF)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Printer size={15} /> Baixar / Imprimir PDF Agora
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors border border-slate-700"
              title="Fechar e Voltar ao Perfil"
            >
              <X size={18} /> Fechar
            </button>
          </div>
        </div>

        {/* ── CORPO DO DOCUMENTO (FORÇADO EM ESTILO CLARO / FOLHA BRANCA A4) ── */}
        <div className="overflow-y-auto flex-1 bg-slate-200 dark:bg-slate-950 p-4 sm:p-8 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="printable-cv"
            className="bg-white p-8 sm:p-12 space-y-6 text-gray-900 border border-gray-300 shadow-md rounded-2xl print:shadow-none print:border-none print:rounded-none print:p-8 print:text-black max-w-2xl mx-auto"
          >
            
            {/* Cabeçalho do Perfil */}
            <div className="flex items-start justify-between border-b-2 border-primary-blue pb-6 gap-6">
              <div>
                <h1 className="text-3xl font-heading font-extrabold text-slate-900 print:text-black">{talent.name}</h1>
                <div className="text-lg font-bold text-primary-blue print:text-blue-800 mt-1 flex items-center gap-2">
                  <GraduationCap size={20} /> {talent.course}
                </div>
                <div className="text-xs text-gray-600 print:text-gray-700 mt-1.5 flex items-center gap-3 flex-wrap">
                  <span><Building2 size={13} className="inline mr-1" />{talent.institution} ({talent.period || 'Graduação'})</span>
                  <span>·</span>
                  <span><MapPin size={13} className="inline mr-1" />{talent.city}, PR</span>
                </div>

                {(talent.linkedin || talent.github) && (
                  <div className="text-xs text-blue-800 print:text-blue-900 mt-2 flex items-center gap-3 flex-wrap font-medium">
                    {talent.linkedin && (
                      <a href={talent.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                        <Globe size={12} className="inline" /> LinkedIn: {talent.linkedin.replace('https://', '')}
                      </a>
                    )}
                    {talent.github && (
                      <a href={talent.github} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                        <Code size={12} className="inline" /> GitHub: {talent.github.replace('https://', '')}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {talent.isVerifiedStudent && (
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold">
                    <ShieldCheck size={14} /> Matrícula Autenticada
                  </span>
                  <div className="text-[10px] text-gray-500 print:text-gray-600 mt-1 font-mono">
                    RA: {talent.raNumber || 'IFPR-2026-VAL'}
                  </div>
                </div>
              )}
            </div>

            {/* Resumo Profissional / Bio */}
            {talent.bio && (
              <div className="space-y-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200 pb-1">
                  Resumo Profissional
                </h2>
                <p className="text-xs leading-relaxed text-gray-800 print:text-black">
                  {talent.bio}
                </p>
              </div>
            )}

            {/* Competências & Habilidades Técnicas */}
            {talent.skills && talent.skills.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200 pb-1">
                  Competências &amp; Habilidades Técnicas
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {talent.skills.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-gray-100 border border-gray-300 rounded-md text-xs font-semibold text-gray-800 print:bg-gray-100 print:border-gray-400">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Formação Acadêmica & Cursos */}
            {talent.education && talent.education.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200 pb-1">
                  Formação Acadêmica &amp; Cursos
                </h2>
                <div className="space-y-2">
                  {talent.education.map((edu, idx) => (
                    <div key={edu.id || idx} className="text-xs">
                      <div className="flex items-center justify-between font-bold text-gray-900 print:text-black">
                        <span>{edu.degree} — {edu.institution}</span>
                        <span className="text-gray-500 font-normal">{edu.period || edu.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experiências Profissionais */}
            {talent.experiences && talent.experiences.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200 pb-1">
                  Experiências Profissionais
                </h2>
                <div className="space-y-3">
                  {talent.experiences.map(exp => (
                    <div key={exp.id} className="text-xs">
                      <div className="flex items-center justify-between font-bold text-gray-900 print:text-black">
                        <span>{exp.role} — {exp.company}</span>
                        <span className="text-gray-500 font-normal">{exp.period}</span>
                      </div>
                      <p className="text-gray-700 print:text-black mt-1 leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projetos Destacados */}
            {talent.projects && talent.projects.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200 pb-1">
                  Projetos &amp; Portfólio
                </h2>
                <div className="space-y-2">
                  {talent.projects.map(proj => (
                    <div key={proj.id} className="text-xs">
                      <div className="font-bold text-gray-900 print:text-black">
                        {proj.title} <span className="text-primary-blue font-semibold">({proj.tech})</span>
                      </div>
                      <p className="text-gray-700 print:text-black mt-0.5">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendações & Pareceres Docentes */}
            {talent.endorsements && talent.endorsements.length > 0 && (
              <div className="space-y-3 pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200 pb-1 flex items-center gap-1.5">
                  <Award size={15} /> Recomendações &amp; Pareceres Docentes Verificados
                </h2>
                <div className="space-y-2.5">
                  {talent.endorsements.map((e, i) => (
                    <div key={e.id || i} className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1 print:border-gray-300 print:bg-gray-50">
                      <div className="flex items-center justify-between font-bold text-gray-900 print:text-black">
                        <span>{e.profName} ({e.discipline})</span>
                        <span className="text-emerald-700 print:text-emerald-800 font-semibold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> Parecer Autenticado
                        </span>
                      </div>
                      <p className="italic text-gray-800 print:text-black">"{e.quote}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rodapé de Autenticação */}
            <div className="pt-6 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500 print:text-gray-600">
              <span>Documento emitido pela plataforma Ivaí Conecta — Conectando Talentos do Vale do Ivaí.</span>
              <span>Código de Autenticação: {talent.raNumber || 'IFPR-2026-VAL'}</span>
            </div>

          </div>
        </div>

        {/* ── RODAPÉ FIXO COM OPÇÕES DE FECHAR E IMPRIMIR (Oculto na Impressão) ── */}
        <div className="p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 hidden sm:inline flex items-center gap-1">
            <Lightbulb size={13} className="text-amber-500 inline" /> Dica: Você pode salvar diretamente como PDF selecionando "Salvar como PDF" no navegador.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handlePrint}
              className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Download size={15} /> Baixar PDF
            </button>
            <button
              onClick={onClose}
              className="btn btn-outline border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 btn-sm text-xs font-bold flex items-center gap-1.5"
            >
              <X size={15} /> Fechar e Voltar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
