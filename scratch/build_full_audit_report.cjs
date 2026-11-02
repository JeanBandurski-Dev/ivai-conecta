const fs = require('fs');
const path = require('path');

const fields = JSON.parse(fs.readFileSync(path.join(__dirname, 'audit_data.json'), 'utf8')).filter(f => f.type !== 'hidden');
const moduleMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'audit_module_map.json'), 'utf8'));

// Analysis function for each field to determine current frontend validation and backend validation
function analyzeField(f) {
  const file = f.file;
  const name = f.nameOrId;
  const type = f.type;
  const placeholder = f.placeholder;

  let purpose = '';
  let feValidation = '';
  let beValidation = '';

  // Determine purpose and current validations
  if (file === 'App/src/pages/Login.jsx') {
    if (name.includes('Email') || type === 'email') {
      purpose = 'E-mail do usuário para autenticação / cadastro';
      feValidation = 'HTML required + regex básica de e-mail';
      beValidation = 'Firebase Auth verifica formato e unicidade no provider';
    } else if (name.includes('Pass')) {
      purpose = 'Senha de acesso';
      feValidation = f.line === 794 ? 'HTML required, min 6 caracteres' : 'HTML required';
      beValidation = 'Firebase Auth exige mínimo de 6 caracteres';
    } else if (name.includes('Cnpj')) {
      purpose = 'CNPJ da empresa para cadastro PJ';
      feValidation = 'Máscara live + validateCNPJ (dígitos verificadores)';
      beValidation = 'Nenhuma no Firestore Rules / sem verificação na API da Receita no backend';
    } else if (name.includes('Name')) {
      purpose = 'Nome completo ou Razão Social no cadastro';
      feValidation = 'HTML required, maxLength 70';
      beValidation = 'Parcial em firestore.rules (string, 2 a 120 chars, sem anti-troll/anti-xss)';
    }
  } else if (file === 'App/src/pages/CompletarPerfil.jsx') {
    if (name.includes('studentEmail') || name.includes('teacherEmail')) {
      purpose = 'E-mail institucional (@ifpr, @uenp, @univale, .edu.br)';
      feValidation = 'Regex de domínio educacional .edu.br';
      beValidation = 'firestore.rules verifica email_verified para flag de estudante';
    } else if (name.includes('cnpj')) {
      purpose = 'CNPJ de empresa no onboarding';
      feValidation = 'validateCNPJ + máscara';
      beValidation = 'Ausente no backend';
    } else if (name.includes('name')) {
      purpose = 'Nome de exibição no onboarding';
      feValidation = 'maxLength 70, required';
      beValidation = 'Parcial em firestore.rules';
    }
  } else if (file === 'App/src/pages/Configuracoes.jsx') {
    if (name === 'name') {
      purpose = 'Nome do usuário ou Razão Social';
      feValidation = 'validateAccountName (anti-troll, tamanho, profanidade)';
      beValidation = 'firestore.rules checa se é string e tamanho';
    } else if (name === 'email') {
      purpose = 'E-mail de acesso';
      feValidation = 'validateAccountEmail (formato, required)';
      beValidation = 'Firebase Auth';
    } else if (name === 'linkedin') {
      purpose = 'URL do perfil do LinkedIn';
      feValidation = 'validateAccountLinkedIn (anti-troll, formato linkedin.com/in/)';
      beValidation = 'Ausente no backend';
    } else if (name === 'github') {
      purpose = 'URL do GitHub ou portfólio';
      feValidation = 'validateAccountGitHubOrPortfolio (anti-troll, formato github.com/)';
      beValidation = 'Ausente no backend';
    } else if (name === 'raNumber') {
      purpose = 'RA / Matrícula acadêmica';
      feValidation = 'validateStudentRA (min 3, max 30, anti-troll)';
      beValidation = 'Ausente no backend';
    } else if (name === 'studentInstEmail') {
      purpose = 'E-mail institucional para envio de verificação';
      feValidation = 'validateStudentEmail (.edu.br)';
      beValidation = 'Firebase Auth sendSignInLinkToEmail / verifyBeforeUpdateEmail';
    } else if (name === 'cnpj') {
      purpose = 'CNPJ de empresa para verificação';
      feValidation = 'validateCNPJ + fetchCNPJData';
      beValidation = 'Ausente no backend';
    } else if (name.includes('Password')) {
      purpose = 'Alteração e confirmação de senha';
      feValidation = 'validatePasswordChange (min 6, max 64, bloqueio de senhas fracas, repetição)';
      beValidation = 'Firebase Auth reauthenticateWithCredential + updatePassword';
    } else {
      purpose = 'Campo de perfil ou badge';
      feValidation = 'Nenhuma';
      beValidation = 'Ausente';
    }
  } else if (file === 'App/src/components/EditProfileModal.jsx') {
    if (name.includes('name')) {
      purpose = 'Nome completo do aluno/candidato';
      feValidation = 'required, maxLength 70';
      beValidation = 'firestore.rules (string, 2 a 120 chars)';
    } else if (name.includes('city')) {
      purpose = 'Cidade / Localização de atendimento';
      feValidation = 'required';
      beValidation = 'Ausente (qualquer string é aceita)';
    } else if (name.includes('course') || name.includes('institution') || name.includes('period') || name.includes('hourlyRate')) {
      purpose = 'Formação acadêmica, curso, instituição ou valor hora';
      feValidation = 'Nenhuma';
      beValidation = 'Ausente';
    } else if (name.includes('bio')) {
      purpose = 'Biografia / Resumo profissional do aluno';
      feValidation = 'Nenhuma';
      beValidation = 'Ausente (vulnerável a XSS / spam / spam links)';
    } else if (name.includes('newExp')) {
      purpose = 'Experiência profissional (cargo, empresa, período, descrição)';
      feValidation = 'Nenhuma';
      beValidation = 'Ausente (armazenado em array sem validação)';
    } else if (name.includes('newProj')) {
      purpose = 'Portfólio de projetos (título, tecnologias, link, descrição)';
      feValidation = 'type="url" no link';
      beValidation = 'Ausente (qualquer URL ou texto pode ser gravado)';
    } else if (name.includes('Skill')) {
      purpose = 'Habilidade técnica / Soft skill';
      feValidation = 'Nenhuma';
      beValidation = 'Ausente';
    } else if (name.includes('linkedin') || name.includes('github') || name.includes('avatar')) {
      purpose = 'Links de redes sociais ou URL de avatar';
      feValidation = 'type="url" básico do HTML5';
      beValidation = 'Ausente';
    }
  } else if (file === 'App/src/pages/PerfilAluno.jsx') {
    if (name.includes('profEmail') || name.includes('profName') || name.includes('discipline') || name.includes('proactiveDiscipline')) {
      purpose = 'Solicitação ou concessão de recomendação docente (disciplina e professor)';
      feValidation = 'required no envio';
      beValidation = 'firestore.rules (status inicial Pendente)';
    } else if (name.includes('proactiveQuote') || name.includes('customQuote')) {
      purpose = 'Parecer / Carta de recomendação pedagógica do professor para o aluno';
      feValidation = 'required no envio';
      beValidation = 'firestore.rules verifica se remetente é o profEmail';
    }
  } else if (file === 'App/src/components/EditCompanyProfileModal.jsx') {
    if (name.includes('name') || name.includes('tradingName')) {
      purpose = 'Razão Social ou Nome Fantasia da empresa';
      feValidation = 'validateCompanyName / validateTradingName (anti-troll, min/max, profanidade)';
      beValidation = 'Parcial em firestore.rules';
    } else if (name.includes('cnpj')) {
      purpose = 'CNPJ da empresa';
      feValidation = 'validateCNPJ + máscara';
      beValidation = 'Ausente no backend';
    } else if (name.includes('foundedYear')) {
      purpose = 'Ano de fundação da empresa';
      feValidation = 'maxLength 4 + checagem numérica';
      beValidation = 'Ausente';
    } else if (name.includes('description') || name.includes('culture')) {
      purpose = 'Apresentação institucional / Cultura e ambiente de trabalho';
      feValidation = 'validateCompanyAbout / validateCompanyCulture (anti-troll, min/max, sem conotação íntima)';
      beValidation = 'Ausente no backend';
    } else if (name.includes('Benefit')) {
      purpose = 'Cadastro de benefícios corporativos';
      feValidation = 'validateCompanyPerks (bloqueio de conotação íntima, bebidas, drogas, vestuário aleatório)';
      beValidation = 'Ausente no backend';
    } else if (name.includes('email')) {
      purpose = 'E-mail corporativo / RH da empresa';
      feValidation = 'validateAccountEmail (formato de e-mail corporativo)';
      beValidation = 'Ausente no backend';
    } else if (name.includes('website') || name.includes('linkedin') || name.includes('instagram') || name.includes('phone') || name.includes('coverImage') || name.includes('avatar')) {
      purpose = 'Contatos e canais sociais da empresa';
      feValidation = 'formValidation.js (validação de formato e ausência de termos de deboche)';
      beValidation = 'Ausente no backend';
    }
  } else if (file === 'App/src/components/EditTeacherProfileModal.jsx') {
    if (name.includes('name')) {
      purpose = 'Nome do professor / docente';
      feValidation = 'required, maxLength 70';
      beValidation = 'firestore.rules';
    } else if (name.includes('institution') || name.includes('discipline') || name.includes('degree')) {
      purpose = 'Instituição, disciplina lecionada ou titulação';
      feValidation = 'required no form';
      beValidation = 'Ausente';
    } else if (name.includes('bio')) {
      purpose = 'Biografia acadêmica e linhas de pesquisa';
      feValidation = 'Nenhuma';
      beValidation = 'Ausente';
    } else if (name.includes('lattes') || name.includes('linkedin') || name.includes('meetUrl') || name.includes('email')) {
      purpose = 'Currículo Lattes, LinkedIn, Google Meet ou E-mail institucional';
      feValidation = 'type="url" / type="email" nativo';
      beValidation = 'Ausente';
    } else {
      purpose = 'Campos de turmas e histórico educacional';
      feValidation = 'Nenhuma';
      beValidation = 'Ausente';
    }
  } else if (file === 'App/src/components/EditFreelancerProfileModal.jsx') {
    if (name.includes('name') || name.includes('specialty')) {
      purpose = 'Nome do profissional e especialidade técnica';
      feValidation = 'required, maxLength 70';
      beValidation = 'firestore.rules';
    } else if (name.includes('bio')) {
      purpose = 'Descrição dos serviços e formas de atendimento';
      feValidation = 'Nenhuma';
      beValidation = 'Ausente';
    } else if (name.includes('phone') || name.includes('cnpj')) {
      purpose = 'Telefone para contato e CNPJ';
      feValidation = 'Máscara visual';
      beValidation = 'Ausente';
    } else if (name.includes('experienceYears') || name.includes('availability') || name.includes('newSkill')) {
      purpose = 'Tempo de experiência, disponibilidade e habilidades';
      feValidation = 'Nenhuma';
      beValidation = 'Ausente';
    } else if (name.includes('newProject')) {
      purpose = 'Portfólio de serviços (título, link, descrição)';
      feValidation = 'Nenhuma';
      beValidation = 'Ausente';
    }
  } else if (file === 'App/src/components/PublishJobModal.jsx') {
    if (name.includes('salary')) {
      purpose = 'Remuneração ou faixa salarial da vaga';
      feValidation = 'maskCurrencyLive / validação CBO / maxLength 12';
      beValidation = 'jobsService filtra caracteres e profanidade básica';
    } else if (name.includes('recruiterPhone')) {
      purpose = 'WhatsApp / Telefone para contato com o recrutador';
      feValidation = 'validatePhoneNumber / maskPhone';
      beValidation = 'Ausente';
    } else if (name.includes('description')) {
      purpose = 'Descrição detalhada das atividades e requisitos da vaga';
      feValidation = 'validateJobDescription (min 50 chars, CBO, anti-troll, profanidade)';
      beValidation = 'firestore.rules checa apenas se é string';
    } else if (name.includes('respInput')) {
      purpose = 'Item de responsabilidade ou atribuição do cargo';
      feValidation = 'validateJobDuty (verbo de ação ou rotina real)';
      beValidation = 'Ausente';
    }
  } else if (file.includes('Combobox')) {
    purpose = 'Seleção e busca rápida de cargos CBO, benefícios ou habilidades';
    feValidation = 'Validação contra banco CBO e taxonomia de skills';
    beValidation = 'jobsService valida ocupação e skills contra catálogo oficial';
  } else if (file === 'App/src/components/PublishServiceModal.jsx' || file === 'App/src/pages/Servicos.jsx') {
    if (name.includes('title')) {
      purpose = 'Título do anúncio de serviço';
      feValidation = 'hasProfanity + required';
      beValidation = 'firestore.rules (string >= 3 chars)';
    } else if (name.includes('phone')) {
      purpose = 'Telefone de contato do prestador';
      feValidation = 'maskPhone, max 15';
      beValidation = 'Ausente';
    } else if (name.includes('price')) {
      purpose = 'Preço estimado ou valor cobrado pelo serviço';
      feValidation = 'formatCurrencyBRL';
      beValidation = 'Ausente';
    } else if (name.includes('description')) {
      purpose = 'Detalhamento do serviço, garantias e escopo';
      feValidation = 'hasProfanity + min 25 chars';
      beValidation = 'Ausente';
    } else if (name.includes('query')) {
      purpose = 'Barra de busca por serviços / termos';
      feValidation = 'Nenhuma';
      beValidation = 'N/A (consulta client-side)';
    } else {
      purpose = 'Dados complementares do prestador / endereço';
      feValidation = 'required';
      beValidation = 'Ausente';
    }
  } else if (file === 'App/src/components/SolicitarServicoModal.jsx') {
    if (name.includes('description')) {
      purpose = 'Descrição da solicitação de serviço / demanda';
      feValidation = 'validateServiceRequestForm (min 15 chars, anti-troll, profanidade)';
      beValidation = 'Ausente em service_orders';
    } else if (name.includes('phone')) {
      purpose = 'Telefone de contato do solicitante';
      feValidation = 'maskPhone + required';
      beValidation = 'Ausente';
    } else if (name.includes('budget') || name.includes('deadline')) {
      purpose = 'Orçamento estimado e prazo desejado para atendimento';
      feValidation = 'required no prazo';
      beValidation = 'Ausente';
    }
  } else if (file === 'App/src/components/AvaliarServicoModal.jsx') {
    purpose = 'Comentário e avaliação do cliente sobre o serviço recebido';
    feValidation = 'required, min 10 chars, hasProfanity';
    beValidation = 'firestore.rules restringe rating entre 0 e 5, mas comentário não tem sanitização';
  } else if (file === 'App/src/pages/PerfilAluno.jsx') {
    if (name.includes('profEmail') || name.includes('profName') || name.includes('discipline')) {
      purpose = 'Solicitação de recomendação docente (dados do professor e disciplina)';
      feValidation = 'required no email e disciplina';
      beValidation = 'firestore.rules (status inicial Pendente)';
    } else if (name.includes('proactiveQuote') || name.includes('customQuote')) {
      purpose = 'Parecer / Carta de recomendação pedagógica do professor para o aluno';
      feValidation = 'required no envio';
      beValidation = 'firestore.rules verifica se remetente é o profEmail';
    }
  } else if (file === 'App/src/pages/GerenciamentoVagasEmpresa.jsx') {
    if (name.includes('Search')) {
      purpose = 'Filtro e busca interna de candidatos / vagas / histórico';
      feValidation = 'Nenhuma';
      beValidation = 'N/A (filtro local em memória)';
    } else if (name.includes('stage.name') || name.includes('stage.description')) {
      purpose = 'Criação ou renomeação de etapa do funil de recrutamento';
      feValidation = 'maxLength 40 / 120';
      beValidation = 'Ausente';
    } else if (name.includes('unnamed') || name.includes('notes') || name.includes('feedback')) {
      purpose = 'Anotações da entrevista / feedback de seleção';
      feValidation = 'Nenhuma';
      beValidation = 'Ausente';
    } else if (name.includes('newCandidateForm')) {
      purpose = 'Cadastro manual de candidato em processo seletivo';
      feValidation = 'required básico';
      beValidation = 'Ausente';
    } else if (name.includes('editingJob')) {
      purpose = 'Edição rápida de título, salário e descrição de vaga';
      feValidation = 'required básico';
      beValidation = 'jobsService.updateJob';
    }
  } else if (file === 'App/src/components/ChatModal.jsx') {
    if (name.includes('searchTerm')) {
      purpose = 'Busca por conversas / contatos';
      feValidation = 'Nenhuma';
      beValidation = 'N/A (filtro client-side)';
    } else if (name.includes('messageInput')) {
      purpose = 'Mensagem de texto do chat em tempo real';
      feValidation = 'hasProfanity / pCheck bloqueando envio se ofensivo';
      beValidation = 'firestore.rules verifica autenticidade do remetente, mas falta anti-spam / anti-xss';
    }
  } else if (file.includes('admin')) {
    if (name.includes('search')) {
      purpose = 'Barra de pesquisa administrativa';
      feValidation = 'Nenhuma';
      beValidation = 'N/A';
    } else if (name.includes('reason')) {
      purpose = 'Justificativa textual de moderação / bloqueio de usuário ou vaga';
      feValidation = 'Nenhuma';
      beValidation = 'firestore.rules permite apenas admin';
    }
  } else if (file.includes('Vagas') || file.includes('BancoDeTalentos') || file.includes('Dashboard') || file.includes('CustomSelect')) {
    purpose = 'Barra de busca pública e filtros de pesquisa';
    feValidation = 'Nenhuma';
    beValidation = 'N/A (consultas com sanitizeQuery ou client-side filter)';
  } else {
    purpose = 'Entrada de dados do formulário';
    feValidation = f.required ? 'required' : 'Nenhuma';
    beValidation = 'Ausente';
  }

  return { purpose, feValidation, beValidation };
}

let report = '';
report += '# RELATÓRIO DE AUDITORIA COMPLETA DE CAMPOS DE TEXTO E SEGURANÇA DE DADOS\n';
report += '**Projeto:** Ivaí Conecta (React 19 + Firebase Serverless)\n';
report += `**Data da Auditoria:** 27 de Outubro de 2026\n`;
report += `**Total de Campos Analisados:** ${fields.length}\n`;
report += `**Total de Componentes com Entradas de Texto:** 27\n\n`;

// Group by category
const categories = {};
fields.forEach(f => {
  const meta = moduleMap[f.file] || { category: 'Outros', backend: 'Firestore' };
  const cat = meta.category;
  if (!categories[cat]) categories[cat] = [];
  categories[cat].push({ ...f, backendInfo: meta.backend });
});

for (const [catName, catFields] of Object.entries(categories)) {
  report += `\n## ${catName} (${catFields.length} campos)\n\n`;
  report += '| Arquivo e Linha | Campo / Identificador | Tipo | Finalidade do Campo | Validação Atual no Frontend | Endpoint / Serviço & Coleção Backend | Validação Atual no Backend |\n';
  report += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';
  
  catFields.forEach(f => {
    const analysis = analyzeField(f);
    const fileName = f.file.replace('App/src/', '');
    report += `| \`${fileName}:${f.line}\` | \`${f.nameOrId}\` | \`${f.tag} [${f.type}]\` | ${analysis.purpose} | ${analysis.feValidation} | \`${f.backendInfo}\` | ${analysis.beValidation} |\n`;
  });
}

fs.writeFileSync(path.join(__dirname, 'audit_report_full.md'), report, 'utf8');
console.log('Complete report written to scratch/audit_report_full.md');
