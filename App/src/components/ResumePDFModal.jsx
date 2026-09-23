import { useEffect } from 'react';
import { Printer, X, ShieldCheck, Download, GraduationCap, Building2, MapPin, Award, Lightbulb, CheckCircle2, Globe, Code } from 'lucide-react';

export default function ResumePDFModal({ talent, onClose }) {
  // Suporte a tecla ESC para fechar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!talent) return null;

  const handlePrint = () => {
    const printableElement = document.getElementById('printable-cv');
    if (!printableElement) {
      window.print();
      return;
    }

    // Cria um iframe temporário e isolado para renderizar exclusivamente o currículo
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();

    // Clona todos os estilos Tailwind e tags style/link da aplicação
    const headNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
    const stylesHtml = headNodes.map(node => node.outerHTML).join('\n');

    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <title>Currículo - ${talent.name || 'Candidato'} (Ivaí Conecta)</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          ${stylesHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #ffffff !important;
              color: #0f172a !important;
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              -webkit-font-smoothing: antialiased;
            }
            .cv-pdf-container {
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 auto !important;
              padding: 10mm 14mm !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
            }
            .cv-pdf-container #printable-cv {
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            .cv-section,
            .cv-item,
            .cv-endorsement {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="cv-pdf-container">
            ${printableElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    // Aguarda aplicação dos estilos e dispara o diálogo do navegador em foco
    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (e) {
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 2000);
      }
    }, 350);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-gray-200 dark:border-slate-800"
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
              className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer size={15} /> Baixar / Imprimir PDF Agora
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer"
              title="Fechar e Voltar ao Perfil"
            >
              <X size={18} /> Fechar
            </button>
          </div>
        </div>

        {/* ── CORPO DO DOCUMENTO (FORÇADO EM ESTILO CLARO / FOLHA BRANCA A4) ── */}
        <div className="overflow-y-auto flex-1 bg-slate-200 dark:bg-slate-950 p-4 sm:p-8">
          <div
            id="printable-cv"
            className="bg-white p-6 sm:p-9 space-y-4 sm:space-y-4.5 text-gray-900 border border-gray-300 shadow-md rounded-2xl max-w-2xl mx-auto"
          >
            
            {/* Cabeçalho do Perfil */}
            <div className="flex items-start justify-between border-b-2 border-primary-blue pb-4 gap-4 cv-section" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900">{talent.name}</h1>
                <div className="text-base sm:text-lg font-bold text-primary-blue mt-1 flex items-center gap-2">
                  <GraduationCap size={19} /> {talent.course}
                </div>
                <div className="text-xs text-gray-600 mt-1 flex items-center gap-2.5 flex-wrap">
                  <span><Building2 size={13} className="inline mr-1" />{talent.institution} ({talent.period || 'Graduação'})</span>
                  <span>·</span>
                  <span><MapPin size={13} className="inline mr-1" />{talent.city}, PR</span>
                </div>

                {(talent.linkedin || talent.github) && (
                  <div className="text-xs text-blue-800 mt-1.5 flex items-center gap-3 flex-wrap font-medium">
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
                  <div className="text-[10px] text-gray-500 mt-1 font-mono">
                    RA: {talent.raNumber || 'IFPR-2026-VAL'}
                  </div>
                </div>
              )}
            </div>

            {/* Resumo Profissional / Bio */}
            {talent.bio && (
              <div className="space-y-1 cv-section" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200 pb-1">
                  Resumo Profissional
                </h2>
                <p className="text-xs leading-relaxed text-gray-800">
                  {talent.bio}
                </p>
              </div>
            )}

            {/* Competências & Habilidades Técnicas */}
            {talent.skills && talent.skills.length > 0 && (
              <div className="space-y-1.5 cv-section" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200 pb-1">
                  Competências &amp; Habilidades Técnicas
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {talent.skills.map(s => (
                    <span key={s} className="px-2.5 py-0.5 bg-gray-100 border border-gray-300 rounded-md text-xs font-semibold text-gray-800">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Formação Acadêmica & Cursos */}
            {talent.education && talent.education.length > 0 && (
              <div className="space-y-2 cv-section" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200 pb-1">
                  Formação Acadêmica &amp; Cursos
                </h2>
                <div className="space-y-2">
                  {talent.education.map((edu, idx) => (
                    <div key={edu.id || idx} className="text-xs cv-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <div className="flex items-start justify-between gap-3 text-xs">
                        <span className="font-bold text-gray-900 leading-snug flex-1">
                          {edu.degree} <span className="font-normal text-gray-600">— {edu.institution}</span>
                        </span>
                        <span className="text-gray-500 font-medium shrink-0 whitespace-nowrap text-right ml-3 text-[11px] sm:text-xs pt-0.5">
                          {edu.period || edu.year}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experiências Profissionais */}
            {talent.experiences && talent.experiences.length > 0 && (
              <div className="space-y-2.5 cv-section" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200 pb-1">
                  Experiências Profissionais
                </h2>
                <div className="space-y-2.5">
                  {talent.experiences.map(exp => (
                    <div key={exp.id} className="text-xs cv-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <div className="flex items-start justify-between gap-3 text-xs">
                        <span className="font-bold text-gray-900 leading-snug flex-1">
                          {exp.role} <span className="font-normal text-gray-600">— {exp.company}</span>
                        </span>
                        <span className="text-gray-500 font-medium shrink-0 whitespace-nowrap text-right ml-3 text-[11px] sm:text-xs pt-0.5">
                          {exp.period}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-1 leading-relaxed text-[11.5px] sm:text-xs">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projetos Destacados */}
            {talent.projects && talent.projects.length > 0 && (
              <div className="space-y-2.5 cv-section" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200 pb-1">
                  Projetos &amp; Portfólio
                </h2>
                <div className="space-y-2">
                  {talent.projects.map(proj => (
                    <div key={proj.id} className="text-xs cv-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <div className="font-bold text-gray-900 leading-snug">
                        {proj.title} <span className="text-primary-blue font-semibold">({proj.tech})</span>
                      </div>
                      <p className="text-gray-700 mt-0.5 leading-relaxed text-[11.5px] sm:text-xs">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendações & Pareceres Docentes */}
            {talent.endorsements && talent.endorsements.length > 0 && (
              <div className="space-y-2.5 pt-1 cv-section" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200 pb-1 flex items-center gap-1.5">
                  <Award size={15} /> Recomendações &amp; Pareceres Docentes Verificados
                </h2>
                <div className="space-y-2">
                  {talent.endorsements.map((e, i) => (
                    <div
                      key={e.id || i}
                      className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1 cv-endorsement"
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                    >
                      <div className="flex items-center justify-between font-bold text-gray-900 gap-2">
                        <span className="leading-snug">{e.profName} <span className="font-semibold text-gray-700">({e.discipline})</span></span>
                        <span className="text-emerald-700 font-semibold text-[10px] inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <CheckCircle2 size={11} /> Parecer Autenticado
                        </span>
                      </div>
                      <p className="italic text-gray-800 leading-relaxed text-[11.5px] sm:text-xs">"{e.quote}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rodapé de Autenticação */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500 cv-section" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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
