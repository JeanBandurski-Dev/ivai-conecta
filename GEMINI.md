# Diretrizes do Projeto Ivaí Conecta (GEMINI.md)

## 🚫 Regra Obrigatória: Proibido Dados Mockados (Zero Mock Policy)

Ao desenvolver, revisar ou preparar commits/envios para o repositório (GitHub):

1. **Nunca Enviar Dados Mockados para o Repositório**:
   - É estritamente proibido criar, reintroduzir ou comitar arrays estáticos fictícios (`mockJobs`, `mockCandidates`, `mockUsers`, `mockTalents`, `mockCompanies`, etc.) como substitutos de banco de dados.
   - Nenhuma tela ou componente deve renderizar dados fictícios hardcoded.

2. **Fontes de Dados Dinâmicas e Reais**:
   - Todas as listagens, perfis, vagas, candidaturas, serviços e talentos devem ser obtidos exclusivamente das coleções oficiais do **Cloud Firestore** ou de instâncias de autenticação do **Firebase Auth**.
   - Atualizações e mutações devem persistir no Firestore e refletir em tempo real.

3. **Tratamento de Estado Vazio (Empty States)**:
   - Quando não houver registros no Firestore ou no banco local de um usuário, renderize componentes amigáveis de **Empty State** (ex.: "Nenhuma vaga disponível no momento", "Você ainda não possui candidaturas").
   - **NUNCA** faça fallback para dados falsos ou pré-popule o estado local com registros de demonstração fictícios.

4. **Scripts de Seed Controlados**:
   - Scripts de auto-seed estão desativados por padrão.
   - Não crie inicializadores automáticos que injetem entidades fakes sem autorização explícita.

5. **Verificação Pré-Envio (GitHub)**:
   - Antes de cada commit ou push, execute a verificação automatizada `npm run check:mocks` para garantir que nenhum arquivo no código-fonte introduza dados mockados não autorizados.
