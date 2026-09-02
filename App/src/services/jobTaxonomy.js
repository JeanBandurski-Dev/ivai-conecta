/**
 * Taxonomia e Validações Profissionais de Vagas (Padrão LinkedIn / Gupy)
 * Ivaí Conecta - Vale do Ivaí
 */

// 1. CARGOS E TÍTULOS PROFISSIONAIS PADRONIZADOS (CBO / MERCADO)
export const STANDARD_JOB_TITLES = [
  // Tecnologia & TI
  'Desenvolvedor Front-end',
  'Desenvolvedor Back-end',
  'Desenvolvedor Full Stack',
  'Desenvolvedor Mobile',
  'Estagiário de TI / Software',
  'Analista de Suporte Técnico',
  'Analista de Dados & BI',
  'UI/UX Designer',
  'Técnico em Informática',
  'Administrador de Redes',

  // Gestão, Administrativo & Financeiro
  'Auxiliar Administrativo',
  'Assistente Administrativo',
  'Analista Administrativo',
  'Assistente Financeiro',
  'Analista Financeiro',
  'Auxiliar Contábil',
  'Assistente Contábil',
  'Assistente de Recursos Humanos (RH)',
  'Analista de Recursos Humanos (RH)',
  'Recepcionista / Atendente',
  'Secretário(a) Executivo(a)',
  'Gerente de Loja / Unidade',

  // Comercial & Vendas
  'Vendedor(a) Comercial',
  'Atendente de Loja',
  'Consultor(a) de Vendas',
  'Representante Comercial',
  'Operador(a) de Caixa',
  'Assistente Comercial',
  'Executivo(a) de Contas (B2B)',

  // Marketing & Comunicação
  'Social Media & Marketing Digital',
  'Designer Gráfico',
  'Analista de Marketing',
  'Assistente de Marketing',
  'Criador de Conteúdo / Copywriter',

  // Agro, Indústria & Logística
  'Eletricista Industrial',
  'Eletricista Predial',
  'Mecânico de Manutenção',
  'Técnico Agrícola',
  'Engenheiro(a) Agrônomo(a)',
  'Operador(a) de Produção',
  'Auxiliar de Logística / Estoque',
  'Estoquista / Almoxarife',
  'Motorista / Entregador',
  'Técnico em Segurança do Trabalho',

  // Saúde, Educação & Serviços
  'Farmacêutico(a)',
  'Enfermeiro(a)',
  'Técnico(a) em Enfermagem',
  'Professor(a) / Docente',
  'Instrutor(a) de Treinamento',
  'Nutricionista',
  'Fisioterapeuta',
  'Cozinheiro(a) / Auxiliar de Cozinha',
  'Zelador(a) / Serviços Gerais'
];

// 2. BANCO DE HABILIDADES PROFISSIONAIS HOMOLOGADAS
export const STANDARD_SKILLS = [
  // Tecnologia & Ferramentas
  'JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'PHP', 'HTML5 & CSS3',
  'SQL / Bancos de Dados', 'Git & GitHub', 'Figma', 'Power BI', 'Excel Avançado',
  'Pacote Office', 'Suporte a Sistemas ERP', 'Design Gráfico / Canva',

  // Habilidades Comerciais & Administrativas
  'Atendimento ao Cliente', 'Negociação & Vendas', 'Emissão de Notas Fiscais (NFe)',
  'Rotinas Administrativas', 'Fluxo de Caixa & Cobrança', 'Contas a Pagar e Receber',
  'Gestão de Redes Sociais', 'Marketing Digital', 'Organização de Arquivos',
  'Controle de Estoque & Inventário', 'Vendas Consultivas B2B',

  // Habilidades Interpessoais (Soft Skills)
  'Comunicação Assertiva', 'Trabalho em Equipe', 'Proatividade & Iniciativa',
  'Gestão de Tempo', 'Liderança & Coordenação', 'Resolução de Problemas',
  'Inteligência Emocional', 'Pontualidade & Compromisso', 'Pensamento Crítico',

  // Operacional & Técnico
  'Manutenção Elétrica', 'Manutenção Mecânica', 'Segurança do Trabalho (NRs)',
  'Operação de Máquinas', 'Logística & Expedição', 'Gestão Agropecuária'
];

// 3. FAIXAS SALARIAIS PADRONIZADAS (SEM CAMPOS DE TEXTO LIVRE TROLL)
export const SALARY_RANGES = [
  { id: 'combinar', label: 'Salário a Combinar / Confidencial', value: 'A combinar' },
  { id: 'estagio',  label: 'Bolsa Estágio (R$ 800 - R$ 1.400)',   value: 'R$ 800 - R$ 1.400' },
  { id: 'faixa1',   label: 'R$ 1.412 - R$ 2.000 (Piso Inicial)',   value: 'R$ 1.412 - R$ 2.000' },
  { id: 'faixa2',   label: 'R$ 2.000 - R$ 3.000',                  value: 'R$ 2.000 - R$ 3.000' },
  { id: 'faixa3',   label: 'R$ 3.000 - R$ 4.500',                  value: 'R$ 3.000 - R$ 4.500' },
  { id: 'faixa4',   label: 'R$ 4.500 - R$ 6.500',                  value: 'R$ 4.500 - R$ 6.500' },
  { id: 'faixa5',   label: 'R$ 6.500 - R$ 10.000',                 value: 'R$ 6.500 - R$ 10.000' },
  { id: 'faixa6',   label: 'Acima de R$ 10.000 (Sênior / Gestão)', value: 'Acima de R$ 10.000' }
];

// 4. HORÁRIOS DE TRABALHO PADRONIZADOS
export const WORK_SCHEDULES = [
  '08:00 às 18:00 (Segunda a Sexta)',
  '08:00 às 17:00 (Segunda a Sexta)',
  '08:00 às 12:00 (Meio Período / Estágio)',
  '13:00 às 17:00 (Meio Período / Estágio)',
  '08:00 às 12:00 / 13:30 às 18:00 (Comércio)',
  'Escala 6x1 (Comércio / Atendimento)',
  'Escala 12x36 (Operacional / Saúde)',
  'Horário Flexível / Home Office'
];

// 5. VALES E BENEFÍCIOS OFERECIDOS
export const STANDARD_BENEFITS = [
  'Vale Transporte (VT)',
  'Vale Refeição / Alimentação (VR/VA)',
  'Plano de Saúde',
  'Plano Odontológico',
  'Ambiente Colaborativo',
  'Horário Flexível',
  'Seguro de Vida',
  'Auxílio Educação / Cursos',
  'Home Office Híbrido',
  'Day-off no Aniversário',
  'Comissão / PLR'
];

// 6. LISTA NEGRA DE PALAVRÕES, TERMOS PEJORATIVOS E OFENSAS REAIS
const PROFANITY_LIST = [
  'cu', 'bosta', 'merda', 'caralho', 'porra', 'puta', 'pinto', 'foder',
  'foda', 'carai', 'cacete', 'buceta', 'piroca', 'viado', 'corno',
  'otario', 'vagabundo', 'safado', 'desgraca', 'vsf', 'vtnc', 'fdp'
];

/**
 * Validador de Texto Profissional e Detecção de Spam / Gibberish
 */
export function validateProfessionalText(text, fieldName = 'Texto', minLength = 4, maxLength = 2000) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: `O campo ${fieldName} é obrigatório.` };
  }

  const clean = text.trim();

  if (clean.length < minLength) {
    return { valid: false, error: `O campo ${fieldName} deve conter no mínimo ${minLength} caracteres.` };
  }

  if (clean.length > maxLength) {
    return { valid: false, error: `O campo ${fieldName} excede o limite máximo de ${maxLength} caracteres.` };
  }

  const lower = clean.toLowerCase();

  // 1. Verificação de Palavrões ou Termos Troll
  for (const bad of PROFANITY_LIST) {
    // Procura palavra isolada ou exata
    const regex = new RegExp(`\\b${bad}\\b`, 'i');
    if (regex.test(lower) || lower === bad) {
      return { valid: false, error: `O termo "${bad}" não é apropriado para a publicação de uma vaga profissional.` };
    }
  }

  // 2. Verificação de Caracteres Repetidos Sem Sentido (ex: "aaaaaaaa", "xxxxxxx")
  if (/(.)\1{4,}/.test(clean)) {
    return { valid: false, error: `O campo ${fieldName} contém repetições excessivas de caracteres.` };
  }

  // 3. Verificação de Teclas Apertadas Aleatoriamente (Gibberish: ex: "waqeqeqwerererererererere")
  if (/^[bcdfghjklmnpqrstvwxyz]{6,}$/i.test(clean) || /^[aeiou]{6,}$/i.test(clean)) {
    return { valid: false, error: `Por favor, digite um texto compreensível para ${fieldName}.` };
  }

  // 4. Verificação de palavras legíveis mínimas
  const words = clean.split(/\s+/).filter(w => w.length >= 2);
  if (minLength >= 20 && words.length < 4) {
    return { valid: false, error: `Por favor, elabore uma descrição mais detalhada e profissional para ${fieldName}.` };
  }

  return { valid: true };
}

/**
 * Template Profissional de Vaga Padrão LinkedIn / Gupy
 */
export function getJobDescriptionTemplate(jobTitle = 'Oportunidade', company = 'Nossa Empresa') {
  return `📌 Sobre a Vaga:
${company} está em busca de um(a) profissional para atuar como ${jobTitle || 'integrante da equipe'}.

🎯 Principais Atividades e Responsabilidades:
- Executar rotinas e processos da área com dedicação e qualidade técnica.
- Interagir colaborativamente com o time para atingimento das metas.
- Participar de alinhamentos e propor melhorias contínuas no setor.

🎓 Requisitos Necessários:
- Formação concluída ou em andamento em área correlata.
- Conhecimento prático nas ferramentas exigidas para a função.
- Excelente postura profissional, comunicação e comprometimento.

⭐ Diferenciais:
- Experiência prévia em funções similares na região do Vale do Ivaí.`;
}
