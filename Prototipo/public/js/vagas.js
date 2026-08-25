// Prototipo/public/js/vagas.js

import { getJobs, addJob } from '../../src/database/firebase-service.js';

document.addEventListener('DOMContentLoaded', () => {
    const citySelect = document.getElementById('jobsPageCitySelect');
    const jobsContainer = document.getElementById('jobsListContainer');

    //Elementos do Modal de Publicar Vaga
    const publishModal = document.getElementById('publishJobModal');
    const btnPublishHero = document.getElementById('btnPublishJobHero');
    const newJobForm = document.getElementById('newJobForm');


    if (!citySelect || !jobsContainer) {
        console.warn('Elementos do filtro de cidades ou lista de vagas não foram encontrados.');
        return;
    }

    //1.Funcao para carregar e exibir as vagas
    async function loadJobs(city = 'Todas as Cidades') {
        try {
            jobsContainer.innerHTML = `
                <div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: var(--gray-600);">
                    Carregando vagas...
                </div>
            `;
            const filteredJobs = await getJobs(city);
            renderJobs(filteredJobs, jobsContainer, city);
        } catch (error) {
            console.error('Erro ao carregar vagas:', error);
        }
    }

    //Carregamento inicial das vagas
    loadJobs(citySelect.value || 'Todas as Cidades');

    //2.Escutador do evento 'change' do seletor de cidades
    citySelect.addEventListener('change', async (event) => {
        const selectedCity = event.target.value;
        loadJobs(selectedCity);
    });

    //3.Controle de abertura do modal de Publicacao
    if (btnPublishHero && publishModal) {
        btnPublishHero.addEventListener('click', () => {
            publishModal.classList.add('active');
        });
    }

    //Abre o modal automaticamente se a URL tiver o parametro ?action=new (ex: vindo do perfil da empresa)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new' && publishModal) {
        publishModal.classList.add('active');
    }

    //4.Controle de fechamento do Modal (botoes com data-close-modal ou .modal-close)
    if (publishModal) {
        publishModal.querySelectorAll('.modal-close, [data-close-modal]').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                publishModal.classList.remove('active');
            });
        });
    }

    //5.Envios do Formulário de Nova Vaga
    if (newJobForm) {
        newJobForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            //Captura os dados informados nos campos do formulario
            const title = document.getElementById('newJobTitle').value.trim();
            const company = document.getElementById('newJobCompany').value.trim();
            const city = document.getElementById('newJobCity').value;
            const type = document.getElementById('newJobType').value;
            const skillsRaw = document.getElementById('newJobSkills').value;

            //Converte a string de competencia separada por virgula em um array
            const skills = skillsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);

            //Monta o objeto da nova vaga
            const newJobData = {
                id: Date.now(),
                title,
                company,
                city,
                type,
                skills,
                createdAt: new Date().toISOString()
            };

            try {
                //Chama o servico para cadastrar a vaga
                await addJob(newJobData);

                //Fecha o modal e limpa os campos do formulario
                publishModal.classList.remove('active');
                newJobForm.reset();

                //Recarrega a lista de vagas imediatamente para exibir a nova vaga cadastrada
                await loadJobs(citySelect.value || 'Todas as Cidades');

                alert('Vaga publicada com sucesso no IvaÍ Conecta!');
            } catch (error) {
                console.error('Erro ao publicar vaga:', error);
                alert('Ocorreu um erro ao tentar publicar a vaga. Tente novamente.');
            }
        });
    }
});

//6.Funcao de renderizacao dos cards na tela
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
        <div class="card" style="padding: 1.25rem; border: 1px solid var(--gray-200); background: var(--white); border-radius: 8px;">
            <div style="font-weight: 700; color: var(--gray-800);">${job.company}</div>
            <h3 style="font-size: 1.05rem; color: var(--primary-dark); margin: 0.35rem 0;">${job.title}</h3>
            <div style="font-size: 0.825rem; color: var(--gray-600); margin-bottom: 0.75rem;">
                📍 ${job.city} &bull; ${job.type}
            </div>
            ${job.skills && job.skills.length > 0 ? `
                <div style="display: flex; gap: 0.25rem; flex-wrap: wrap; margin-top: 0.5rem;">
                    ${job.skills.map(s => `<span class="tag" style="font-size: 0.75rem;">${s}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}