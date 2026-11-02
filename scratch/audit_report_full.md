# RELATÓRIO DE AUDITORIA COMPLETA DE CAMPOS DE TEXTO E SEGURANÇA DE DADOS
**Projeto:** Ivaí Conecta (React 19 + Firebase Serverless)
**Data da Auditoria:** 27 de Outubro de 2026
**Total de Campos Analisados:** 133
**Total de Componentes com Entradas de Texto:** 27


## 1. Autenticação & Cadastro (10 campos)

| Arquivo e Linha | Campo / Identificador | Tipo | Finalidade do Campo | Validação Atual no Frontend | Endpoint / Serviço & Coleção Backend | Validação Atual no Backend |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `pages/Login.jsx:443` | `loginEmail` | `input [email]` | E-mail do usuário para autenticação / cadastro | HTML required + regex básica de e-mail | `Firebase Auth & users (authService.loginWithEmail / registerWithEmail / resetUserPassword)` | Firebase Auth verifica formato e unicidade no provider |
| `pages/Login.jsx:476` | `loginPass` | `input [text]` | Senha de acesso | HTML required | `Firebase Auth & users (authService.loginWithEmail / registerWithEmail / resetUserPassword)` | Firebase Auth exige mínimo de 6 caracteres |
| `pages/Login.jsx:577` | `regCnpj` | `input [text]` | CNPJ da empresa para cadastro PJ | Máscara live + validateCNPJ (dígitos verificadores) | `Firebase Auth & users (authService.loginWithEmail / registerWithEmail / resetUserPassword)` | Nenhuma no Firestore Rules / sem verificação na API da Receita no backend |
| `pages/Login.jsx:682` | `regName` | `input [text]` | Nome completo ou Razão Social no cadastro | HTML required, maxLength 70 | `Firebase Auth & users (authService.loginWithEmail / registerWithEmail / resetUserPassword)` | Parcial em firestore.rules (string, 2 a 120 chars, sem anti-troll/anti-xss) |
| `pages/Login.jsx:710` | `regEmail` | `input [email]` | E-mail do usuário para autenticação / cadastro | HTML required + regex básica de e-mail | `Firebase Auth & users (authService.loginWithEmail / registerWithEmail / resetUserPassword)` | Firebase Auth verifica formato e unicidade no provider |
| `pages/Login.jsx:794` | `regPass` | `input [text]` | Senha de acesso | HTML required, min 6 caracteres | `Firebase Auth & users (authService.loginWithEmail / registerWithEmail / resetUserPassword)` | Firebase Auth exige mínimo de 6 caracteres |
| `pages/CompletarPerfil.jsx:344` | `studentEmail` | `input [email]` | E-mail institucional (@ifpr, @uenp, @univale, .edu.br) | Regex de domínio educacional .edu.br | `users (authService.updateAuthUser / UserRepository.update)` | firestore.rules verifica email_verified para flag de estudante |
| `pages/CompletarPerfil.jsx:420` | `teacherEmail` | `input [email]` | E-mail institucional (@ifpr, @uenp, @univale, .edu.br) | Regex de domínio educacional .edu.br | `users (authService.updateAuthUser / UserRepository.update)` | firestore.rules verifica email_verified para flag de estudante |
| `pages/CompletarPerfil.jsx:475` | `cnpj` | `input [text]` | CNPJ de empresa no onboarding | validateCNPJ + máscara | `users (authService.updateAuthUser / UserRepository.update)` | Ausente no backend |
| `pages/CompletarPerfil.jsx:528` | `name` | `input [text]` | Nome de exibição no onboarding | maxLength 70, required | `users (authService.updateAuthUser / UserRepository.update)` | Parcial em firestore.rules |

## 2. Configurações de Conta & Segurança (11 campos)

| Arquivo e Linha | Campo / Identificador | Tipo | Finalidade do Campo | Validação Atual no Frontend | Endpoint / Serviço & Coleção Backend | Validação Atual no Backend |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `pages/Configuracoes.jsx:783` | `name` | `input [text]` | Nome do usuário ou Razão Social | validateAccountName (anti-troll, tamanho, profanidade) | `users & Firebase Auth (authService.updateAuthUser / updateUserPassword)` | firestore.rules checa se é string e tamanho |
| `pages/Configuracoes.jsx:806` | `email` | `input [email]` | E-mail de acesso | validateAccountEmail (formato, required) | `users & Firebase Auth (authService.updateAuthUser / updateUserPassword)` | Firebase Auth |
| `pages/Configuracoes.jsx:831` | `linkedin` | `input [text]` | URL do perfil do LinkedIn | validateAccountLinkedIn (anti-troll, formato linkedin.com/in/) | `users & Firebase Auth (authService.updateAuthUser / updateUserPassword)` | Ausente no backend |
| `pages/Configuracoes.jsx:851` | `github` | `input [text]` | URL do GitHub ou portfólio | validateAccountGitHubOrPortfolio (anti-troll, formato github.com/) | `users & Firebase Auth (authService.updateAuthUser / updateUserPassword)` | Ausente no backend |
| `pages/Configuracoes.jsx:873` | `raNumber` | `input [text]` | RA / Matrícula acadêmica | validateStudentRA (min 3, max 30, anti-troll) | `users & Firebase Auth (authService.updateAuthUser / updateUserPassword)` | Ausente no backend |
| `pages/Configuracoes.jsx:899` | `currentUser.badge || currentUser.role` | `input [text]` | Campo de perfil ou badge | Nenhuma | `users & Firebase Auth (authService.updateAuthUser / updateUserPassword)` | Ausente |
| `pages/Configuracoes.jsx:1095` | `studentInstEmail` | `input [email]` | E-mail institucional para envio de verificação | validateStudentEmail (.edu.br) | `users & Firebase Auth (authService.updateAuthUser / updateUserPassword)` | Firebase Auth sendSignInLinkToEmail / verifyBeforeUpdateEmail |
| `pages/Configuracoes.jsx:1248` | `cnpj` | `input [text]` | CNPJ de empresa para verificação | validateCNPJ + fetchCNPJData | `users & Firebase Auth (authService.updateAuthUser / updateUserPassword)` | Ausente no backend |
| `pages/Configuracoes.jsx:1423` | `currentPassword` | `input [text]` | Alteração e confirmação de senha | validatePasswordChange (min 6, max 64, bloqueio de senhas fracas, repetição) | `users & Firebase Auth (authService.updateAuthUser / updateUserPassword)` | Firebase Auth reauthenticateWithCredential + updatePassword |
| `pages/Configuracoes.jsx:1466` | `newPassword` | `input [text]` | Alteração e confirmação de senha | validatePasswordChange (min 6, max 64, bloqueio de senhas fracas, repetição) | `users & Firebase Auth (authService.updateAuthUser / updateUserPassword)` | Firebase Auth reauthenticateWithCredential + updatePassword |
| `pages/Configuracoes.jsx:1503` | `confirmPassword` | `input [text]` | Alteração e confirmação de senha | validatePasswordChange (min 6, max 64, bloqueio de senhas fracas, repetição) | `users & Firebase Auth (authService.updateAuthUser / updateUserPassword)` | Firebase Auth reauthenticateWithCredential + updatePassword |

## 3. Gestão de Perfis (Aluno / Geral) (24 campos)

| Arquivo e Linha | Campo / Identificador | Tipo | Finalidade do Campo | Validação Atual no Frontend | Endpoint / Serviço & Coleção Backend | Validação Atual no Backend |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `components/EditProfileModal.jsx:257` | `editData.avatar || ''` | `input [url]` | Links de redes sociais ou URL de avatar | type="url" básico do HTML5 | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditProfileModal.jsx:295` | `editData.name || ''` | `input [text]` | Nome completo do aluno/candidato | required, maxLength 70 | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | firestore.rules (string, 2 a 120 chars) |
| `components/EditProfileModal.jsx:308` | `editData.city || ''` | `input [text]` | Cidade / Localização de atendimento | required | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente (qualquer string é aceita) |
| `components/EditProfileModal.jsx:326` | `editData.course || ''` | `input [text]` | Formação acadêmica, curso, instituição ou valor hora | Nenhuma | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditProfileModal.jsx:339` | `role === 'freelancer' ? (editData.hourlyRate || editData.period || '') : (editData.period || '')` | `input [text]` | Formação acadêmica, curso, instituição ou valor hora | Nenhuma | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditProfileModal.jsx:355` | `editData.institution || ''` | `input [text]` | Formação acadêmica, curso, instituição ou valor hora | Nenhuma | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditProfileModal.jsx:368` | `editData.institution || ''` | `input [text]` | Formação acadêmica, curso, instituição ou valor hora | Nenhuma | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditProfileModal.jsx:386` | `editData.bio || ''` | `textarea [textarea]` | Biografia / Resumo profissional do aluno | Nenhuma | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente (vulnerável a XSS / spam / spam links) |
| `components/EditProfileModal.jsx:418` | `newExp?.role || ''` | `input [text]` | Experiência profissional (cargo, empresa, período, descrição) | Nenhuma | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente (armazenado em array sem validação) |
| `components/EditProfileModal.jsx:429` | `newExp?.company || ''` | `input [text]` | Experiência profissional (cargo, empresa, período, descrição) | Nenhuma | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente (armazenado em array sem validação) |
| `components/EditProfileModal.jsx:442` | `newExp?.period || ''` | `input [text]` | Formação acadêmica, curso, instituição ou valor hora | Nenhuma | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditProfileModal.jsx:471` | `newExp?.description || ''` | `textarea [textarea]` | Experiência profissional (cargo, empresa, período, descrição) | Nenhuma | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente (armazenado em array sem validação) |
| `components/EditProfileModal.jsx:566` | `newProj?.title || ''` | `input [text]` | Portfólio de projetos (título, tecnologias, link, descrição) | type="url" no link | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente (qualquer URL ou texto pode ser gravado) |
| `components/EditProfileModal.jsx:577` | `newProj?.tech || ''` | `input [text]` | Portfólio de projetos (título, tecnologias, link, descrição) | type="url" no link | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente (qualquer URL ou texto pode ser gravado) |
| `components/EditProfileModal.jsx:589` | `newProj?.link || ''` | `input [url]` | Portfólio de projetos (título, tecnologias, link, descrição) | type="url" no link | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente (qualquer URL ou texto pode ser gravado) |
| `components/EditProfileModal.jsx:600` | `newProj?.description || ''` | `textarea [textarea]` | Portfólio de projetos (título, tecnologias, link, descrição) | type="url" no link | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente (qualquer URL ou texto pode ser gravado) |
| `components/EditProfileModal.jsx:694` | `editData?.newSkill || ''` | `input [text]` | Habilidade técnica / Soft skill | Nenhuma | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditProfileModal.jsx:797` | `editData?.linkedin || ''` | `input [url]` | Links de redes sociais ou URL de avatar | type="url" básico do HTML5 | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditProfileModal.jsx:814` | `editData?.github || ''` | `input [url]` | Links de redes sociais ou URL de avatar | type="url" básico do HTML5 | `users (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `pages/PerfilAluno.jsx:1081` | `proactiveDiscipline` | `input [text]` | Solicitação ou concessão de recomendação docente (disciplina e professor) | required no envio | `endorsement_requests (talentsService.requestTeacherEndorsement / approveEndorsementRequest)` | firestore.rules (status inicial Pendente) |
| `pages/PerfilAluno.jsx:1094` | `proactiveQuote` | `textarea [textarea]` | Parecer / Carta de recomendação pedagógica do professor para o aluno | required no envio | `endorsement_requests (talentsService.requestTeacherEndorsement / approveEndorsementRequest)` | firestore.rules verifica se remetente é o profEmail |
| `pages/PerfilAluno.jsx:1318` | `requestForm.profName` | `input [text]` | Solicitação ou concessão de recomendação docente (disciplina e professor) | required no envio | `endorsement_requests (talentsService.requestTeacherEndorsement / approveEndorsementRequest)` | firestore.rules (status inicial Pendente) |
| `pages/PerfilAluno.jsx:1395` | `requestForm.profEmail` | `input [email]` | Solicitação ou concessão de recomendação docente (disciplina e professor) | required no envio | `endorsement_requests (talentsService.requestTeacherEndorsement / approveEndorsementRequest)` | firestore.rules (status inicial Pendente) |
| `pages/PerfilAluno.jsx:1410` | `requestForm.discipline` | `input [text]` | Solicitação ou concessão de recomendação docente (disciplina e professor) | required no envio | `endorsement_requests (talentsService.requestTeacherEndorsement / approveEndorsementRequest)` | firestore.rules (status inicial Pendente) |

## 4. Gestão de Perfil de Empresa (14 campos)

| Arquivo e Linha | Campo / Identificador | Tipo | Finalidade do Campo | Validação Atual no Frontend | Endpoint / Serviço & Coleção Backend | Validação Atual no Backend |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `components/EditCompanyProfileModal.jsx:590` | `editData.coverImage || ''` | `input [url]` | Contatos e canais sociais da empresa | formValidation.js (validação de formato e ausência de termos de deboche) | `users (authService.updateAuthUser)` | Ausente no backend |
| `components/EditCompanyProfileModal.jsx:666` | `editData.avatar || ''` | `input [url]` | Contatos e canais sociais da empresa | formValidation.js (validação de formato e ausência de termos de deboche) | `users (authService.updateAuthUser)` | Ausente no backend |
| `components/EditCompanyProfileModal.jsx:719` | `editData.name || ''` | `input [text]` | Razão Social ou Nome Fantasia da empresa | validateCompanyName / validateTradingName (anti-troll, min/max, profanidade) | `users (authService.updateAuthUser)` | Parcial em firestore.rules |
| `components/EditCompanyProfileModal.jsx:736` | `editData.tradingName || ''` | `input [text]` | Razão Social ou Nome Fantasia da empresa | validateCompanyName / validateTradingName (anti-troll, min/max, profanidade) | `users (authService.updateAuthUser)` | Parcial em firestore.rules |
| `components/EditCompanyProfileModal.jsx:755` | `editData.cnpj || ''` | `input [text]` | CNPJ da empresa | validateCNPJ + máscara | `users (authService.updateAuthUser)` | Ausente no backend |
| `components/EditCompanyProfileModal.jsx:823` | `editData.foundedYear || ''` | `input [text]` | Ano de fundação da empresa | maxLength 4 + checagem numérica | `users (authService.updateAuthUser)` | Ausente |
| `components/EditCompanyProfileModal.jsx:850` | `editData.description || ''` | `textarea [textarea]` | Apresentação institucional / Cultura e ambiente de trabalho | validateCompanyAbout / validateCompanyCulture (anti-troll, min/max, sem conotação íntima) | `users (authService.updateAuthUser)` | Ausente no backend |
| `components/EditCompanyProfileModal.jsx:866` | `editData.culture || ''` | `textarea [textarea]` | Apresentação institucional / Cultura e ambiente de trabalho | validateCompanyAbout / validateCompanyCulture (anti-troll, min/max, sem conotação íntima) | `users (authService.updateAuthUser)` | Ausente no backend |
| `components/EditCompanyProfileModal.jsx:897` | `newBenefitInput` | `input [text]` | Cadastro de benefícios corporativos | validateCompanyPerks (bloqueio de conotação íntima, bebidas, drogas, vestuário aleatório) | `users (authService.updateAuthUser)` | Ausente no backend |
| `components/EditCompanyProfileModal.jsx:1016` | `editData.website || ''` | `input [url]` | Contatos e canais sociais da empresa | formValidation.js (validação de formato e ausência de termos de deboche) | `users (authService.updateAuthUser)` | Ausente no backend |
| `components/EditCompanyProfileModal.jsx:1031` | `editData.email || ''` | `input [email]` | E-mail corporativo / RH da empresa | validateAccountEmail (formato de e-mail corporativo) | `users (authService.updateAuthUser)` | Ausente no backend |
| `components/EditCompanyProfileModal.jsx:1049` | `editData.linkedin || ''` | `input [text]` | Contatos e canais sociais da empresa | formValidation.js (validação de formato e ausência de termos de deboche) | `users (authService.updateAuthUser)` | Ausente no backend |
| `components/EditCompanyProfileModal.jsx:1065` | `editData.instagram || ''` | `input [text]` | Contatos e canais sociais da empresa | formValidation.js (validação de formato e ausência de termos de deboche) | `users (authService.updateAuthUser)` | Ausente no backend |
| `components/EditCompanyProfileModal.jsx:1081` | `editData.phone || ''` | `input [text]` | Contatos e canais sociais da empresa | formValidation.js (validação de formato e ausência de termos de deboche) | `users (authService.updateAuthUser)` | Ausente no backend |

## 5. Gestão de Perfil de Professor (14 campos)

| Arquivo e Linha | Campo / Identificador | Tipo | Finalidade do Campo | Validação Atual no Frontend | Endpoint / Serviço & Coleção Backend | Validação Atual no Backend |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `components/EditTeacherProfileModal.jsx:254` | `editData.avatar || ''` | `input [url]` | Campos de turmas e histórico educacional | Nenhuma | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditTeacherProfileModal.jsx:294` | `editData.name || ''` | `input [text]` | Nome do professor / docente | required, maxLength 70 | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | firestore.rules |
| `components/EditTeacherProfileModal.jsx:326` | `editData.institution || ''` | `input [text]` | Instituição, disciplina lecionada ou titulação | required no form | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditTeacherProfileModal.jsx:340` | `editData.discipline || ''` | `input [text]` | Instituição, disciplina lecionada ou titulação | required no form | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditTeacherProfileModal.jsx:355` | `editData.degree || ''` | `input [text]` | Instituição, disciplina lecionada ou titulação | required no form | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditTeacherProfileModal.jsx:389` | `editData.newClass || ''` | `input [text]` | Campos de turmas e histórico educacional | Nenhuma | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditTeacherProfileModal.jsx:484` | `editData.newEdu?.degree || ''` | `input [text]` | Instituição, disciplina lecionada ou titulação | required no form | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditTeacherProfileModal.jsx:495` | `editData.newEdu?.institution || ''` | `input [text]` | Instituição, disciplina lecionada ou titulação | required no form | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditTeacherProfileModal.jsx:507` | `editData.newEdu?.period || ''` | `input [text]` | Campos de turmas e histórico educacional | Nenhuma | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditTeacherProfileModal.jsx:584` | `editData.bio || ''` | `textarea [textarea]` | Biografia acadêmica e linhas de pesquisa | Nenhuma | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditTeacherProfileModal.jsx:610` | `editData.email || ''` | `input [email]` | Currículo Lattes, LinkedIn, Google Meet ou E-mail institucional | type="url" / type="email" nativo | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditTeacherProfileModal.jsx:626` | `editData.lattes || ''` | `input [url]` | Currículo Lattes, LinkedIn, Google Meet ou E-mail institucional | type="url" / type="email" nativo | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditTeacherProfileModal.jsx:639` | `editData.linkedin || ''` | `input [url]` | Currículo Lattes, LinkedIn, Google Meet ou E-mail institucional | type="url" / type="email" nativo | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditTeacherProfileModal.jsx:652` | `editData.meetUrl || ''` | `input [url]` | Currículo Lattes, LinkedIn, Google Meet ou E-mail institucional | type="url" / type="email" nativo | `users / teachers (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |

## 6. Gestão de Perfil de Freelancer (11 campos)

| Arquivo e Linha | Campo / Identificador | Tipo | Finalidade do Campo | Validação Atual no Frontend | Endpoint / Serviço & Coleção Backend | Validação Atual no Backend |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `components/EditFreelancerProfileModal.jsx:225` | `editData?.name || ''` | `input [text]` | Nome do profissional e especialidade técnica | required, maxLength 70 | `users / talents (talentsService.updateTalentProfile / authService.updateAuthUser)` | firestore.rules |
| `components/EditFreelancerProfileModal.jsx:240` | `editData?.specialty || editData?.title || ''` | `input [text]` | Nome do profissional e especialidade técnica | required, maxLength 70 | `users / talents (talentsService.updateTalentProfile / authService.updateAuthUser)` | firestore.rules |
| `components/EditFreelancerProfileModal.jsx:296` | `editData?.bio || ''` | `textarea [textarea]` | Descrição dos serviços e formas de atendimento | Nenhuma | `users / talents (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditFreelancerProfileModal.jsx:352` | `editData?.phone ? maskPhone(editData.phone) : ''` | `input [text]` | Telefone para contato e CNPJ | Máscara visual | `users / talents (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditFreelancerProfileModal.jsx:366` | `editData?.cnpj ? maskCNPJ(editData.cnpj) : ''` | `input [text]` | Telefone para contato e CNPJ | Máscara visual | `users / talents (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditFreelancerProfileModal.jsx:381` | `editData?.experienceYears || ''` | `input [text]` | Tempo de experiência, disponibilidade e habilidades | Nenhuma | `users / talents (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditFreelancerProfileModal.jsx:394` | `editData?.availability || ''` | `input [text]` | Tempo de experiência, disponibilidade e habilidades | Nenhuma | `users / talents (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditFreelancerProfileModal.jsx:415` | `newSkill` | `input [text]` | Tempo de experiência, disponibilidade e habilidades | Nenhuma | `users / talents (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditFreelancerProfileModal.jsx:485` | `newProject.title` | `input [text]` | Portfólio de serviços (título, link, descrição) | Nenhuma | `users / talents (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditFreelancerProfileModal.jsx:492` | `newProject.link` | `input [text]` | Portfólio de serviços (título, link, descrição) | Nenhuma | `users / talents (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |
| `components/EditFreelancerProfileModal.jsx:500` | `newProject.description` | `textarea [textarea]` | Portfólio de serviços (título, link, descrição) | Nenhuma | `users / talents (talentsService.updateTalentProfile / authService.updateAuthUser)` | Ausente |

## 7. Módulo de Vagas (Recrutamento) (25 campos)

| Arquivo e Linha | Campo / Identificador | Tipo | Finalidade do Campo | Validação Atual no Frontend | Endpoint / Serviço & Coleção Backend | Validação Atual no Backend |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `components/PublishJobModal.jsx:1212` | `form.recruiterPhone` | `input [text]` | WhatsApp / Telefone para contato com o recrutador | validatePhoneNumber / maskPhone | `jobs (jobsService.createJob / jobsService.updateJob)` | Ausente |
| `components/PublishJobModal.jsx:1272` | `form.salary === 'A Combinar' ? '' : form.salary` | `input [text]` | Remuneração ou faixa salarial da vaga | maskCurrencyLive / validação CBO / maxLength 12 | `jobs (jobsService.createJob / jobsService.updateJob)` | jobsService filtra caracteres e profanidade básica |
| `components/PublishJobModal.jsx:1546` | `form.description` | `textarea [textarea]` | Descrição detalhada das atividades e requisitos da vaga | validateJobDescription (min 50 chars, CBO, anti-troll, profanidade) | `jobs (jobsService.createJob / jobsService.updateJob)` | firestore.rules checa apenas se é string |
| `components/PublishJobModal.jsx:1615` | `respInput` | `input [text]` | Item de responsabilidade ou atribuição do cargo | validateJobDuty (verbo de ação ou rotina real) | `jobs (jobsService.createJob / jobsService.updateJob)` | Ausente |
| `components/ui/JobTitleCombobox.jsx:112` | `value` | `input [text]` | Seleção e busca rápida de cargos CBO, benefícios ou habilidades | Validação contra banco CBO e taxonomia de skills | `Consulta CBO / jobs (jobsService.createJob)` | jobsService valida ocupação e skills contra catálogo oficial |
| `components/ui/BenefitCombobox.jsx:111` | `inputValue` | `input [text]` | Seleção e busca rápida de cargos CBO, benefícios ou habilidades | Validação contra banco CBO e taxonomia de skills | `jobs (jobsService.createJob)` | jobsService valida ocupação e skills contra catálogo oficial |
| `components/ui/SkillCombobox.jsx:126` | `inputValue` | `input [text]` | Seleção e busca rápida de cargos CBO, benefícios ou habilidades | Validação contra banco CBO e taxonomia de skills | `jobs / users (jobsService / talentsService)` | jobsService valida ocupação e skills contra catálogo oficial |
| `pages/Vagas.jsx:307` | `query` | `input [text]` | Barra de busca pública e filtros de pesquisa | Nenhuma | `Client-side query / Firestore jobs query (jobsService.getAllJobs)` | N/A (consultas com sanitizeQuery ou client-side filter) |
| `pages/GerenciamentoVagasEmpresa.jsx:1681` | `candidateSearch` | `input [text]` | Filtro e busca interna de candidatos / vagas / histórico | Nenhuma | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | N/A (filtro local em memória) |
| `pages/GerenciamentoVagasEmpresa.jsx:2529` | `jobListSearch` | `input [text]` | Filtro e busca interna de candidatos / vagas / histórico | Nenhuma | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | N/A (filtro local em memória) |
| `pages/GerenciamentoVagasEmpresa.jsx:3258` | `historySearch` | `input [text]` | Filtro e busca interna de candidatos / vagas / histórico | Nenhuma | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | N/A (filtro local em memória) |
| `pages/GerenciamentoVagasEmpresa.jsx:4182` | `stage.name` | `input [text]` | Criação ou renomeação de etapa do funil de recrutamento | maxLength 40 / 120 | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | Ausente |
| `pages/GerenciamentoVagasEmpresa.jsx:4231` | `stage.description || ''` | `input [text]` | Criação ou renomeação de etapa do funil de recrutamento | maxLength 40 / 120 | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | Ausente |
| `pages/GerenciamentoVagasEmpresa.jsx:4566` | `unnamed` | `textarea [textarea]` | Anotações da entrevista / feedback de seleção | Nenhuma | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | Ausente |
| `pages/GerenciamentoVagasEmpresa.jsx:4730` | `interviewForm.date || selectedCandidate.interview?.date || ''` | `input [date]` |  |  | `applications & jobs (jobsService.updateApplicationStage / updateJob)` |  |
| `pages/GerenciamentoVagasEmpresa.jsx:4741` | `interviewForm.time || selectedCandidate.interview?.time || ''` | `input [time]` |  |  | `applications & jobs (jobsService.updateApplicationStage / updateJob)` |  |
| `pages/GerenciamentoVagasEmpresa.jsx:4849` | `newCandidateForm.name` | `input [text]` | Cadastro manual de candidato em processo seletivo | required básico | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | Ausente |
| `pages/GerenciamentoVagasEmpresa.jsx:4862` | `newCandidateForm.course` | `input [text]` | Cadastro manual de candidato em processo seletivo | required básico | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | Ausente |
| `pages/GerenciamentoVagasEmpresa.jsx:4903` | `newCandidateForm.matchScore` | `input [number]` | Cadastro manual de candidato em processo seletivo | required básico | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | Ausente |
| `pages/GerenciamentoVagasEmpresa.jsx:4916` | `newCandidateForm.phone` | `input [text]` | Cadastro manual de candidato em processo seletivo | required básico | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | Ausente |
| `pages/GerenciamentoVagasEmpresa.jsx:4927` | `newCandidateForm.skills` | `input [text]` | Cadastro manual de candidato em processo seletivo | required básico | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | Ausente |
| `pages/GerenciamentoVagasEmpresa.jsx:4984` | `editingJob.title` | `input [text]` | Edição rápida de título, salário e descrição de vaga | required básico | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | jobsService.updateJob |
| `pages/GerenciamentoVagasEmpresa.jsx:5010` | `editingJob.salary || ''` | `input [text]` | Edição rápida de título, salário e descrição de vaga | required básico | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | jobsService.updateJob |
| `pages/GerenciamentoVagasEmpresa.jsx:5037` | `editingJob.description || ''` | `textarea [textarea]` | Edição rápida de título, salário e descrição de vaga | required básico | `applications & jobs (jobsService.updateApplicationStage / updateJob)` | jobsService.updateJob |
| `pages/MinhasVagas.jsx:493` | `customQuote[req.id] || ''` | `textarea [textarea]` | Barra de busca pública e filtros de pesquisa | Nenhuma | `endorsement_requests (talentsService.approveEndorsementRequest)` | N/A (consultas com sanitizeQuery ou client-side filter) |

## 8. Marketplace de Serviços & Ordens (15 campos)

| Arquivo e Linha | Campo / Identificador | Tipo | Finalidade do Campo | Validação Atual no Frontend | Endpoint / Serviço & Coleção Backend | Validação Atual no Backend |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `components/PublishServiceModal.jsx:167` | `title` | `input [text]` | Título do anúncio de serviço | hasProfanity + required | `services (servicesService.createService)` | firestore.rules (string >= 3 chars) |
| `components/PublishServiceModal.jsx:269` | `phone` | `input [tel]` | Telefone de contato do prestador | maskPhone, max 15 | `services (servicesService.createService)` | Ausente |
| `components/PublishServiceModal.jsx:355` | `price` | `input [text]` | Preço estimado ou valor cobrado pelo serviço | formatCurrencyBRL | `services (servicesService.createService)` | Ausente |
| `components/PublishServiceModal.jsx:416` | `description` | `textarea [textarea]` | Detalhamento do serviço, garantias e escopo | hasProfanity + min 25 chars | `services (servicesService.createService)` | Ausente |
| `components/SolicitarServicoModal.jsx:284` | `description` | `textarea [textarea]` | Descrição da solicitação de serviço / demanda | validateServiceRequestForm (min 15 chars, anti-troll, profanidade) | `service_orders (servicesService.createServiceOrder)` | Ausente em service_orders |
| `components/SolicitarServicoModal.jsx:378` | `phone` | `input [text]` | Telefone de contato do solicitante | maskPhone + required | `service_orders (servicesService.createServiceOrder)` | Ausente |
| `components/SolicitarServicoModal.jsx:414` | `budget` | `input [text]` | Orçamento estimado e prazo desejado para atendimento | required no prazo | `service_orders (servicesService.createServiceOrder)` | Ausente |
| `components/SolicitarServicoModal.jsx:464` | `deadline` | `input [text]` | Orçamento estimado e prazo desejado para atendimento | required no prazo | `service_orders (servicesService.createServiceOrder)` | Ausente |
| `components/AvaliarServicoModal.jsx:201` | `comment` | `textarea [textarea]` | Comentário e avaliação do cliente sobre o serviço recebido | required, min 10 chars, hasProfanity | `services.reviews (servicesService.addServiceReview)` | firestore.rules restringe rating entre 0 e 5, mas comentário não tem sanitização |
| `pages/Servicos.jsx:741` | `query` | `input [text]` | Barra de busca por serviços / termos | Nenhuma | `services (servicesService.createService / getAllServices)` | N/A (consulta client-side) |
| `pages/Servicos.jsx:878` | `serviceData.title` | `input [text]` | Título do anúncio de serviço | hasProfanity + required | `services (servicesService.createService / getAllServices)` | firestore.rules (string >= 3 chars) |
| `pages/Servicos.jsx:890` | `serviceData.providerName` | `input [text]` | Dados complementares do prestador / endereço | required | `services (servicesService.createService / getAllServices)` | Ausente |
| `pages/Servicos.jsx:901` | `serviceData.address` | `input [text]` | Dados complementares do prestador / endereço | required | `services (servicesService.createService / getAllServices)` | Ausente |
| `pages/Servicos.jsx:913` | `serviceData.phone` | `input [tel]` | Telefone de contato do prestador | maskPhone, max 15 | `services (servicesService.createService / getAllServices)` | Ausente |
| `pages/Servicos.jsx:926` | `serviceData.description` | `textarea [textarea]` | Detalhamento do serviço, garantias e escopo | hasProfanity + min 25 chars | `services (servicesService.createService / getAllServices)` | Ausente |

## 9. Banco de Talentos & Busca Global (3 campos)

| Arquivo e Linha | Campo / Identificador | Tipo | Finalidade do Campo | Validação Atual no Frontend | Endpoint / Serviço & Coleção Backend | Validação Atual no Backend |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `pages/BancoDeTalentos.jsx:395` | `query` | `input [text]` | Barra de busca pública e filtros de pesquisa | Nenhuma | `Client-side query / Firestore users query (talentsService.getAllTalents)` | N/A (consultas com sanitizeQuery ou client-side filter) |
| `pages/Dashboard.jsx:189` | `searchQuery` | `input [text]` | Barra de busca pública e filtros de pesquisa | Nenhuma | `Client-side search (jobs & services)` | N/A (consultas com sanitizeQuery ou client-side filter) |
| `components/ui/CustomSelect.jsx:194` | `searchQuery` | `input [text]` | Barra de busca pública e filtros de pesquisa | Nenhuma | `Filtro local UI` | N/A (consultas com sanitizeQuery ou client-side filter) |

## 10. Mensageria & Chat em Tempo Real (2 campos)

| Arquivo e Linha | Campo / Identificador | Tipo | Finalidade do Campo | Validação Atual no Frontend | Endpoint / Serviço & Coleção Backend | Validação Atual no Backend |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `components/ChatModal.jsx:491` | `searchTerm` | `input [text]` | Busca por conversas / contatos | Nenhuma | `chats/{chatId}/messages (chatService.sendMessage)` | N/A (filtro client-side) |
| `components/ChatModal.jsx:788` | `messageInput` | `textarea [textarea]` | Mensagem de texto do chat em tempo real | hasProfanity / pCheck bloqueando envio se ofensivo | `chats/{chatId}/messages (chatService.sendMessage)` | firestore.rules verifica autenticidade do remetente, mas falta anti-spam / anti-xss |

## 11. Módulo Administrativo (4 campos)

| Arquivo e Linha | Campo / Identificador | Tipo | Finalidade do Campo | Validação Atual no Frontend | Endpoint / Serviço & Coleção Backend | Validação Atual no Backend |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `pages/admin/AdminUsers.jsx:190` | `search` | `input [text]` | Barra de pesquisa administrativa | Nenhuma | `Client-side search / users query` | N/A |
| `pages/admin/AdminJobs.jsx:166` | `search` | `input [text]` | Barra de pesquisa administrativa | Nenhuma | `Client-side search / jobs query` | N/A |
| `pages/admin/AdminServices.jsx:152` | `search` | `input [text]` | Barra de pesquisa administrativa | Nenhuma | `Client-side search / services query` | N/A |
| `components/admin/AdminConfirmModal.jsx:86` | `reason` | `textarea [textarea]` | Justificativa textual de moderação / bloqueio de usuário ou vaga | Nenhuma | `users / jobs / services (adminService.blockUser / deleteJobAdmin)` | firestore.rules permite apenas admin |
