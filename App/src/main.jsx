import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const requiredFirebaseKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingFirebaseKeys = requiredFirebaseKeys.filter((key) => !import.meta.env[key]);

function renderConfigurationError() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a">
      <section style="max-width:520px;width:100%;border:1px solid #fecaca;border-radius:20px;background:white;padding:28px;text-align:center;box-shadow:0 20px 40px rgba(15,23,42,.08)">
        <h1 style="font-size:20px;margin:0 0 10px">Configuracao indisponivel</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 16px;color:#475569">
          O Firebase nao foi configurado nesta implantacao. A plataforma nao deve ficar em 404 por causa disso.
        </p>
        <p style="font-size:12px;line-height:1.5;margin:0;color:#b91c1c">
          Configure as variaveis VITE_FIREBASE_* no painel da Vercel e execute um novo deploy.
        </p>
      </section>
    </main>
  `;
}

async function boot() {
  if (missingFirebaseKeys.length > 0) {
    console.error('[Boot] Configuracao Firebase incompleta:', missingFirebaseKeys);
    renderConfigurationError();
    return;
  }

  try {
    const { default: App } = await import('./App.jsx');
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    console.error('[Boot] Falha ao iniciar a aplicacao:', error);
    const root = document.getElementById('root');
    root.innerHTML = `
      <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a">
        <section style="max-width:520px;width:100%;border:1px solid #fecaca;border-radius:20px;background:white;padding:28px;text-align:center">
          <h1 style="font-size:20px;margin:0 0 10px">Nao foi possivel iniciar a plataforma</h1>
          <p style="font-size:14px;line-height:1.6;margin:0;color:#475569">Recarregue a pagina. Se persistir, verifique a configuracao do Firebase e o console do navegador.</p>
        </section>
      </main>
    `;
  }
}

boot();
