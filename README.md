# 🌐 Ivaí Conecta

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-FFCA28?logo=firebase)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Ivaí Conecta** é uma plataforma digital desenvolvida como projeto de extensão universitária voltada a conectar alunos, recém-formados, professores, profissionais autônomos (freelancers) e empresas da região do Vale do Ivaí, impulsionando a empregabilidade, parcerias e a prestação de serviços locais.

---

## 📌 Sumário

1. [Sobre o Projeto](#-sobre-o-projeto)
2. [Principais Funcionalidades](#-principais-funcionalidades)
3. [Stack Tecnológica](#-stack-tecnológica)
4. [Pré-requisitos](#-pré-requisitos)
5. [Instalação e Configuração Inicial](#-instalação-e-configuração-inicial)
   - [Passo 1: Clonar o repositório](#passo-1-clonar-o-repositório)
   - [Passo 2: Instalar as dependências](#passo-2-instalar-as-dependências)
   - [Passo 3: Configurar as variáveis de ambiente (.env)](#passo-3-configurar-as-variáveis-de-ambiente-env)
   - [Passo 4: Executar o ambiente de desenvolvimento](#passo-4-executar-o-ambiente-de-desenvolvimento)
6. [Configuração do Firebase (Opcional / Backend)](#-configuração-do-firebase-opcional--backend)
7. [Diretriz Obrigatória: Política de Dados Reais (Zero Mock Policy)](#-diretriz-obrigatória-política-de-dados-reais-zero-mock-policy)
8. [Estrutura de Pastas](#-estrutura-de-pastas)
9. [Scripts Disponíveis](#-scripts-disponíveis)
10. [Documentação Complementar](#-documentação-complementar)
11. [Licença](#-licença)

---

## 📖 Sobre o Projeto

O **Ivaí Conecta** preenche a lacuna de comunicação entre o ecossistema acadêmico universitário e o setor produtivo regional. O sistema oferece soluções completas de divulgação de vagas (estágio, júnior, efetivo, trainees), banco de talentos geolocalizado com classificação de competências, mural para oferta e contratação de serviços técnicos, além de um painel de moderação e métricas administrativas.

---

## ✨ Principais Funcionalidades

- 💼 **Mural de Vagas:** Filtros por cidade, modalidade (remoto, híbrido, presencial), regime (CLT, estágio, PJ) e classificação CBO.
- 🎯 **Gestão de Candidaturas (Funil de Recrutamento):** Empresas acompanham e alteram o status de candidatos em 4 etapas (*Candidatura Enviada*, *Triagem de Currículo*, *Entrevista* e *Proposta / Admissão*) com feedback.
- 🧑‍🎓 **Banco de Talentos:** Pesquisa e visualização de perfis detalhados de alunos, egressos e pesquisadores por curso, semestre e habilidades.
- 🛠️ **Mural de Serviços & Freelancers:** Publicação e busca de prestadores de serviços acadêmicos, técnicos e de design/desenvolvimento.
- 👤 **Perfis Especializados:** Áreas específicas com funcionalidades ajustadas para cada perfil de usuário:
  - **Aluno / Candidato:** Currículo, candidaturas ativas, favoritos e histórico.
  - **Empresa:** Cadastro institucional, publicação e edição de vagas, painel de triagem de candidatos.
  - **Professor / Orientador:** Mentoria, projetos de pesquisa e recomendação acadêmica.
  - **Freelancer / Prestador:** Portfólio, avaliações e serviços ofertados.
  - **Administrador (`/admin`):** Gestão de usuários, moderação de vagas/serviços, estatísticas da plataforma e configurações do sistema.
- 💬 **Mensagens & Chat em Tempo Real:** Conversas diretas entre recrutadores e candidatos.
- 📄 **Exportação de Currículo e Relatórios:** Exportação em PDF utilizando `jspdf` e `html2canvas-pro`.

---

## 🛠️ Stack Tecnológica

- **Front-end:** [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Roteamento:** [React Router DOM v7](https://reactrouter.com/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Gerenciamento de Estado:** [Zustand](https://github.com/pmndrs/zustand)
- **BaaS (Backend as a Service):** [Firebase](https://firebase.google.com/)
  - **Firebase Authentication:** Autenticação por e-mail/senha e Google OAuth.
  - **Cloud Firestore:** Banco de dados NoSQL em tempo real para vagas, usuários, mensagens e candidaturas.
  - **Cloud Storage:** Armazenamento seguro de fotos de perfil, comprovantes e currículos.
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Linter & Qualidade:** [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) e script de verificação contra dados fictícios (`check-no-mocks`).

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de possuir instalado em sua máquina:

1. **[Node.js](https://nodejs.org/)** (versão 18.x, 20.x ou superior recomendada)
2. **[npm](https://www.npmjs.com/)** (geralmente incluído com o Node.js) ou gerenciador de pacotes equivalente (yarn/pnpm)
3. **[Git](https://git-scm.com/)** para controle de versão
4. *(Opcional)* **[Firebase CLI](https://firebase.google.com/docs/cli)** caso deseje fazer deploy de novas regras de segurança (`firestore.rules` e `storage.rules`).

---

## 🚀 Instalação e Configuração Inicial

### Passo 1: Clonar o repositório

Abra o terminal em sua pasta de projetos e execute:

```bash
git clone https://github.com/JeanBandurski-Dev/ivai-conecta.git
cd ivai-conecta
```

---

### Passo 2: Instalar as dependências

O projeto possui a aplicação principal localizada dentro do diretório `App/`, enquanto a raiz gerencia scripts orquestradores e testes. Instale as dependências executando:

#### Opção A (Instalação completa - recomendada):
```bash
# 1. Instala dependências da raiz
npm install

# 2. Instala dependências da aplicação React
npm install --prefix App
```

*Ou manualmente entrando nas pastas:*
```bash
npm install
cd App
npm install
cd ..
```

---

### Passo 3: Configurar as variáveis de ambiente (`.env`)

Dentro da pasta `App/` existe um arquivo modelo chamado `.env.example`. Você deve criar um arquivo `.env` a partir deste modelo.

#### No Linux / macOS (Bash):
```bash
cp App/.env.example App/.env
```

#### No Windows (PowerShell):
```powershell
Copy-Item App\.env.example App\.env
```

#### Conteúdo das variáveis:
O arquivo `App/.env` contém as credenciais de acesso aos serviços do Firebase:

```env
# Configurações do Firebase
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

> 💡 **Nota:** O repositório já disponibiliza as credenciais do ambiente de homologação/desenvolvimento diretamente no `.env.example`. Para iniciar de forma imediata, basta copiar o arquivo. Caso utilize seu próprio projeto do Firebase, substitua os valores pelos dados obtidos nas **Configurações do Projeto > Seus Aplicativos (Web)** no [Firebase Console](https://console.firebase.google.com/).

---

### Passo 4: Executar o ambiente de desenvolvimento

Você pode iniciar o servidor de desenvolvimento diretamente da raiz do projeto:

```bash
npm run dev
```

*(Ou alternativamente: `cd App && npm run dev`)*

O Vite iniciará o servidor local. Acesse no navegador:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🔥 Configuração do Firebase (Opcional / Backend)

Se você estiver configurando o projeto em um novo banco de dados Firebase próprio:

1. Instale o Firebase CLI globalmente (se ainda não tiver):
   ```bash
   npm install -g firebase-tools
   ```
2. Realize login com sua conta Google:
   ```bash
   firebase login
   ```
3. Associe o projeto configurado:
   ```bash
   firebase use <id-do-seu-projeto>
   ```
4. Implante as regras de segurança e índices incluídos no repositório:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```

---

## 🚫 Diretriz Obrigatória: Política de Dados Reais (Zero Mock Policy)

O projeto Ivaí Conecta possui uma diretriz rígida de **Zero Mock Policy**:
- **É estritamente proibido** comitar ou reintroduzir arrays estáticos fictícios (`mockJobs`, `mockCandidates`, `mockUsers`, etc.) no código-fonte.
- Toda listagem, perfil e vaga deve ser consumida dinamicamente do **Cloud Firestore**. Quando não houver registros, a interface deve exibir um componente apropriado de *Empty State*.
- Antes de cada commit ou push, execute a verificação automatizada:

```bash
npm run check:mocks
```

Se algum array estático não autorizado for detectado em `App/src`, o script apontará o arquivo e a linha correspondente para correção.

---

## 📁 Estrutura de Pastas

```text
ivai-conecta/
├── App/                          # Aplicação Front-end (React + Vite)
│   ├── public/                   # Recursos estáticos públicos
│   ├── src/
│   │   ├── assets/               # Imagens, logotipos e ícones locais
│   │   ├── components/           # Componentes modulares de UI (Header, Footer, Cards, Modais)
│   │   │   ├── admin/            # Componentes específicos do painel administrativo
│   │   │   ├── auth/             # Rotas protegidas (ProtectedRoute, GuestRoute)
│   │   │   ├── layout/           # Componentes estruturais (Navbar, Footer, etc.)
│   │   │   └── ui/               # Botões, inputs, toasts, modais de confirmação
│   │   ├── data/                 # Dados de referência auxiliares (cursos, CBO, etc.)
│   │   ├── hooks/                # Hooks customizados
│   │   ├── lib/                  # Configuração do Firebase (Auth, Firestore, Storage)
│   │   ├── models/               # Modelos e schemas de entidades
│   │   ├── pages/                # Telas da aplicação (Vagas, Talentos, Dashboard, etc.)
│   │   │   └── admin/            # Telas da área administrativa (/admin)
│   │   ├── repositories/         # Abstrações de acesso a dados
│   │   ├── services/             # Regras de negócio e integração direta com Firebase
│   │   ├── store/                # Estado global gerenciado com Zustand (useAppStore)
│   │   └── utils/                # Formatadores de texto, validadores de CPF/CNPJ, CBO
│   ├── .env.example              # Modelo de variáveis de ambiente
│   ├── package.json              # Dependências e scripts do front-end
│   ├── tailwind.config.js        # Configurações do Tailwind CSS
│   └── vite.config.js            # Configurações do Vite e plugins locais
├── docs/                         # Documentação técnica, requisitos ABNT e manuais
├── scripts/                      # Scripts Node.js de validação e testes (check-no-mocks)
├── firestore.indexes.json        # Definição dos índices compostos do Firestore
├── firestore.rules               # Regras de segurança e controle de acesso do Firestore
├── storage.rules                 # Regras de segurança de upload do Firebase Storage
├── firebase.json                 # Arquivo de configuração de deploy do Firebase
├── GEMINI.md                     # Diretrizes de contribuição e regras do projeto
├── LICENSE                       # Licença de uso do software
└── package.json                  # Scripts raiz de orquestração
```

---

## ⚙️ Scripts Disponíveis

Na raiz do projeto (`ivai-conecta`):

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia a aplicação React em modo de desenvolvimento (`App`). |
| `npm run build` | Valida a política de dados (`check:mocks`) e compila a aplicação para produção. |
| `npm run check:mocks` | Executa a auditoria automática contra dados estáticos/mockados em `App/src`. |
| `npm test` | Executa o teste de conformidade de código limpo. |

Dentro da pasta `App/` (`cd App`):

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor Vite local (`localhost:5173`). |
| `npm run build` | Compila o bundle otimizado para o diretório `dist/`. |
| `npm run preview` | Pré-visualiza localmente a build de produção gerada. |
| `npm run lint` | Executa o analisador de código [Oxlint](https://oxc.rs/). |

---

## 📚 Documentação Complementar

Na pasta [`docs/`](./docs) estão disponíveis os materiais analíticos e acadêmicos do projeto:
- **Manual de Uso – Ivaí Conecta**: Guia completo com telas e passos para usuários e recrutadores.
- **Documento de Requisitos (ABNT)**: Especificação formal dos requisitos funcionais e não-funcionais.
- **Projeto de Extensão Universitária**: Justificativa social, objetivos e fundamentação teórica.
- **Relatório de Auditoria de Backend**: Mapeamento das regras de segurança, permissões e endpoints.

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Consulte o arquivo [LICENSE](./LICENSE) para obter mais detalhes.

---

*Desenvolvido com dedicação para a comunidade acadêmica e empresarial do Vale do Ivaí.*
