/**
 * Script de Teste Automatizado da Validação CBO
 * Executa cenários de aceitação e rejeição de cargos profissionais
 */
import { validateJobTitle, STANDARD_JOB_TITLES } from '../App/src/services/jobTaxonomy.js';

console.log('🧪 Iniciando testes de validação da CBO (Ivaí Conecta)...\n');
console.log(`📚 Total de ocupações oficiais CBO cadastradas no catálogo: ${STANDARD_JOB_TITLES.length}\n`);

// 1. Casos que DEVEM PASSAR (incluindo cargos que antes eram rejeitados por falta de palavras-chave)
const validCases = [
  // Profissões tradicionais e regulamentadas que antes falhavam
  'Biólogo',
  'Bióloga',
  'Topógrafo',
  'Agrimensor',
  'Arquiteto',
  'Arquiteta',
  'Geólogo',
  'Oceanógrafo',
  'Físico',
  'Químico',
  'Bioquímico',
  'Estatístico',
  'Sociólogo',
  'Historiador',
  'Filósofo',
  'Jornalista',
  'Publicitário',
  'Fotógrafo',
  'Tradutor',
  'Intérprete',
  'Redator',
  'Bibliotecário',
  'Arquivista',
  'Psicopedagogo',
  'Fonoaudiólogo',
  'Protético Dentário',
  'Podólogo',
  'Massoterapeuta',
  'Socorrista',
  'Bombeiro Civil',
  'Zootecnista',
  'Apicultor',
  'Jardineiro',
  'Paisagista',
  'Sommelier',
  'Barista',
  'Chef de Cozinha',
  'Pizzaiolo',
  'Sushiman',
  'Padeiro',
  'Confeiteiro',
  'Açougueiro',
  'Camareira',
  'Gesseiro',
  'Vidraceiro',
  'Azulejista',
  'Caldeireiro',
  'Funileiro',
  'Estofador',
  'Alfaiate',
  'Costureiro',
  'Sapateiro',
  'Ourives',
  'Lapidador',
  'Ceramista',
  'Tatuador',
  'Maquiador',
  'Manicure',
  'Corretor de Imóveis',
  'Despachante',
  'Agente de Viagens',
  'Guia de Turismo',
  'Agente Comunitário de Saúde',
  'Taxista',
  'Motoboy',
  'Carteiro',
  'Empacotador',
  'Conferente',

  // Cargos com Senioridade / Nível
  'Biólogo Júnior',
  'Jornalista Sênior',
  'Psicólogo Pleno',
  'Topógrafo II',
  'Arquiteto Pleno',
  'Desenvolvedor Full Stack Sênior',

  // Cargos com Especialidades Profissionais
  'Advogado Trabalhista',
  'Médico Pediatra',
  'Biólogo Marinho',
  'Jornalista Esportivo',
  'Fotógrafo Publicitário',
  'Designer de Interiores',
  'Professor de Matemática',
  'Tradutor de Inglês',
  'Mecânico Diesel',
  'Eletricista Automotivo',
  'Vendedor Externo',
  'Cozinheiro Industrial',
  'Soldador TIG',
  'Operador de Torno CNC',

  // Estruturas Função + Domínio
  'Auxiliar de Almoxarifado',
  'Assistente de Departamento Pessoal',
  'Analista de Suporte Técnico',
  'Gerente de Vendas',
  'Estagiário de Direito',
  'Técnico em Edificações',
  'Técnico em Agropecuária'
];

// 2. Casos que DEVEM SER REJEITADOS (incluindo termos incompletos que antes eram aceitos erroneamente)
const invalidCases = [
  // Termos puramente hierárquicos isolados (sem especificar a função)
  { title: 'chefe', reason: 'Termo hierárquico isolado' },
  { title: 'gerente', reason: 'Termo hierárquico isolado' },
  { title: 'auxiliar', reason: 'Termo hierárquico isolado' },
  { title: 'assistente', reason: 'Termo hierárquico isolado' },
  { title: 'estagiario', reason: 'Termo hierárquico isolado' },
  { title: 'diretor', reason: 'Termo hierárquico isolado' },
  { title: 'supervisor', reason: 'Termo hierárquico isolado' },
  { title: 'coordenador', reason: 'Termo hierárquico isolado' },
  { title: 'lider', reason: 'Termo hierárquico isolado' },

  // Áreas e siglas genéricas isoladas (não são cargos de trabalho)
  { title: 'ti', reason: 'Área/sigla isolada' },
  { title: 'dev', reason: 'Abreviação isolada' },
  { title: 'dados', reason: 'Área isolada' },
  { title: 'redes', reason: 'Área isolada' },
  { title: 'suporte', reason: 'Área isolada' },
  { title: 'software', reason: 'Área isolada' },
  { title: 'marketing', reason: 'Área isolada' },
  { title: 'rh', reason: 'Sigla/departamento isolado' },
  { title: 'vendas', reason: 'Área isolada' },

  // Frases inválidas com palavras-chave embutidas
  { title: 'chefe da gangue', reason: 'Domínio ilegal/inválido' },
  { title: 'auxiliar de tomar cafe', reason: 'Atividade sem contexto de trabalho' },
  { title: 'analista de brincadeira', reason: 'Termo não profissional' },
  { title: 'dev de nada', reason: 'Termo sem sentido' },

  // Números aleatórios e gibberish
  { title: 'vendedor123', reason: 'Sufixo numérico aleatório' },
  { title: 'asdfgh', reason: 'Sequência de teclado' },
  { title: 'banana', reason: 'Alimento avulso' },
  { title: 'abacaxi', reason: 'Alimento avulso' }
];

let validFailures = 0;
let invalidFailures = 0;

console.log('✅ Verificando cargos válidos (CBO):');
for (const title of validCases) {
  const result = validateJobTitle(title);
  if (!result.valid) {
    console.error(`  ❌ ERRO: "${title}" deveria ser ACEITO, mas foi rejeitado: "${result.error}"`);
    validFailures++;
  }
}

if (validFailures === 0) {
  console.log(`  🎉 Todos os ${validCases.length} cargos válidos foram aprovados com sucesso!`);
}

console.log('\n🚫 Verificando termos incorretos e inválidos:');
for (const item of invalidCases) {
  const result = validateJobTitle(item.title);
  if (result.valid) {
    console.error(`  ❌ ERRO: "${item.title}" (${item.reason}) deveria ser REJEITADO, mas foi aceito!`);
    invalidFailures++;
  }
}

if (invalidFailures === 0) {
  console.log(`  🛡️ Todos os ${invalidCases.length} termos incorretos foram bloqueados com sucesso!`);
}

console.log('\n📊 Resumo Geral:');
console.log(`  - Cargos válidos aprovados: ${validCases.length - validFailures}/${validCases.length}`);
console.log(`  - Termos inválidos bloqueados: ${invalidCases.length - invalidFailures}/${invalidCases.length}`);

if (validFailures > 0 || invalidFailures > 0) {
  console.error('\n❌ Houve falhas no teste de CBO.');
  process.exit(1);
} else {
  console.log('\n✨ Todos os testes da CBO passaram com 100% de precisão!\n');
  process.exit(0);
}
