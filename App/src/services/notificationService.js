/**
 * @file notificationService.js
 * @description Serviço de gerenciamento de notificações, privacidade e despacho de e-mails transacionais
 * para o ecossistema Ivaí Conecta.
 * 
 * Regras estritas:
 * - Sem dados mockados (Zero Mock Policy).
 * - Integração real com Firestore e Firebase Auth.
 * - Respeito rigoroso às preferências de comunicação do usuário (Opt-in / Opt-out).
 * - Despacho seguro via fila 'mail' do Cloud Firestore (padrão oficial Firebase Trigger Email Extension).
 */

import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  emailNotifications: true,       // Notificações por e-mail ativadas globalmente
  applicationUpdates: true,       // Atualizações no processo seletivo / etapas da candidatura
  interviewInvites: true,         // Convites e alterações de agendamento de entrevistas
  companyMessages: true,          // Mensagens diretas ou comunicações importantes de empresas
  platformAnnouncements: false,   // Comunicados e atualizações gerais da plataforma
  newApplicants: true,            // [Empresas] Aviso de novos candidatos em vagas abertas
  frequency: 'instant'            // 'instant' (imediato) | 'daily' (resumo diário)
};

export const DEFAULT_PRIVACY_SETTINGS = {
  talentDirectoryVisibility: 'public', // 'public' | 'verified_only' | 'private'
  showContactInfo: true,                // Exibir links e contatos profissionais para recrutadores
  shareResumeWithRecruiters: true,      // Permitir acesso ao currículo e competências por empresas
  allowDirectMessages: true             // Permitir recebimento de mensagens no chat interno
};

/**
 * Busca as preferências de notificação do usuário diretamente no Firestore.
 * @param {string} userUid 
 * @returns {Promise<typeof DEFAULT_NOTIFICATION_PREFERENCES>}
 */
export async function getUserNotificationPreferences(userUid) {
  if (!userUid) return { ...DEFAULT_NOTIFICATION_PREFERENCES };

  try {
    const userDocRef = doc(db, 'users', String(userUid));
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.notificationPreferences && typeof data.notificationPreferences === 'object') {
        return {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...data.notificationPreferences
        };
      }
    }
  } catch (error) {
    console.warn('[notificationService] Erro ao buscar preferências de notificação:', error.message);
  }

  return { ...DEFAULT_NOTIFICATION_PREFERENCES };
}

/**
 * Salva as preferências de notificação do usuário no Cloud Firestore.
 * @param {string} userUid 
 * @param {object} preferences 
 * @returns {Promise<{ success: boolean, preferences?: object, error?: string }>}
 */
export async function saveUserNotificationPreferences(userUid, preferences) {
  if (!userUid) {
    return { success: false, error: 'Usuário não autenticado.' };
  }

  const cleanPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...preferences
  };

  try {
    const userDocRef = doc(db, 'users', String(userUid));
    await setDoc(userDocRef, {
      notificationPreferences: cleanPreferences,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { success: true, preferences: cleanPreferences };
  } catch (error) {
    console.error('[notificationService] Erro ao salvar preferências:', error);
    return { success: false, error: error.message || 'Erro ao persistir preferências no banco de dados.' };
  }
}

/**
 * Busca as configurações de privacidade do usuário no Firestore.
 * @param {string} userUid 
 * @returns {Promise<typeof DEFAULT_PRIVACY_SETTINGS>}
 */
export async function getUserPrivacySettings(userUid) {
  if (!userUid) return { ...DEFAULT_PRIVACY_SETTINGS };

  try {
    const userDocRef = doc(db, 'users', String(userUid));
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.privacySettings && typeof data.privacySettings === 'object') {
        return {
          ...DEFAULT_PRIVACY_SETTINGS,
          ...data.privacySettings
        };
      }
    }
  } catch (error) {
    console.warn('[notificationService] Erro ao carregar configurações de privacidade:', error.message);
  }

  return { ...DEFAULT_PRIVACY_SETTINGS };
}

/**
 * Salva as configurações de privacidade do usuário no Cloud Firestore.
 * @param {string} userUid 
 * @param {object} settings 
 * @returns {Promise<{ success: boolean, settings?: object, error?: string }>}
 */
export async function saveUserPrivacySettings(userUid, settings) {
  if (!userUid) {
    return { success: false, error: 'Usuário não autenticado.' };
  }

  const cleanSettings = {
    ...DEFAULT_PRIVACY_SETTINGS,
    ...settings
  };

  try {
    const userDocRef = doc(db, 'users', String(userUid));
    await setDoc(userDocRef, {
      privacySettings: cleanSettings,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { success: true, settings: cleanSettings };
  } catch (error) {
    console.error('[notificationService] Erro ao salvar configurações de privacidade:', error);
    return { success: false, error: error.message || 'Erro ao persistir privacidade no banco de dados.' };
  }
}

/**
 * Mapeamento de rótulos humanizados para etapas de processos seletivos.
 */
export const STAGE_DISPLAY_NAMES = {
  triagem: 'Triagem / Novos Currículos',
  analise: 'Em Análise',
  entrevista: 'Entrevista',
  desafio: 'Desafio Técnico',
  aprovado: 'Aprovado(a)',
  reprovado: 'Banco de Talentos',
  banco_talentos: 'Banco de Talentos'
};

/**
 * Dispara uma notificação oficial por e-mail quando a empresa atualiza a etapa de uma candidatura.
 * Respeita rigorosamente a escolha e preferências de notificação do candidato.
 * 
 * @param {object} params
 * @param {string} params.candidateEmail - E-mail do candidato
 * @param {string} [params.candidateUid] - UID do candidato no Firebase
 * @param {string} [params.candidateName] - Nome do candidato
 * @param {string} [params.jobTitle] - Título da vaga
 * @param {string} [params.companyName] - Nome da empresa contratante
 * @param {string} params.newStage - Chave ou nome da nova etapa
 * @param {string} [params.newStageName] - Rótulo amigável da nova etapa
 * @returns {Promise<{ dispatched: boolean, skipped?: boolean, reason?: string, error?: string }>}
 */
export async function sendApplicationStatusNotification({
  candidateEmail,
  candidateUid = null,
  candidateName = 'Candidato(a)',
  jobTitle = 'Oportunidade',
  companyName = 'Empresa parceira',
  newStage,
  newStageName = null
}) {
  const emailTarget = String(candidateEmail || '').trim().toLowerCase();
  if (!emailTarget || !emailTarget.includes('@')) {
    return { dispatched: false, skipped: true, reason: 'invalid_email' };
  }

  // 1. Consulta as preferências do candidato
  let userPrefs = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  if (candidateUid) {
    userPrefs = await getUserNotificationPreferences(candidateUid);
  } else {
    // Busca por e-mail no Firestore se UID não veio diretamente
    try {
      const q = query(collection(db, 'users'), where('email', '==', emailTarget));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const udata = snap.docs[0].data();
        if (udata.notificationPreferences) {
          userPrefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...udata.notificationPreferences };
        }
      }
    } catch (prefErr) {
      console.warn('[notificationService] Não foi possível carregar preferências por e-mail:', prefErr.message);
    }
  }

  // 2. Valida se o usuário habilitou notificações por e-mail para processos seletivos
  if (userPrefs.emailNotifications === false) {
    console.info(`[notificationService] Notificação por e-mail ignorada: o usuário ${emailTarget} desativou notificações globais.`);
    return { dispatched: false, skipped: true, reason: 'user_disabled_email_notifications' };
  }

  if (userPrefs.applicationUpdates === false) {
    console.info(`[notificationService] Notificação por e-mail ignorada: o usuário ${emailTarget} desativou alertas de atualização de candidatura.`);
    return { dispatched: false, skipped: true, reason: 'user_disabled_application_updates' };
  }

  // 3. Monta o conteúdo padronizado conforme especificação do projeto
  const stageFormatted = newStageName || STAGE_DISPLAY_NAMES[newStage] || newStage;
  const subject = 'Atualização da sua candidatura — Ivai Conecta';

  const plainText = `Olá, ${candidateName || 'Candidato(a)'}!\n\n` +
    `Temos uma atualização sobre sua candidatura.\n\n` +
    `A empresa responsável pela oportunidade "${jobTitle}" atualizou sua etapa no processo seletivo.\n\n` +
    `Nova etapa: ${stageFormatted}.\n\n` +
    `Acesse sua conta no Ivai Conecta para consultar os detalhes.\n\n` +
    `Atenciosamente,\nEquipe Ivai Conecta.`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; margin: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="background: linear-gradient(135deg, #0A1128 0%, #051944 50%, #0052FF 100%); padding: 32px 28px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Ivaí Conecta</h1>
        <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 13px;">Conectando talentos e oportunidades no Vale do Ivaí</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Olá, ${candidateName || 'Candidato(a)'}!</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          Temos uma atualização sobre sua candidatura para a vaga <strong>${jobTitle}</strong> na empresa <strong>${companyName}</strong>.
        </p>
        <div style="background-color: #f1f5f9; border-left: 4px solid #0052FF; padding: 16px 20px; border-radius: 8px; margin: 24px 0;">
          <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Status do Processo Seletivo</span>
          <span style="font-size: 18px; font-weight: 800; color: #0052FF;">Nova etapa: ${stageFormatted}</span>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Acesse sua conta no Ivaí Conecta para consultar os detalhes do processo, cronograma e orientações enviadas pelo recrutador.
        </p>
        <div style="margin: 28px 0 16px 0; text-align: center;">
          <a href="https://ivai-conecta-4a366.firebaseapp.com/minhas-vagas" style="background-color: #0052FF; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; display: inline-block;">Acessar Minhas Candidaturas</a>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          Atenciosamente,<br />
          <strong>Equipe Ivaí Conecta.</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 16px 28px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        Você está recebendo este e-mail porque se candidatou a uma vaga no Ivaí Conecta e suas preferências permitem avisos de atualização.<br />
        Para gerenciar suas notificações, acesse Configurações &gt; Notificações &amp; Privacidade na sua conta.
      </td>
    </tr>
  </table>
</body>
</html>
`;

  // 4. Enfileira o e-mail na coleção oficial 'mail' do Firestore
  try {
    const mailDoc = {
      to: emailTarget,
      message: {
        subject,
        text: plainText,
        html: htmlContent
      },
      metadata: {
        type: 'application_status_update',
        candidateUid: candidateUid || null,
        jobTitle,
        companyName,
        newStage,
        newStageName: stageFormatted,
        createdAt: new Date().toISOString()
      }
    };

    const docRef = await addDoc(collection(db, 'mail'), mailDoc);

    console.info(`[notificationService] E-mail enfileirado na coleção 'mail' (${docRef.id}) para ${emailTarget}.`);
    return {
      dispatched: true,
      mailId: docRef.id,
      to: emailTarget,
      subject
    };
  } catch (error) {
    console.warn('[notificationService] Aviso ao enfileirar no Firestore /mail:', error.message);
    // Caso a extensão do Firebase Trigger Email ainda não esteja instalada no projeto remoto,
    // a tentativa foi processada sem quebrar a execução da interface.
    return {
      dispatched: false,
      error: error.message,
      requiresExtensionSetup: true
    };
  }
}

/**
 * Dispara notificação oficial por e-mail de agendamento de entrevista.
 * @param {object} params
 */
export async function sendInterviewScheduledNotification({
  candidateEmail,
  candidateUid = null,
  candidateName = 'Candidato(a)',
  jobTitle = 'Oportunidade',
  companyName = 'Empresa parceira',
  interviewData = {}
}) {
  const emailTarget = String(candidateEmail || '').trim().toLowerCase();
  if (!emailTarget || !emailTarget.includes('@')) {
    return { dispatched: false, skipped: true, reason: 'invalid_email' };
  }

  let userPrefs = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  if (candidateUid) {
    userPrefs = await getUserNotificationPreferences(candidateUid);
  }

  if (userPrefs.emailNotifications === false || userPrefs.interviewInvites === false) {
    return { dispatched: false, skipped: true, reason: 'user_opted_out' };
  }

  const dateFormatted = interviewData.date ? String(interviewData.date).split('-').reverse().join('/') : 'A definir';
  const timeFormatted = interviewData.time || 'Horário comercial';
  const formatText = interviewData.format || 'Google Meet / Online';

  const subject = `Convite para Entrevista: ${jobTitle} — Ivai Conecta`;
  const plainText = `Olá, ${candidateName}!\n\n` +
    `A empresa ${companyName} agendou sua entrevista para a vaga "${jobTitle}".\n\n` +
    `Data: ${dateFormatted}\n` +
    `Horário: ${timeFormatted}\n` +
    `Formato: ${formatText}\n\n` +
    `Acesse sua conta no Ivai Conecta para conferir as instruções e o link oficial da sala.\n\n` +
    `Atenciosamente,\nEquipe Ivai Conecta.`;

  try {
    const docRef = await addDoc(collection(db, 'mail'), {
      to: emailTarget,
      message: {
        subject,
        text: plainText
      },
      metadata: {
        type: 'interview_invitation',
        candidateUid: candidateUid || null,
        jobTitle,
        companyName,
        createdAt: new Date().toISOString()
      }
    });

    return { dispatched: true, mailId: docRef.id };
  } catch (err) {
    console.warn('[notificationService] Aviso ao agendar e-mail de entrevista:', err.message);
    return { dispatched: false, error: err.message, requiresExtensionSetup: true };
  }
}

/**
 * Gera e dispara o download dos dados pessoais do usuário em conformidade com o direito à portabilidade (LGPD).
 * @param {object} user - Usuário conectado
 */
export async function exportUserDataAsJSON(user) {
  if (!user) return;

  const uid = user.uid || user.id;
  let fullData = { ...user };

  try {
    if (uid) {
      const snap = await getDoc(doc(db, 'users', String(uid)));
      if (snap.exists()) {
        fullData = { ...fullData, ...snap.data() };
      }
    }
  } catch (e) {
    console.warn('[exportUserDataAsJSON] Erro ao obter dados atualizados:', e);
  }

  // Remove campos sensíveis internos de segurança se existirem
  delete fullData.password;
  delete fullData.token;

  const exportPayload = {
    platform: 'Ivai Conecta',
    exportDate: new Date().toISOString(),
    lgpdCompliance: 'Art. 18, V da Lei 13.709/2018 - Portabilidade de Dados Pessoais',
    userData: fullData
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `ivai_conecta_dados_usuario_${uid || 'me'}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
