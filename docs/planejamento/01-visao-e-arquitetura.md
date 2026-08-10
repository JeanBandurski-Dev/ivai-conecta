# 01 - Visão do Produto e Arquitetura de Software

## 1. Visão Geral do Produto

O **Ivaí Conecta** é um ecossistema digital regional projetado para conectar talentos e oportunidades em Ivaiporã e no Vale do Ivaí (Jardim Alegre, São João do Ivaí, Manoel Ribas, Lunardelli, Borrazópolis, Ariranha do Ivaí e Grandes Rios).

### 🎯 Problemas Solucionados
1. **Dificuldade de recrutamento qualificado**: Empresas regionais não sabem onde encontrar os melhores formandos dos cursos técnicos e superiores da região.
2. **Falta de validação prática**: Alunos formados têm dificuldades de comprovar suas habilidades práticas sem experiência formal prévia.
3. **Desconexão com serviços locais**: Moradores e negócios locais dependem de indicação informal para contratar eletricistas, suporte técnico, aulas ou serviços autônomos.

---

## 2. Pilares Estratégicos

1. **Banco de Talentos Acadêmicos Verificados**:
   - Perfis de estudantes com competências estruturadas em tags.
   - Selo visual e funcional **"Endosso Acadêmico Verificado"** concedido por docentes credenciados (ex: IFPR, UENP, Univale).

2. **Vagas com Algoritmo de Matching**:
   - Sistema de cálculo dinâmico de % de compatibilidade entre os pré-requisitos das empresas e as competências do aluno.

3. **Marketplace Regional de Serviços Locais**:
   - Catálogo de autônomos e MEIs organizados por categoria e cidade.
   - Sistema de avaliação de clientes e direcionamento instantâneo via **WhatsApp (`wa.me`)**.

---

## 3. Arquitetura do Repositório (`src/` & `public/`)

```
                  ┌───────────────────────────────────────────────┐
                  │              CAMADA DE APRESENTAÇÃO           │
                  │        HTML5 / CSS3 (Design System)           │
                  │           src/views/ e public/css/            │
                  └───────────────────────┬───────────────────────┘
                                          │
                  ┌───────────────────────▼───────────────────────┐
                  │              MOTOR DE REGRAS E LÓGICA         │
                  │   • matching-engine.js (% Match Score)        │
                  │   • endorsement-service.js (Validação Docente)│
                  │   • whatsapp-generator.js (URLs Dinâmicas)    │
                  └───────────────────────┬───────────────────────┘
                                          │
                  ┌───────────────────────▼───────────────────────┐
                  │           CAMADA DE DADOS E FIREBASE          │
                  │   • firebase-config.js (Firestore & Auth)     │
                  │   • firebase-service.js (CRUD & Fallback)     │
                  │   • seed-data.json (População Inicial)        │
                  └───────────────────────────────────────────────┘
```
