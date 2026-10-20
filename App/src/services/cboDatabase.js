/**
 * Base de Ocupações Homologadas da Classificação Brasileira de Ocupações (CBO)
 * Ministério do Trabalho e Emprego (MTE) / Padrão de Mercado de Trabalho
 * Ivaí Conecta - Vale do Ivaí
 */

export const CBO_OCCUPATIONS = [
  // 1. Tecnologia da Informação & Computação
  'Desenvolvedor(a) Front-end',
  'Desenvolvedor(a) Back-end',
  'Desenvolvedor(a) Full Stack',
  'Desenvolvedor(a) Mobile',
  'Desenvolvedor(a) de Software',
  'Engenheiro(a) de Software',
  'Arquiteto(a) de Software',
  'Analista de Sistemas',
  'Analista de Suporte Técnico',
  'Analista de Dados & BI',
  'Cientista de Dados',
  'Engenheiro(a) de Dados',
  'Administrador(a) de Banco de Dados (DBA)',
  'Administrador(a) de Redes',
  'Especialista em Segurança da Informação',
  'Analista de Segurança Cibernética',
  'Analista de Qualidade e Testes (QA)',
  'Engenheiro(a) DevOps',
  'UI/UX Designer',
  'Product Owner (PO)',
  'Scrum Master',
  'Técnico(a) em Informática',
  'Técnico(a) de Manutenção de Computadores',
  'Técnico(a) em Redes de Computadores',
  'Web Designer',
  'Programador(a) Web',
  'Estagiário(a) de TI / Software',

  // 2. Gestão, Administração, RH, Contabilidade & Finanças
  'Administrador(a)',
  'Auxiliar Administrativo',
  'Assistente Administrativo',
  'Analista Administrativo',
  'Coordenador(a) Administrativo(a)',
  'Gerente Administrativo',
  'Diretor(a) Administrativo(a)',
  'Auxiliar de Escritório',
  'Recepcionista',
  'Recepcionista / Atendente',
  'Telefonista',
  'Secretário(a) Executivo(a)',
  'Secretário(a) Administrativo(a)',
  'Auxiliar de Recursos Humanos (RH)',
  'Assistente de Recursos Humanos (RH)',
  'Analista de Recursos Humanos (RH)',
  'Coordenador(a) de Recursos Humanos (RH)',
  'Gerente de Recursos Humanos (RH)',
  'Analista de Recrutamento e Seleção',
  'Auxiliar de Departamento Pessoal (DP)',
  'Assistente de Departamento Pessoal (DP)',
  'Analista de Departamento Pessoal (DP)',
  'Auxiliar Contábil',
  'Assistente Contábil',
  'Analista Contábil',
  'Contador(a)',
  'Auditor(a) Contábil',
  'Auditor(a) Fiscal',
  'Perito(a) Contábil',
  'Auxiliar Fiscal',
  'Assistente Fiscal',
  'Analista Fiscal',
  'Auxiliar Financeiro',
  'Assistente Financeiro',
  'Analista Financeiro',
  'Coordenador(a) Financeiro(a)',
  'Gerente Financeiro',
  'Diretor(a) Financeiro(a) (CFO)',
  'Analista de Controladoria / Controller',
  'Auxiliar de Cobrança',
  'Assistente de Cobrança',
  'Analista de Crédito e Cobrança',
  'Tesoureiro(a)',
  'Economista',
  'Arquivista',
  'Despachante Documentalista',

  // 3. Jurídico & Compliance
  'Advogado(a)',
  'Advogado(a) Trabalhista',
  'Advogado(a) Tributarista',
  'Advogado(a) Cível',
  'Advogado(a) Corporativo(a)',
  'Assistente Jurídico',
  'Analista Jurídico',
  'Consultor(a) Jurídico(a)',
  'Analista de Compliance',
  'Estagiário(a) de Direito',

  // 4. Comercial, Vendas & Atendimento ao Cliente
  'Vendedor(a) Comercial',
  'Vendedor(a) Interno(a)',
  'Vendedor(a) Externo(a)',
  'Atendente de Loja',
  'Atendente de Balcão',
  'Balconista',
  'Consultor(a) de Vendas',
  'Representante Comercial',
  'Executivo(a) de Contas (B2B)',
  'Gerente de Loja / Unidade',
  'Gerente Comercial / Vendas',
  'Supervisor(a) de Vendas',
  'Coordenador(a) de Vendas',
  'Assistente Comercial',
  'Analista Comercial',
  'Operador(a) de Caixa',
  'Fiscal de Caixa / Loja',
  'Promotor(a) de Vendas',
  'Demonstrador(a) de Mercadorias',
  'Auxiliar de Compras',
  'Assistente de Compras',
  'Comprador(a)',
  'Analista de Compras / Suprimentos',
  'Operador(a) de Telemarketing',
  'Atendente de SAC / Call Center',
  'Analista de Atendimento ao Cliente',
  'Analista de Sucesso do Cliente (Customer Success)',
  'Corretor(a) de Imóveis',
  'Corretor(a) de Seguros',

  // 5. Marketing, Comunicação, Mídia & Criação
  'Analista de Marketing',
  'Assistente de Marketing',
  'Coordenador(a) de Marketing',
  'Gerente de Marketing',
  'Social Media & Marketing Digital',
  'Analista de Tráfego Pago',
  'Especialista em SEO',
  'Designer Gráfico',
  'Designer de Embalagens',
  'Designer de Interiores',
  'Criador(a) de Conteúdo / Copywriter',
  'Redator(a) Publicitário(a)',
  'Revisor(a) de Texto',
  'Jornalista',
  'Repórter',
  'Assessor(a) de Imprensa',
  'Relações Públicas',
  'Publicitário(a)',
  'Fotógrafo(a)',
  'Cinegrafista / Operador(a) de Câmera',
  'Editor(a) de Vídeo',
  'Animador(a) 2D / 3D',
  'Ilustrador(a)',
  'Produtor(a) Audiovisual',
  'Locutor(a) / Radialista',
  'Tradutor(a) / Intérprete',

  // 6. Agropecuária, Campo, Pesca & Meio Ambiente
  'Engenheiro(a) Agrônomo(a)',
  'Agrônomo(a)',
  'Técnico(a) Agrícola',
  'Técnico(a) em Agropecuária',
  'Zootecnista',
  'Médico(a) Veterinário(a)',
  'Veterinário(a)',
  'Trabalhador(a) Rural',
  'Produtor(a) Rural',
  'Tratorista Agrícola',
  'Operador(a) de Trator e Máquinas Agrícolas',
  'Operador(a) de Colheitadeira',
  'Campeiro(a) / Vaqueiro(a)',
  'Ordenhador(a)',
  'Auxiliar de Pecuária',
  'Manejador(a) de Pastagens e Solos',
  'Técnico(a) em Piscicultura / Aquicultura',
  'Piscicultor(a)',
  'Apicultor(a)',
  'Avicultor(a)',
  'Pecuarista',
  'Floricultor(a)',
  'Jardineiro(a)',
  'Paisagista',
  'Engenheiro(a) Florestal',
  'Técnico(a) Florestal',
  'Engenheiro(a) Ambiental',
  'Analista Ambiental',
  'Biólogo(a)',

  // 7. Saúde, Enfermagem, Farmácia & Cuidados
  'Médico(a) Clínico Geral',
  'Médico(a) do Trabalho',
  'Médico(a) Pediatra',
  'Médico(a) Cardiologista',
  'Médico(a) Ginecologista e Obstetra',
  'Médico(a) Ortopedista',
  'Médico(a) Cirurgião(ã)',
  'Enfermeiro(a)',
  'Enfermeiro(a) do Trabalho',
  'Técnico(a) em Enfermagem',
  'Auxiliar de Enfermagem',
  'Farmacêutico(a)',
  'Farmacêutico(a) Bioquímico(a)',
  'Farmacêutico(a) Hospitalar',
  'Atendente de Farmácia / Balconista',
  'Fisioterapeuta',
  'Fisioterapeuta Respiratório(a)',
  'Nutricionista',
  'Nutricionista Clínico(a)',
  'Psicólogo(a)',
  'Psicólogo(a) Clínico(a)',
  'Psicólogo(a) Organizacional',
  'Cirurgião(ã)-Dentista / Dentista',
  'Auxiliar de Saúde Bucal (ASB)',
  'Técnico(a) em Prótese Dentária / Protético(a)',
  'Fonoaudiólogo(a)',
  'Terapeuta Ocupacional',
  'Biomédico(a)',
  'Técnico(a) em Radiologia',
  'Técnico(a) de Laboratório e Análises Clínicas',
  'Cuidador(a) de Idosos',
  'Agente Comunitário de Saúde (ACS)',
  'Agente Comunitário de Saúde',
  'Agente de Combate às Endemias',
  'Condutor(a) de Ambulância',
  'Massoterapeuta',
  'Podólogo(a)',
  'Quiropraxista',
  'Acupunturista',
  'Óptico(a) / Optometrista',

  // 8. Educação, Pedagogia & Treinamento
  'Professor(a) / Docente',
  'Professor(a) de Educação Infantil',
  'Professor(a) de Ensino Fundamental',
  'Professor(a) de Ensino Médio',
  'Professor(a) de Ensino Superior',
  'Professor(a) de Idiomas',
  'Professor(a) de Educação Física',
  'Professor(a) de Matemática',
  'Professor(a) de Português e Literatura',
  'Professor(a) de História',
  'Professor(a) de Geografia',
  'Professor(a) de Biologia',
  'Professor(a) de Física',
  'Professor(a) de Química',
  'Professor(a) de Artes',
  'Pedagogo(a)',
  'Psicopedagogo(a)',
  'Coordenador(a) Pedagógico(a)',
  'Orientador(a) Educacional',
  'Diretor(a) Escolar',
  'Instrutor(a) de Treinamento',
  'Instrutor(a) de Autoescola (CFC)',
  'Monitor(a) Escolar / Educacional',
  'Educador(a) Social',
  'Bibliotecário(a)',

  // 9. Indústria, Manutenção, Mecânica & Elétrica
  'Engenheiro(a) Mecânico(a)',
  'Engenheiro(a) Eletricista',
  'Engenheiro(a) de Produção',
  'Engenheiro(a) Químico(a)',
  'Engenheiro(a) de Segurança do Trabalho',
  'Técnico(a) em Segurança do Trabalho',
  'Técnico(a) em Mecânica',
  'Técnico(a) em Mecatrônica / Automação',
  'Técnico(a) em Eletrotécnica',
  'Técnico(a) em Química',
  'Operador(a) de Produção',
  'Auxiliar de Produção',
  'Líder de Produção',
  'Supervisor(a) de Produção',
  'Gerente de Produção / Industrial',
  'Eletricista Industrial',
  'Eletricista Predial',
  'Eletricista de Manutenção',
  'Eletricista Automotivo',
  'Eletrotécnico(a)',
  'Mecânico de Manutenção',
  'Mecânico Industrial',
  'Mecânico de Automóveis / Veículos',
  'Mecânico Diesel',
  'Mecânico de Motocicletas',
  'Torneiro(a) Mecânico(a)',
  'Operador(a) de Torno CNC',
  'Fresador(a)',
  'Soldador(a) (MIG / TIG / Elétrica)',
  'Caldeireiro(a)',
  'Ferramenteiro(a)',
  'Serralheiro(a)',
  'Operador(a) de Caldeira / Caldeirista',
  'Operador(a) de Empilhadeira',
  'Operador(a) de Ponte Rolante',
  'Inspetor(a) de Qualidade',
  'Auxiliar de Controle de Qualidade',
  'Analista de Qualidade Industrial',
  'Funileiro(a) / Latoeiro(a)',
  'Pintor(a) Automotivo / Industrial',

  // 10. Construção Civil, Arquitetura & Obras
  'Engenheiro(a) Civil',
  'Arquiteto(a) Urbanista',
  'Arquiteto(a)',
  'Mestre de Obras',
  'Encarregado(a) de Obras',
  'Técnico(a) em Edificações',
  'Topógrafo(a)',
  'Agrimensor(a)',
  'Pedreiro(a)',
  'Servente de Obras / Ajudante de Pedreiro',
  'Armador(a) de Ferragens',
  'Carpinteiro(a) de Obras',
  'Encanador(a) / Instalador(a) Hidráulico',
  'Pintor(a) Predial / Residencial',
  'Gesseiro(a)',
  'Azulejista / Ladrilheiro',
  'Vidraceiro(a)',
  'Marceneiro(a)',
  'Montador(a) de Móveis',
  'Instalador(a) de Drywall',

  // 11. Logística, Armazenagem, Distribuição & Transportes
  'Auxiliar de Logística',
  'Assistente de Logística',
  'Analista de Logística',
  'Coordenador(a) de Logística',
  'Gerente de Logística / Supply Chain',
  'Estoquista',
  'Auxiliar de Estoque',
  'Almoxarife',
  'Auxiliar de Almoxarifado',
  'Conferente de Carga e Descarga',
  'Expedidor(a) de Mercadorias',
  'Separador(a) / Embalador(a) de Pedidos',
  'Repositor(a) de Mercadorias',
  'Motorista de Veículos Leves',
  'Motorista de Caminhão',
  'Motorista Carreteiro',
  'Motorista de Ônibus / Transporte Coletivo',
  'Motorista de Van / Escolar',
  'Motorista / Entregador',
  'Motoboy / Motociclista de Entregas',
  'Manobrista',
  'Chapa / Carregador de Caminhão',
  'Despachante Aduaneiro',
  'Agente de Viagens',
  'Guia de Turismo',
  'Guia Turístico',

  // 12. Alimentação, Gastronomia & Hotelaria
  'Cozinheiro(a)',
  'Auxiliar de Cozinha',
  'Chefe de Cozinha / Chef Executivo(a)',
  'Garçom / Garçonete',
  'Cumim',
  'Bartender / Barman',
  'Barista',
  'Sommelier',
  'Padeiro(a)',
  'Auxiliar de Padaria',
  'Confeiteiro(a)',
  'Açougueiro(a)',
  'Auxiliar de Açougue',
  'Pizzaiolo(a)',
  'Sushiman',
  'Churrasqueiro(a)',
  'Copeiro(a)',
  'Camareira de Hotel',
  'Governanta de Hotel',
  'Recepcionista de Hotel',
  'Gerente de Restaurante / Hotel',

  // 13. Beleza, Estética, Moda & Cuidados Pessoais
  'Cabeleireiro(a)',
  'Barbeiro',
  'Manicure e Pedicure',
  'Esteticista',
  'Maquiador(a)',
  'Designer de Sobrancelhas',
  'Tatuador(a) / Body Piercer',
  'Costureiro(a)',
  'Costureiro(a) Industrial',
  'Modelista',
  'Alfaiate',
  'Sapateiro(a)',
  'Estofador(a)',
  'Ourives / Joalheiro(a)',
  'Lapidador(a)',
  'Ceramista',

  // 14. Segurança, Limpeza, Portaria & Serviços Gerais
  'Vigilante Patrimonial',
  'Vigilante de Segurança Pessoal',
  'Vigilante de Transporte de Valores',
  'Bombeiro(a) Civil',
  'Porteiro(a)',
  'Agente de Portaria',
  'Vigia',
  'Zelador(a)',
  'Auxiliar de Limpeza / Faxineiro(a)',
  'Auxiliar de Serviços Gerais (ASG)',
  'Lavador(a) de Veículos',
  'Frentista',
  'Borracheiro(a)',
  'Dedetizador(a)',
  'Gari / Coletor(a) de Resíduos',

  // 15. Ciências, Cultura, Artes & Ciências Sociais
  'Biólogo(a)',
  'Biomédico(a)',
  'Oceanógrafo(a)',
  'Geólogo(a)',
  'Meteorologista',
  'Astrônomo(a)',
  'Físico(a)',
  'Químico(a)',
  'Bioquímico(a)',
  'Matemático(a)',
  'Estatístico(a)',
  'Atuário(a)',
  'Sociólogo(a)',
  'Antropólogo(a)',
  'Historiador(a)',
  'Arqueólogo(a)',
  'Filósofo(a)',
  'Museólogo(a)',
  'Ator / Atriz',
  'Músico(a) / Instrumentista',
  'Coreógrafo(a) / Dançarino(a)',
  'Cenógrafo(a)',
  'Figurinista'
];

/**
 * Normaliza uma string para comparação fonética/textual neutra (sem acentos e minúsculo)
 */
export function normalizeCboText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Extrai a forma base neutra de uma ocupação removendo sufixos de gênero (a), (o), /a, /o e siglas entre parênteses
 */
export function stripGenderSuffixes(normText) {
  return normText
    .replace(/\s*\([a-z0-9&/+\s-]+\)/gi, '')
    .replace(/\/[ao]\b/gi, '')
    .replace(/[-_][ao]\b/gi, '')
    .trim();
}

// Conjunto indexado para busca O(1) de ocupações completas
const CBO_NORMALIZED_SET = new Set(
  CBO_OCCUPATIONS.flatMap(title => {
    const norm = normalizeCboText(title);
    const base = stripGenderSuffixes(norm);
    const withoutParentheses = norm.replace(/\s*\([^)]*\)/g, '').trim();
    const items = [norm, base, withoutParentheses];

    // Gera variações masculinas e femininas comuns
    if (norm.includes('(a)') || norm.includes('/a')) {
      items.push(norm.replace(/\(a\)/g, '').replace(/\/a/g, '').trim());
      items.push(norm.replace(/\(a\)/g, 'a').replace(/\/a/g, 'a').trim());
    }
    if (norm.includes('(o)') || norm.includes('/o')) {
      items.push(norm.replace(/\(o\)/g, '').replace(/\/o/g, '').trim());
      items.push(norm.replace(/\(o\)/g, 'o').replace(/\/o/g, 'o').trim());
    }

    return items.filter(Boolean);
  })
);

// Núcleos ocupacionais reconhecidos pelo CBO (substantivos de profissão oficiais)
export const CBO_CORE_OCCUPATIONS = new Set([
  // Ciências, Engenharia, Arquitetura & Tecnologia
  'biologo', 'biologa', 'topografo', 'topografa', 'agrimensor', 'agrimensora',
  'arquiteto', 'arquiteta', 'urbanista', 'geologo', 'geologa', 'oceanografo', 'oceanografa',
  'meteorologista', 'astronomo', 'astronoma', 'fisico', 'fisica', 'quimico', 'quimica',
  'bioquimico', 'bioquimica', 'matematico', 'matematica', 'estatistico', 'estatistica',
  'atuario', 'atuaria', 'engenheiro', 'engenheira', 'desenvolvedor', 'desenvolvedora',
  'programador', 'programadora', 'webdesigner', 'designer',

  // Saúde, Farmácia & Cuidados
  'medico', 'medica', 'cirurgiao', 'cirurgia', 'enfermeiro', 'enfermeira',
  'farmaceutico', 'farmaceutica', 'fisioterapeuta', 'nutricionista', 'psicologo', 'psicologa',
  'dentista', 'protetico', 'protetica', 'fonoaudiologo', 'fonoaudiologa',
  'terapeuta', 'biomedico', 'biomedica', 'cuidador', 'cuidadora', 'socorrista',
  'paramedico', 'paramedica', 'massoterapeuta', 'podologo', 'podologa', 'quiropraxista',
  'acupunturista', 'optico', 'optica', 'optometrista', 'veterinario', 'veterinaria',

  // Educação, Humanas, Comunicação & Artes
  'professor', 'professora', 'docente', 'pedagogo', 'pedagoga', 'psicopedagogo', 'psicopedagoga',
  'bibliotecario', 'bibliotecaria', 'arquivista', 'museologo', 'museologa',
  'sociologo', 'sociologa', 'antropologo', 'antropologa', 'historiador', 'historiadora',
  'arqueologo', 'arqueologa', 'filosofo', 'filosofa', 'jornalista', 'reporter',
  'publicitario', 'publicitaria', 'fotografo', 'fotografa', 'cinegrafista',
  'redator', 'redatora', 'revisor', 'revisora', 'editor', 'editora',
  'tradutor', 'tradutora', 'interprete', 'locutor', 'locutora', 'radialista',
  'ator', 'atriz', 'musico', 'musica', 'coreografo', 'coreografa', 'cenografo', 'cenografa',

  // Jurídico, Gestão & Administração
  'advogado', 'advogada', 'contador', 'contadora', 'auditor', 'auditora',
  'economista', 'administrador', 'administradora', 'recepcionista', 'telefonista',
  'secretario', 'secretaria', 'despachante',

  // Comercial, Atendimento & Vendas
  'vendedor', 'vendedora', 'balconista', 'atendente', 'comprador', 'compradora',
  'corretor', 'corretora', 'promotor', 'promotora', 'demonstrador', 'demonstradora',

  // Agropecuária & Campo
  'agronomo', 'agronoma', 'zootecnista', 'tratorista', 'campeiro', 'campeira',
  'vaqueiro', 'vaqueira', 'ordenhador', 'ordenhadora', 'piscicultor', 'piscicultora',
  'apicultor', 'apicultora', 'avicultor', 'avicultora', 'pecuarista', 'floricultor', 'floricultora',
  'jardineiro', 'jardineira', 'paisagista',

  // Operacional, Manutenção, Indústria & Construção
  'eletricista', 'eletrotecnico', 'eletrotecnica', 'mecanico', 'mecanica',
  'torneiro', 'torneira', 'fresador', 'fresadora', 'soldador', 'soldadora',
  'caldeireiro', 'caldeireira', 'ferramenteiro', 'ferramenteira', 'serralheiro', 'serralheira',
  'caldeirista', 'funileiro', 'funileira', 'latoeiro', 'latoeira',
  'pedreiro', 'pedreira', 'servente', 'encanador', 'encanadora',
  'pintor', 'pintora', 'gesseiro', 'gesseira', 'azulejista', 'vidraceiro', 'vidraceira',
  'marceneiro', 'marceneira', 'carpinteiro', 'carpinteira', 'estofador', 'estofadora',

  // Alimentação, Hotelaria & Serviços
  'cozinheiro', 'cozinheira', 'chef', 'garcom', 'garconete', 'cumim',
  'barista', 'sommelier', 'bartender', 'barman', 'padeiro', 'padeira',
  'confeiteiro', 'confeiteira', 'acougueiro', 'acougueira', 'pizzaiolo', 'pizzaiola',
  'sushiman', 'churrasqueiro', 'churrasqueira', 'copeiro', 'copeira',
  'camareira', 'governanta', 'porteiro', 'porteira', 'vigia', 'vigilante',
  'zelador', 'zeladora', 'faxineiro', 'faxineira', 'frentista', 'borracheiro', 'borracheira',

  // Beleza, Moda & Pessoais
  'cabeleireiro', 'cabeleireira', 'barbeiro', 'manicure', 'pedicure', 'esteticista',
  'maquiador', 'maquiadora', 'tatuador', 'tatuadora', 'costureiro', 'costureira',
  'alfaiate', 'sapateiro', 'sapateira', 'ourives', 'lapidador', 'lapidadora', 'ceramista',

  // Logística, Transporte & Serviços
  'motorista', 'motoboy', 'motociclista', 'manobrista', 'estoquista', 'almoxarife',
  'conferente', 'expedidor', 'expedidora', 'empacotador', 'empacotadora', 'repositor', 'repositora',
  'carteiro', 'carteira', 'chapa', 'taxista', 'agente', 'guia'
]);

// Prefixos funcionais que exigem complemento com área ou ocupação profissional
export const CBO_FUNCTIONAL_PREFIXES = [
  'auxiliar de', 'auxiliar em', 'auxiliar',
  'assistente de', 'assistente em', 'assistente',
  'analista de', 'analista em', 'analista',
  'coordenador de', 'coordenador em', 'coordenador', 'coordenadora de', 'coordenadora em', 'coordenadora',
  'gerente de', 'gerente em', 'gerente',
  'diretor de', 'diretor em', 'diretor', 'diretora de', 'diretora em', 'diretora',
  'supervisor de', 'supervisor em', 'supervisor', 'supervisora de', 'supervisora em', 'supervisora',
  'lider de', 'lider em', 'lider',
  'especialista em', 'especialista de', 'especialista',
  'consultor de', 'consultor em', 'consultor', 'consultora de', 'consultora em', 'consultora',
  'tecnico de', 'tecnico em', 'tecnico', 'tecnica de', 'tecnica em', 'tecnica',
  'estagiario de', 'estagiario em', 'estagiario', 'estagiaria de', 'estagiaria em', 'estagiaria', 'estagio em', 'estagio de',
  'instrutor de', 'instrutor em', 'instrutor', 'instrutora de', 'instrutora em', 'instrutora',
  'professor de', 'professor em', 'professora de', 'professora em',
  'engenheiro de', 'engenheira de',
  'operador de', 'operadora de', 'operador', 'operadora',
  'inspetor de', 'inspetor em', 'inspetor', 'inspetora de', 'inspetora em', 'inspetora',
  'agente de', 'agente em',
  'guia de',
  'chefe de', 'chefe'
];

// Áreas, especialidades e domínios profissionais válidos para complementar funções
export const CBO_PROFESSIONAL_DOMAINS = new Set([
  // Administrativo, Gestão, RH & Finanças
  'rh', 'recursos humanos', 'departamento pessoal', 'dp', 'administracao', 'administrativo', 'administrativa',
  'financeiro', 'financeira', 'financas', 'contabilidade', 'contabil', 'fiscal', 'escrita fiscal',
  'compras', 'suprimentos', 'almoxarifado', 'estoque', 'expedicao', 'faturamento',
  'credito e cobranca', 'cobranca', 'credito', 'contas a pagar', 'contas a receber', 'tesouraria',
  'controladoria', 'compliance', 'ouvidoria', 'qualidade', 'processos', 'projetos', 'operacoes',
  'viagens', 'turismo', 'endemias', 'saude', 'saude comunitaria', 'saude publica',

  // Comercial, Marketing & Atendimento
  'vendas', 'comercial', 'pos-venda', 'pos vendas', 'atendimento', 'atendimento ao cliente',
  'sac', 'relacionamento', 'sucesso do cliente', 'customer success', 'telemarketing',
  'marketing', 'marketing digital', 'midias sociais', 'redes sociais', 'trafego pago', 'seo',
  'conteudo', 'comunicacao', 'imprensa', 'eventos', 'propaganda', 'publicidade',

  // Tecnologia & TI
  'ti', 'tecnologia', 'suporte', 'suporte tecnico', 'sistemas', 'software', 'redes', 'infraestrutura',
  'banco de dados', 'dados', 'business intelligence', 'bi', 'seguranca da informacao', 'cybersecurity',
  'devops', 'automacao', 'inteligencia artificial', 'qa', 'testes', 'desenvolvimento',

  // Indústria, Manutenção, Produção & Agro
  'producao', 'linha de producao', 'manutencao', 'manutencao industrial', 'manutencao eletrica',
  'manutencao mecanica', 'manutencao predial', 'seguranca do trabalho', 'meio ambiente',
  'planejamento e controle de producao', 'pcp', 'logistica', 'transporte', 'frotas',
  'agronomia', 'agropecuaria', 'agricultura', 'pecuaria', 'veterinaria', 'solos', 'plantio',
  'irrigacao', 'colheita', 'graos', 'aves', 'suinos', 'bovinos', 'leite',

  // Construção, Técnica & Obras
  'obras', 'edificacoes', 'construcao civil', 'instalacoes', 'eletrica', 'mecanica',
  'hidraulica', 'eletrotecnica', 'mecatronica', 'automacao industrial', 'quimica',
  'topografia', 'agrimensura', 'georreferenciamento', 'projetos civis', 'drywall', 'acabamento',

  // Saúde, Educação & Serviços
  'enfermagem', 'farmacia', 'laboratorio', 'analises clinicas', 'radiologia',
  'saude bucal', 'prótese dentaria', 'triagem', 'coleta', 'ambulatorio',
  'ensino', 'educacao infantil', 'ensino fundamental', 'ensino medio', 'treinamento',
  'cozinha', 'padaria', 'confeitaria', 'acougue', 'restaurante', 'hotelaria',
  'limpeza', 'servicos gerais', 'portaria', 'seguranca patrimonial', 'vigilancia'
]);

// Modificadores de Senioridade e Nível
export const CBO_SENIORITY_MODIFIERS = new Set([
  'junior', 'jr', 'pleno', 'pl', 'senior', 'sr', 'trainee', 'estagiario', 'estagiaria',
  'lead', 'tech lead', 'lider', 'especialista', 'principal', 'master',
  'i', 'ii', 'iii', 'iv', 'v', '1', '2', '3', '4',
  'nivel 1', 'nivel 2', 'nivel 3', 'nivel i', 'nivel ii', 'nivel iii',
  'grau a', 'grau b', 'grau c'
]);

// Termos isolados de hierarquia que NÃO são cargos completos sozinhos
export const INCOMPLETE_HIERARCHICAL_ROLES = new Set([
  'chefe', 'chefes',
  'gerente', 'gerentes',
  'diretor', 'diretora', 'diretores', 'diretoras',
  'supervisor', 'supervisora', 'supervisores', 'supervisoras',
  'coordenador', 'coordenadora', 'coordenadores', 'coordenadoras',
  'auxiliar', 'auxiliares',
  'assistente', 'assistentes',
  'estagiario', 'estagiaria', 'estagiarios', 'estagio', 'estágio',
  'trainee', 'trainees',
  'aprendiz', 'aprendizes',
  'ajudante', 'ajudantes',
  'lider', 'líder', 'lideres', 'líderes',
  'assessor', 'assessora', 'assessores', 'assessoras',
  'consultor', 'consultora', 'consultores',
  'especialista', 'especialistas',
  'analista', 'analistas'
]);

// Departamentos, siglas e áreas isoladas que NÃO são cargos sozinhos
export const INCOMPLETE_AREAS_AND_ACRONYMS = new Set([
  'ti', 'dev', 'dados', 'redes', 'suporte', 'software', 'hardware', 'marketing', 'rh', 'dp',
  'vendas', 'comercial', 'financeiro', 'logistica', 'producao', 'administracao', 'juridico',
  'contabilidade', 'engenharia', 'enfermagem', 'medicina', 'educacao', 'comunicacao',
  'qualidade', 'manutencao', 'informatica', 'compras', 'estoque', 'almoxarifado'
]);

/**
 * Verifica se um texto normalizado é um termo isolado/incompleto (que a validação antiga aceitava incorretamente)
 */
export function isIsolatedIncompleteRole(words, normText) {
  if (!words || words.length === 0) return true;

  // 1. Se for uma única palavra e pertencer a cargos de hierarquia isolados
  if (words.length === 1) {
    const single = words[0];
    if (INCOMPLETE_HIERARCHICAL_ROLES.has(single)) return true;
    if (INCOMPLETE_AREAS_AND_ACRONYMS.has(single)) return true;
  }

  // 2. Duas palavras que representam apenas combinações de hierarquia sem função
  // Ex: "chefe chefe", "auxiliar assistente", "gerente lider"
  if (words.length === 2) {
    if (INCOMPLETE_HIERARCHICAL_ROLES.has(words[0]) && INCOMPLETE_HIERARCHICAL_ROLES.has(words[1])) {
      return true;
    }
  }

  // 3. Siglas/áreas isoladas (ex: "apenas ti", "somente rh")
  if (normText === 'ti' || normText === 'dev' || normText === 'software' || normText === 'redes' || normText === 'dados') {
    return true;
  }

  return false;
}

/**
 * Remove modificadores de senioridade do final ou início do texto
 */
export function stripSeniority(normText) {
  let cleaned = normText.trim();

  // Remove sufixos como Jr, Pl, Sr, Sênior, I, II, III
  for (const mod of CBO_SENIORITY_MODIFIERS) {
    const regexEnd = new RegExp(`\\s+${mod}$`, 'i');
    if (regexEnd.test(cleaned)) {
      cleaned = cleaned.replace(regexEnd, '').trim();
      break;
    }
    const regexStart = new RegExp(`^${mod}\\s+`, 'i');
    if (regexStart.test(cleaned)) {
      cleaned = cleaned.replace(regexStart, '').trim();
      break;
    }
  }

  return cleaned;
}

/**
 * Avalia se o título corresponde a uma ocupação CBO legítima:
 * 1. Correspondência direta ou com sufixos de gênero na base CBO
 * 2. Correspondência CBO + Senioridade (ex: Biólogo Júnior, Jornalista Sênior)
 * 3. Estrutura [Função/Prefixo] + [de/em] + [Área/Domínio CBO reconhecido]
 * 4. Núcleo CBO reconhecido + qualificadores legítimos (ex: Advogado Trabalhista, Médico Pediatra, Biólogo Marinho)
 */
export function isRecognizedCboOccupation(normText, _rawText = '') {
  if (!normText) return false;

  const cleanNorm = normText.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const baseTitle = stripGenderSuffixes(cleanNorm);
  const withoutSeniority = stripSeniority(baseTitle);

  // A. Correspondência Direta na Base Oficial CBO
  if (CBO_NORMALIZED_SET.has(cleanNorm) || CBO_NORMALIZED_SET.has(baseTitle) || CBO_NORMALIZED_SET.has(withoutSeniority)) {
    return true;
  }

  // B. Estrutura [Função/Prefixo] + [de/em] + [Domínio Profissional Legítimo]
  // Ex: "Auxiliar de Almoxarifado", "Assistente de DP", "Gerente de Produção", "Estagiário de Direito"
  for (const prefix of CBO_FUNCTIONAL_PREFIXES) {
    if (withoutSeniority.startsWith(prefix + ' ')) {
      const remainder = withoutSeniority.slice(prefix.length).trim();
      if (!remainder) continue;

      // Se o complemento for um domínio profissional homologado
      if (CBO_PROFESSIONAL_DOMAINS.has(remainder)) {
        return true;
      }

      // Se o complemento for uma ocupação CBO reconhecida (ex: "Auxiliar de Topografia", "Assistente de Fotografia")
      if (CBO_NORMALIZED_SET.has(remainder) || CBO_CORE_OCCUPATIONS.has(remainder)) {
        return true;
      }

      // Se o complemento for uma área profissional composta
      const domainWords = remainder.split(/\s+/);
      const hasValidDomainWord = domainWords.some(w => CBO_PROFESSIONAL_DOMAINS.has(w) || CBO_CORE_OCCUPATIONS.has(w));
      if (hasValidDomainWord && domainWords.length <= 4) {
        return true;
      }
    }
  }

  // C. Núcleo CBO Reconhecido (substantivo ocupacional oficial)
  // Ex: "Biólogo", "Topógrafo", "Químico", "Jornalista", "Psicólogo", "Fisioterapeuta", "Nutricionista",
  // "Biólogo Marinho", "Topógrafo de Campo", "Jornalista Esportivo", "Barista Especialista", "Marceneiro de Planejados"
  const words = withoutSeniority.split(/\s+/).filter(Boolean);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (CBO_CORE_OCCUPATIONS.has(word)) {
      // Se for a palavra única ou com qualificadores razoáveis (até 5 palavras)
      if (words.length <= 5) {
        return true;
      }
    }

    // Trata plurais e variações comuns em português (biólogos -> biologo, químicas -> quimica)
    if (word.endsWith('s')) {
      const singular = word.slice(0, -1);
      if (CBO_CORE_OCCUPATIONS.has(singular) && words.length <= 5) {
        return true;
      }
    }
  }

  // D. Ocupações com especialidades compostas diretas da base CBO
  // Ex: "Desenvolvedor de Software", "Engenheiro de Software", "Auxiliar de Enfermagem", "Cirurgião-Dentista"
  const isCboSubmatch = CBO_OCCUPATIONS.some(cboTitle => {
    const normCbo = normalizeCboText(cboTitle);
    const cboBase = stripGenderSuffixes(normCbo);

    if (withoutSeniority === cboBase || withoutSeniority === normCbo) return true;

    // Se o título do usuário começa exatamente com uma ocupação CBO oficial completa
    if (withoutSeniority.startsWith(cboBase + ' ') || withoutSeniority.startsWith(normCbo + ' ')) {
      return true;
    }

    return false;
  });

  if (isCboSubmatch) {
    return true;
  }

  return false;
}
