// Prototipo/public/js/vagas.js

import { getJobs } from '../../src/database/firebase-service.js';

document.addEventListener('DOMContentLoaded', () => {
    const citySelect = document.getElementById('jobsPageCitySelect');
    const jobsContainer = document.getElementById('jobsListContainer');

    if (!citySelect || !jobsContainer) {
        console.warn('Elementos do filtro de cidades ou lista de vagas não foram encontrados.');
        return;
    }

    //Escutador do evento 'change' do seletor de cidades
    citySelect.addEventListener('change', async (event) => {
        const selectedCity = event.target.value;

        try {
            //Feedback visual de carregamento
            jobsContainer.innerHTML = `
            <div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: var(--gray-600);">
          Carregando vagas para <strong>${selectedCity}</strong>...
            </div>
        `;

            //Chamada assíncrona ao banco de dados
            const filteredJobs = await getJobs(selectedCity);

            //Atualiza a tela com os resultados
            renderJobs(filteredJobs, jobsContainer, selectedCity);
        } catch (error) {
            console.error('Erro ao filtrar vagas por cidade:', error);
        }
    });
});

function renderJobs(jobsList, container, currentCity) {
    if (!jobsList || jobsList.length === 0) {
        container.innerHTML = `
        <div style="grid-column: 1/-1; padding: 3rem; text-align: center; color: var(--gray-500);">
        Nenhuma vaga encontrada para ${currentCity}.
      </div>
      `;
        return;
    }

    container.innerHTML = jobsList.map(job => `
        <div class="card" style="padding: 1.25rem; border: 1px solid var(--gray-200); background: var(--white);">
      <div style="font-weight: 700; color: var(--gray-800);">${job.company}</div>
      <h3 style="font-size: 1.05rem; color: var(--primary-dark); margin: 0.35rem 0;">${job.title}</h3>
      <div style="font-size: 0.825rem; color: var(--gray-600); margin-bottom: 0.75rem;">
        📍 ${job.city} &bull; ${job.type}
      </div>
    </div>
    `).join('');
}