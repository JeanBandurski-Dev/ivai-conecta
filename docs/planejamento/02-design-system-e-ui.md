# 02 - Design System & UI Specifications

## 1. Diretrizes Visuais e Estética

A identidade do **Ivaí Conecta** é pautada pelo slogan: *"Conectando talentos e oportunidades em Ivaiporã."*

### 🎨 Paleta de Cores (CSS Tokens Oficiais)

```css
:root {
  /* Cores Principais da Identidade Visual */
  --primary-dark:  #0A1128; /* Deep Navy - Fundos escuros e headers corporativos */
  --primary-navy:  #0F172A; /* Dark Navy - Cards e barras secundárias */
  --primary-blue:  #0052FF; /* Electric Royal Blue - Cor principal do logo e botões CTA */
  --primary-light: #EFF6FF; /* Fundo suave para botões e seletores */
  
  /* Cores Tecnológicas & Destaques de Rede */
  --accent-green:  #22C55E; /* Vibrant Green - Nó do logo iC e badges de sucesso */
  --accent-sky:    #38BDF8; /* Electric Cyan - Gradientes e badges secundárias */
  
  /* Badges de Endosso e Selo Verificado */
  --accent-gold:   #F59E0B; /* Amber 500 - Estrelas e Endossos */
  --accent-soft:   #FEF3C7; /* Amber 100 - Fundo de Endossos */

  /* Neutros e Backgrounds */
  --gray-900:      #0A1128;
  --gray-700:      #334155;
  --gray-500:      #64748B;
  --gray-200:      #E2E8F0;
  --gray-50:       #F8FAFC;
  --white:         #FFFFFF;
}
```

---

## 2. Tipografia

- **Títulos e Headings**: `Outfit` (Google Fonts) — Proporciona personalidade moderna e visual marcante.
- **Corpo de Texto e Controles**: `Inter` (Google Fonts) — Proporciona legibilidade excelente em qualquer tela.

---

## 3. Biblioteca de Componentes

### 🏷️ Badge de Endosso Acadêmico Verificado
```html
<span class="badge-endosso">
  🎓 Recomendado pelo Prof. [Nome do Professor]
</span>
```

### 🎯 Indicador de Matching Algorítmico (% Match)
```html
<span class="badge-match high">88% Match</span>
```

### 💬 Botão de Ação WhatsApp Direto
```html
<a href="https://wa.me/5543999887766?text=..." class="btn btn-whatsapp">
  💬 Contatar via WhatsApp
</a>
```
