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
import CustomSelect from './ui/CustomSelect';
import JobTitleCombobox from './ui/JobTitleCombobox';
import SkillCombobox from './ui/SkillCombobox';

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

const STATUS_OPTIONS = [
  { value: 'Ativa', label: 'Ativa (Aberta para Novas Inscrições)', badge: '🟢 Ativa' },
  { value: 'Pausada', label: 'Pausada (Inscrições Suspensas Temporariamente)', badge: '🟡 Pausada' },
  { value: 'Encerrada', label: 'Encerrada (Processo Finalizado)', badge: '🔴 Encerrada' },
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
              <label className="form-label font-bold text-xs mb-1.5 block">Status Atual da Vaga:</label>
              <CustomSelect
                value={status}
                onChange={setStatus}
                options={STATUS_OPTIONS}
              />
            </div>
          )}

          {/* Cargo / Título Padronizado com CBO */}
          <div className="form-group">
            <div className="flex items-center justify-between mb-1.5">
              <label className="form-label font-bold mb-0">Cargo / Ocupação Profissional *</label>
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
            </div>

            <JobTitleCombobox
              value={title}
              onChange={newTitle => { setTitle(newTitle); setFormError(''); }}
              placeholder="Ex: Desenvolvedor Front-end, Auxiliar Administrativo, Vendedor(a)..."
              required
            />

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
              <label className="form-label font-bold mb-1.5 block">Tipo de Contratação</label>
              <CustomSelect
                value={type}
                onChange={setType}
                options={TYPES}
              />
            </div>
            <div className="form-group">
              <label className="form-label font-bold mb-1.5 block">Modalidade de Atuação</label>
              <CustomSelect
                value={modality}
                onChange={setModality}
                options={MODALITIES}
              />
            </div>
          </div>

          {/* Município & Faixa Salarial Padronizada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label font-bold mb-1.5 block">Município (Vale do Ivaí)</label>
              <CustomSelect
                value={city}
                onChange={setCity}
                options={CITIES.filter(c => c !== 'Todas as Cidades')}
                searchable={true}
              />
            </div>
            <div className="form-group">
              <label className="form-label font-bold flex items-center justify-between mb-1.5">
                <span>Faixa Salarial / Remuneração *</span>
                <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">Padronizada</span>
              </label>
              <CustomSelect
                value={salary}
                onChange={val => { setSalary(val); setFormError(''); }}
                options={SALARY_RANGES}
              />
            </div>
          </div>

          {/* Horário de Trabalho Padronizado */}
          <div className="form-group">
            <label className="form-label font-bold mb-1.5 block">Jornada / Horário de Trabalho</label>
            <CustomSelect
              value={schedule}
              onChange={setSchedule}
              options={WORK_SCHEDULES}
            />
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

            {/* Adicionar Habilidade com Pesquisa e Autocomplete Moderno */}
            <SkillCombobox
              skillsList={skillsList}
              onAddSkill={addSkillTag}
            />
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
                className="text-xs text-primary-blue hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles size={13} /> Gerar Modelo Pré-formatado
              </button>
            </div>
            <textarea
              value={description}
              onChange={e => { setDescription(e.target.value); setFormError(''); }}
              className={`form-control text-xs leading-relaxed transition-all ${
                description.trim().length >= 10 && !validateProfessionalText(description, 'Descrição', 30, 2500).valid
                  ? 'border-amber-400 dark:border-amber-500 bg-amber-50/15'
                  : description.trim().length >= 30 && validateProfessionalText(description, 'Descrição', 30, 2500).valid
                  ? 'border-green-400 dark:border-green-500 bg-green-50/10'
                  : ''
              }`}
              rows={6}
              placeholder="Descreva as atribuições diárias, requisitos obrigatórios, diferenciais e informações sobre a equipe..."
              required
            />

            {/* Feedback e Estatísticas da Descrição */}
            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
              <span>Mínimo 30 caracteres. Redija atribuições reais e profissionais.</span>
              <span className={description.length >= 30 ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                {description.length}/2500 caracteres
              </span>
            </div>

            {/* Alerta em tempo real de validação da descrição */}
            {description.trim().length >= 10 && (
              <div className={`mt-1.5 text-[11px] font-medium p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                validateProfessionalText(description, 'Descrição', 30, 2500).valid
                  ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800'
                  : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
              }`}>
                {validateProfessionalText(description, 'Descrição', 30, 2500).valid ? (
                  <>✓ Descrição com padrão, vocabulário e estrutura profissional aprovados</>
                ) : (
                  <>⚠️ {validateProfessionalText(description, 'Descrição', 30, 2500).error}</>
                )}
              </div>
            )}
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
