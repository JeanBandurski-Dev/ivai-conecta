import { useState, useEffect } from 'react';
import {
  Briefcase, X, ShieldCheck, Sparkles, AlertCircle, Check, Loader2, Edit3
} from 'lucide-react';
import {
  CITIES,
  STANDARD_JOB_TITLES,
  STANDARD_SKILLS,
  SALARY_RANGES,
  WORK_SCHEDULES,
  STANDARD_BENEFITS,
  validateProfessionalText,
  getJobDescriptionTemplate,
  validateJobTitle,
  validateSkill
} from '../lib/ivaiConecta';

const TYPES = [
  { label: 'Tempo Integral (CLT)', value: 'Tempo Integral' },
  { label: 'Meio Período', value: 'Meio Período' },
  { label: 'Estágio / Trainee', value: 'Estágio' },
  { label: 'Prestador de Serviço (PJ)', value: 'Prestador de Serviço' },
];

const MODALITIES = [
  { label: 'Presencial', value: 'Presencial' },
  { label: 'Híbrido', value: 'Híbrido' },
  { label: '100% Remoto', value: 'Remoto' },
];

const POPULAR_TITLE_SUGGESTIONS = [
  'Desenvolvedor Front-end',
  'Assistente Administrativo',
  'Vendedor(a) Comercial',
  'Atendente de Loja',
  'Estagiário de TI / Software',
  'Auxiliar Contábil',
  'Operador(a) de Caixa',
  'Eletricista Industrial',
  'Técnico Agrícola'
];

export default function JobFormModal({
  isOpen,
  onClose,
  onSave,
  initialJob = null,
  currentUser = null
}) {
  const isEditing = Boolean(initialJob && initialJob.id);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Tempo Integral');
  const [modality, setModality] = useState('Presencial');
  const [city, setCity] = useState('Ivaiporã');
  const [salary, setSalary] = useState(SALARY_RANGES[0]?.value || 'A combinar');
  const [schedule, setSchedule] = useState(WORK_SCHEDULES[0] || 'Comercial (Segunda a Sexta)');
  const [skillsList, setSkillsList] = useState(['Comunicação Assertiva', 'Trabalho em Equipe']);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [description, setDescription] = useState('');
  const [benefits, setBenefits] = useState(['Vale Transporte (VT)', 'Vale Refeição / Alimentação (VR/VA)']);
  const [status, setStatus] = useState('Ativa');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form when modal opens or initialJob changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialJob) {
      setTitle(initialJob.title || '');
      setType(initialJob.type || 'Tempo Integral');
      setModality(initialJob.modality || 'Presencial');
      setCity(initialJob.city || 'Ivaiporã');
      setSalary(initialJob.salary || SALARY_RANGES[0]?.value || 'A combinar');
      setSchedule(initialJob.schedule || WORK_SCHEDULES[0] || 'Comercial (Segunda a Sexta)');
      setSkillsList(Array.isArray(initialJob.requiredSkills) && initialJob.requiredSkills.length > 0
        ? initialJob.requiredSkills
        : ['Comunicação Assertiva', 'Trabalho em Equipe']
      );
      setBenefits(Array.isArray(initialJob.benefits) && initialJob.benefits.length > 0
        ? initialJob.benefits
        : ['Vale Transporte (VT)', 'Vale Refeição / Alimentação (VR/VA)']
      );
      setDescription(initialJob.description || '');
      setStatus(initialJob.status || 'Ativa');
    } else {
      setTitle('');
      setType('Tempo Integral');
      setModality('Presencial');
      setCity(currentUser?.city || 'Ivaiporã');
      setSalary(SALARY_RANGES[0]?.value || 'A combinar');
      setSchedule(WORK_SCHEDULES[0] || 'Comercial (Segunda a Sexta)');
      setSkillsList(['Comunicação Assertiva', 'Trabalho em Equipe']);
      setBenefits(['Vale Transporte (VT)', 'Vale Refeição / Alimentação (VR/VA)']);
      setDescription('');
      setStatus('Ativa');
    }
    setCustomSkillInput('');
    setFormError('');
    setIsSubmitting(false);
  }, [isOpen, initialJob, currentUser]);

  if (!isOpen) return null;

  const toggleBenefit = (benefit) => {
    setBenefits(prev =>
      prev.includes(benefit) ? prev.filter(b => b !== benefit) : [...prev, benefit]
    );
  };

  const addSkillTag = (skillToAdd) => {
    const cleanSkill = (skillToAdd || '').trim();
    if (!cleanSkill) return;

    const val = validateSkill(cleanSkill);
    if (!val.valid) {
      setFormError(val.error);
      return;
    }

    if (!skillsList.some(s => s.toLowerCase() === cleanSkill.toLowerCase())) {
      setSkillsList(prev => [...prev, cleanSkill]);
      setCustomSkillInput('');
      setFormError('');
    } else {
      setFormError('Esta habilidade já foi adicionada.');
    }
  };

  const removeSkillTag = (skillToRemove) => {
    setSkillsList(prev => prev.filter(s => s !== skillToRemove));
  };

  const fillDescriptionTemplate = () => {
    const companyName = currentUser?.razaoSocial || currentUser?.nomeFantasia || currentUser?.name || 'Nossa Empresa';
    const template = getJobDescriptionTemplate(title || 'Oportunidade Profissional', companyName);
    setDescription(template);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // 1. Validação Profissional do Título de Trabalho (CBO / Mercado)
    const titleVal = validateJobTitle(title);
    if (!titleVal.valid) {
      setFormError(titleVal.error);
      return;
    }

    // 2. Validação Profissional da Descrição
    const descVal = validateProfessionalText(description, 'Descrição da Oportunidade', 30, 2500);
    if (!descVal.valid) {
      setFormError(descVal.error);
      return;
    }

    // 3. Validação de Habilidades
    if (skillsList.length === 0) {
      setFormError('Selecione ou adicione pelo menos uma competência ou habilidade exigida para a vaga.');
      return;
    }

    const invalidSkill = skillsList.find(s => !validateSkill(s).valid);
    if (invalidSkill) {
      setFormError(`A competência "${invalidSkill}" é inválida ou inadequada. Por favor, remova-a.`);
      return;
    }

    const companyName = currentUser?.razaoSocial || currentUser?.nomeFantasia || currentUser?.name || initialJob?.company || 'ValeTech Soluções Digitais';
    const companyLogo = currentUser?.avatar || initialJob?.companyLogo || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=150';

    const payload = {
      ...(initialJob || {}),
      title: title.trim(),
      company: companyName,
      companyLogo: companyLogo,
      isVerifiedCompany: currentUser?.isVerifiedCompany ?? true,
      city,
      type,
      modality,
      salary: salary || 'A combinar',
      schedule,
      description: description.trim(),
      requiredSkills: skillsList,
      benefits: benefits.length > 0 ? benefits : ['Vale Transporte (VT)'],
      status,
      recruiterPhone: currentUser?.phone || initialJob?.recruiterPhone || '',
      recruiterEmail: currentUser?.email || initialJob?.recruiterEmail || '',
      createdBy: currentUser?.uid || currentUser?.id || currentUser?.email || initialJob?.createdBy || 'empresa'
    };

    try {
      setIsSubmitting(true);
      await onSave(payload, isEditing);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar vaga:', err);
      setIsSubmitting(false);
      setFormError(err.message || 'Ocorreu um erro ao salvar a vaga. Tente novamente.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-brand-xl w-full max-w-2xl p-6 sm:p-8 border border-gray-200 dark:border-slate-800 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-heading text-xl font-bold text-primary-dark dark:text-white flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit3 size={22} className="text-primary-blue dark:text-blue-400" />
                  Editar Vaga &amp; Critérios de Seleção
                </>
              ) : (
                <>
                  <Briefcase size={22} className="text-primary-blue dark:text-blue-400" />
                  Publicar Oportunidade Profissional
                </>
              )}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Padrão corporativo LinkedIn / Gupy alinhado com o mercado do Vale do Ivaí.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Banner da Empresa Recrutadora */}
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-3.5">
          <img
            src={currentUser?.avatar || initialJob?.companyLogo || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=150'}
            alt="Empresa"
            className="w-11 h-11 rounded-xl object-cover border border-primary-blue/30 shrink-0 bg-white"
          />
          <div className="min-w-0">
            <div className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Empresa Recrutadora Homologada
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
              {currentUser?.razaoSocial || currentUser?.nomeFantasia || currentUser?.name || initialJob?.company || 'Sua Empresa'}
              <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800 flex items-center gap-1">
                <ShieldCheck size={11} /> CNPJ Verificado
              </span>
            </div>
          </div>
        </div>

        {/* Banner de Erro de Validação */}
        {formError && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status da Vaga (Apenas na edição) */}
          {isEditing && (
            <div className="form-group bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-gray-200 dark:border-slate-700">
              <label className="form-label font-bold text-xs">Status Atual da Vaga:</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="form-control text-sm font-bold"
              >
                <option value="Ativa">🟢 Ativa (Aberta para Novas Inscrições)</option>
                <option value="Pausada">🟡 Pausada (Inscrições Suspensas Temporariamente)</option>
                <option value="Encerrada">🔴 Encerrada (Processo Finalizado)</option>
              </select>
            </div>
          )}

          {/* Cargo / Título Padronizado com CBO */}
          <div className="form-group">
            <label className="form-label flex items-center justify-between">
              <span className="font-bold">Cargo / Ocupação Profissional *</span>
              {title && (
                <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                  validateJobTitle(title).valid
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {validateJobTitle(title).valid ? (
                    <>✓ Cargo Profissional Válido (CBO)</>
                  ) : (
                    <>⚠️ Especifique uma ocupação profissional real</>
                  )}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                list="cbo-job-titles-list"
                value={title}
                onChange={e => { setTitle(e.target.value); setFormError(''); }}
                className={`form-control text-sm font-semibold transition-all ${
                  title && !validateJobTitle(title).valid ? 'border-amber-400 dark:border-amber-500 bg-amber-50/20' : ''
                }`}
                placeholder="Ex: Desenvolvedor Front-end, Auxiliar Administrativo, Vendedor(a)..."
                required
              />
              <datalist id="cbo-job-titles-list">
                {STANDARD_JOB_TITLES.map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            {title && !validateJobTitle(title).valid && title.trim().length >= 3 && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                💡 O título precisa especificar uma função ou ocupação de trabalho (ex.: <em>Auxiliar Administrativo</em>, <em>Vendedor(a)</em>, <em>Desenvolvedor(a)</em>, <em>Técnico(a)</em>, <em>Operador(a)</em>). Termos avulsos ou aleatórios não são aceitos.
              </p>
            )}

            {/* Sugestões Rápidas de Cargos */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-gray-400 self-center font-medium">Cargos Populares:</span>
              {POPULAR_TITLE_SUGGESTIONS.map(sug => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => { setTitle(sug); setFormError(''); }}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer font-medium ${
                    title === sug
                      ? 'bg-primary-blue text-white border-primary-blue font-bold shadow-xs'
                      : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-primary-blue hover:text-primary-blue'
                  }`}
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Regime de Contratação & Modalidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label font-bold">Tipo de Contratação</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="form-control text-sm font-medium"
              >
                {TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-bold">Modalidade de Atuação</label>
              <select
                value={modality}
                onChange={e => setModality(e.target.value)}
                className="form-control text-sm font-medium"
              >
                {MODALITIES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Município & Faixa Salarial Padronizada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label font-bold">Município (Vale do Ivaí)</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="form-control text-sm font-medium"
              >
                {CITIES.filter(c => c !== 'Todas as Cidades').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-bold flex items-center justify-between">
                <span>Faixa Salarial / Remuneração *</span>
                <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">Padronizada</span>
              </label>
              <select
                value={salary}
                onChange={e => { setSalary(e.target.value); setFormError(''); }}
                className="form-control text-sm font-semibold text-gray-800 dark:text-white"
              >
                {SALARY_RANGES.map(sal => (
                  <option key={sal.id} value={sal.value}>
                    {sal.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Horário de Trabalho Padronizado */}
          <div className="form-group">
            <label className="form-label font-bold">Jornada / Horário de Trabalho</label>
            <select
              value={schedule}
              onChange={e => setSchedule(e.target.value)}
              className="form-control text-sm font-medium"
            >
              {WORK_SCHEDULES.map(sch => (
                <option key={sch} value={sch}>{sch}</option>
              ))}
            </select>
          </div>

          {/* Habilidades e Competências Homologadas */}
          <div className="form-group">
            <label className="form-label flex items-center justify-between">
              <span className="font-bold">Competências &amp; Habilidades Exigidas *</span>
              <span className="text-[11px] font-normal text-gray-400">Usado no cálculo de Match inteligente</span>
            </label>

            {/* Habilidades Selecionadas */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl flex flex-wrap gap-1.5 min-h-[46px] items-center mb-2">
              {skillsList.map(skill => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/60 text-primary-blue dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-2.5 py-1 rounded-xl text-xs font-bold"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkillTag(skill)}
                    className="hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                    title="Remover"
                  >
                    ×
                  </button>
                </span>
              ))}
              {skillsList.length === 0 && (
                <span className="text-xs text-gray-400 italic">Nenhuma habilidade adicionada ainda. Clique nas sugestões abaixo:</span>
              )}
            </div>

            {/* Banco de Sugestões de Habilidades */}
            <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto p-1">
              {STANDARD_SKILLS.slice(0, 16).map(s => {
                const isSelected = skillsList.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => isSelected ? removeSkillTag(s) : addSkillTag(s)}
                    className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-medium ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary-blue hover:text-primary-blue'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{s}
                  </button>
                );
              })}
            </div>

            {/* Adicionar Habilidade Personalizada com Validação */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={e => setCustomSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkillTag(customSkillInput);
                    }
                  }}
                  placeholder="Digite outra competência profissional (ex: Gestão de Projetos, SolidWorks)..."
                  className={`form-control text-xs flex-1 transition-all ${
                    customSkillInput.trim() && !validateSkill(customSkillInput).valid
                      ? 'border-amber-400 dark:border-amber-500 bg-amber-50/20'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => addSkillTag(customSkillInput)}
                  className="btn btn-outline btn-sm text-xs font-bold shrink-0"
                >
                  + Adicionar
                </button>
              </div>
              {customSkillInput.trim() && !validateSkill(customSkillInput).valid && customSkillInput.trim().length >= 3 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ {validateSkill(customSkillInput).error}
                </p>
              )}
            </div>
          </div>

          {/* Benefícios Estruturados (LinkedIn / Gupy) */}
          <div className="form-group">
            <label className="form-label font-bold flex items-center justify-between">
              <span>Benefícios &amp; Vantagens Oferecidas</span>
              <span className="text-[10px] text-gray-400 font-normal">Clique para marcar/desmarcar</span>
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl max-h-32 overflow-y-auto">
              {STANDARD_BENEFITS.map(b => {
                const checked = benefits.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBenefit(b)}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-all cursor-pointer font-semibold flex items-center gap-1.5 ${
                      checked
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-teal-400'
                    }`}
                  >
                    {checked ? <Check size={13} className="text-teal-600 dark:text-teal-400" /> : <span className="text-gray-300">+</span>}
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descrição e Responsabilidades */}
          <div className="form-group">
            <div className="flex items-center justify-between mb-1">
              <label className="form-label font-bold mb-0">Descrição e Responsabilidades da Função *</label>
              <button
                type="button"
                onClick={fillDescriptionTemplate}
                className="text-xs text-primary-blue hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={13} /> Gerar Modelo Pré-formatado
              </button>
            </div>
            <textarea
              value={description}
              onChange={e => { setDescription(e.target.value); setFormError(''); }}
              className="form-control text-xs leading-relaxed"
              rows={6}
              placeholder="Descreva as atribuições diárias, requisitos obrigatórios, diferenciais e informações sobre a equipe..."
              required
            />
            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
              <span>Mínimo 30 caracteres. Seja claro e profissional.</span>
              <span>{description.length}/2500 caracteres</span>
            </div>
          </div>

          {/* Ações do Formulário */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-outline btn-sm font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm px-6 py-2.5 font-bold rounded-xl shadow-brand-md flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Salvando no Firestore...</span>
                </>
              ) : isEditing ? (
                <>
                  <Check size={16} />
                  <span>Salvar Alterações</span>
                </>
              ) : (
                <>
                  <Briefcase size={16} />
                  <span>Publicar Vaga Homologada</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
