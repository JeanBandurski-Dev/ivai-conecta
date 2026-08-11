# 04 - Especificação do Algoritmo de Matching e Regras de Negócio

## 1. Algoritmo de Compatibilidade de Habilidades (Match Score)

O algoritmo compara a lista de habilidades do candidato ($S$) com a lista de habilidades requeridas pela vaga ($V$).

### 🧮 Fórmula de Cálculo

$$\text{MatchScore} = \text{round}\left( \frac{|S \cap V|}{|V|} \times 100 \right)$$

### 💻 Implementação Modular em `src/modules/carreira/matching-engine.js`

```javascript
export function calculateMatchScore(studentSkills = [], requiredSkills = []) {
  if (!requiredSkills || requiredSkills.length === 0) return 0;
  if (!studentSkills || studentSkills.length === 0) return 0;
  
  const normalizedStudent = studentSkills.map(s => s.toLowerCase().trim());
  let matches = 0;
  
  requiredSkills.forEach(req => {
    if (normalizedStudent.includes(req.toLowerCase().trim())) {
      matches++;
    }
  });

  return Math.round((matches / requiredSkills.length) * 100);
}
```

---

## 2. Gerador de Links Diretos para WhatsApp (`wa.me`)

Localizado em `src/modules/servicos/whatsapp-generator.js`:

```javascript
export function generateWhatsAppLink(phone, serviceName, providerName, city) {
  const message = `Olá ${providerName}! Encontrei seu serviço de "${serviceName}" em ${city} através da plataforma Ivaí Conecta. Gostaria de solicitar um orçamento.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
```
