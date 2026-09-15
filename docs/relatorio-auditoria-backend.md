# Relatório de Auditoria Arquitetural & Diagnóstico de Backend
**Projeto:** Ivaí Conecta (React + Firebase Firestore / Auth / Storage)  
**Papel:** Arquiteto de Software Sênior & Tech Lead  
**Data:** 04 de Setembro de 2026  

---

## 📌 Contexto e Escopo da Auditoria
Auditoria técnica completa realizada na camada de backend, serviços e banco de dados do projeto **Ivaí Conecta**, abrangendo:
- Regras de segurança e autorização: `firestore.rules` e `storage.rules`
- Serviços modulares da aplicação: `App/src/services/*` (`jobsService`, `talentsService`, `servicesService`, `authService`, `favoritesService`, `chatService`, `storageService`, `matchService`)
- Código legado de transição: `Prototipo/src/database/firebase-service.js`

O objetivo deste documento é registrar os débitos técnicos, falhas de integridade, brechas de segurança e operações de CRUD faltantes, categorizados por prioridade de impacto.

---

## 🔴 Prioridade Alta (Crítico / Segurança / Regras Bloqueantes)

### 1. Vulnerabilidade Crítica de Autorização nas Regras de Segurança
* **Arquivos Afetados:** `firestore.rules`, `storage.rules`
* **Diagnóstico:** As regras atuais definem permissões permissivas baseadas unicamente em `isAuthenticated()`.
* **Impacto Técnico:** Qualquer usuário cadastrado e autenticado possui permissão irrestrita para sobrescrever, alterar ou deletar dados pertencentes a outros usuários (ex: alterar o perfil de outro aluno, encerrar ou deletar vagas de empresas concorrentes, excluir mensagens ou sobrescrever arquivos no Firebase Storage).
* **Solução Necessária:** Implementar checagem estrita de propriedade nas regras (`request.auth.uid == userId` ou checagem de vínculo com o documento `resource.data.recruiterUid == request.auth.uid`).

### 2. Ausência de Fluxo de Recuperação de Senha (`sendPasswordResetEmail`)
* **Arquivo Afetado:** `App/src/services/authService.js`
* **Diagnóstico:** O serviço implementa cadastro e login via Firebase Auth, mas não fornece método de redefinição ou esquecimento de senha.
* **Impacto Técnico:** Caso um candidato ou empresa esqueça sua credencial, fica permanentemente impossibilitado de acessar o sistema sem intervenção manual no Firebase Console.
* **Solução Necessária:** Criar a função `resetUserPassword(email)` utilizando `sendPasswordResetEmail(auth, email)` com tratamento amigável de erros.

### 3. Falta de Gestão das Etapas do Funil de Candidatura (`updateApplicationStage`)
* **Arquivo Afetado:** `App/src/services/jobsService.js`
* **Diagnóstico:** A função `applyToJob` cria um pipeline com 4 etapas estruturadas (*Candidatura Enviada*, *Triagem de Currículo*, *Entrevista*, *Proposta / Admissão*). Contudo, inexiste qualquer função no serviço que permita ao recrutador alterar a fase do candidato.
* **Impacto Técnico:** O processo seletivo fica estático; recrutadores não conseguem aprovar, reprovar ou anexar notas de feedback às candidaturas no Firestore.
* **Solução Necessária:** Desenvolver `updateApplicationStage(applicationId, nextStageIndex, feedbackNote, newStatus)`.

### 4. Falso Fluxo de Verificação de Alunos e Empresas (Validação Ilusória no Front-end)
* **Arquivos Afetados:** `App/src/services/talentsService.js` (`submitStudentVerification`), `App/src/services/authService.js` (`submitCompanyVerification`)
* **Diagnóstico:** As funções concedem status de "Aprovado" e selo de verificado instantaneamente no estado local/memória sem upload de comprovante e sem atualização real no documento do Firestore.
* **Impacto Técnico:** Risco de segurança e integridade; qualquer usuário pode simular ser um estudante com matrícula ativa ou empresa com CNPJ validado sem passar por auditoria ou persistência na nuvem.
* **Solução Necessária:** Integrar o upload de documento (`uploadUserDocument` no Storage), registrar a solicitação com status `Pendente` no Firestore e persistir a alteração no perfil.

### 5. Favoritos em "Buraco Negro" (Persistência na Nuvem sem Sincronização)
* **Arquivo Afetado:** `App/src/services/favoritesService.js`
* **Diagnóstico:** O método `toggleFavorite` salva os registros no Firestore na coleção `favorites`, mas as funções de leitura `getFavoriteJobs()` e `getFavoriteTalents()` consultam unicamente o `localStorage`.
* **Impacto Técnico:** Se o usuário acessar por outro computador, limpar os dados de navegação ou usar dispositivo móvel, a lista de favoritos no front-end permanece vazia, inutilizando os dados persistidos no Firestore.
* **Solução Necessária:** Criar funções assíncronas de hidratação/sincronização `loadUserFavorites(userUid)` que façam query na coleção `favorites` e sincronizem o cache local.

### 6. Desistência de Candidatura com Ajuste Atômico (`withdrawApplication`)
* **Arquivo Afetado:** `App/src/services/jobsService.js`
* **Diagnóstico:** Não existe método que permita a um candidato retirar sua candidatura.
* **Impacto Técnico:** O candidato não pode corrigir inscrições indevidas. Além disso, a contagem de inscritos na vaga (`applicantsCount`) precisa ser decrementada atomicamente no Firestore (`increment(-1)`).
* **Solução Necessária:** Implementar `withdrawApplication(applicationId, jobId)` com remoção/atualização de status no Firestore e decremento atômico na vaga.

---

## 🟡 Prioridade Média (Integridade de Dados & CRUDs Incompletos)

### 7. CRUD Incompleto de Vagas: Ausência de Edição (`updateJob`) e Exclusão (`deleteJob`)
* **Arquivo Afetado:** `App/src/services/jobsService.js`
* **Diagnóstico:** Há apenas o método `updateJobStatus` (que alterna entre 'Ativa' e 'Encerrada'). Não há métodos para atualizar o corpo da vaga nem para excluí-la.
* **Impacto Técnico:** Erros de digitação, alterações de faixa salarial ou mudanças de requisitos exigem recriar a vaga do zero, gerando duplicidade e sujeira no banco.
* **Solução Necessária:** Criar `updateJob(jobId, jobData)` e `deleteJob(jobId)`.

### 8. Validação de Duplicidade de Candidatura Sujeita a Falhas de Concorrência
* **Arquivo Afetado:** `App/src/services/jobsService.js`
* **Diagnóstico:** Em `applyToJob`, a validação que impede candidaturas repetidas consulta apenas o `localStorage`.
* **Impacto Técnico:** Usuários logados em novas abas/dispositivos conseguem submeter inscrições idênticas para a mesma vaga diretamente no Firestore.
* **Solução Necessária:** Realizar consulta direta no Firestore (`where('jobId', '==', jobId)`, `where('candidateUid', '==', userUid)`) antes de confirmar a escrita.

### 9. Vazamento de Mensagens Órfãs ao Deletar Conversas (`deleteChatThread`)
* **Arquivo Afetado:** `App/src/services/chatService.js`
* **Diagnóstico:** O Firestore não exclui subcoleções automaticamente quando um documento pai é removido via `deleteDoc`.
* **Impacto Técnico:** Ao apagar uma conversa, as mensagens filhas em `chats/{chatId}/messages` continuam persistidas na nuvem, gerando vazamento de dados e custos de armazenamento.
* **Solução Necessária:** Implementar exclusão em lote (batch delete) de todas as mensagens filhas antes de remover o documento do chat.

### 10. Dependência de Cache Local no Fluxo de Aprovação de Endossos
* **Arquivo Afetado:** `App/src/services/talentsService.js`
* **Diagnóstico:** Em `approveEndorsementRequest`, o sistema executa `addEndorsementToTalent(req.studentId)`, que por sua vez depende de `getTalentById` (puramente síncrono e baseado em `localStorage`).
* **Impacto Técnico:** Se o professor estiver avaliando um aluno cujo perfil não foi previamente baixado em sua máquina, o método falha silenciosamente e o endosso nunca é adicionado ao aluno no Firestore.
* **Solução Necessária:** Fazer a busca assíncrona do aluno diretamente no Firestore caso não seja encontrado no cache.

### 11. Falta de Edição e Revogação de Recomendações Docentes
* **Arquivo Afetado:** `App/src/services/talentsService.js`
* **Diagnóstico:** Não há funções para o aluno cancelar uma solicitação enviada por engano (`cancelEndorsementRequest`), nem para o professor editar o parecer (`updateEndorsementQuote`) ou revogá-lo (`deleteEndorsement`).
* **Impacto Técnico:** Ausência de controle de ciclo de vida dos pareceres acadêmicos.

### 12. CRUD Incompleto no Marketplace de Serviços (Avaliações e Fórum)
* **Arquivo Afetado:** `App/src/services/servicesService.js`
* **Diagnóstico:** A entidade possui atributos de `reviews: []`, `rating`, `reviewsCount` e `forumTopics: []`, mas não há métodos operacionais no serviço.
* **Impacto Técnico:** Clientes não conseguem avaliar serviços prestados nem tirar dúvidas públicas com prestadores autônomos.
* **Solução Necessária:** Desenvolver `addServiceReview` (com cálculo incremental da média de estrelas) e `addServiceForumQuestion`.

### 13. Ausência de Remoção de Arquivos Substituídos no Storage (`deleteFile`)
* **Arquivo Afetado:** `App/src/services/storageService.js`
* **Diagnóstico:** Não há chamada a `deleteObject` do Firebase Storage quando uma foto ou documento é substituído.
* **Impacto Técnico:** Acúmulo progressivo de imagens e PDFs obsoletos consumindo cota do Cloud Storage.

---

## 🟢 Prioridade Baixa (Melhorias de Arquitetura, UX e Conformidade)

### 14. Ausência de Rotina de Exclusão de Conta / LGPD (`deleteAccount`)
* **Arquivo Afetado:** `App/src/services/authService.js`
* **Diagnóstico:** Não há método que permita ao usuário excluir sua conta no Firebase Auth e cascatear a exclusão de seus dados pessoais.
* **Impacto Técnico:** Não conformidade com o direito ao esquecimento previsto na LGPD.

### 15. Inexistência de Consultas Assíncronas Diretas por ID (`getByIdAsync`)
* **Arquivos Afetados:** `jobsService.js`, `talentsService.js`, `servicesService.js`
* **Diagnóstico:** As buscas unitárias dependem de o registro já estar na memória do cliente.
* **Impacto Técnico:** Falhas ao acessar links diretos compartilhados (deeplinks) sem passar pela listagem global.
* **Solução Necessária:** Disponibilizar `getJobByIdAsync(id)`, `getTalentByIdAsync(id)` e `getServiceByIdAsync(id)`.

### 16. Falta de Confirmação de Leitura e Contador de Não Lidas no Chat
* **Arquivo Afetado:** `App/src/services/chatService.js`
* **Diagnóstico:** O modelo de mensagens não armazena status `read: boolean` nem timestamp de entrega.
* **Impacto Técnico:** Usuários não sabem se foram respondidos/visualizados, e não há como exibir badges com contagem de notificações não lidas.

### 17. Favoritar Prestadores de Serviços no Marketplace
* **Arquivo Afetado:** `App/src/services/favoritesService.js`
* **Diagnóstico:** Existe suporte apenas a favoritar vagas e talentos.
* **Impacto Técnico:** Quebra de coerência da experiência do usuário no marketplace autônomo.
* **Solução Necessária:** Adicionar `getFavoriteServices()` e `toggleFavoriteService(serviceId, userUid)`.

### 18. Descontinuação Formal do Código Legado do Protótipo
* **Arquivo Afetado:** `Prototipo/src/database/firebase-service.js`
* **Diagnóstico:** Manutenção de código monolítico legado na raiz do repositório.
* **Impacto Técnico:** Risco de importações erradas ou confusão técnica por membros da equipe.
* **Solução Necessária:** Documentar como legado ou arquivar a pasta `Prototipo/`.

---

## 🎯 Ordem Recomendada de Implementação
1. **Fase 1 - Blindagem e Integridade:** Regras de Segurança (`firestore.rules` e `storage.rules`) + Recuperação de Senha (`authService.js`).
2. **Fase 2 - Funil de Vagas e Candidaturas:** `updateApplicationStage`, `withdrawApplication` e `updateJob`/`deleteJob` (`jobsService.js`).
3. **Fase 3 - Sincronização e Confiabilidade:** Hidratação de favoritos na nuvem (`favoritesService.js`) + Validação real de Aluno/Empresa com Storage (`talentsService.js` e `authService.js`).
4. **Fase 4 - Marketplace e Chat:** Avaliações no `servicesService.js` + Exclusão em lote no `chatService.js`.
