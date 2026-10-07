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

// 4. HORÁRIOS DE TRABALHO PADRONIZADOS (CARGA HORÁRIA OFICIAL)
export const STANDARD_WORKING_HOURS = [
  '44h semanais • 08:00 às 18:00 (Segunda a Sexta / CLT Comercial)',
  '44h semanais • 08:00 às 17:00 (Segunda a Sexta + Sábado até 12:00)',
  '40h semanais • 08:00 às 17:00 (Segunda a Sexta)',
  '40h semanais • 09:00 às 18:00 (Segunda a Sexta)',
  '30h semanais • 6h diárias (Estágio / Manhã ou Tarde)',
  '20h semanais • 4h diárias (Meio Período / Jovem Aprendiz)',
  'Escala 6x1 • 44h semanais (Comércio / Atendimento)',
  'Escala 12x36 • Diurno (07:00 às 19:00 / Saúde e Operacional)',
  'Escala 12x36 • Noturno (19:00 às 07:00 / Vigilância e Plantão)',
  'Horário Flexível • 40h semanais (Híbrido / Remoto)',
  'A Combinar (Escala definida na entrevista)'
];
export const WORK_SCHEDULES = STANDARD_WORKING_HOURS;

// 5. VALES E BENEFÍCIOS OFERECIDOS (PADRÃO MERCADO BRASIL / LINKEDIN / GUPY)
export const STANDARD_BENEFITS = [
  // Alimentação & Refeição
  'Vale Refeição (VR)',
  'Vale Alimentação (VA)',
  'Vale Refeição / Alimentação (VR/VA)',
  'Cartão Benefícios Flexíveis (Caju / Flash / Swile)',
  'Refeitório no Local / Restaurante',
  'Café da Manhã & Frutas no Escritório',

  // Saúde & Bem-Estar
  'Plano de Saúde (Médico)',
  'Plano Odontológico',
  'Gympass / Wellhub (Academias)',
  'TotalPass / Saúde Física',
  'Assistência Psicológica / Terapia Online',
  'Seguro de Vida em Grupo',
  'Telemedicina 24h',
  'Convênio Farmácia (Desconto Medicamentos)',
  'Massoterapia / Quick Massage',

  // Transporte & Mobilidade
  'Vale Transporte (VT)',
  'Vale Combustível / Auxílio Mobilidade',
  'Estacionamento Gratuito no Local',
  'Vale Pedágio',
  'Bicicletário & Vestiário',

  // Flexibilidade & Família
  'Horário Flexível',
  'Home Office Híbrido',
  '100% Remoto (Home Office)',
  'Auxílio Home Office / Ergonomia',
  'Day-off no Aniversário',
  'Sexta-feira Curta (Short Friday)',
  'Auxílio Creche',
  'Auxílio Babá',
  'Licença Maternidade Estendida (6 meses)',
  'Licença Paternidade Estendida (20 dias)',

  // Educação & Carreira
  'Auxílio Educação / Graduação e Pós',
  'Auxílio Cursos & Treinamentos',
  'Auxílio Idiomas (Inglês / Espanhol)',
  'Reembolso de Certificações',
  'Plano de Carreira Estruturado',
  'Parcerias com Universidades & Escolas',

  // Finanças & Recompensas
  'Participação nos Lucros e Resultados (PLR / PPR)',
  'Bônus por Metas / Premiações',
  'Previdência Privada',
  'Empréstimo Consignado com Juros Baixos',
  'Comissão sobre Vendas',

  // Cultura & Vantagens
  'Ambiente Colaborativo & Descontraído',
  'Dress Code Livre / Casual',
  'Espaço de Descompressão / Jogos',
  'Pet Friendly',
  'Clube de Descontos e Convênios Locais'
];

// 6. LISTA NEGRA DE PALAVRÕES, TERMOS PEJORATIVOS E OFENSAS REAIS
export const PROFANITY_ROOTS = [
  'bost', 'merd', 'foder', 'foda', 'fode', 'fodid', 'fodao', 'fodão', 'puta', 'puto', 'putaria',
  'porra', 'caralh', 'bucet', 'piroca', 'arromb', 'viad', 'vagabund', 'safad',
  'desgrac', 'desgraç', 'vsf', 'vtnc', 'fdp', 'pqp', 'chupa', 'cacete', 'krl', 'kct', 'trouxa', 'babaca',
  'cuzin', 'cuzao', 'cuzão', 'otari', 'fuder', 'fudeu', 'fodasse', 'fodase'
];

export const PROFANITY_LIST = [
  'bosta', 'bostinha', 'merda', 'merdinha', 'caralho', 'porra', 'puta', 'putaria',
  'pinto', 'foder', 'foda', 'fode', 'fodido', 'fodida', 'carai', 'cacete', 'buceta',
  'piroca', 'viado', 'viadagem', 'corno', 'otario', 'otaria', 'vagabundo', 'safado',
  'desgraca', 'desgraça', 'vsf', 'vtnc', 'fdp', 'pqp', 'chupa', 'rola', 'penis', 'vagina',
  'arrombado', 'arrombada', 'krl', 'kct', 'cu', 'cuzao', 'cuzão', 'cuzinho', 'trouxa', 'babaca'
];

// 6.1 LISTA DE TERMOS TROLL, BRINCADEIRAS, ALIMENTOS E PALAVRAS INAPROPRIADAS PARA RH
export const GENERAL_TROLL_WORDS = new Set([
  // Frutas e comidas isoladas que não representam cargos, atividades ou requisitos
  'abacaxi', 'banana', 'melancia', 'abacate', 'manga', 'mamao', 'mamão', 'laranja',
  'maca', 'maçã', 'uva', 'morango', 'kiwi', 'limao', 'limão', 'goiaba', 'pera', 'pêra',
  'pitanga', 'jabuticaba', 'maracuja', 'maracujá', 'melao', 'melão',
  'coxinha', 'pastel', 'pizza', 'churrasco', 'pipoca', 'hamburguer', 'hotdog',
  'cerveja', 'chopp', 'chope', 'pinga', 'cachaca', 'cachaça', 'vodka', 'vinho', 'whisky', 'energetico',
  'cigarro', 'narguile', 'fumo', 'sorvete', 'acai', 'açaí', 'lanche', 'salgado', 'biscoito', 'bolacha',
  'marmita', 'almoço', 'almoco', 'jantar', 'pao', 'pão',
  // Gírias, brincadeiras, zoeiras e termos sem contexto de serviços
  'comer', 'beber', 'dormir', 'roncar', 'brincar', 'fofoca', 'namoro', 'sexo', 'zoeira',
  'palhacada', 'palhaçada', 'piada', 'preguica', 'preguiça', 'sono', 'mentira', 'besteira',
  'bobagem', 'troca', 'fake', 'teste', 'asdf', 'qwert', 'jogo', 'truco', 'videogame',
  'playstation', 'xbox', 'free fire', 'tinder', 'balada', 'festa', 'ping pong', 'ping-pong',
  'sinuca', 'pebolim', 'futebol'
]);

/**
 * Verifica se uma palavra é um termo troll, brincadeira, fruta/comida solta ou gíria inapropriada
 */
export function isTrollWord(word) {
  if (!word || typeof word !== 'string') return false;
  const lower = word.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!lower || lower.length < 3) return false;

  if (GENERAL_TROLL_WORDS.has(lower)) return true;

  // Trata plurais e variações comuns em português (abacaxis -> abacaxi, bananas -> banana, pasteis -> pastel)
  if (lower.endsWith('s')) {
    const s1 = lower.slice(0, -1);
    if (GENERAL_TROLL_WORDS.has(s1)) return true;
    if (lower.endsWith('es')) {
      const s2 = lower.slice(0, -2);
      if (GENERAL_TROLL_WORDS.has(s2)) return true;
    }
    if (lower.endsWith('is')) {
      const s3 = lower.slice(0, -2) + 'l';
      if (GENERAL_TROLL_WORDS.has(s3)) return true;
    }
  }

  // Raízes de palavras troll
  const trollRoots = [
    'abacaxi', 'banana', 'melancia', 'pastel', 'pizza', 'coxinha', 'cerveja', 'churrasco',
    'pipoca', 'hamburguer', 'fofoca', 'namoro', 'zoeira', 'palhacada', 'bobagem', 'besteira'
  ];
  for (const root of trollRoots) {
    if (lower.includes(root)) return true;
  }

  return false;
}

/**
 * Validador de Número de Telefone no Padrão Brasileiro (DDD + 8 ou 9 dígitos)
 * Bloqueia sequências fictícias repetidas e valida DDDs oficiais.
 */
export function validatePhoneNumber(phone, required = false) {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    if (required) {
      return { valid: false, error: 'O número de telefone é obrigatório.' };
    }
    return { valid: true };
  }

  const clean = phone.trim();
  const digits = clean.replace(/\D/g, '');

  if (digits.length === 0) {
    if (required) {
      return { valid: false, error: 'O número de telefone é obrigatório.' };
    }
    return { valid: true };
  }

  if (digits.length !== 10 && digits.length !== 11) {
    return {
      valid: false,
      error: 'Telefone inválido. Informe o DDD + número (ex: (43) 99999-9999).'
    };
  }

  // Bloqueio de dígitos repetidos fictícios (ex: 11111111111, 00000000000)
  if (/^(\d)\1+$/.test(digits)) {
    return { valid: false, error: 'Número de telefone inválido (dígitos todos iguais).' };
  }

  // Códigos DDD válidos no Brasil (Anatel)
  const validDDDs = [
    11, 12, 13, 14, 15, 16, 17, 18, 19,
    21, 22, 24,
    27, 28,
    31, 32, 33, 34, 35, 37, 38,
    41, 42, 43, 44, 45, 46, // PR (43 é Vale do Ivaí/Ivaiporã)
    47, 48, 49,
    51, 53, 54, 55,
    61, 62, 63, 64, 65, 66, 67, 68, 69,
    71, 73, 74, 75, 77, 79,
    81, 82, 83, 84, 85, 86, 87, 88, 89,
    91, 92, 93, 94, 95, 96, 97, 98, 99
  ];

  const ddd = parseInt(digits.slice(0, 2), 10);
  if (!validDDDs.includes(ddd)) {
    return { valid: false, error: `O DDD (${ddd}) informado não é válido no Brasil.` };
  }

  // Celular com 11 dígitos deve iniciar com 9 após o DDD
  if (digits.length === 11 && digits[2] !== '9') {
    return {
      valid: false,
      error: 'Telefone celular de 11 dígitos deve iniciar com 9 após o DDD (ex: (43) 9XXXX-XXXX).'
    };
  }

  // Fixo com 10 dígitos não pode iniciar com 0 ou 1 após o DDD
  if (digits.length === 10 && ['0', '1'].includes(digits[2])) {
    return {
      valid: false,
      error: 'O telefone fixo não pode iniciar com 0 ou 1 após o DDD.'
    };
  }

  return { valid: true };
}

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

    // Bloqueio de termos troll, piadas ou alimentos no cargo
    const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
    for (const w of words) {
      if (GENERAL_TROLL_WORDS.has(w)) {
        return {
          valid: false,
          error: `O termo "${w}" não é apropriado para um cargo ou profissão de trabalho. Especifique uma ocupação legítima.`
        };
      }
    }

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

    // Bloqueio de termos troll ou gírias em competências
    const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
    for (const w of words) {
      if (GENERAL_TROLL_WORDS.has(w)) {
        return {
          valid: false,
          error: `O termo "${w}" não é aceito como uma competência profissional.`
        };
      }
    }

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

// 5.1 BLACKLIST DE PALAVRAS TROLL / BOBAGENS / ALIMENTOS FORA DE CONTEXTO EM BENEFÍCIOS
export const BENEFIT_TROLL_WORDS = new Set([
  // Frutas e alimentos que não constituem benefícios corporativos isolados
  'abacaxi', 'banana', 'melancia', 'abacate', 'manga', 'mamao', 'mamão', 'laranja',
  'maca', 'maçã', 'uva', 'morango', 'kiwi', 'limao', 'limão', 'goiaba', 'pera', 'pêra',
  'pitanga', 'jabuticaba', 'maracuja', 'maracujá', 'melao', 'melão',
  'coxinha', 'pastel', 'pizza', 'churrasco', 'pipoca', 'hamburguer', 'hotdog',
  'cerveja', 'chopp', 'chope', 'pinga', 'cachaca', 'cachaça', 'vodka', 'vinho', 'whisky', 'energetico',
  'cigarro', 'narguile', 'fumo',
  // Gírias, brincadeiras, zoeiras e termos sem contexto de RH
  'fofoca', 'namoro', 'sexo', 'zoeira', 'palhacada', 'palhaçada', 'piada', 'preguica', 'preguiça',
  'sono', 'dormir', 'mentira', 'besteira', 'bobagem', 'troca', 'fake', 'teste', 'asdf', 'qwert',
  'jogo', 'truco', 'videogame', 'playstation', 'xbox', 'free fire', 'tinder', 'balada', 'festa',
  'ping pong', 'ping-pong', 'sinuca', 'pebolim', 'futebol'
]);

// 5.2 MODIFICADORES VÁLIDOS POR TIPO DE ESTRUTURA DE BENEFÍCIO
const VALID_INSURANCE_MODIFIERS = [
  'vida', 'saude', 'saúde', 'acidente', 'acidentes', 'acidentes pessoais',
  'invalidez', 'morte', 'grupo', 'odontologico', 'odontológico', 'viagem',
  'veiculo', 'veículo', 'automovel', 'automóvel', 'carro', 'residencial', 'funeral', 'estagiario', 'estagiário'
];

const VALID_VOUCHER_MODIFIERS = [
  'refeicao', 'refeição', 'alimentacao', 'alimentação', 'transporte', 'combustivel', 'combustível',
  'gas', 'gás', 'cultura', 'livro', 'livros', 'farmacia', 'farmácia', 'pedagio', 'pedágio',
  'lanche', 'compras', 'alimentar', 'viagem', 'mobilidade'
];

const VALID_PLAN_MODIFIERS = [
  'saude', 'saúde', 'medico', 'médico', 'odontologico', 'odontológico', 'dental', 'carreira',
  'previdencia', 'previdência', 'farmacia', 'farmácia', 'coparticipacao', 'coparticipação',
  'hospitalar', 'ambulatorial', 'psicologico', 'psicológico', 'oftalmologico', 'oftalmológico'
];

const VALID_AUXILIO_MODIFIERS = [
  'creche', 'baba', 'babá', 'educacao', 'educação', 'estudo', 'estudos', 'curso', 'cursos',
  'graduacao', 'graduação', 'pos', 'pós', 'home office', 'remoto', 'combustivel', 'combustível',
  'transporte', 'moradia', 'aluguel', 'mudanca', 'mudança', 'alimentacao', 'alimentação',
  'refeicao', 'refeição', 'farmacia', 'farmácia', 'saude', 'saúde', 'academia', 'linguas', 'línguas',
  'idiomas', 'ingles', 'inglês', 'espanhol', 'funeral', 'luto', 'casamento', 'filhos', 'pcd',
  'ergonomia', 'internet', 'energia', 'mobilidade', 'escolar', 'material', 'maternidade', 'paternidade'
];

const VALID_BOLSA_MODIFIERS = [
  'estudo', 'estudos', 'graduacao', 'graduação', 'pos', 'pós', 'pos-graduacao', 'pós-graduação',
  'mestrado', 'doutorado', 'idiomas', 'curso', 'cursos', 'treinamento', 'capacitacao', 'capacitação',
  'estagio', 'estágio', 'pesquisa'
];

const VALID_DAYOFF_MODIFIERS = [
  'aniversario', 'aniversário', 'aniversariante', 'casamento', 'metas', 'natal', 'ano novo',
  'tempo de casa', 'tempo de empresa', 'empresa', 'nascimento'
];

// 5.3 CONCEITOS E TERMOS CORPORATIVOS HOMOLOGADOS PARA BENEFÍCIOS
const RECOGNIZED_BENEFIT_CONCEPTS = [
  'refeitorio', 'refeitório', 'restaurante', 'cafe da manha', 'café da manhã',
  'frutas no escritorio', 'frutas no escritório', 'lanche', 'gympass', 'wellhub', 'totalpass', 'academia',
  'telemedicina', 'psicologo', 'psicólogo', 'psicologia', 'terapia', 'massoterapia',
  'quick massage', 'ginastica laboral', 'ginástica laboral', 'estacionamento',
  'fretado', 'transporte fretado', 'bicicletario', 'bicicletário', 'vestiario', 'vestiário',
  'horario flexivel', 'horário flexível', 'home office', 'trabalho remoto', 'hibrido', 'híbrido',
  'short friday', 'sexta-feira curta', 'banco de horas', 'licenca maternidade', 'licença maternidade',
  'licenca paternidade', 'licença paternidade', 'plr', 'ppr', 'lucros e resultados',
  'bonus', 'bônus', 'premiacao', 'premiação', 'comissao', 'comissão', 'previdencia privada',
  'previdência privada', 'consignado', 'emprestimo', 'empréstimo', '14 salario', '14º salário',
  'clube de descontos', 'desconto em produtos', 'convenio farmacia', 'convênio farmácia',
  'parcerias', 'convenios', 'convênios', 'uniforme', 'epi', 'notebook', 'celular corporativo',
  'equipamento', 'descompressao', 'descompressão', 'dress code', 'pet friendly',
  'cesta basica', 'cesta básica', 'cesta de natal', 'participacao nos lucros',
  'participação nos lucros', 'reembolso', 'certificacao', 'certificação', 'plano de carreira'
];

/**
 * Validador Inteligente de Benefícios e Vantagens Corporativas
 * Rejeita termos sem sentido profissional (ex: "seguro de abacaxi", "vale cerveja", "auxílio fofoca")
 * e valida se o benefício pertence ao catálogo corporativo ou se segue uma semântica de RH legítima.
 */
export function validateBenefit(benefitName) {
  if (!benefitName || typeof benefitName !== 'string') {
    return { valid: false, error: 'O nome do benefício é obrigatório.' };
  }

  const clean = benefitName.trim();

  if (clean.length < 3) {
    return { valid: false, error: 'O benefício deve conter no mínimo 3 caracteres.' };
  }

  if (clean.length > 70) {
    return { valid: false, error: 'O nome do benefício deve conter no máximo 70 caracteres.' };
  }

  // 1. Filtro estrito anti-palavrões
  if (hasProfanity(clean)) {
    return { valid: false, error: 'Termo impróprio ou inadequado para um benefício profissional.' };
  }

  // 2. Validação básica de caracteres profissionais
  const basicVal = validateProfessionalText(clean, 'Benefício', 3, 70);
  if (!basicVal.valid) {
    return basicVal;
  }

  if (!/[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(clean)) {
    return { valid: false, error: 'O benefício deve conter letras e representar uma vantagem profissional real.' };
  }

  // 3. Normalização para comparação semântica
  const norm = clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 4. Detecção de termos troll / piadas / comidas aleatórias
  const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (BENEFIT_TROLL_WORDS.has(w)) {
      return {
        valid: false,
        error: `O termo "${w}" não é aceito como benefício corporativo legítimo. Informe uma vantagem profissional real.`
      };
    }
  }

  // 5. Correspondência direta com benefícios do Catálogo Oficial
  const isExactStandard = STANDARD_BENEFITS.some(st => {
    const normSt = st.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return norm === normSt || norm.includes(normSt) || normSt.includes(norm);
  });
  if (isExactStandard) {
    return { valid: true };
  }

  // 6. Validação Semântica Estruturada para Prefixos Corporativos

  // 6.1 Seguro
  if (/\bseguro\b/.test(norm)) {
    const hasValidInsurance = VALID_INSURANCE_MODIFIERS.some(mod => {
      const normMod = mod.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm.includes(normMod);
    });
    if (!hasValidInsurance) {
      return {
        valid: false,
        error: 'Benefício do tipo Seguro inválido. Seguros corporativos devem ser voltados a Vida, Saúde, Acidentes ou Veículo (ex: "Seguro de Vida em Grupo").'
      };
    }
    return { valid: true };
  }

  // 6.2 Vale
  if (/\bvale\b/.test(norm)) {
    const hasValidVoucher = VALID_VOUCHER_MODIFIERS.some(mod => {
      const normMod = mod.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm.includes(normMod);
    });
    if (!hasValidVoucher) {
      return {
        valid: false,
        error: 'Benefício do tipo Vale inválido. Vales corporativos devem ser voltados a Alimentação, Refeição, Transporte, Combustível, Farmácia ou Cultura (ex: "Vale Alimentação", "Vale Transporte").'
      };
    }
    return { valid: true };
  }

  // 6.3 Plano
  if (/\bplano\b/.test(norm)) {
    const hasValidPlan = VALID_PLAN_MODIFIERS.some(mod => {
      const normMod = mod.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm.includes(normMod);
    });
    if (!hasValidPlan) {
      return {
        valid: false,
        error: 'Benefício do tipo Plano inválido. Planos corporativos devem ser voltados a Saúde, Médico, Odontológico, Previdência ou Carreira (ex: "Plano de Saúde", "Plano Odontológico").'
      };
    }
    return { valid: true };
  }

  // 6.4 Auxílio
  if (/\bauxilio\b/.test(norm)) {
    const hasValidAuxilio = VALID_AUXILIO_MODIFIERS.some(mod => {
      const normMod = mod.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm.includes(normMod);
    });
    if (!hasValidAuxilio) {
      return {
        valid: false,
        error: 'Benefício do tipo Auxílio inválido. Auxílios corporativos devem ser voltados a Creche, Educação, Home Office, Transporte ou Saúde (ex: "Auxílio Creche", "Auxílio Home Office").'
      };
    }
    return { valid: true };
  }

  // 6.5 Bolsa
  if (/\bbolsa\b/.test(norm)) {
    const hasValidBolsa = VALID_BOLSA_MODIFIERS.some(mod => {
      const normMod = mod.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm.includes(normMod);
    });
    if (!hasValidBolsa) {
      return {
        valid: false,
        error: 'Benefício do tipo Bolsa inválido. Deve ser voltado a Estudos, Cursos, Idiomas ou Estágio (ex: "Bolsa de Estudos").'
      };
    }
    return { valid: true };
  }

  // 6.6 Day Off / Folga
  if (/\bday\s*off\b|\bfolga\b/.test(norm)) {
    const hasValidDayoff = VALID_DAYOFF_MODIFIERS.some(mod => {
      const normMod = mod.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm.includes(normMod);
    });
    if (!hasValidDayoff) {
      return {
        valid: false,
        error: 'Benefício de Folga/Day-off inválido. Deve ser voltado a Aniversário, Metas ou Datas Comemorativas (ex: "Day Off no Aniversário").'
      };
    }
    return { valid: true };
  }

  // 6.7 Cesta
  if (/\bcesta\b/.test(norm)) {
    const hasValidCesta = /\bbasica\b|\bnatal\b|\balimentos?\b/.test(norm);
    if (!hasValidCesta) {
      return {
        valid: false,
        error: 'Benefício de Cesta inválido (ex: "Cesta Básica", "Cesta de Natal").'
      };
    }
    return { valid: true };
  }

  // 7. Conceitos corporativos reconhecidos sem prefixo padrão
  const matchesConcept = RECOGNIZED_BENEFIT_CONCEPTS.some(concept => {
    const normConcept = concept.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return norm.includes(normConcept);
  });

  if (matchesConcept) {
    return { valid: true };
  }

  // 8. Se não corresponder a nenhuma das regras de mercado, rejeita amigavelmente
  return {
    valid: false,
    error: `O benefício "${clean}" não é reconhecido como uma vantagem corporativa válida (ex.: Vale Refeição, Plano de Saúde, Gympass, Auxílio Creche, Seguro de Vida). Selecione uma opção no catálogo de benefícios ou informe uma vantagem corporativa homologada.`
  };
}

/**
 * Validador Estrito e Padronizado de Remuneração / Salário
 * Exige estritamente valores numéricos no formato 2500,00 (ou separador de milhar 2.500,00),
 * ou a seleção de "A Combinar". Rejeita textos livres, termos genéricos e valores fora dos limites CLT.
 */
export function validateSalary(salary, isRequired = true) {
  if (!salary || typeof salary !== 'string' || !salary.trim()) {
    if (isRequired) {
      return {
        valid: false,
        error: 'Informe a remuneração no formato 2500,00 ou selecione "A Combinar".'
      };
    }
    return { valid: true };
  }

  const clean = salary.trim();

  // Opção legítima de mercado "A Combinar"
  if (clean.toLowerCase() === 'a combinar') {
    return { valid: true };
  }

  if (clean.length > 30) {
    return { valid: false, error: 'O campo de remuneração deve conter no máximo 30 caracteres.' };
  }

  if (hasProfanity(clean)) {
    return { valid: false, error: 'Termo impróprio ou ofensivo detectado na remuneração.' };
  }

  // Remove prefixo monetário opcional "R$" ou "r$" e espaços
  const withoutCurrency = clean.replace(/^r\$\s*/i, '').trim();

  // Rejeita qualquer letra no campo (o usuário deve digitar apenas números no formato 2500,00)
  if (/[a-zA-Z]/.test(withoutCurrency)) {
    return {
      valid: false,
      error: 'A remuneração deve conter apenas números no formato 2500,00 (ex: 2500,00) ou selecione "A Combinar".'
    };
  }

  // Formato estrito: apenas dígitos com vírgula e 2 casas decimais (ex: 2500,00 ou 2.500,00)
  const normalized = withoutCurrency.replace(/\s+/g, '');
  const formatRegex = /^\d{1,6},\d{2}$|^\d{1,3}(\.\d{3})*,\d{2}$/;

  if (!formatRegex.test(normalized)) {
    return {
      valid: false,
      error: 'Formato de salário inválido. Utilize apenas números com centavos separados por vírgula (ex: 2500,00).'
    };
  }

  // Extrai valor numérico float
  const numericValue = parseFloat(normalized.replace(/\./g, '').replace(',', '.'));

  if (isNaN(numericValue)) {
    return {
      valid: false,
      error: 'Valor de salário numérico inválido.'
    };
  }

  if (numericValue < 400) {
    return {
      valid: false,
      error: 'O valor mínimo de salário permitido é 400,00 (bolsa-auxílio/aprendiz). Para outros casos, selecione "A Combinar".'
    };
  }

  if (numericValue > 150000) {
    return {
      valid: false,
      error: 'O valor da remuneração não pode ultrapassar 150000,00.'
    };
  }

  return { valid: true };
}

/**
 * Validador Inteligente de Carga Horária / Jornada de Trabalho
 */
export function validateWorkingHours(hours) {
  if (!hours || typeof hours !== 'string' || !hours.trim()) {
    return { valid: false, error: 'A carga horária / jornada de trabalho é obrigatória.' };
  }
  const clean = hours.trim();
  if (clean.length < 5) {
    return { valid: false, error: 'A jornada de trabalho deve conter no mínimo 5 caracteres.' };
  }
  if (clean.length > 90) {
    return { valid: false, error: 'A jornada de trabalho deve conter no máximo 90 caracteres.' };
  }
  if (hasProfanity(clean)) {
    return { valid: false, error: 'Termo impróprio detectado na carga horária.' };
  }

  const norm = clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Bloqueio de termos troll
  const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (GENERAL_TROLL_WORDS.has(w)) {
      return {
        valid: false,
        error: `O termo "${w}" não é apropriado para uma jornada de trabalho.`
      };
    }
  }

  // Conceitos reais de horários, turnos, escalas e regimes de trabalho
  const SCHEDULE_CONCEPTS = [
    'semanais', 'semanal', 'diarias', 'diárias', 'diaria', 'diária',
    'segunda', 'sexta', 'sabado', 'sábado', 'domingo', 'escala',
    '12x36', '6x1', '5x2', 'flexivel', 'flexível', 'comercial',
    'plantao', 'plantão', 'a combinar', 'integral', 'meio periodo', 'meio período',
    'estagio', 'estágio', 'aprendiz', 'turno', 'diurno', 'noturno', 'horas', 'hora'
  ];

  const hasScheduleConcept = SCHEDULE_CONCEPTS.some(concept => norm.includes(concept)) || /\d+\s*h|\d+:\d+/.test(norm);

  if (!hasScheduleConcept) {
    return {
      valid: false,
      error: 'A carga horária deve especificar uma escala ou horário real (ex: "40h semanais • 08:00 às 17:00 (Segunda a Sexta)" ou "Escala 6x1").'
    };
  }

  return { valid: true };
}

/**
 * Validador Inteligente de Descrição Detalhada da Vaga
 * Exige um contexto profissional legítimo de trabalho e bloqueia piadas, termos informais e textos sem sentido.
 */
export function validateJobDescription(description) {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'A descrição da vaga é obrigatória (mínimo 30 caracteres ou use o Modelo Padrão).' };
  }

  const clean = description.trim();

  // Validação básica profissional (mínimo 30, máximo 2000, repetições, palavrões, etc.)
  const basicVal = validateProfessionalText(clean, 'Descrição da Vaga', 30, 2000);
  if (!basicVal.valid) {
    return basicVal;
  }

  const norm = clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Detecção de termos troll / piadas / termos não corporativos
  const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (GENERAL_TROLL_WORDS.has(w)) {
      return {
        valid: false,
        error: `O termo "${w}" não é apropriado para a descrição de uma vaga profissional. Detalhe as reais responsabilidades e contexto da oportunidade.`
      };
    }
  }

  // Vocabulário de contexto corporativo e de trabalho
  const CORPORATE_CONTEXT_KEYWORDS = [
    'empresa', 'equipe', 'time', 'trabalho', 'rotina', 'atendimento', 'desenvolvimento',
    'processo', 'cliente', 'atividade', 'responsavel', 'responsabilidades', 'experiencia',
    'atuar', 'apoio', 'sistema', 'execucao', 'servico', 'vaga', 'setor', 'horario',
    'funcao', 'conhecimento', 'oportunidade', 'requisito', 'requisitos', 'profissional',
    'qualificacao', 'habilidades', 'comunicacao', 'beneficios', 'salario', 'remuneracao',
    'candidato', 'candidata', 'missao', 'organizacao', 'unidade', 'loja', 'escritorio',
    'obra', 'fabrica', 'producao', 'area', 'gestao', 'projeto', 'rotinas', 'vendas',
    'mercado', 'ambiente', 'perfil', 'dinamico', 'busca', 'proativo'
  ];

  const hasCorporateContext = CORPORATE_CONTEXT_KEYWORDS.some(kw => norm.includes(kw));

  if (!hasCorporateContext) {
    return {
      valid: false,
      error: 'A descrição da vaga deve fornecer contexto sobre a oportunidade, rotinas ou perfil profissional esperado (ex: atuação no setor, atendimento, requisitos técnicos). Utilize o botão "Modelo Padrão" se preferir.'
    };
  }

  return { valid: true };
}

/**
 * Validador Inteligente de Atividades e Responsabilidades
 * Bloqueia termos que não representam ações e responsabilidades de trabalho legítimas.
 */
export function validateResponsibility(activity) {
  if (!activity || typeof activity !== 'string') {
    return { valid: false, error: 'A atividade / responsabilidade é obrigatória.' };
  }

  const clean = activity.trim();

  if (clean.length < 5) {
    return { valid: false, error: 'A atividade deve conter no mínimo 5 caracteres.' };
  }

  if (clean.length > 120) {
    return { valid: false, error: 'A atividade deve conter no máximo 120 caracteres.' };
  }

  if (hasProfanity(clean)) {
    return { valid: false, error: 'Termo impróprio ou inadequado detectado na atividade.' };
  }

  const basicVal = validateProfessionalText(clean, 'Atividade', 5, 120);
  if (!basicVal.valid) {
    return basicVal;
  }

  const norm = clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Bloqueio de termos troll
  const words = norm.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (GENERAL_TROLL_WORDS.has(w)) {
      return {
        valid: false,
        error: `O termo "${w}" não é apropriado para uma responsabilidade profissional de trabalho.`
      };
    }
  }

  // Raízes de verbos de ação e termos ocupacionais típicos de responsabilidades
  const ACTION_OCCUPATIONAL_STEMS = [
    'atend', 'execut', 'realiz', 'elabor', 'desenvolv', 'organiz', 'apoi', 'control',
    'acompanh', 'gerenci', 'mant', 'oper', 'auxili', 'prepar', 'analis', 'confer',
    'coorden', 'particip', 'contat', 'vend', 'prospect', 'registr', 'emit', 'program',
    'planej', 'limp', 'arrum', 'conduz', 'instal', 'monitor', 'aliment', 'prest',
    'assegur', 'garant', 'cuid', 'ministr', 'recepcion', 'orient', 'trein', 'supervision',
    'verific', 'rotin', 'process', 'document', 'relatori', 'estoqu', 'sistem', 'client',
    'equip', 'servi', 'taref', 'pedid', 'venda', 'caixa', 'chamad', 'suport', 'comunic',
    'entreg', 'carg', 'descarg', 'produ', 'inspecion', 'digit', 'arquiv', 'ligac',
    'reuniao', 'financeir', 'faturament', 'fechament', 'cobranc', 'supriment'
  ];

  const hasActionOrDuty = ACTION_OCCUPATIONAL_STEMS.some(stem => norm.includes(stem));

  if (!hasActionOrDuty) {
    return {
      valid: false,
      error: 'A atividade informada deve descrever uma tarefa ou rotina de trabalho real (ex.: "Atendimento ao cliente e suporte", "Emissão de notas fiscais e relatórios").'
    };
  }

  return { valid: true };
}

/**
 * Detecta e identifica linguagem inapropriada / ofensas em um texto.
 * Retorna se possui profanidade e qual raiz/palavra foi identificada.
 */
export function detectProfanity(text) {
  if (!text || typeof text !== 'string') return { hasProfanity: false };
  const lower = text.toLowerCase().trim();
  const cleanAlpha = lower.replace(/[^a-z0-9]/g, '');
  if (!cleanAlpha) return { hasProfanity: false };

  // 1. Checa raízes ofensivas
  for (const root of PROFANITY_ROOTS) {
    if (cleanAlpha.includes(root)) {
      return { hasProfanity: true, matchedWord: root };
    }
  }

  // 2. Checa termos da lista
  for (const b of PROFANITY_LIST) {
    if (b.length >= 3) {
      if (lower.includes(b) || cleanAlpha.includes(b)) {
        return { hasProfanity: true, matchedWord: b };
      }
    }
  }

  // 3. Termos curtos como 'cu' isolados ou compostos
  const regexCu = /(^|\W|_|\d)cu($|\W|_|\d|zao|zão|dao|dão|bost|merd|lhao|lhão|zinh[oa])/i;
  if (regexCu.test(lower) || cleanAlpha === 'cu') {
    return { hasProfanity: true, matchedWord: 'termo impróprio' };
  }

  if (/^cu(zao|zão|dao|dão|bost|merd|lhao|lhão|zinh[oa])/i.test(cleanAlpha)) {
    return { hasProfanity: true, matchedWord: 'termo impróprio' };
  }

  return { hasProfanity: false };
}

/**
 * Verifica se um texto contém linguagem inapropriada / palavrões.
 * Usado como filtro leve para publicações no banco de dados.
 */
export function hasProfanity(text) {
  return detectProfanity(text).hasProfanity;
}

