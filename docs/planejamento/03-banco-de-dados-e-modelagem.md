# 03 - Modelagem de Banco de Dados e Esquema Firestore

Este documento descreve as coleções e esquema JSON do banco de dados **Firebase Firestore** do projeto **Ivaí Conecta**.

---

## 1. Estrutura de Coleções no Firestore

```
  students (Coleção)
    ├── {studentId} (Documento)
    │     ├── name, course, institution, city, avatar, skills
    │     └── endorsements (Array de Objetos)
  
  jobs (Coleção)
    ├── {jobId} (Documento)
    │     ├── title, company, city, type, requiredSkills

  services (Coleção)
    ├── {serviceId} (Documento)
    │     ├── providerName, category, city, phone, rating, reviewsCount, description
```

---

## 2. Esquemas JSON (Firebase / Local Storage)

### A. Coleção: `students`
```json
{
  "id": "String / Number",
  "name": "Lucas Eduardo Silva",
  "course": "Análise e Desenvolvimento de Sistemas",
  "institution": "IFPR Campus Ivaiporã",
  "city": "Ivaiporã",
  "avatar": "https://...",
  "skills": ["JavaScript", "HTML5/CSS3", "React", "Node.js", "SQL"],
  "endorsements": [
    {
      "id": "endosso_123",
      "profName": "Prof. Dr. Ricardo Oliveira",
      "profEmail": "ricardo.oliveira@ifpr.edu.br",
      "institution": "IFPR Campus Ivaiporã",
      "discipline": "Desenvolvimento Web & Banco de Dados",
      "quote": "Aluno exemplar, com ótimo raciocínio lógico.",
      "isVerified": true
    }
  ]
}
```

### B. Coleção: `jobs`
```json
{
  "id": "String / Number",
  "title": "Desenvolvedor Front-end Junior",
  "company": "ValeTech Soluções Digitais",
  "city": "Ivaiporã",
  "type": "Tempo Integral / Híbrido",
  "requiredSkills": ["JavaScript", "HTML5/CSS3", "React", "Git"]
}
```

### C. Coleção: `services`
```json
{
  "id": "String / Number",
  "providerName": "Marcos Eletricista & Automação",
  "category": "Construção & Manutenção",
  "city": "Ivaiporã",
  "phone": "5543999887766",
  "rating": 4.9,
  "reviewsCount": 38,
  "badge": "Verificado Ivaí Conecta",
  "description": "Serviços residenciais e comerciais, quadros de distribuição."
}
```
