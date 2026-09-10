---
description: Proíbe estritamente a inclusão e o envio de dados mockados / fictícios para o repositório GitHub.
globs: ["**/*"]
always_on: true
---

# Regra: Proibição de Dados Mockados (Zero Mock Policy)

Esta regra é de cumprimento obrigatório em todas as tarefas, alterações de código e commits para o GitHub:

1. **Sem Mocks Estáticos**:
   - Nunca crie arquivos com listas de candidatos, vagas, empresas, avaliações ou usuários fictícios (`mockData`, `mockJobs`, `mockCandidates`, `mockTalents`, etc.).
   - Nunca adicione fallbacks com dados falsos nos componentes ou serviços.

2. **Integração Exclusiva com Firebase / Firestore**:
   - Todos os dados exibidos na aplicação devem vir de documentos reais do Firestore ou do usuário autenticado no Firebase Auth.

3. **Empty States Reais**:
   - Em caso de ausência de registros (coleção vazia ou sem resultados de busca), exiba componentes de estado vazio limpos e elegantes (Empty State), orientando o usuário a cadastrar um novo registro.

4. **Verificação Pré-Push**:
   - Antes de enviar ao GitHub, certifique-se de que nenhum dado mockado foi adicionado ao código.
