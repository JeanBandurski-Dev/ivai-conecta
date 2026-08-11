# 🌐 Ivaí Conecta

**Conectando talentos e oportunidades em Ivaiporã e no Vale do Ivaí.**

> Projeto de Extensão Acadêmica desenvolvido para aproximar estudantes qualificados (IFPR, UENP, Univale), empresas locais e autônomos/prestadores de serviços regionais.

---

## 🎨 Identidade Visual & Design System
- **Logo oficial**: Monograma `iC` vetorial com nós de conexão.
- **Paleta de Cores**:
  - Azul Elétrico Primário: `#0052FF`
  - Verde Vibrante de Conexão: `#22C55E`
  - Dark Navy Corporativo: `#0A1128`
  - Azul Celeste Destaque: `#38BDF8`

---

## 📁 Estrutura de Diretórios Reorganizada

```
ivai-conecta/
├── docs/
│   ├── Conecta_Ivai_Projeto_Extensao_Documento_do_Projeto_ABNT.pdf
│   ├── Conecta_Ivai_Projeto_Extensao_Plano_de_Desenvolvimento_Detalhado.pdf
│   └── planejamento/                           # Documentação de arquitetura e design
│       ├── 01-visao-e-arquitetura.md
│       ├── 02-design-system-e-ui.md
│       ├── 03-banco-de-dados-e-modelagem.md
│       ├── 04-algoritmo-de-matching-e-regras.md
│       └── 05-cronograma-e-roadmap-dev.md
├── public/
│   ├── assets/                                 # Favicon e imagens estáticas
│   ├── css/
│   │   └── styles.css                          # Design System oficial Ivaí Conecta
│   └── js/
│       ├── firebase-config.js                 # Inicialização & cliente do Firebase (Firestore & Auth)
│       └── app.js                              # Lógica principal, matching e sincronização em tempo real
├── src/
│   ├── database/
│   │   ├── firebase-service.js                 # Camada de serviços CRUD do Firestore (Talentos, Vagas, Serviços)
│   │   └── seed-data.json                     # Dados iniciais para carga e fallbacks
│   ├── modules/
│   │   ├── carreira/
│   │   │   ├── matching-engine.js              # Algoritmo de cálculo de % de Match
│   │   │   └── endorsement-service.js          # Validação e emissão de endossos acadêmicos
│   │   └── servicos/
│   │       └── whatsapp-generator.js           # Gerador de URLs dinâmicas para contato via WhatsApp
│   └── views/
│       ├── index.html                          # Dashboard & Home oficial
│       ├── vagas.html                          # Painel de Vagas & Match
│       ├── servicos.html                       # Marketplace de Serviços Locais
│       └── perfil-aluno.html                   # Perfil Acadêmico Verificado
├── .env.example                                # Modelo de variáveis de ambiente para Firebase
├── package.json                                # Configuração do projeto e scripts de dev/server
└── README.md                                   # Guia do repositório
```

---

## ⚡ Integração com Firebase (Firestore & Auth)

O projeto possui integração nativa com o **Firebase (Firestore & Auth)**:
- **`public/js/firebase-config.js`**: Inicialização do Firebase App.
- **`src/database/firebase-service.js`**: Métodos CRUD (`getTalents`, `getJobs`, `getServices`, `addEndorsementToTalent`, `addService`).
- **Fallback Automático**: Caso as chaves do Firebase não estejam configuradas em um ambiente de teste, o sistema utiliza o banco local pré-carregado (`seed-data.json` / LocalStorage) garantindo execução zero-config.

---

## 🚀 Como Executar o Projeto

1. Clone ou abra a pasta do repositório:
   ```bash
   cd C:\Users\jeanc\ivai-conecta
   ```
2. Inicie o servidor local:
   ```bash
   npm start
   ```
   *Ou execute qualquer servidor web (ex: `python -m http.server 8080`).*
3. Acesse no navegador:
   - `http://localhost:8080/src/views/index.html` (ou diretamente `http://localhost:8080/`).

---

## 📜 Licença
Projeto desenvolvido sob licença MIT. Projeto de Extensão IFPR Campus Ivaiporã.
