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
  // Tecnologia, Programação & Ferramentas
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Node.js', 'Vue.js', 'Angular',
  'Python', 'PHP', 'Java', 'C#', 'C++', 'Go', 'Rust', 'Ruby', 'HTML5 & CSS3', 'Sass',
  'TailwindCSS', 'Bootstrap', 'Git & GitHub', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud (GCP)',
  'Linux', 'SQL / Bancos de Dados', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'Figma', 'UI/UX Design', 'Power BI', 'Tableau', 'Excel Avançado', 'Pacote Office',
  'Suporte a Sistemas ERP', 'SAP', 'TOTVS', 'Salesforce / CRM', 'Design Gráfico / Canva',
  'Adobe Photoshop', 'Adobe Illustrator', 'Edição de Vídeo', 'AutoCAD', 'SolidWorks',

  // Gestão, Administrativo & Financeiro
  'Atendimento ao Cliente', 'Rotinas Administrativas', 'Emissão de Notas Fiscais (NFe)',
  'Fluxo de Caixa & Cobrança', 'Contas a Pagar e Receber', 'Contabilidade Geral',
  'Escrita Fiscal', 'Departamento Pessoal (DP)', 'Recrutamento e Seleção (RH)',
  'Gestão de Pessoas', 'Organização de Arquivos', 'Gestão de Tempo', 'Gestão de Projetos',
  'Metodologias Ágeis (Scrum/Kanban)', 'Planejamento Estratégico',

  // Comercial, Vendas & Marketing
  'Vendas Consultivas B2B', 'Negociação & Fechamento', 'Técnicas de Vendas (B2C)',
  'Prospecção de Clientes', 'Marketing Digital', 'Gestão de Redes Sociais',
  'Gestão de Tráfego Pago', 'Google Ads', 'Meta Ads', 'Copywriting', 'SEO',
  'Comunicação Corporativa', 'Pós-Venda & Sucesso do Cliente',

  // Habilidades Interpessoais (Soft Skills)
  'Comunicação Assertiva', 'Trabalho em Equipe', 'Proatividade & Iniciativa',
  'Resolução de Problemas', 'Liderança & Coordenação', 'Inteligência Emocional',
  'Pontualidade & Compromisso', 'Pensamento Crítico', 'Adaptabilidade & Resiliência',
  'Relacionamento Interpessoal', 'Ética Profissional', 'Orientação para Resultados',

  // Operacional, Logística & Indústria
  'Segurança do Trabalho (NRs)', 'NR-10 (Segurança Elétrica)', 'NR-35 (Trabalho em Altura)',
  'NR-11 (Transporte e Movimentação)', 'NR-12 (Segurança em Máquinas)', 'Manutenção Elétrica',
  'Manutenção Mecânica', 'Operação de Empilhadeira', 'Operação de Máquinas Industriais',
  'Solda Elétrica / MIG / TIG', 'Torneamento & Usinagem CNC', 'Logística & Expedição',
  'Controle de Estoque & Inventário', 'Gestão de Almoxarifado', 'Controle de Qualidade / 5S',
  'Carteira de Habilitação (CNH)',

  // Agro, Saúde, Educação & Idiomas
  'Gestão Agropecuária', 'Manejo de Pastagens & Solos', 'Operação de Tratores e Implementos',
  'Técnicas Agrícolas', 'Zootecnia Básica', 'Primeiros Socorros', 'Enfermagem Geral',
  'Dispensação Farmacêutica', 'Didática & Ensino', 'Inglês Básico', 'Inglês Intermediário',
  'Inglês Avançado / Fluente', 'Espanhol'
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
const PROFANITY_ROOTS = [
  'bost', 'merd', 'foder', 'foda', 'fode', 'fodid', 'fodao', 'fodão', 'puta', 'puto', 'putaria',
  'porra', 'caralh', 'bucet', 'piroca', 'arromb', 'viad', 'vagabund', 'safad',
  'desgrac', 'desgraç', 'vsf', 'vtnc', 'fdp'
];

const PROFANITY_LIST = [
  'bosta', 'bostinha', 'merda', 'merdinha', 'caralho', 'porra', 'puta', 'putaria',
  'pinto', 'foder', 'foda', 'fode', 'fodido', 'fodida', 'carai', 'cacete', 'buceta',
  'piroca', 'viado', 'viadagem', 'corno', 'otario', 'otaria', 'vagabundo', 'safado',
  'desgraca', 'desgraça', 'vsf', 'vtnc', 'fdp', 'chupa', 'rola', 'penis', 'vagina',
  'arrombado', 'krl', 'kct', 'cu'
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
  const cleanAlpha = lower.replace(/[^a-z0-9]/g, '');

  // 1. Verificação Aprofundada de Raízes Ofensivas (inclusive termos compostos como cubost, cubosta123)
  for (const root of PROFANITY_ROOTS) {
    if (cleanAlpha.includes(root)) {
      return { valid: false, error: 'Termo impróprio ou inadequado detectado.' };
    }
  }

  for (const bad of PROFANITY_LIST) {
    if (bad.length >= 3) {
      if (lower.includes(bad) || cleanAlpha.includes(bad)) {
        return { valid: false, error: `O termo "${bad}" não é apropriado para uma publicação profissional.` };
      }
    } else {
      // Para termos curtos como 'cu'
      const regexCu = /(^|\W|_|\d)cu($|\W|_|\d|zao|zão|dao|dão|bost|merd|lhao|lhão)/i;
      if (regexCu.test(lower) || cleanAlpha === 'cu' || cleanAlpha.startsWith('cu') && !['curso', 'curriculo', 'currículo', 'custom', 'custos', 'cuidados', 'cultura', 'cuidado', 'curadoria'].some(ok => cleanAlpha.startsWith(ok))) {
        return { valid: false, error: 'Termo impróprio ou inadequado detectado.' };
      }
    }
  }

  // 2. Verificação de Caracteres Repetidos Sem Sentido (ex: "aaaaaaaa", "xxxxxxx")
  if (/(.)\1{4,}/.test(clean)) {
    return { valid: false, error: `O campo ${fieldName} contém repetições excessivas de caracteres.` };
  }

  // 3. Verificação de Teclas Apertadas Aleatoriamente (Gibberish: ex: "waqeqeqwerererererererere", "asdfgh")
  const keyboardPatterns = ['asdfgh', 'qwerty', 'zxcvbn', 'poiuyt', 'lkjhgf', 'mnbvcx', '123456'];
  for (const pat of keyboardPatterns) {
    if (cleanAlpha.includes(pat)) {
      return { valid: false, error: `O texto de ${fieldName} contém sequências de teclado aleatórias (ex.: "${pat}").` };
    }
  }

  if (/^[bcdfghjklmnpqrstvwxyz]{5,}$/i.test(clean) || /^[aeiou]{5,}$/i.test(clean)) {
    return { valid: false, error: `Por favor, digite um texto compreensível para ${fieldName}.` };
  }

  const words = clean.split(/\s+/).filter(w => w.length >= 2);

  // 4. Verificações Estruturais para Descrição de Oportunidades (evita textos aleatórios ou repetitivos)
  if (minLength >= 20) {
    // a) Evita palavras excessivamente longas sem espaço (gibberish/mashing de teclado)
    if (words.some(w => w.length > 28)) {
      return { valid: false, error: 'O texto contém palavras ou sequências aleatórias sem espaçamento adequado.' };
    }

    // b) Palavras sem nenhuma vogal com 4 ou mais letras (teclado mashing)
    const hasVowellessWords = words.some(w => {
      const alphaOnly = w.replace(/[^a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/g, '');
      return alphaOnly.length >= 4 && !/[aeiouyáàâãéèêíïóôõöúÁÀÂÃÉÈÊÍÏÓÔÕÖÚ]/i.test(alphaOnly);
    });
    if (hasVowellessWords) {
      return { valid: false, error: 'O texto contém palavras aleatórias ou incompreensíveis.' };
    }

    // c) Evita repetição excessiva de palavras idênticas (ex: "vaga legal vaga legal vaga legal")
    if (words.length >= 6) {
      const lowerWords = words.map(w => w.toLowerCase());
      const unique = new Set(lowerWords);
      if (unique.size / lowerWords.length < 0.45) {
        return { valid: false, error: 'O texto contém repetição excessiva de palavras idênticas. Por favor, detalhe as atividades reais da vaga ou use o modelo pré-formatado.' };
      }
    }

    // d) Exige no mínimo 7 palavras com sentido
    if (words.length < 7) {
      return { valid: false, error: `Por favor, elabore uma descrição mais detalhada e profissional para ${fieldName} (mínimo 7 palavras).` };
    }

    // e) Verifica se contém texto alfabético suficiente (e não só números ou pontuação)
    const letterMatches = clean.match(/[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/g);
    if (!letterMatches || letterMatches.length < 20) {
      return { valid: false, error: 'A descrição deve conter informações legíveis sobre as atividades da vaga.' };
    }
  }

  return { valid: true };
}

// 7. TERMOS E CARGOS OCUPACIONAIS RECONHECIDOS (CBO / MERCADO DE TRABALHO)
export const OCCUPATIONAL_ROLE_KEYWORDS = [
  // Níveis e Cargos Organizacionais
  'auxiliar', 'assistente', 'analista', 'gerente', 'coordenador', 'coordenadora',
  'supervisor', 'supervisora', 'diretor', 'diretora', 'especialista', 'consultor', 'consultora',
  'assessor', 'assessora', 'lider', 'líder', 'chefe', 'estagiario', 'estagiário',
  'estagiaria', 'estagiária', 'estagio', 'estágio', 'trainee', 'aprendiz', 'jovem aprendiz',

  // Comercial, Atendimento & Vendas
  'vendedor', 'vendedora', 'atendente', 'balconista', 'operador', 'operadora', 'caixa',
  'repositor', 'repositora', 'estoquista', 'almoxarife', 'frentista', 'promotor', 'promotora',
  'representante', 'comprador', 'compradora', 'conferente', 'expedidor', 'expedidora',

  // Operacional, Logística & Produção
  'motorista', 'entregador', 'entregadora', 'auxiliar de producao', 'auxiliar de produção',
  'operador de producao', 'operador de produção', 'embalador', 'embaladora', 'carregador',
  'ajudante', 'chapa', 'auxiliar geral', 'servicos gerais', 'serviços gerais',

  // Agropecuária & Campo
  'tratorista', 'agronomo', 'agrônomo', 'agronoma', 'agrônoma', 'tecnico agricola',
  'técnico agrícola', 'zootecnista', 'veterinario', 'veterinário', 'veterinaria', 'veterinária',
  'campeiro', 'ordenhador', 'vaqueiro', 'trabalhador rural', 'produtor rural', 'colhedor',

  // Construção, Manutenção & Técnica
  'tecnico', 'técnico', 'tecnica', 'técnica', 'eletricista', 'mecanico', 'mecânico',
  'soldador', 'soldadora', 'pedreiro', 'pintor', 'pintora', 'marceneiro', 'marceneira',
  'carpinteiro', 'serralheiro', 'instalador', 'instaladora', 'encanador', 'montador',
  'montadora', 'torneiro', 'caldeireiro', 'ferramenteiro', 'borracheiro', 'lavador',

  // Tecnologia, TI & Design
  'desenvolvedor', 'desenvolvedora', 'programador', 'programadora', 'engenheiro', 'engenheira',
  'arquiteto', 'arquiteta', 'designer', 'webdesigner', 'dev', 'suporte', 'redes', 'dados',
  'copywriter', 'social media', 'conteudo', 'conteúdo', 'marketing', 'ti', 'software',
  'frontend', 'backend', 'fullstack', 'full stack', 'full-stack',

  // Saúde, Farmácia & Cuidados
  'medico', 'médico', 'medica', 'médica', 'enfermeiro', 'enfermeira', 'farmaceutico',
  'farmacêutico', 'farmaceutica', 'farmacêutica', 'fisioterapeuta', 'nutricionista',
  'dentista', 'psicologo', 'psicólogo', 'psicologa', 'psicóloga', 'biomedico', 'biomédico',
  'cuidador', 'cuidadora', 'terapeuta', 'massoterapeuta', 'fonoaudiologo', 'fonoaudiólogo',

  // Educação & Pedagogia
  'professor', 'professora', 'docente', 'instrutor', 'instrutora', 'educador', 'educadora',
  'pedagogo', 'pedagoga', 'tutor', 'tutora', 'monitor', 'monitora',

  // Administrativo, Jurídico & Financeiro
  'secretario', 'secretário', 'secretaria', 'secretária', 'recepcionista', 'porteiro',
  'portaria', 'zelador', 'zeladora', 'vigilante', 'seguranca', 'segurança', 'advogado',
  'advogada', 'contador', 'contadora', 'auditor', 'auditora', 'economista', 'telefonista',

  // Alimentação & Hotelaria
  'cozinheiro', 'cozinheira', 'garcom', 'garçom', 'garconete', 'garçonete', 'copeiro',
  'copeira', 'padeiro', 'padeira', 'confeiteiro', 'confeiteira', 'acougueiro', 'açougueiro',
  'churrasqueiro', 'pizzaiolo', 'bartender', 'sushiman', 'barista',

  // Beleza & Estética
  'cabeleireiro', 'cabeleireira', 'barbeiro', 'manicure', 'pedicure', 'esteticista'
];

export const JOB_CATEGORIES = [
  {
    category: 'Tecnologia & TI',
    roles: [
      'Desenvolvedor Front-end', 'Desenvolvedor Back-end', 'Desenvolvedor Full Stack',
      'Desenvolvedor Mobile', 'Estagiário de TI / Software', 'Analista de Suporte Técnico',
      'Analista de Dados & BI', 'UI/UX Designer', 'Técnico em Informática', 'Administrador de Redes'
    ]
  },
  {
    category: 'Administrativo & Financeiro',
    roles: [
      'Auxiliar Administrativo', 'Assistente Administrativo', 'Analista Administrativo',
      'Assistente Financeiro', 'Analista Financeiro', 'Auxiliar Contábil', 'Assistente Contábil',
      'Assistente de Recursos Humanos (RH)', 'Recepcionista / Atendente', 'Secretário(a) Executivo(a)',
      'Gerente de Loja / Unidade'
    ]
  },
  {
    category: 'Comercial & Vendas',
    roles: [
      'Vendedor(a) Comercial', 'Atendente de Loja', 'Consultor(a) de Vendas',
      'Representante Comercial', 'Operador(a) de Caixa', 'Assistente Comercial',
      'Executivo(a) de Contas (B2B)', 'Balconista'
    ]
  },
  {
    category: 'Agro, Indústria & Operacional',
    roles: [
      'Eletricista Industrial', 'Eletricista Predial', 'Mecânico de Manutenção',
      'Técnico Agrícola', 'Engenheiro(a) Agrônomo(a)', 'Operador(a) de Produção',
      'Auxiliar de Logística / Estoque', 'Estoquista / Almoxarife', 'Motorista / Entregador',
      'Técnico em Segurança do Trabalho', 'Tratorista Agrícola'
    ]
  },
  {
    category: 'Saúde, Educação & Serviços',
    roles: [
      'Farmacêutico(a)', 'Enfermeiro(a)', 'Técnico(a) em Enfermagem', 'Professor(a) / Docente',
      'Instrutor(a) de Treinamento', 'Nutricionista', 'Fisioterapeuta', 'Cozinheiro(a) / Auxiliar de Cozinha',
      'Zelador(a) / Serviços Gerais', 'Cuidador(a) de Idosos / Saúde'
    ]
  }
];

export function escapeRegex(string) {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validação de Título Profissional de Vaga (CBO / Mercado de Trabalho)
 * Exige que o título contenha um cargo, função ou profissão de trabalho real.
 */
export function validateJobTitle(title) {
  try {
    if (!title || typeof title !== 'string') {
      return { valid: false, error: 'O título do cargo é obrigatório.' };
    }

    const clean = title.trim();

    // Validação básica profissional (palavrões, tamanho, repetição)
    const basicVal = validateProfessionalText(clean, 'Título do Cargo', 3, 75);
    if (!basicVal.valid) {
      return basicVal;
    }

    const norm = clean
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // 1. Verifica se corresponde ou contém algum título padronizado oficial
    const isExactStandard = STANDARD_JOB_TITLES.some(st => {
      const normSt = st.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm === normSt || norm.includes(normSt) || normSt.includes(norm);
    });
    if (isExactStandard) {
      return { valid: true };
    }

    // 2. Verifica se contém ao menos uma palavra-chave ocupacional/CBO de trabalho
    const hasOccupationalRole = OCCUPATIONAL_ROLE_KEYWORDS.some(kw => {
      try {
        const normKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const regex = new RegExp(`(^|\\s|\\W)${escapeRegex(normKw)}($|\\s|\\W)`, 'i');
        return regex.test(norm) || norm.includes(normKw);
      } catch {
        return false;
      }
    });

    if (hasOccupationalRole) {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'O título da vaga deve especificar um cargo ou profissão de trabalho legítima (ex.: "Vendedor(a)", "Desenvolvedor(a)", "Auxiliar Administrativo", "Técnico(a)", "Eletricista"). Selecione uma opção na lista de cargos recomendados ou informe uma função profissional.'
    };
  } catch (err) {
    console.error('Erro defensivo em validateJobTitle:', err);
    return { valid: false, error: 'Título com formato inválido.' };
  }
}

// 8. BANCO DE PALAVRAS-CHAVE E COMPETÊNCIAS OCUPACIONAIS HOMOLOGADAS
export const OCCUPATIONAL_SKILL_KEYWORDS = [
  // Tecnologia & Ferramentas
  'react', 'react native', 'vue', 'angular', 'node', 'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'php',
  'ruby', 'go', 'rust', 'sql', 'mysql', 'postgres', 'postgresql', 'oracle', 'mongodb', 'redis', 'html', 'css', 'sass',
  'tailwind', 'bootstrap', 'git', 'github', 'gitlab', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'google cloud',
  'linux', 'windows', 'excel', 'word', 'powerpoint', 'office', 'power bi', 'tableau', 'erp', 'crm',
  'sap', 'totvs', 'figma', 'photoshop', 'illustrator', 'canva', 'coreldraw', 'autocad', 'solidworks',
  'revit', 'sketchup', 'programacao', 'programação', 'redes', 'suporte', 'software', 'hardware',
  'flutter', 'kotlin', 'swift', 'django', 'flask', 'spring', 'next.js', 'nextjs', 'api', 'rest', 'scrum',
  'kanban', 'jira', 'trello', 'blender', 'indesign', 'premiere', 'after effects',

  // Operacional, Agro & Técnica
  'nr-10', 'nr-11', 'nr-12', 'nr-35', 'cnh', 'cnh a', 'cnh b', 'cnh c', 'cnh d', 'cnh e',
  'eletrica', 'elétrica', 'mecanica', 'mecânica', 'solda', 'usinagem', 'torno', 'cnc', 'empilhadeira',
  'trator', 'colheitadeira', 'manutencao', 'manutenção', 'operacao', 'operação', 'logistica', 'logística',
  'estoque', 'expedicao', 'expedição', 'inventario', 'inventário', 'almoxarifado', 'producao', 'produção',
  'segurança do trabalho', 'agronomia', 'veterinaria', 'veterinária', 'plantio', 'colheita', 'irrigacao',
  'irrigação', 'mecatronica', 'mecatrônica', 'clp', 'pneumatica', 'pneumática', 'hidraulica', 'hidráulica',
  'metrologia', 'paquimetro', 'paquímetro', '5s', 'kaizen', 'lean', 'seis sigma', 'six sigma', 'iso 9001',
  'boas praticas', 'boas práticas', 'bpf',

  // Comercial & Administrativo
  'vendas', 'negociacao', 'negociação', 'atendimento', 'caixa', 'faturamento', 'nfe', 'fiscal',
  'contabil', 'contábil', 'financeiro', 'cobranca', 'cobrança', 'rh', 'recrutamento', 'dp',
  'marketing', 'seo', 'midias sociais', 'mídias sociais', 'copywriting', 'gestao', 'gestão',
  'projetos', 'compras', 'b2b', 'b2c', 'rotinas administrativas', 'fluxo de caixa', 'arquivos',
  'dre', 'conciliacao', 'conciliação', 'sped', 'sintegra', 'icms', 'contas a pagar', 'contas a receber',
  'tesouraria', 'folha de pagamento', 'esocial', 'ponto eletronico', 'ponto eletrônico', 'fgts', 'inss',
  'pos-venda', 'pós-venda', 'customer success', 'prospeccao', 'prospecção', 'funil de vendas', 'telemarketing',

  // Soft Skills & Habilidades Humanas
  'comunicacao', 'comunicação', 'trabalho em equipe', 'proatividade', 'organizacao', 'organização',
  'lideranca', 'liderança', 'pontualidade', 'resiliencia', 'resiliência', 'empatia', 'foco',
  'etica', 'ética', 'compromisso', 'resolucao de problemas', 'resolução de problemas', 'adaptabilidade',
  'inteligência emocional', 'pensamento crítico',

  // Saúde, Educação & Serviços
  'enfermagem', 'farmacia', 'farmácia', 'triagem', 'pedagogia', 'didatica', 'didática',
  'culinaria', 'culinária', 'gastronomia', 'limpeza', 'zeladoria', 'portaria', 'vigilancia', 'vigilância',
  'ingles', 'inglês', 'espanhol', 'socorrista', 'curativos', 'administracao de medicamentos',
  'administração de medicamentos', 'coleta de exames', 'prontuario', 'prontuário', 'psicologia',
  'nutricao', 'nutrição', 'fisioterapia', 'servicos gerais', 'serviços gerais'
];

/**
 * Validador de Competências e Habilidades Profissionais
 * Exige correspondência estrita com o banco de competências homologadas (STANDARD_SKILLS / OCCUPATIONAL_SKILL_KEYWORDS)
 * e impede termos pejorativos, troll ou inventados (ex.: cubost, teste123, blabla).
 */
export function validateSkill(skill) {
  try {
    if (!skill || typeof skill !== 'string') {
      return { valid: false, error: 'O nome da competência é obrigatório.' };
    }

    const clean = skill.trim();

    // 1. Checagem básica profissional (palavrões, tamanho mínimo/máximo)
    const basicVal = validateProfessionalText(clean, 'Competência / Habilidade', 2, 45);
    if (!basicVal.valid) {
      return basicVal;
    }

    const lower = clean.toLowerCase();
    const norm = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 2. Reconhecimento de padrões técnicos oficiais (ex.: NR-10, ISO 9001, HTML5, C++, C#, .NET)
    const isTechnicalStandard = /^(NR[-\s]?\d+|ISO[-\s]?\d+|HTML\d|CSS\d|IPV\d|VUE\s?\d|REACT\s?\d|WINDOWS\s?\d+|OFFICE\s?\d+|SQL\s?\d+|C\+\+|C#|\.NET)$/i.test(clean);
    if (isTechnicalStandard) {
      return { valid: true };
    }

    // 3. Bloqueio de sufixos numéricos aleatórios / troll (ex: "cubosta123", "teste123", "abc000")
    if (/\d{3,}$/.test(clean) || /\d{2,}$/.test(norm.replace(/[^a-z0-9]/g, ''))) {
      return { valid: false, error: 'A habilidade não deve conter sufixos numéricos aleatórios (ex.: "123").' };
    }

    // 4. Bloqueio de termos que não contenham letras
    if (!/[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(clean)) {
      return { valid: false, error: 'A habilidade deve conter letras e representar uma competência profissional real.' };
    }

    // 5. Verificação direta contra a lista homologada de habilidades (STANDARD_SKILLS)
    const isStandardSkill = STANDARD_SKILLS.some(st => {
      const normSt = st.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm === normSt || norm.includes(normSt);
    });
    if (isStandardSkill) {
      return { valid: true };
    }

    // 6. Verificação de termos e raízes de competências ocupacionais reconhecidas
    const isRecognizedCompetency = OCCUPATIONAL_SKILL_KEYWORDS.some(kw => {
      try {
        const normKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const regex = new RegExp(`(^|\\s|\\W)${escapeRegex(normKw)}($|\\s|\\W)`, 'i');
        return regex.test(norm) || norm === normKw;
      } catch {
        return false;
      }
    });

    if (isRecognizedCompetency) {
      return { valid: true };
    }

    // 7. Rejeição estrita de qualquer termo fora da base homologada do mercado de trabalho
    return {
      valid: false,
      error: 'Competência não reconhecida no mercado de trabalho. Selecione uma opção na lista de habilidades sugeridas ou informe uma competência profissional válida.'
    };
  } catch (err) {
    console.error('Erro defensivo em validateSkill:', err);
    return { valid: false, error: 'Competência com formato inválido.' };
  }
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
