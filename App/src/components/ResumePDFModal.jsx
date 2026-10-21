import { useEffect, useState } from 'react';
import {
  Printer, X, ShieldCheck, Download, GraduationCap, Building2,
  MapPin, Award, Lightbulb, CheckCircle2, Globe, Code,
  Mail, Phone, FileText, Sparkles, Briefcase, Loader2, Check, AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

export default function ResumePDFModal({ talent, onClose }) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  // Suporte a tecla ESC para fechar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!talent) return null;

  // 1. Download Direto em Arquivo .PDF Real (sem abrir janela de impressão)
  const handleDownloadDirectPDF = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setDownloadError('');

    const element = document.getElementById('printable-cv');
    if (!element) {
      setIsGeneratingPdf(false);
      return;
    }

    // Salva estilos temporários do elemento para remoção de borda e sombra no PDF
    const origShadow = element.style.boxShadow;
    const origBorder = element.style.border;
    const origRadius = element.style.borderRadius;

    element.style.boxShadow = 'none';
    element.style.border = 'none';
    element.style.borderRadius = '0';

    try {
      const safeName = (talent.name || 'Talento')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Curriculo_${safeName}.pdf`;

      // Captura o elemento com html2canvas-pro (suporte nativo a Tailwind v4 e oklch)
      const canvas = await html2canvas(element, {
        scale: 2, // Resolução nítida para textos e ícones
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0
      });

      const elementRect = element.getBoundingClientRect();
      const scaleY = canvas.height / elementRect.height;
      const mmPerPx = 210 / canvas.width;
      const pxPerMm = canvas.width / 210;

      // Localiza todos os blocos individuais que não devem ser cortados
      const rawPdfItems = Array.from(element.querySelectorAll('[data-pdf-item="true"]'));
      const items = rawPdfItems.map(el => {
        const r = el.getBoundingClientRect();
        return {
          top: (r.top - elementRect.top) * scaleY,
          bottom: (r.bottom - elementRect.top) * scaleY,
          height: r.height * scaleY,
          isHeader: el.getAttribute('data-pdf-header') === 'true'
        };
      }).filter(it => it.height > 5);

      items.sort((a, b) => a.top - b.top);

      // Algoritmo de fatiamento inteligente (Smart Page Breaks com margens ajustadas)
      const pages = [];
      let currentY = 0;
      const totalCanvasHeight = canvas.height;

      while (currentY < totalCanvasHeight - 20) {
        const isFirstPage = pages.length === 0;
        // Altura útil de conteúdo em mm por página (garante margem superior e inferior)
        // Página 1: padding natural no topo (~15mm) e 15mm de margem inferior de segurança
        // Página 2+: margem superior de 12mm e margem inferior de 15mm
        const maxSliceMm = isFirstPage ? 280 : 270;
        const maxSlicePx = maxSliceMm * pxPerMm;

        let targetCutY = currentY + maxSlicePx;

        // Se o restante cabe na página atual, encerra
        if (targetCutY >= totalCanvasHeight) {
          pages.push({
            startY: currentY,
            endY: totalCanvasHeight,
            topMarginMm: isFirstPage ? 0 : 12
          });
          break;
        }

        // Procura se algum elemento é cortado ao meio por targetCutY
        let cutY = targetCutY;
        let adjusted = true;
        let loops = 0;

        while (adjusted && loops < 20) {
          adjusted = false;
          loops++;

          for (const item of items) {
            // Se o item atravessa a linha de corte (começa antes e termina depois)
            if (item.top < cutY && item.bottom > cutY) {
              if (item.height < maxSlicePx) {
                const proposedCut = item.top - 8 * scaleY;
                // Garante avanço mínimo de pelo menos 25% da página para não travar
                if (proposedCut > currentY + maxSlicePx * 0.25 && proposedCut < cutY) {
                  cutY = proposedCut;
                  adjusted = true;
                  break;
                }
              }
            }

            // Evita títulos de seção (h2) órfãos no fim da página
            if (item.isHeader && item.bottom <= cutY && cutY - item.bottom < 55 * scaleY) {
              const proposedCut = item.top - 8 * scaleY;
              if (proposedCut > currentY + maxSlicePx * 0.25 && proposedCut < cutY) {
                cutY = proposedCut;
                adjusted = true;
                break;
              }
            }
          }
        }

        pages.push({
          startY: currentY,
          endY: cutY,
          topMarginMm: isFirstPage ? 0 : 12
        });

        currentY = cutY;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        const sliceHeightPx = p.endY - p.startY;
        const sliceHeightMm = sliceHeightPx * mmPerPx;

        // Cria canvas isolado para a fatia exata desta página
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        ctx.drawImage(
          canvas,
          0, p.startY, canvas.width, sliceHeightPx,
          0, 0, canvas.width, sliceHeightPx
        );

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);

        if (i > 0) {
          pdf.addPage();
        }

        // Desenha na página A4 respeitando a margem superior
        pdf.addImage(pageImgData, 'JPEG', 0, p.topMarginMm, 210, sliceHeightMm);
      }

      // Salva diretamente o arquivo no disco (sem acionar window.print)
      try {
        pdf.save(filename);
      } catch {
        // Fallback seguro via Blob e link de download
        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('[ResumePDFModal] Erro ao gerar PDF direto:', err);
      setDownloadError('Erro ao gerar PDF: ' + (err?.message || 'Falha na renderização'));
      setTimeout(() => setDownloadError(''), 6000);
    } finally {
      // Restaura estilos originais do elemento na tela
      element.style.boxShadow = origShadow;
      element.style.border = origBorder;
      element.style.borderRadius = origRadius;
      setIsGeneratingPdf(false);
    }
  };

  // 2. Impressão Nativa / Salvar como PDF via Navegador
  const handlePrint = () => {
    const originalTitle = document.title;
    const cleanName = talent.name ? talent.name.trim() : 'Talento';
    document.title = `Curriculo - ${cleanName}`;

    window.print();

    // Restaura o título da página após abrir o diálogo de impressão
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  return (
    <>
      {/* ── ESTILOS ESPECÍFICOS DE IMPRESSÃO (A4 ISOLADO E LIMPO) ── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
          }
          body > * {
            visibility: hidden !important;
          }
          .print-hide, nav, header, footer, #toast-container {
            display: none !important;
          }
          #resume-modal-container {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
            display: block !important;
          }
          #resume-modal-card {
            position: static !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            max-height: none !important;
            max-width: 100% !important;
            width: 100% !important;
            overflow: visible !important;
            display: block !important;
            background: transparent !important;
          }
          #printable-cv-wrapper {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
          }
          #printable-cv, #printable-cv * {
            visibility: visible !important;
          }
          #printable-cv {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div
        id="resume-modal-container"
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
        onClick={onClose}
      >
        <div
          id="resume-modal-card"
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800"
          onClick={e => e.stopPropagation()}
        >
          {/* ── BARRA SUPERIOR FIXA (Oculta na Impressão) ── */}
          <div className="p-3.5 sm:px-6 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 border-b border-slate-800 print-hide">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Printer size={16} />
              </span>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-sm sm:text-base truncate">
                  Currículo de {talent.name}
                </h3>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Formato Executivo Padrão A4 • Pronto para visualização e download
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Botão Baixar Arquivo PDF */}
              <button
                type="button"
                onClick={handleDownloadDirectPDF}
                disabled={isGeneratingPdf}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                title="Baixar arquivo PDF diretamente no computador"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Gerando PDF...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check size={14} className="text-emerald-300" />
                    <span>PDF Baixado!</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Baixar PDF</span>
                  </>
                )}
              </button>

              {/* Botão Imprimir / Salvar via Navegador */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="Abrir janela de impressão / Salvar como PDF do navegador"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">Imprimir / Salvar</span>
              </button>

              {/* Botão Fechar */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700/60"
                title="Fechar (ESC)"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Banner de Erro caso a geração falhe */}
          {downloadError && (
            <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-2 print-hide">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* ── CORPO DO DOCUMENTO (FOLHA A4 COM ESPAÇAMENTOS REFINADOS) ── */}
          <div
            id="printable-cv-wrapper"
            className="overflow-y-auto flex-1 bg-slate-200/80 dark:bg-slate-950 p-3 sm:p-6 md:p-8"
          >
            <div
              id="printable-cv"
              className="bg-white text-slate-900 border border-slate-200/90 shadow-xl rounded-2xl max-w-[210mm] min-h-[297mm] mx-auto p-6 sm:p-10 md:p-12 space-y-6"
            >
              {/* 1. CABEÇALHO DO CURRÍCULO */}
              <div data-pdf-item="true" className="border-b-2 border-blue-600 pb-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight break-words [overflow-wrap:anywhere]">
                      {talent.name}
                    </h1>

                    <div className="text-sm sm:text-base font-bold text-blue-700 flex items-center gap-2 flex-wrap break-words [overflow-wrap:anywhere]">
                      <GraduationCap size={18} className="shrink-0 text-blue-600" />
                      <span>{talent.course || 'Estudante / Profissional'}</span>
                    </div>

                    {/* Instituição e Cidade */}
                    <div className="text-xs text-slate-600 flex items-center gap-x-3 gap-y-1 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <Building2 size={13} className="shrink-0 text-slate-400" />
                        <strong className="font-semibold text-slate-700">{talent.institution || 'Instituição de Ensino'}</strong>
                        {talent.period && <span className="text-slate-500">({talent.period})</span>}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="shrink-0 text-slate-400" />
                        <span>{talent.city ? `${talent.city}, PR` : 'Vale do Ivaí, PR'}</span>
                      </span>
                    </div>

                    {/* Contato (Email, Telefone, Redes) */}
                    {(talent.email || talent.phone || talent.linkedin || talent.github) && (
                      <div className="text-xs text-slate-700 flex items-center gap-x-4 gap-y-1.5 flex-wrap pt-1.5 font-medium">
                        {talent.email && (
                          <span className="flex items-center gap-1 text-slate-800">
                            <Mail size={12} className="text-blue-600 shrink-0" />
                            <span className="break-all">{talent.email}</span>
                          </span>
                        )}
                        {talent.phone && (
                          <span className="flex items-center gap-1 text-slate-800">
                            <Phone size={12} className="text-blue-600 shrink-0" />
                            <span>{talent.phone}</span>
                          </span>
                        )}
                        {talent.linkedin && (
                          <span className="flex items-center gap-1 text-blue-700">
                            <Globe size={12} className="shrink-0" />
                            <span className="break-all">
                              linkedin.com/in/{talent.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '')}
                            </span>
                          </span>
                        )}
                        {talent.github && (
                          <span className="flex items-center gap-1 text-blue-700">
                            <Code size={12} className="shrink-0" />
                            <span className="break-all">
                              github.com/{talent.github.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/$/, '')}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selo Estudante Autenticado */}
                  {talent.isVerifiedStudent && (
                    <div className="sm:text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold shadow-xs">
                        <ShieldCheck size={14} className="text-emerald-600" /> Matrícula Autenticada
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        RA: {talent.raNumber || 'IFPR-2026-VAL'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. RESUMO PROFISSIONAL COM QUEBRA DE LINHA CORRETA */}
              {talent.bio && (
                <div data-pdf-item="true" className="space-y-2 print-avoid-break">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                    <FileText size={14} className="text-blue-700 shrink-0" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Resumo Profissional
                    </h2>
                  </div>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700 break-words [overflow-wrap:anywhere] whitespace-pre-line text-justify">
                    {talent.bio}
                  </p>
                </div>
              )}

              {/* 3. COMPETÊNCIAS & HABILIDADES TÉCNICAS */}
              {talent.skills && talent.skills.length > 0 && (
                <div data-pdf-item="true" className="space-y-2.5 print-avoid-break">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                    <Sparkles size={14} className="text-blue-700 shrink-0" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Competências &amp; Habilidades Técnicas
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {talent.skills.map((s, idx) => (
                      <span
                        key={s + idx}
                        className="px-2.5 py-1 bg-slate-50 text-slate-800 border border-slate-200 rounded-md text-xs font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. FORMAÇÃO ACADÊMICA & CURSOS */}
              {talent.education && talent.education.length > 0 && (
                <div className="space-y-2.5 print-avoid-break">
                  <div data-pdf-item="true" data-pdf-header="true" className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                    <GraduationCap size={14} className="text-blue-700 shrink-0" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Formação Acadêmica &amp; Cursos
                    </h2>
                  </div>
                  <div className="space-y-2.5">
                    {talent.education.map((edu, idx) => (
                      <div data-pdf-item="true" key={edu.id || idx} className="text-xs space-y-0.5 print-avoid-break">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs sm:text-[13px] break-words [overflow-wrap:anywhere]">
                            {edu.degree || edu.course}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                            {edu.period || edu.year}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 break-words [overflow-wrap:anywhere]">
                          {edu.institution}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. EXPERIÊNCIAS PROFISSIONAIS */}
              {talent.experiences && talent.experiences.length > 0 && (
                <div className="space-y-3 print-avoid-break">
                  <div data-pdf-item="true" data-pdf-header="true" className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                    <Briefcase size={14} className="text-blue-700 shrink-0" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Experiências Profissionais
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {talent.experiences.map((exp, idx) => (
                      <div data-pdf-item="true" key={exp.id || idx} className="text-xs space-y-1 print-avoid-break">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs sm:text-[13px] break-words [overflow-wrap:anywhere]">
                            {exp.role} <span className="font-normal text-slate-600">— {exp.company}</span>
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                            {exp.period}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-slate-700 leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-line text-justify">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. PROJETOS & PORTFÓLIO */}
              {talent.projects && talent.projects.length > 0 && (
                <div className="space-y-3 print-avoid-break">
                  <div data-pdf-item="true" data-pdf-header="true" className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                    <Code size={14} className="text-blue-700 shrink-0" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Projetos &amp; Portfólio
                    </h2>
                  </div>
                  <div className="space-y-2.5">
                    {talent.projects.map((proj, idx) => (
                      <div data-pdf-item="true" key={proj.id || idx} className="text-xs space-y-0.5 print-avoid-break">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 break-words [overflow-wrap:anywhere]">
                            {proj.title}
                          </span>
                          {proj.tech && (
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                              {proj.tech}
                            </span>
                          )}
                        </div>
                        {proj.description && (
                          <p className="text-slate-700 leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-line">
                            {proj.description}
                          </p>
                        )}
                        {proj.link && (
                          <div className="text-[11px] text-blue-700 font-mono break-all pt-0.5">
                            Link: {proj.link}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. RECOMENDAÇÕES DOCENTES VERIFICADAS */}
              {talent.endorsements && talent.endorsements.length > 0 && (
                <div className="space-y-3 print-avoid-break pt-1">
                  <div data-pdf-item="true" data-pdf-header="true" className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                    <Award size={14} className="text-blue-700 shrink-0" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Recomendações &amp; Pareceres Docentes Verificados
                    </h2>
                  </div>
                  <div className="space-y-2.5">
                    {talent.endorsements.map((e, idx) => (
                      <div
                        data-pdf-item="true"
                        key={e.id || idx}
                        className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs space-y-1.5 print-avoid-break"
                      >
                        <div className="flex items-baseline justify-between gap-2 flex-wrap font-bold text-slate-900">
                          <span className="break-words [overflow-wrap:anywhere]">
                            {e.profName} <span className="font-normal text-slate-600">({e.discipline})</span>
                          </span>
                          <span className="text-emerald-700 font-semibold text-[10px] inline-flex items-center gap-1 shrink-0">
                            <CheckCircle2 size={11} /> Parecer Autenticado
                          </span>
                        </div>
                        <p className="italic text-slate-800 leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-line">
                          "{e.quote}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. RODAPÉ DE AUTENTICAÇÃO */}
              <div data-pdf-item="true" className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
                <span className="text-center sm:text-left">
                  Documento emitido pela plataforma <strong>Ivaí Conecta</strong> — Conectando Talentos do Vale do Ivaí.
                </span>
                <span className="font-mono text-center sm:text-right shrink-0">
                  Autenticação: {talent.raNumber || 'IFPR-2026-VAL'}
                </span>
              </div>
            </div>
          </div>

          {/* ── RODAPÉ FIXO DO MODAL (Oculto na Impressão) ── */}
          <div className="p-3.5 sm:p-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print-hide">
            <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-center sm:text-left">
              <Lightbulb size={14} className="text-amber-500 shrink-0" />
              <span>
                <strong>Dica:</strong> Clique em <strong>"Baixar PDF"</strong> para salvar o arquivo diretamente ou em <strong>"Imprimir / Salvar"</strong> para o assistente nativo.
              </span>
            </span>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleDownloadDirectPDF}
                disabled={isGeneratingPdf}
                className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md flex-1 sm:flex-initial justify-center"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Gerando...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check size={14} />
                    <span>Baixado!</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Baixar PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 btn-sm text-xs font-bold flex items-center gap-1.5 flex-1 sm:flex-initial justify-center"
              >
                <X size={14} />
                <span>Fechar e Voltar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

