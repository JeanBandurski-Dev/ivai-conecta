# AUDITORIA COMPLETA DE CAMPOS DE TEXTO DO PROJETO IVAÍ CONECTA

**Total de campos de texto mapeados:** 133
**Total de arquivos com formulários/inputs:** 27

## Arquivo: `App/src/pages/Login.jsx` (6 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L443 | `<input type="email">` | `loginEmail` | "seu.email@exemplo.com" | Sim | - | |
| L476 | `<input type="text">` | `loginPass` | "••••••••" | Sim | - | |
| L577 | `<input type="text">` | `regCnpj` | "00.000.000/0000-00" | Sim | 18 | |
| L682 | `<input type="text">` | `regName` | - | Sim | 70 | |
| L710 | `<input type="email">` | `regEmail` | - | Não | - | |
| L794 | `<input type="text">` | `regPass` | "Mínimo 6 dígitos" | Sim | - | |

## Arquivo: `App/src/pages/CompletarPerfil.jsx` (4 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L344 | `<input type="email">` | `studentEmail` | - | Não | - | |
| L420 | `<input type="email">` | `teacherEmail` | - | Não | - | |
| L475 | `<input type="text">` | `cnpj` | "00.000.000/0000-00" | Sim | 18 | |
| L528 | `<input type="text">` | `name` | "Ex: Lucas Eduardo Silva ou ValeTech Soluções" | Sim | 70 | |

## Arquivo: `App/src/pages/Configuracoes.jsx` (11 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L783 | `<input type="text">` | `name` | - | Não | 100 | |
| L806 | `<input type="email">` | `email` | "exemplo@email.com" | Sim | - | |
| L831 | `<input type="text">` | `linkedin` | "https://linkedin.com/in/seu-nome" | Não | - | |
| L851 | `<input type="text">` | `github` | "https://github.com/seu-usuario ou portfólio" | Não | - | |
| L873 | `<input type="text">` | `raNumber` | "Ex: IFPR-2024-8891 ou UNIVALE-2025-102" | Não | - | |
| L899 | `<input type="text">` | `currentUser.badge || currentUser.role` | - | Não | - | |
| L1095 | `<input type="email">` | `studentInstEmail` | "seu.nome@estudante.ifpr.edu.br" | Sim | - | |
| L1248 | `<input type="text">` | `cnpj` | "00.000.000/0000-00" | Sim | 18 | |
| L1423 | `<input type="text">` | `currentPassword` | - | Sim | - | |
| L1466 | `<input type="text">` | `newPassword` | - | Não | - | |
| L1503 | `<input type="text">` | `confirmPassword` | - | Não | - | |

## Arquivo: `App/src/components/EditProfileModal.jsx` (19 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L257 | `<input type="url">` | `editData.avatar || ''` | "Ou cole a URL direta de uma imagem..." | Não | - | |
| L295 | `<input type="text">` | `editData.name || ''` | "Seu nome completo" | Sim | 70 | |
| L308 | `<input type="text">` | `editData.city || ''` | "Ex: Ivaiporã, PR" | Sim | - | |
| L326 | `<input type="text">` | `editData.course || ''` | - | Não | - | |
| L339 | `<input type="text">` | `role === 'freelancer' ? (editData.hourlyRate || editData.period || '') : (editData.period || '')` | - | Não | - | |
| L355 | `<input type="text">` | `editData.institution || ''` | "Ex: Ivaiporã e Vale do Ivaí (ou 100% Remoto)" | Não | - | |
| L368 | `<input type="text">` | `editData.institution || ''` | "Ex: IFPR Campus Ivaiporã, UNIVALE, UENP..." | Não | - | |
| L386 | `<textarea type="textarea">` | `editData.bio || ''` | "Conte um pouco sobre seus objetivos, principais competências e o que você busca na sua carreira..." | Não | - | |
| L418 | `<input type="text">` | `newExp?.role || ''` | "Ex: Desenvolvedor Front-end, Auxiliar de TI" | Não | - | |
| L429 | `<input type="text">` | `newExp?.company || ''` | "Ex: Empresa X, Prefeitura de Ivaiporã" | Não | - | |
| L442 | `<input type="text">` | `newExp?.period || ''` | - | Não | - | |
| L471 | `<textarea type="textarea">` | `newExp?.description || ''` | "Descreva as tecnologias utilizadas, rotinas de trabalho e conquistas no cargo..." | Não | - | |
| L566 | `<input type="text">` | `newProj?.title || ''` | "Ex: App de Gestão de Vagas, E-commerce em React" | Não | - | |
| L577 | `<input type="text">` | `newProj?.tech || ''` | "Ex: React, Node.js, Tailwind CSS" | Não | - | |
| L589 | `<input type="url">` | `newProj?.link || ''` | "https://github.com/seu-usuario/projeto ou link do deploy" | Não | - | |
| L600 | `<textarea type="textarea">` | `newProj?.description || ''` | "Qual problema o projeto resolveu e qual foi o seu papel..." | Não | - | |
| L694 | `<input type="text">` | `editData?.newSkill || ''` | "Ex: React, Vendas B2B, Excel, Python..." | Não | - | |
| L797 | `<input type="url">` | `editData?.linkedin || ''` | "https://linkedin.com/in/seu-perfil" | Não | - | |
| L814 | `<input type="url">` | `editData?.github || ''` | "https://github.com/seu-usuario" | Não | - | |

## Arquivo: `App/src/pages/PerfilAluno.jsx` (5 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L1081 | `<input type="text">` | `proactiveDiscipline` | "Ex: Programação de Computadores" | Sim | - | |
| L1094 | `<textarea type="textarea">` | `proactiveQuote` | "Escreva sobre a assiduidade, qualidade dos trabalhos e competências técnicas do aluno..." | Sim | - | |
| L1318 | `<input type="text">` | `requestForm.profName` | - | Não | - | |
| L1395 | `<input type="email">` | `requestForm.profEmail` | "Ex: ronan.silva@ifpr.edu.br" | Sim | - | |
| L1410 | `<input type="text">` | `requestForm.discipline` | "Ex: Programação de Computadores" | Sim | - | |

## Arquivo: `App/src/components/EditCompanyProfileModal.jsx` (14 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L590 | `<input type="url">` | `editData.coverImage || ''` | "Ou cole a URL direta de uma imagem de capa (https://...)" | Não | - | |
| L666 | `<input type="url">` | `editData.avatar || ''` | "Ou cole a URL direta do logotipo (https://...)" | Não | - | |
| L719 | `<input type="text">` | `editData.name || ''` | "Ex: Ivaí Tech Soluções em TI Ltda" | Sim | 100 | |
| L736 | `<input type="text">` | `editData.tradingName || ''` | "Ex: Ivaí Tech" | Sim | 70 | |
| L755 | `<input type="text">` | `editData.cnpj || ''` | "00.000.000/0001-00" | Sim | 18 | |
| L823 | `<input type="text">` | `editData.foundedYear || ''` | "Ex: 2018" | Não | 4 | |
| L850 | `<textarea type="textarea">` | `editData.description || ''` | "Conte sobre o início da empresa, as soluções desenvolvidas e o impacto no Vale do Ivaí..." | Não | 3000 | |
| L866 | `<textarea type="textarea">` | `editData.culture || ''` | "Nosso ambiente valoriza inovação contínua, colaboração aberta e bem-estar dos profissionais..." | Não | 2000 | |
| L897 | `<input type="text">` | `newBenefitInput` | - | Não | - | |
| L1016 | `<input type="url">` | `editData.website || ''` | "https://suaempresa.com.br" | Não | - | |
| L1031 | `<input type="email">` | `editData.email || ''` | "rh@suaempresa.com.br" | Não | - | |
| L1049 | `<input type="text">` | `editData.linkedin || ''` | "https://linkedin.com/company/sua-empresa" | Não | - | |
| L1065 | `<input type="text">` | `editData.instagram || ''` | "@suaempresa" | Não | - | |
| L1081 | `<input type="text">` | `editData.phone || ''` | "(43) 99999-9999" | Não | - | |

## Arquivo: `App/src/components/EditTeacherProfileModal.jsx` (14 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L254 | `<input type="url">` | `editData.avatar || ''` | "Ou cole a URL direta de uma imagem..." | Não | - | |
| L294 | `<input type="text">` | `editData.name || ''` | "Ex: Prof. Dr. Carlos Eduardo" | Sim | 70 | |
| L326 | `<input type="text">` | `editData.institution || ''` | "Ex: IFPR Campus Ivaiporã" | Sim | - | |
| L340 | `<input type="text">` | `editData.discipline || ''` | "Ex: Informática e Engenharia de Software" | Sim | - | |
| L355 | `<input type="text">` | `editData.degree || ''` | "Ex: Doutor em Ciência da Computação (UFPR)" | Sim | - | |
| L389 | `<input type="text">` | `editData.newClass || ''` | - | Não | - | |
| L484 | `<input type="text">` | `editData.newEdu?.degree || ''` | "Ex: Doutorado em Ciência da Computação" | Não | - | |
| L495 | `<input type="text">` | `editData.newEdu?.institution || ''` | "Ex: UFPR - Univ. Federal do Paraná" | Não | - | |
| L507 | `<input type="text">` | `editData.newEdu?.period || ''` | "Ex: 2022 à 2026 (ou Concluído em 2025)" | Não | - | |
| L584 | `<textarea type="textarea">` | `editData.bio || ''` | "Docente na área de Computação no IFPR Campus Ivaiporã, atuando em projetos de pesquisa e desenvolvimento de software..." | Não | - | |
| L610 | `<input type="email">` | `editData.email || ''` | "professor@ifpr.edu.br" | Não | - | |
| L626 | `<input type="url">` | `editData.lattes || ''` | "http://lattes.cnpq.br/..." | Não | - | |
| L639 | `<input type="url">` | `editData.linkedin || ''` | "https://linkedin.com/in/seu-perfil" | Não | - | |
| L652 | `<input type="url">` | `editData.meetUrl || ''` | "https://meet.google.com/..." | Não | - | |

## Arquivo: `App/src/components/EditFreelancerProfileModal.jsx` (11 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L225 | `<input type="text">` | `editData?.name || ''` | "Ex: João da Silva / Silva Eletricista" | Sim | 70 | |
| L240 | `<input type="text">` | `editData?.specialty || editData?.title || ''` | "Ex: Eletricista Residencial e Predial" | Sim | - | |
| L296 | `<textarea type="textarea">` | `editData?.bio || ''` | "Descreva sua experiência, diferenciais de atendimento, garantia de serviço e formas de pagamento aceitas..." | Não | - | |
| L352 | `<input type="text">` | `editData?.phone ? maskPhone(editData.phone) : ''` | "(43) 99999-0000" | Não | - | |
| L366 | `<input type="text">` | `editData?.cnpj ? maskCNPJ(editData.cnpj) : ''` | "00.000.000/0001-00" | Não | - | |
| L381 | `<input type="text">` | `editData?.experienceYears || ''` | "Ex: 5 anos de experiência no mercado regional" | Não | - | |
| L394 | `<input type="text">` | `editData?.availability || ''` | "Ex: De segunda a sábado • Horário comercial" | Não | - | |
| L415 | `<input type="text">` | `newSkill` | "Digite uma habilidade ou serviço (ex: Instalação de Padrão Copel, Figma, React)..." | Não | - | |
| L485 | `<input type="text">` | `newProject.title` | "Título do Projeto ou Trabalho Realizado" | Não | - | |
| L492 | `<input type="text">` | `newProject.link` | "Link / URL (Website, GitHub, Instagram ou Drive)" | Não | - | |
| L500 | `<textarea type="textarea">` | `newProject.description` | "Breve descrição do trabalho realizado, materiais ou tecnologias utilizadas..." | Não | - | |

## Arquivo: `App/src/components/PublishJobModal.jsx` (4 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L1212 | `<input type="text">` | `form.recruiterPhone` | "(43) 99999-9999" | Não | - | |
| L1272 | `<input type="text">` | `form.salary === 'A Combinar' ? '' : form.salary` | - | Não | 12 | |
| L1546 | `<textarea type="textarea">` | `form.description` | "Descreva o objetivo da contratação, o ambiente de trabalho e o que a empresa espera do candidato..." | Não | - | |
| L1615 | `<input type="text">` | `respInput` | "Adicione uma atividade (ex: Atendimento a clientes, Elaboração de relatórios)..." | Não | - | |

## Arquivo: `App/src/components/ui/JobTitleCombobox.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L112 | `<input type="text">` | `value` | - | Não | - | |

## Arquivo: `App/src/components/ui/BenefitCombobox.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L111 | `<input type="text">` | `inputValue` | - | Não | - | |

## Arquivo: `App/src/components/ui/SkillCombobox.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L126 | `<input type="text">` | `inputValue` | - | Não | - | |

## Arquivo: `App/src/pages/Vagas.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L307 | `<input type="text">` | `query` | "Cargo, empresa ou habilidade..." | Não | - | |

## Arquivo: `App/src/pages/GerenciamentoVagasEmpresa.jsx` (16 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L1681 | `<input type="text">` | `candidateSearch` | "Buscar candidato..." | Não | - | |
| L2529 | `<input type="text">` | `jobListSearch` | "Buscar por cargo, skills, cidade..." | Não | - | |
| L3258 | `<input type="text">` | `historySearch` | "Buscar candidato, curso, notas..." | Não | - | |
| L4182 | `<input type="text">` | `stage.name` | - | Não | 40 | |
| L4231 | `<input type="text">` | `stage.description || ''` | - | Não | 120 | |
| L4566 | `<textarea type="textarea">` | `unnamed` | "Registre observações técnicas, impressões da entrevista ou considerações da equipe..." | Não | - | |
| L4730 | `<input type="date">` | `interviewForm.date || selectedCandidate.interview?.date || ''` | - | Sim | - | |
| L4741 | `<input type="time">` | `interviewForm.time || selectedCandidate.interview?.time || ''` | - | Sim | - | |
| L4849 | `<input type="text">` | `newCandidateForm.name` | "Ex: Matheus Oliveira" | Sim | - | |
| L4862 | `<input type="text">` | `newCandidateForm.course` | "Ex: ADS, Engenharia..." | Sim | - | |
| L4903 | `<input type="number">` | `newCandidateForm.matchScore` | - | Não | - | |
| L4916 | `<input type="text">` | `newCandidateForm.phone` | "5543999112233" | Não | - | |
| L4927 | `<input type="text">` | `newCandidateForm.skills` | "React, JavaScript, Git..." | Não | - | |
| L4984 | `<input type="text">` | `editingJob.title` | "Ex: Assistente Administrativo, Vendedor Comercial, Desenvolvedor React..." | Sim | - | |
| L5010 | `<input type="text">` | `editingJob.salary || ''` | - | Não | - | |
| L5037 | `<textarea type="textarea">` | `editingJob.description || ''` | "Descreva as responsabilidades e detalhes da oportunidade..." | Não | - | |

## Arquivo: `App/src/pages/MinhasVagas.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L493 | `<textarea type="textarea">` | `customQuote[req.id] || ''` | "Ex: Estudante com excelente raciocínio prático, boa assiduidade e ótimo trabalho em equipe." | Não | - | |

## Arquivo: `App/src/components/PublishServiceModal.jsx` (4 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L167 | `<input type="text">` | `title` | "Ex: Instalação e Manutenção Elétrica Residencial" | Não | - | |
| L269 | `<input type="tel">` | `phone` | "(43) 99999-0000" | Não | 15 | |
| L355 | `<input type="text">` | `price` | - | Não | - | |
| L416 | `<textarea type="textarea">` | `description` | "Descreva com detalhes suas especialidades, diferenciais, ferramentas e garantias. Mínimo de 25 caracteres." | Não | - | |

## Arquivo: `App/src/components/SolicitarServicoModal.jsx` (4 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L284 | `<textarea type="textarea">` | `description` | "Ex: Preciso de uma reforma na fiação do escritório com 4 tomadas novas e revisão do disjuntor principal..." | Sim | - | |
| L378 | `<input type="text">` | `phone` | "(43) 99999-0000" | Sim | - | |
| L414 | `<input type="text">` | `budget` | "Ex: R$ 1.500,00 ou A combinar" | Não | - | |
| L464 | `<input type="text">` | `deadline` | "Ex: Até sexta-feira / Imediato" | Sim | - | |

## Arquivo: `App/src/components/AvaliarServicoModal.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L201 | `<textarea type="textarea">` | `comment` | "Conte com detalhes como foi o atendimento, a pontualidade, qualidade e comunicação do prestador..." | Sim | - | |

## Arquivo: `App/src/pages/Servicos.jsx` (6 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L741 | `<input type="text">` | `query` | "Busque por eletricista, técnico, aulas, designer..." | Não | - | |
| L878 | `<input type="text">` | `serviceData.title` | "Ex: Manutenção Elétrica Residencial e Predial" | Sim | - | |
| L890 | `<input type="text">` | `serviceData.providerName` | - | Sim | - | |
| L901 | `<input type="text">` | `serviceData.address` | "Ex: Rua Paraná, 450 - Centro, Ivaiporã - PR" | Sim | - | |
| L913 | `<input type="tel">` | `serviceData.phone` | "(43) 99999-9999" | Sim | 15 | |
| L926 | `<textarea type="textarea">` | `serviceData.description` | - | Sim | - | |

## Arquivo: `App/src/pages/BancoDeTalentos.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L395 | `<input type="text">` | `query` | "Busque por nome, curso, instituição ou habilidade..." | Não | - | |

## Arquivo: `App/src/pages/Dashboard.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L189 | `<input type="text">` | `searchQuery` | - | Não | - | |

## Arquivo: `App/src/components/ui/CustomSelect.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L194 | `<input type="text">` | `searchQuery` | "Pesquisar..." | Não | - | |

## Arquivo: `App/src/components/ChatModal.jsx` (2 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L491 | `<input type="text">` | `searchTerm` | "Buscar conversa..." | Não | - | |
| L788 | `<textarea type="textarea">` | `messageInput` | - | Não | - | |

## Arquivo: `App/src/pages/admin/AdminUsers.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L190 | `<input type="text">` | `search` | "Pesquisar por nome, e-mail ou cidade..." | Não | - | |

## Arquivo: `App/src/pages/admin/AdminJobs.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L166 | `<input type="text">` | `search` | "Buscar por cargo, título, empresa ou cidade..." | Não | - | |

## Arquivo: `App/src/pages/admin/AdminServices.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L152 | `<input type="text">` | `search` | "Buscar por serviço, prestador ou cidade..." | Não | - | |

## Arquivo: `App/src/components/admin/AdminConfirmModal.jsx` (1 campos)

| Linha | Tag / Tipo | Campo / Variável | Placeholder | Obrigatório | MaxLength | Finalidade Identificada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L86 | `<textarea type="textarea">` | `reason` | - | Não | - | |

