import React, { useState, useEffect } from 'react';
import {
  Briefcase, DollarSign, FileText, X, Check, ChevronLeft, ChevronRight,
  MapPin, Phone, Sparkles, Building2, RefreshCw, Globe, ShieldCheck,
  Clock, Award, CheckCircle2, AlertCircle, Eye, Wand2, ChevronDown
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import {
  addJob,
  CITIES,
  STANDARD_JOB_TITLES,
  STANDARD_WORKING_HOURS,
  validateJobTitle,
  validateSkill,
  validateBenefit,
  validateSalary,
  validateWorkingHours,
  validatePhoneNumber,
  validateJobDescription,
  validateResponsibility,
  getJobDescriptionTemplate
} from '../lib/ivaiConecta';
import SkillCombobox from './ui/SkillCombobox';
import JobTitleCombobox from './ui/JobTitleCombobox';
import BenefitCombobox from './ui/BenefitCombobox';

const SUGGESTED_SKILLS = [
  'Comunicação Assertiva', 'Trabalho em Equipe', 'Atendimento ao Cliente', 'Organização de Arquivos',
  'Técnicas de Vendas (B2C)', 'Pacote Office', 'Excel Avançado', 'Gestão de Tempo',
  'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'SQL / Bancos de Dados',
  'Figma', 'UI/UX Design', 'Marketing Digital', 'Gestão de Redes Sociais'
];

const SUGGESTED_BENEFITS = [
  'Vale Alimentação / Refeição',
  'Vale Transporte / Combustível',
  'Plano de Saúde',
  'Plano Odontológico',
  'Horário Flexível',
  'Auxílio Home Office',
  'Gympass / Auxílio Academia',
  'Bolsa de Estudos / Cursos',
  'Seguro de Vida',
  'Day Off no Aniversário'
];

// Limites máximos configurados
const LIMITS = {
  TITLE_MAX: 80,
  TITLE_MIN: 3,
  SALARY_MAX: 40,
  SALARY_NUMBER_MAX_DIGITS: 7,
  WORKING_HOURS_MAX: 80,
  PHONE_MAX: 15,
  SKILLS_MAX_COUNT: 12,
  SKILL_INPUT_MAX: 45,
  BENEFITS_MAX_COUNT: 10,
  BENEFIT_INPUT_MAX: 50,
  DESCRIPTION_MAX: 2000,
  DESCRIPTION_MIN: 30,
  RESPONSIBILITIES_MAX_COUNT: 8,
  RESPONSIBILITY_INPUT_MAX: 120
};

export default function PublishJobModal({ isOpen, onClose, onJobCreated }) {
  const { currentUser, showToast } = useAppStore();
  const [step, setStep] = useState(1);
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [respInput, setRespInput] = useState('');
  const [previewTab, setPreviewTab] = useState('card'); // 'card' | 'details'
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    title: '',
    type: 'Tempo Integral',
    modality: 'Presencial',
    city: (currentUser?.city && currentUser.city !== 'Todas as Cidades') ? currentUser.city : 'Ivaiporã',
    level: 'Júnior',
    salary: '',
    workingHours: STANDARD_WORKING_HOURS[0],
    recruiterPhone: currentUser?.phone || '',
    requiredSkills: [],
    benefits: [],
    description: '',
    responsibilities: []
  });

    useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isPublishing) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPublishing]);

  if (!isOpen) return null;

  // Formatação e máscara de telefone brasileiro
  const formatPhone = (val) => {
    const digits = String(val || '').replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleClose = () => {
    if (isPublishing) return;
    setStep(1);
    setFieldErrors({});
    setShowMobilePreview(false);
    onClose();
  };

  // Limpar erro de um campo específico ao digitar
  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  // Validação do Step 1 (Cargo, Carga Horária, Cidade e Telefone)
  const validateStep1 = () => {
    const errors = {};
    const titleClean = form.title.trim();

    if (!titleClean) {
      errors.title = 'Por favor, informe o cargo ou título da vaga.';
    } else {
      const titleVal = validateJobTitle(titleClean);
      if (!titleVal.valid) {
        errors.title = titleVal.error;
      }
    }

    const whVal = validateWorkingHours(form.workingHours);
    if (!whVal.valid) {
      errors.workingHours = whVal.error;
    }

    if (form.recruiterPhone && form.recruiterPhone.trim()) {
      const phoneVal = validatePhoneNumber(form.recruiterPhone, false);
      if (!phoneVal.valid) {
        errors.recruiterPhone = phoneVal.error;
      }
    }

    if (!form.city || form.city === 'Todas as Cidades') {
      errors.city = 'Por favor, selecione uma cidade polo válida do Vale do Ivaí.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validação do Step 2 (Competências, Remuneração e Benefícios)
  const validateStep2 = () => {
    const errors = {};
    let currentSkills = Array.isArray(form.requiredSkills) ? [...form.requiredSkills] : [];

    // Se o usuário digitou uma competência no input mas não clicou em adicionar, auto-adiciona se válida
    if (skillInput && skillInput.trim()) {
      const s = skillInput.trim();
      const sVal = validateSkill(s);
      if (sVal.valid && !currentSkills.some(item => item.toLowerCase() === s.toLowerCase())) {
        currentSkills.push(s);
        setForm(prev => ({ ...prev, requiredSkills: currentSkills }));
        setSkillInput('');
      }
    }

    if (currentSkills.length === 0) {
      errors.skills = 'Adicione ao menos 1 competência ou requisito profissional para a vaga.';
    } else {
      for (const skill of currentSkills) {
        const val = validateSkill(skill);
        if (!val.valid) {
          errors.skills = `A competência "${skill}" não é permitida: ${val.error}`;
          break;
        }
      }
    }

    const salVal = validateSalary(form.salary, true);
    if (!salVal.valid) {
      errors.salary = salVal.error;
    }

    if (Array.isArray(form.benefits) && form.benefits.length > 0) {
      for (const b of form.benefits) {
        const bVal = validateBenefit(b);
        if (!bVal.valid) {
          errors.benefits = `O benefício "${b}" é inválido: ${bVal.error}`;
          break;
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validação do Step 3 (Descrição Detalhada e Atividades)
  const validateStep3 = () => {
    const errors = {};
    const descClean = form.description.trim();
    if (!descClean) {
      errors.description = 'A descrição detalhada da vaga é obrigatória (mínimo 30 caracteres ou use o Modelo Padrão).';
    } else {
      const descVal = validateJobDescription(descClean);
      if (!descVal.valid) {
        errors.description = descVal.error;
      }
    }

    if (Array.isArray(form.responsibilities) && form.responsibilities.length > 0) {
      for (let i = 0; i < form.responsibilities.length; i++) {
        const r = form.responsibilities[i].trim();
        const rVal = validateResponsibility(r);
        if (!rVal.valid) {
          errors.responsibilities = `Atividade ${i + 1} inválida: ${rVal.error}`;
          break;
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      const isValid = validateStep1();
      if (!isValid) {
        const titleClean = form.title.trim();
        let errMsg = 'Por favor, confira os dados do cargo na Etapa 1.';
        if (!titleClean) errMsg = 'Por favor, informe o cargo ou título da vaga.';
        else if (!validateJobTitle(titleClean).valid) errMsg = validateJobTitle(titleClean).error;
        else if (!validateWorkingHours(form.workingHours).valid) errMsg = validateWorkingHours(form.workingHours).error;
        else if (!form.city || form.city === 'Todas as Cidades') errMsg = 'Por favor, selecione uma cidade polo válida do Vale do Ivaí.';
        else if (form.recruiterPhone && !validatePhoneNumber(form.recruiterPhone, false).valid) errMsg = validatePhoneNumber(form.recruiterPhone, false).error;
        showToast(`⚠️ ${errMsg}`);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const isValid = validateStep2();
      if (!isValid) {
        let errMsg = 'Por favor, confira a remuneração e competências antes de avançar.';
        const salVal = validateSalary(form.salary, true);
        if (!salVal.valid) errMsg = salVal.error;
        else if (!form.requiredSkills || form.requiredSkills.length === 0) errMsg = 'Adicione ao menos 1 competência para a vaga.';
        else if (form.benefits && form.benefits.length > 0) {
          for (const b of form.benefits) {
            const bVal = validateBenefit(b);
            if (!bVal.valid) { errMsg = bVal.error; break; }
          }
        }
        showToast(`⚠️ ${errMsg}`);
        return;
      }
      setStep(3);
    }
  };

  // Adicionar Habilidade com validação estrita
  const handleAddSkill = (skill) => {
    const s = (skill || skillInput).trim();
    if (!s) return;

    // Validação estrita contra catálogo e regras profissionais
    const val = validateSkill(s);
    if (!val.valid) {
      showToast(`⚠️ ${val.error}`);
      setFieldErrors(prev => ({ ...prev, skills: val.error }));
      return;
    }

    const current = Array.isArray(form.requiredSkills) ? form.requiredSkills : [];

    if (current.length >= LIMITS.SKILLS_MAX_COUNT) {
      showToast(`Limite máximo de ${LIMITS.SKILLS_MAX_COUNT} competências atingido.`);
      return;
    }

    if (current.some(item => item.toLowerCase() === s.toLowerCase())) {
      showToast('Esta competência já foi adicionada.');
      return;
    }

    setForm(prev => ({ ...prev, requiredSkills: [...current, s] }));
    setSkillInput('');
    clearFieldError('skills');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setForm(prev => ({
      ...prev,
      requiredSkills: (prev.requiredSkills || []).filter(s => s !== skillToRemove)
    }));
  };

  // Alternar Benefício com limites
  const _handleToggleBenefit = (benefitName) => {
    const current = Array.isArray(form.benefits) ? form.benefits : [];
    const exists = current.some(b => b.toLowerCase() === benefitName.toLowerCase());
    if (exists) {
      setForm(prev => ({ ...prev, benefits: current.filter(b => b.toLowerCase() !== benefitName.toLowerCase()) }));
    } else {
      if (current.length >= LIMITS.BENEFITS_MAX_COUNT) {
        showToast(`Limite máximo de ${LIMITS.BENEFITS_MAX_COUNT} benefícios atingido.`);
        return;
      }
      setForm(prev => ({ ...prev, benefits: [...current, benefitName] }));
    }
  };

  // Remover Benefício selecionado
  const handleRemoveBenefit = (bToRemove) => {
    setForm(prev => ({
      ...prev,
      benefits: (prev.benefits || []).filter(b => b.toLowerCase() !== bToRemove.toLowerCase())
    }));
  };

  // Adicionar Benefício com validação inteligente
  const handleAddCustomBenefit = (benefitToAdd) => {
    const b = (benefitToAdd || benefitInput || '').trim();
    if (!b) return;

    const current = Array.isArray(form.benefits) ? form.benefits : [];

    if (current.length >= LIMITS.BENEFITS_MAX_COUNT) {
      showToast(`Limite máximo de ${LIMITS.BENEFITS_MAX_COUNT} benefícios atingido.`);
      return;
    }

    const val = validateBenefit(b);
    if (!val.valid) {
      showToast(`⚠️ ${val.error}`);
      setFieldErrors(prev => ({ ...prev, benefits: val.error }));
      return;
    }

    if (current.some(item => item.toLowerCase() === b.toLowerCase())) {
      showToast('Este benefício já foi adicionado.');
      return;
    }

    setForm(prev => ({ ...prev, benefits: [...current, b] }));
    setBenefitInput('');
    clearFieldError('benefits');
    showToast(`✅ Benefício "${b}" adicionado.`);
  };

  // Adicionar Atividade / Responsabilidade com validação estrita
  const handleAddResponsibility = () => {
    const r = respInput.trim();
    if (!r) return;

    const current = Array.isArray(form.responsibilities) ? form.responsibilities : [];

    if (current.length >= LIMITS.RESPONSIBILITIES_MAX_COUNT) {
      showToast(`Limite máximo de ${LIMITS.RESPONSIBILITIES_MAX_COUNT} atividades atingido.`);
      return;
    }

    const val = validateResponsibility(r);
    if (!val.valid) {
      showToast(`⚠️ ${val.error}`);
      setFieldErrors(prev => ({ ...prev, responsibilities: val.error }));
      return;
    }

    if (current.some(item => item.toLowerCase() === r.toLowerCase())) {
      showToast('Esta atividade já foi adicionada.');
      return;
    }

    setForm(prev => ({
      ...prev,
      responsibilities: [...current, r]
    }));
    setRespInput('');
    clearFieldError('responsibilities');
    showToast('✅ Atividade adicionada à vaga.');
  };

  const handleRemoveResponsibility = (index) => {
    setForm(prev => ({
      ...prev,
      responsibilities: (prev.responsibilities || []).filter((_, idx) => idx !== index)
    }));
  };

  // Inserir Template Profissional Automático
  const handleApplyTemplate = () => {
    const companyName = currentUser?.company || currentUser?.razaoSocial || currentUser?.nomeFantasia || currentUser?.name || 'Nossa Empresa';
    const template = getJobDescriptionTemplate(form.title || 'Oportunidade Profissional', companyName);
    setForm(prev => ({ ...prev, description: template }));
    clearFieldError('description');
    showToast('✨ Modelo estruturado de descrição inserido com sucesso!');
  };

  // Publicação completa da vaga (validação rigorosa de todos os campos)
  const handlePublish = async (e) => {
    if (e) e.preventDefault();
    if (isPublishing) return;

    if (!currentUser) {
      showToast('⚠️ Você precisa estar logado com uma conta de Empresa para publicar vagas.');
      return;
    }
    const userRole = String(currentUser?.role || '').toLowerCase().trim();
    if (userRole !== 'empresa' && userRole !== 'company' && userRole !== 'recrutador') {
      showToast('⚠️ Apenas contas com perfil de Empresa / Recrutador podem publicar vagas.');
      return;
    }

    if (!validateStep1()) {
      setStep(1);
      const titleClean = form.title.trim();
      let errMsg = 'Por favor, corrija os dados da Etapa 1.';
      if (!titleClean) errMsg = 'Por favor, informe o cargo ou título da vaga.';
      else if (!validateJobTitle(titleClean).valid) errMsg = validateJobTitle(titleClean).error;
      else if (!form.city || form.city === 'Todas as Cidades') errMsg = 'Por favor, selecione uma cidade polo válida do Vale do Ivaí.';
      else if (form.recruiterPhone && !validatePhoneNumber(form.recruiterPhone, false).valid) errMsg = validatePhoneNumber(form.recruiterPhone, false).error;
      showToast(`⚠️ ${errMsg}`);
      return;
    }

    if (!validateStep2()) {
      setStep(2);
      let errMsg = 'Por favor, confira a remuneração e competências da Etapa 2.';
      const salVal = validateSalary(form.salary, true);
      if (!salVal.valid) errMsg = salVal.error;
      else if (!form.requiredSkills || form.requiredSkills.length === 0) errMsg = 'Adicione ao menos 1 competência profissional para a vaga.';
      else if (form.benefits && form.benefits.length > 0) {
        for (const b of form.benefits) {
          const bVal = validateBenefit(b);
          if (!bVal.valid) { errMsg = bVal.error; break; }
        }
      }
      showToast(`⚠️ ${errMsg}`);
      return;
    }

    if (!validateStep3()) {
      setStep(3);
      const descClean = form.description.trim();
      let errMsg = 'Por favor, elabore a descrição da vaga na Etapa 3 (mínimo 30 caracteres ou use o Modelo Padrão).';
      const dVal = validateJobDescription(descClean);
      if (!dVal.valid) {
        errMsg = dVal.error;
      } else if (form.responsibilities && form.responsibilities.length > 0) {
        for (let i = 0; i < form.responsibilities.length; i++) {
          const rVal = validateResponsibility(form.responsibilities[i]);
          if (!rVal.valid) {
            errMsg = `Atividade ${i + 1}: ${rVal.error}`;
            break;
          }
        }
      }
      showToast(`⚠️ ${errMsg}`);
      return;
    }

    const skillsArray = Array.isArray(form.requiredSkills)
      ? form.requiredSkills.filter(s => s && s.trim())
      : [];

    const benefitsArray = Array.isArray(form.benefits)
      ? form.benefits.filter(b => b && b.trim())
      : [];

    const responsibilitiesArray = Array.isArray(form.responsibilities)
      ? form.responsibilities.filter(r => r && r.trim())
      : [];

    setIsPublishing(true);
    let created = null;

    try {
      const companyName = currentUser?.company || currentUser?.razaoSocial || currentUser?.nomeFantasia || currentUser?.name || 'Empresa Regional';
      const companyLogo = currentUser?.avatar || currentUser?.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=250';
      const userUid = currentUser?.uid || currentUser?.id || currentUser?.email || 'empresa';

      created = await addJob({
        title: form.title.trim(),
        company: companyName,
        companyLogo: companyLogo,
        type: form.type || 'Tempo Integral',
        modality: form.modality || 'Presencial',
        city: form.city || currentUser?.city || 'Ivaiporã',
        level: form.level || 'Júnior',
        salary: form.salary?.trim() || 'A Combinar',
        workingHours: form.workingHours?.trim() || STANDARD_WORKING_HOURS[0],
        recruiterPhone: form.recruiterPhone?.trim() || currentUser?.phone || '',
        recruiterEmail: currentUser?.email || '',
        requiredSkills: skillsArray,
        benefits: benefitsArray,
        description: form.description.trim(),
        responsibilities: responsibilitiesArray,
        createdBy: userUid,
        companyUid: userUid,
        isVerifiedCompany: true
      });

      showToast('🎉 Nova vaga publicada com sucesso no Mural Regional!');
    } catch (err) {
      console.error('[PublishJobModal] Erro ao salvar vaga:', err);
      showToast(err?.message || 'Ocorreu um erro ao salvar a vaga.');
      setIsPublishing(false);
      return;
    }

    try {
      if (onJobCreated && typeof onJobCreated === 'function') {
        onJobCreated(created);
      }
    } catch (callbackErr) {
      console.warn('[PublishJobModal] Aviso no callback onJobCreated:', callbackErr);
    }

    setIsPublishing(false);

    try {
      setStep(1);
      setFieldErrors({});
      setForm({
        title: '',
        type: 'Tempo Integral',
        modality: 'Presencial',
        city: currentUser?.city || 'Ivaiporã',
        level: 'Júnior',
        salary: '',
        workingHours: STANDARD_WORKING_HOURS[0],
        recruiterPhone: currentUser?.phone || '',
        requiredSkills: [],
        benefits: [],
        description: '',
        responsibilities: []
      });
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    } catch (closeErr) {
      console.warn('[PublishJobModal] Aviso ao fechar modal:', closeErr);
    }
  };

  // Publicação Rápida Direta (preenche automaticamente requisitos e template profissional)
  const handleQuickPublish = async (e) => {
    if (e) e.preventDefault();
    if (isPublishing) return;

    if (!currentUser) {
      showToast('⚠️ Você precisa estar logado com uma conta de Empresa para publicar vagas.');
      return;
    }
    const userRole = String(currentUser?.role || '').toLowerCase().trim();
    if (userRole !== 'empresa' && userRole !== 'company' && userRole !== 'recrutador') {
      showToast('⚠️ Apenas contas com perfil de Empresa / Recrutador podem publicar vagas.');
      return;
    }

    if (!validateStep1()) {
      setStep(1);
      const titleClean = form.title.trim();
      let errMsg = 'Por favor, informe o cargo profissional na Etapa 1.';
      if (!titleClean) errMsg = 'Por favor, informe o cargo ou título da vaga.';
      else if (!validateJobTitle(titleClean).valid) errMsg = validateJobTitle(titleClean).error;
      else if (!form.city || form.city === 'Todas as Cidades') errMsg = 'Por favor, selecione uma cidade polo válida do Vale do Ivaí.';
      showToast(`⚠️ ${errMsg}`);
      return;
    }

    if (form.salary && form.salary.trim()) {
      const salVal = validateSalary(form.salary, false);
      if (!salVal.valid) {
        setStep(2);
        setFieldErrors(prev => ({ ...prev, salary: salVal.error }));
        showToast(`⚠️ Remuneração inválida: ${salVal.error}`);
        return;
      }
    }

    if (Array.isArray(form.requiredSkills) && form.requiredSkills.length > 0) {
      for (const skill of form.requiredSkills) {
        const skVal = validateSkill(skill);
        if (!skVal.valid) {
          setStep(2);
          setFieldErrors(prev => ({ ...prev, skills: `A competência "${skill}" não é permitida: ${skVal.error}` }));
          showToast(`⚠️ Competência inválida: ${skVal.error}`);
          return;
        }
      }
    }

    if (Array.isArray(form.benefits) && form.benefits.length > 0) {
      for (const b of form.benefits) {
        const bVal = validateBenefit(b);
        if (!bVal.valid) {
          setStep(2);
          setFieldErrors(prev => ({ ...prev, benefits: `O benefício "${b}" não é permitido: ${bVal.error}` }));
          showToast(`⚠️ Benefício inválido: ${bVal.error}`);
          return;
        }
      }
    }

    if (form.description && form.description.trim()) {
      const descVal = validateJobDescription(form.description.trim());
      if (!descVal.valid) {
        setStep(3);
        setFieldErrors(prev => ({ ...prev, description: descVal.error }));
        showToast(`⚠️ Descrição inválida: ${descVal.error}`);
        return;
      }
    }

    if (Array.isArray(form.responsibilities) && form.responsibilities.length > 0) {
      for (const r of form.responsibilities) {
        const rVal = validateResponsibility(r);
        if (!rVal.valid) {
          setStep(3);
          setFieldErrors(prev => ({ ...prev, responsibilities: `A atividade "${r}" não é válida: ${rVal.error}` }));
          showToast(`⚠️ Atividade inválida: ${rVal.error}`);
          return;
        }
      }
    }

    const companyName = currentUser?.company || currentUser?.razaoSocial || currentUser?.nomeFantasia || currentUser?.name || 'Nossa Empresa';
    const finalSalary = form.salary && form.salary.trim() ? form.salary.trim() : 'A Combinar';
    const finalSkills = Array.isArray(form.requiredSkills) && form.requiredSkills.length > 0
      ? form.requiredSkills
      : ['Comunicação Assertiva', 'Trabalho em Equipe', 'Proatividade & Iniciativa'];
    const finalDesc = form.description && form.description.trim().length >= LIMITS.DESCRIPTION_MIN
      ? form.description.trim()
      : getJobDescriptionTemplate(form.title || 'Oportunidade Profissional', companyName);

    setIsPublishing(true);
    let created = null;

    try {
      const companyLogo = currentUser?.avatar || currentUser?.logo || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=250';
      const userUid = currentUser?.uid || currentUser?.id || currentUser?.email || 'empresa';

      created = await addJob({
        title: form.title.trim(),
        company: companyName,
        companyLogo: companyLogo,
        type: form.type || 'Tempo Integral',
        modality: form.modality || 'Presencial',
        city: form.city || currentUser?.city || 'Ivaiporã',
        level: form.level || 'Júnior',
        salary: finalSalary,
        workingHours: form.workingHours?.trim() || STANDARD_WORKING_HOURS[0],
        recruiterPhone: form.recruiterPhone?.trim() || currentUser?.phone || '',
        recruiterEmail: currentUser?.email || '',
        requiredSkills: finalSkills,
        benefits: form.benefits || [],
        description: finalDesc,
        responsibilities: form.responsibilities || [],
        createdBy: userUid,
        companyUid: userUid,
        isVerifiedCompany: true
      });

      showToast('🎉 Nova vaga publicada com sucesso no Mural Regional!');
    } catch (err) {
      console.error('[PublishJobModal] Erro ao salvar vaga rápida:', err);
      showToast(err?.message || 'Ocorreu um erro ao salvar a vaga.');
      setIsPublishing(false);
      return;
    }

    try {
      if (onJobCreated && typeof onJobCreated === 'function') {
        onJobCreated(created);
      }
    } catch (callbackErr) {
      console.warn('[PublishJobModal] Aviso no callback onJobCreated:', callbackErr);
    }

    setIsPublishing(false);

    try {
      setStep(1);
      setFieldErrors({});
      setForm({
        title: '',
        type: 'Tempo Integral',
        modality: 'Presencial',
        city: currentUser?.city || 'Ivaiporã',
        level: 'Júnior',
        salary: '',
        workingHours: STANDARD_WORKING_HOURS[0],
        recruiterPhone: currentUser?.phone || '',
        requiredSkills: [],
        benefits: [],
        description: '',
        responsibilities: []
      });
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    } catch (closeErr) {
      console.warn('[PublishJobModal] Aviso ao fechar modal:', closeErr);
    }
  };

  const stepsList = [
    { num: 1, title: 'Dados da Vaga', subtitle: 'Cargo e modelo', icon: Briefcase },
    { num: 2, title: 'Requisitos & Salário', subtitle: 'Skills e benefícios', icon: DollarSign },
    { num: 3, title: 'Descrição & Atividades', subtitle: 'Texto e detalhes', icon: FileText }
  ];

  // Componente de Prévia em Tempo Real Renderizado Dinamicamente
  const renderLivePreview = () => {
    const companyName = currentUser?.name || currentUser?.company || 'Minha Empresa';
    const companyLogo = currentUser?.avatar || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150';
    const displayTitle = form.title.trim() || 'Título do Cargo / Função';
    const rawSal = (form.salary || '').trim();
    const displaySalary = rawSal === 'A Combinar'
      ? 'A Combinar'
      : rawSal
      ? (rawSal.startsWith('R$') ? rawSal : `R$ ${rawSal}`)
      : 'A Combinar';
    const displayCity = form.city || 'Ivaiporã';

    return (
      <div className="space-y-3">
        {/* Switcher de Formato de Prévia */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
              Ao Vivo no Mural
            </span>
          </div>

          <div className="bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg flex items-center text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setPreviewTab('card')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                previewTab === 'card'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              Card Mural
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab('details')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                previewTab === 'details'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              Visão Completa
            </button>
          </div>
        </div>

        {/* ── PREVIEW TAB: CARD DO MURAL (IDÊNTICO AO JOBCARD OFICIAL) ── */}
        {previewTab === 'card' ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Header do Card */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800"
                />
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">
                    {companyName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      <ShieldCheck size={12} className="shrink-0" />
                      CNPJ Validado · Vaga Verificada
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 max-w-[45%]">
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-1 rounded-full truncate block max-w-full" title={displaySalary}>
                  {displaySalary}
                </span>
              </div>
            </div>

            {/* Cargo */}
            <h4 className={`text-base font-extrabold leading-snug transition-colors line-clamp-2 ${
              form.title ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500 italic font-medium'
            }`}>
              {displayTitle}
            </h4>

            {/* Metadados: Local, Modalidade e Regime */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-primary-blue dark:text-blue-400">
                <MapPin size={12} className="shrink-0" />
                {displayCity}
              </span>
              <span className="text-gray-300 dark:text-slate-600">·</span>
              <span className="font-semibold text-gray-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                {form.modality}
              </span>
              <span className="text-gray-300 dark:text-slate-600">·</span>
              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                {form.type}
              </span>
            </div>

            {/* Benefícios */}
            {form.benefits.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {form.benefits.slice(0, 2).map((b, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1"
                  >
                    <Check size={10} strokeWidth={3} /> {b}
                  </span>
                ))}
                {form.benefits.length > 2 && (
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 self-center">
                    +{form.benefits.length - 2} benefícios
                  </span>
                )}
              </div>
            )}

            {/* Requisitos / Skills */}
            {form.requiredSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1 items-center">
                {form.requiredSkills.slice(0, 3).map(skill => (
                  <span
                    key={skill}
                    className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md truncate max-w-[130px]"
                  >
                    {skill}
                  </span>
                ))}
                {form.requiredSkills.length > 3 && (
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold self-center">
                    +{form.requiredSkills.length - 3} requisitos
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-gray-400 dark:text-slate-500 italic py-0.5">
                Nenhuma competência selecionada ainda
              </div>
            )}

            {/* CTA do Card */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
              <div className="w-full py-2 bg-primary-blue text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs opacity-90 cursor-default">
                <Eye size={13} /> Candidatar-se à Vaga (Exemplo)
              </div>
            </div>
          </div>
        ) : (
          /* ── PREVIEW TAB: DETALHES COMPLETOS DA VAGA ── */
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm space-y-3.5 text-xs overflow-hidden">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-blue dark:text-blue-400">
                Sobre a Oportunidade
              </span>
              <p className={`mt-1 leading-relaxed text-xs whitespace-pre-line break-words [overflow-wrap:anywhere] ${
                form.description ? 'text-gray-700 dark:text-slate-300' : 'text-gray-400 italic'
              }`}>
                {form.description || 'A descrição detalhada da oportunidade aparecerá aqui conforme você preenche o campo...'}
              </p>
            </div>

            {form.responsibilities.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 block mb-1.5">
                  Atividades & Responsabilidades ({form.responsibilities.length})
                </span>
                <ul className="space-y-1">
                  {form.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-gray-700 dark:text-slate-300 break-words [overflow-wrap:anywhere]">
                      <span className="text-primary-blue font-bold shrink-0">•</span>
                      <span className="min-w-0 flex-1">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {form.workingHours && (
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
                <Clock size={13} className="text-primary-blue shrink-0" />
                <span className="font-semibold text-gray-800 dark:text-slate-200">Horário:</span> {form.workingHours}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto custom-scrollbar">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* ── HEADER MODERNO & ORGANIZADO ── */}
        <div className="px-6 py-4.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary-blue/10 dark:bg-primary-blue/20 text-primary-blue dark:text-blue-400 flex items-center justify-center shrink-0 border border-primary-blue/20 shadow-xs">
              <Briefcase size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-blue dark:text-blue-400">
                  Painel de Recrutamento
                </span>
                <span className="text-gray-300 dark:text-slate-600">·</span>
                <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                  Etapa {step} de 3
                </span>
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                Publicar Nova Oportunidade
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão para alternar prévia em telas menores */}
            <button
              type="button"
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className={`lg:hidden px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showMobilePreview
                  ? 'bg-primary-blue text-white border-primary-blue'
                  : 'bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
              }`}
            >
              <Eye size={13} />
              <span>{showMobilePreview ? 'Ocultar Prévia' : 'Ver Prévia'}</span>
            </button>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── STEPPER BAR MINIMALISTA & FLUIDO ── */}
        <div className="px-6 py-2.5 bg-gray-50/80 dark:bg-slate-900/90 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {stepsList.map(s => {
              const isCurrent = step === s.num;
              const isDone = step > s.num;

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num === 2 && !validateStep1()) {
                      showToast('Preencha o cargo corretamente antes de ir para a etapa 2.');
                      return;
                    }
                    if (s.num === 3) {
                      if (!validateStep1() || !validateStep2()) {
                        showToast('Complete os requisitos anteriores antes de avançar.');
                        return;
                      }
                    }
                    setStep(s.num);
                  }}
                  className={`py-2 px-3 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-2.5 border ${
                    isCurrent
                      ? 'bg-white dark:bg-slate-800 border-primary-blue dark:border-blue-500 shadow-sm'
                      : isDone
                      ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/40 text-primary-blue dark:text-blue-400'
                      : 'bg-transparent border-transparent text-gray-400 dark:text-slate-500 hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-primary-blue text-white shadow-xs'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                  }`}>
                    {isDone ? <Check size={12} strokeWidth={3} /> : s.num}
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <p className={`text-xs font-bold leading-tight truncate ${
                      isCurrent ? 'text-gray-900 dark:text-white' : isDone ? 'text-primary-blue dark:text-blue-300' : 'text-gray-500 dark:text-slate-400'
                    }`}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                      {s.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MODAL BODY: SPLIT VIEW COM FORMULÁRIO (ESQ) E PRÉVIA EM TEMPO REAL (DIR) ── */}
        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUNA ESQUERDA: FORMULÁRIO WIZARD (7 COLUNAS EM TELAS GRANDES) */}
            <div className={`lg:col-span-7 space-y-6 ${showMobilePreview ? 'hidden lg:block' : 'block'}`}>
              
              {/* ═════════════════════════════════════════════════════════════
                  STEP 1: CARGO, MODALIDADE, REGIME E LOCALIZAÇÃO
              ═════════════════════════════════════════════════════════════ */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  
                  {/* Título do Cargo */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Título do Cargo / Função <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-[10px] font-semibold ${
                        form.title.length > LIMITS.TITLE_MAX ? 'text-red-500 font-bold' : 'text-gray-400'
                      }`}>
                        {form.title.length}/{LIMITS.TITLE_MAX} caracteres
                      </span>
                    </div>
                    <JobTitleCombobox
                      value={form.title}
                      onChange={val => {
                        setForm(prev => ({ ...prev, title: val }));
                        clearFieldError('title');
                      }}
                      onBlur={() => {
                        const titleClean = form.title.trim();
                        if (!titleClean) {
                          setFieldErrors(prev => ({ ...prev, title: 'Por favor, informe o cargo ou título da vaga.' }));
                        } else {
                          const titleVal = validateJobTitle(titleClean);
                          if (!titleVal.valid) {
                            setFieldErrors(prev => ({ ...prev, title: titleVal.error }));
                          }
                        }
                      }}
                      error={fieldErrors.title}
                      placeholder="Ex: Assistente Administrativo, Vendedor Comercial, Desenvolvedor React..."
                      required
                    />
                    {fieldErrors.title && (
                      <p className="mt-1.5 text-xs text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={13} className="shrink-0" />
                        {fieldErrors.title}
                      </p>
                    )}
                    {!fieldErrors.title && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sugestões rápidas:</span>
                        {STANDARD_JOB_TITLES.slice(0, 4).map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setForm(prev => ({ ...prev, title: st }));
                              clearFieldError('title');
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:text-primary-blue hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                          >
                            + {st}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tipo de Contrato & Modalidade */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Modalidade */}
                    <div>
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                        Modalidade de Trabalho
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'Presencial', label: 'Presencial', icon: Building2 },
                          { id: 'Híbrido', label: 'Híbrido', icon: RefreshCw },
                          { id: 'Remoto', label: '100% Remoto', icon: Globe }
                        ].map(mod => {
                          const Icon = mod.icon;
                          const isSelected = form.modality === mod.id;
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => setForm({ ...form, modality: mod.id })}
                              className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                isSelected
                                  ? 'bg-primary-blue text-white border-primary-blue shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300'
                              }`}
                            >
                              <Icon size={14} className={isSelected ? 'text-white' : 'text-primary-blue'} />
                              <span className="text-[11px] truncate">{mod.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tipo de Contrato */}
                    <div>
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                        Regime de Contratação
                      </label>
                      <div className="relative">
                        <select
                          value={form.type}
                          onChange={e => setForm({ ...form, type: e.target.value })}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                        >
                          <option value="Tempo Integral">CLT (Tempo Integral)</option>
                          <option value="Estágio">Estágio Remunerado</option>
                          <option value="Prestador de Serviço">PJ / Prestador de Serviços</option>
                          <option value="Jovem Aprendiz">Jovem Aprendiz</option>
                          <option value="Meio Período">Meio Período</option>
                          <option value="Temporário">Temporário</option>
                        </select>
                        <Award size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Cidade & Horário */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200 block mb-1.5">
                        Cidade Polo (Vale do Ivaí)
                      </label>
                      <div className="relative">
                        <select
                          value={form.city}
                          onChange={e => setForm({ ...form, city: e.target.value })}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                        >
                          {CITIES.filter(c => c !== 'Todas as Cidades').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <MapPin size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                          Carga Horária & Jornada <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <div className="relative">
                        <select
                          value={form.workingHours}
                          onChange={e => {
                            setForm(prev => ({ ...prev, workingHours: e.target.value }));
                            clearFieldError('workingHours');
                          }}
                          className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer focus:border-primary-blue"
                        >
                          {STANDARD_WORKING_HOURS.map(wh => (
                            <option key={wh} value={wh}>{wh}</option>
                          ))}
                        </select>
                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {fieldErrors.workingHours && (
                        <p className="mt-1 text-xs text-red-500 font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.workingHours}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Telefone para Contato */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Telefone Comercial / WhatsApp <span className="text-gray-400 font-normal">(Opcional)</span>
                      </label>
                      <span className="text-[10px] text-gray-400">
                        {form.recruiterPhone.length}/{LIMITS.PHONE_MAX}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={LIMITS.PHONE_MAX}
                        placeholder="(43) 99999-9999"
                        value={form.recruiterPhone}
                        onChange={e => {
                          const formatted = formatPhone(e.target.value);
                          setForm({ ...form, recruiterPhone: formatted });
                          clearFieldError('recruiterPhone');
                        }}
                        onBlur={() => {
                          if (form.recruiterPhone && form.recruiterPhone.trim()) {
                            const phoneVal = validatePhoneNumber(form.recruiterPhone, false);
                            if (!phoneVal.valid) {
                              setFieldErrors(prev => ({ ...prev, recruiterPhone: phoneVal.error }));
                            }
                          }
                        }}
                        className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none ${
                          fieldErrors.recruiterPhone
                            ? 'border-red-400 bg-red-50/20'
                            : 'border-gray-200 dark:border-slate-700 focus:border-primary-blue'
                        }`}
                      />
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-blue pointer-events-none" />
                    </div>
                    {fieldErrors.recruiterPhone && (
                      <p className="mt-1 text-xs text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.recruiterPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════════
                  STEP 2: REMUNERAÇÃO, HABILIDADES E BENEFÍCIOS
              ═════════════════════════════════════════════════════════════ */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Remuneração */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Remuneração / Salário (Formato: 2500,00) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">
                          (Somente números · Ex: 2500,00)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                      <div className="relative flex-1">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                          <DollarSign size={15} className="text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-extrabold text-gray-500 dark:text-slate-400">R$</span>
                        </div>
                        <input
                          type="text"
                          maxLength={12}
                          disabled={form.salary === 'A Combinar'}
                          placeholder={form.salary === 'A Combinar' ? 'Salário definido como "A Combinar"' : '2500,00'}
                          value={form.salary === 'A Combinar' ? '' : form.salary}
                          onChange={e => {
                            let val = e.target.value;
                            // Permite estritamente dígitos e vírgula
                            val = val.replace(/[^\d,]/g, '');
                            // Permite apenas uma vírgula
                            const parts = val.split(',');
                            if (parts.length > 2) {
                              val = parts[0] + ',' + parts.slice(1).join('');
                            }
                            // Formato máximo: 6 dígitos inteiros e 2 decimais (ex: 2500,00)
                            if (val.includes(',')) {
                              const [intPart, decPart] = val.split(',');
                              val = intPart.slice(0, 6) + ',' + (decPart ? decPart.slice(0, 2) : '');
                            } else {
                              val = val.slice(0, 6);
                            }
                            setForm(prev => ({ ...prev, salary: val }));
                            clearFieldError('salary');
                          }}
                          onBlur={() => {
                            if (!form.salary.trim()) {
                              setFieldErrors(prev => ({ ...prev, salary: 'Informe o valor no formato 2500,00 ou selecione "A Combinar".' }));
                              return;
                            }
                            if (form.salary === 'A Combinar') return;

                            let normalized = form.salary.trim();
                            // Se o usuário digitou apenas números (ex: 2500), auto-completa com ,00
                            if (!normalized.includes(',')) {
                              normalized = normalized + ',00';
                            } else {
                              const [intPart, decPart = ''] = normalized.split(',');
                              if (decPart.length === 0) normalized = intPart + ',00';
                              else if (decPart.length === 1) normalized = intPart + ',' + decPart + '0';
                            }

                            setForm(prev => ({ ...prev, salary: normalized }));
                            const salVal = validateSalary(normalized, true);
                            if (!salVal.valid) {
                              setFieldErrors(prev => ({ ...prev, salary: salVal.error }));
                            } else {
                              clearFieldError('salary');
                            }
                          }}
                          className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-2xl pl-13 pr-4 py-2.5 text-sm font-bold outline-none text-gray-900 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                            fieldErrors.salary
                              ? 'border-red-400 dark:border-red-500/80 bg-red-50/20'
                              : 'border-gray-200 dark:border-slate-700 focus:border-primary-blue'
                          }`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (form.salary === 'A Combinar') {
                            setForm(prev => ({ ...prev, salary: '' }));
                          } else {
                            setForm(prev => ({ ...prev, salary: 'A Combinar' }));
                            clearFieldError('salary');
                          }
                        }}
                        className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 select-none ${
                          form.salary === 'A Combinar'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-brand-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600'
                        }`}
                      >
                        <CheckCircle2 size={15} className={form.salary === 'A Combinar' ? 'text-white' : 'text-gray-400'} />
                        <span>A Combinar</span>
                      </button>
                    </div>

                    {fieldErrors.salary && (
                      <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.salary}
                      </p>
                    )}
                  </div>

                  {/* Habilidades & Competências */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Competências & Requisitos Desejados ({form.requiredSkills.length}/{LIMITS.SKILLS_MAX_COUNT}) <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-gray-400">Pressione Enter ou clique em Adicionar</span>
                    </div>

                    <SkillCombobox
                      skillsList={form.requiredSkills}
                      onAddSkill={handleAddSkill}
                      error={fieldErrors.skills}
                      placeholder="Pesquise uma competência no catálogo (ex: Atendimento ao Cliente, Excel, React)..."
                    />

                    {fieldErrors.skills && (
                      <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.skills}
                      </p>
                    )}

                    {/* Chips Ativos */}
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 min-h-[48px] items-center">
                      {form.requiredSkills.length === 0 ? (
                        <span className="text-gray-400 text-xs italic">
                          Nenhuma competência adicionada ainda (adicione ao menos 1).
                        </span>
                      ) : (
                        form.requiredSkills.map(skill => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-primary-blue dark:text-blue-200 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="text-blue-400 hover:text-red-500 cursor-pointer"
                              title="Remover"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Sugestões Populares */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sugestões rápidas:</span>
                      <div className="flex flex-wrap gap-1">
                        {SUGGESTED_SKILLS.map(skill => {
                          const isAdded = form.requiredSkills.some(s => s.toLowerCase() === skill.toLowerCase());
                          if (isAdded) return null;
                          const isMax = form.requiredSkills.length >= LIMITS.SKILLS_MAX_COUNT;
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => handleAddSkill(skill)}
                              disabled={isMax}
                              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors border ${
                                isMax
                                  ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-gray-400 border-transparent'
                                  : 'bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-primary-blue dark:hover:text-blue-300 border-transparent hover:border-blue-200 cursor-pointer'
                              }`}
                            >
                              + {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Benefícios */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Benefícios & Vantagens Corporativas ({form.benefits.length}/{LIMITS.BENEFITS_MAX_COUNT})
                      </label>
                      <span className="text-[10px] text-gray-400">Busque no catálogo ou selecione sugestões</span>
                    </div>

                    {/* Caixa de Pesquisa e Seleção Inteligente de Benefícios com Catálogo Oficial */}
                    <BenefitCombobox
                      benefitsList={form.benefits}
                      onAddBenefit={handleAddCustomBenefit}
                      error={fieldErrors.benefits}
                      placeholder="Pesquise uma vantagem no catálogo ou adicione (ex: Gympass, Auxílio Creche, Vale Combustível)..."
                    />

                    {fieldErrors.benefits && (
                      <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.benefits}
                      </p>
                    )}

                    {/* Chips Ativos de Benefícios Selecionados com Botão de Remoção */}
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 min-h-[48px] items-center">
                      {form.benefits.length === 0 ? (
                        <span className="text-gray-400 text-xs italic">
                          Nenhum benefício selecionado ainda (opcional).
                        </span>
                      ) : (
                        form.benefits.map(b => (
                          <span
                            key={b}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800"
                          >
                            <Check size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{b}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveBenefit(b)}
                              className="text-emerald-600 dark:text-emerald-400 hover:text-red-500 cursor-pointer p-0.5 transition-colors"
                              title={`Remover "${b}"`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Sugestões Rápidas Populares */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sugestões rápidas:</span>
                      <div className="flex flex-wrap gap-1">
                        {SUGGESTED_BENEFITS.map(b => {
                          const isChecked = form.benefits.some(item => item.toLowerCase() === b.toLowerCase());
                          if (isChecked) return null;
                          const isMax = form.benefits.length >= LIMITS.BENEFITS_MAX_COUNT;
                          return (
                            <button
                              key={b}
                              type="button"
                              onClick={() => handleAddCustomBenefit(b)}
                              disabled={isMax}
                              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors border ${
                                isMax
                                  ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-gray-400 border-transparent'
                                  : 'bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 border-transparent hover:border-emerald-200 cursor-pointer'
                              }`}
                            >
                              + {b}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════════
                  STEP 3: DESCRIÇÃO E ATIVIDADES
              ═════════════════════════════════════════════════════════════ */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Descrição com Contador e Template Helper */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Descrição da Vaga & Contexto da Empresa
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleApplyTemplate}
                          className="text-[10px] font-bold text-primary-blue dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                          title="Inserir modelo padrão estruturado"
                        >
                          <Wand2 size={11} /> Usar Modelo Padrão
                        </button>
                        <span className={`text-[10px] font-semibold ${
                          form.description.length > 0 && form.description.length < LIMITS.DESCRIPTION_MIN
                            ? 'text-amber-500 font-bold'
                            : form.description.length > LIMITS.DESCRIPTION_MAX
                            ? 'text-red-500 font-bold'
                            : 'text-gray-400'
                        }`}>
                          {form.description.length}/{LIMITS.DESCRIPTION_MAX} (mín. {LIMITS.DESCRIPTION_MIN})
                        </span>
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      maxLength={LIMITS.DESCRIPTION_MAX}
                      placeholder="Descreva o objetivo da contratação, o ambiente de trabalho e o que a empresa espera do candidato..."
                      value={form.description}
                      onChange={e => {
                        setForm({ ...form, description: e.target.value });
                        clearFieldError('description');
                      }}
                      onBlur={() => {
                        const descClean = form.description.trim();
                        if (!descClean) {
                          setFieldErrors(prev => ({ ...prev, description: 'A descrição detalhada da vaga é obrigatória (mínimo 30 caracteres ou use o Modelo Padrão).' }));
                        } else {
                          const descVal = validateJobDescription(descClean);
                          if (!descVal.valid) {
                            setFieldErrors(prev => ({ ...prev, description: descVal.error }));
                          } else {
                            clearFieldError('description');
                          }
                        }
                      }}
                      className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-2xl p-3.5 text-xs leading-relaxed outline-none text-gray-900 dark:text-white placeholder:text-gray-400 ${
                        fieldErrors.description
                          ? 'border-red-400 bg-red-50/20'
                          : 'border-gray-200 dark:border-slate-700 focus:border-primary-blue'
                      }`}
                    />
                    {fieldErrors.description && (
                      <p className="mt-1 text-xs text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.description}
                      </p>
                    )}
                  </div>

                  {/* Atividades & Responsabilidades */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Principais Atividades & Responsabilidades ({form.responsibilities.length}/{LIMITS.RESPONSIBILITIES_MAX_COUNT})
                      </label>
                      <span className="text-[10px] text-gray-400">Até {LIMITS.RESPONSIBILITIES_MAX_COUNT} tópicos</span>
                    </div>

                    {form.responsibilities.length > 0 && (
                      <div className="space-y-1.5">
                        {form.responsibilities.map((resp, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs w-full overflow-hidden">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-primary-blue dark:text-blue-300 text-[10px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="flex-1 min-w-0 text-gray-800 dark:text-slate-200 font-medium break-words [overflow-wrap:anywhere] leading-snug">
                              {resp}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveResponsibility(idx)}
                              className="text-gray-400 hover:text-red-500 cursor-pointer p-1 shrink-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Remover atividade"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="text"
                          maxLength={LIMITS.RESPONSIBILITY_INPUT_MAX}
                          placeholder="Adicione uma atividade (ex: Atendimento a clientes, Elaboração de relatórios)..."
                          value={respInput}
                          onChange={e => setRespInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddResponsibility();
                            }
                          }}
                          disabled={form.responsibilities.length >= LIMITS.RESPONSIBILITIES_MAX_COUNT}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-3.5 pr-14 py-2 text-xs outline-none focus:border-primary-blue text-gray-900 dark:text-white disabled:opacity-50"
                        />
                        {respInput.length > 0 && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                            {respInput.length}/{LIMITS.RESPONSIBILITY_INPUT_MAX}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddResponsibility}
                        disabled={form.responsibilities.length >= LIMITS.RESPONSIBILITIES_MAX_COUNT || !respInput.trim()}
                        className="bg-primary-blue hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3.5 py-2 font-bold text-xs rounded-xl cursor-pointer shrink-0 transition-colors"
                      >
                        + Adicionar
                      </button>
                    </div>

                    {fieldErrors.responsibilities && (
                      <p className="mt-1 text-xs text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.responsibilities}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* COLUNA DIREITA: PRÉVIA AO VIVO EM TEMPO REAL (5 COLUNAS EM TELAS GRANDES) */}
            <div className={`lg:col-span-5 sticky top-0 ${showMobilePreview ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-gray-200/80 dark:border-slate-700/80 rounded-3xl p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary-blue dark:text-blue-400 font-bold text-xs">
                    <Sparkles size={15} />
                    <span>Prévia em Tempo Real</span>
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">
                    Atualiza instantaneamente
                  </span>
                </div>

                {renderLivePreview()}
              </div>
            </div>

          </div>
        </div>

        {/* ── MODAL FOOTER ACTIONS ── */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {step === 1 ? (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft size={14} /> Voltar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {step < 3 && form.title.trim() && (
              <button
                type="button"
                onClick={handleQuickPublish}
                disabled={isPublishing}
                className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                title="Publicar direto com as informações preenchidas"
              >
                {isPublishing ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                <span>{isPublishing ? 'Publicando...' : 'Publicar Direto'}</span>
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-brand-sm"
              >
                <span>{step === 1 ? 'Requisitos & Salário' : 'Descrição & Atividades'}</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="bg-primary-blue hover:bg-blue-600 text-white px-6 py-2.5 text-xs font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-brand-sm hover:shadow-brand-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isPublishing ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                <span>{isPublishing ? 'Publicando Oportunidade...' : 'Publicar Vaga no Mural'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
