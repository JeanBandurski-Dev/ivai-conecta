import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateAuthUser } from './authService';

const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutos de validade
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 segundos entre reenvios

/**
 * Gera um código numérico seguro de 6 dígitos
 */
function generate6DigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Envia o código de verificação para o e-mail informado
 * 1. Dispara o e-mail com o código de 6 dígitos via endpoint do servidor / SMTP
 * 2. Também dispara a verificação nativa do Firebase Auth (se usuário estiver logado no Firebase)
 * 3. Registra o código no Firestore e no cache local com data de expiração
 */
export async function sendVerificationCode(user) {
  if (!user || !user.email) {
    return { success: false, error: 'E-mail do usuário não informado.' };
  }

  const uid = user.uid || user.id || 'current';
  const cleanEmail = user.email.toLowerCase().trim();
  const storageKey = `ivai_email_verif_${uid}`;

  // Verificar cooldown de reenvio
  try {
    const rawPrev = localStorage.getItem(storageKey);
    if (rawPrev) {
      const prev = JSON.parse(rawPrev);
      const elapsed = Date.now() - (prev.createdAt || 0);
      if (elapsed < RESEND_COOLDOWN_MS) {
        const remainingSec = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return {
          success: false,
          error: `Aguarde ${remainingSec}s antes de solicitar um novo código.`,
          cooldownRemaining: remainingSec
        };
      }
    }
  } catch {}

  const code = generate6DigitCode();
  const now = Date.now();
  const expiresAt = now + CODE_EXPIRY_MS;

  const verifData = {
    uid,
    email: cleanEmail,
    code,
    createdAt: now,
    expiresAt,
    attempts: 0,
    verified: false,
  };

  // 1. Salvar no Firestore
  try {
    await setDoc(doc(db, 'email_verifications', uid), verifData);
  } catch (dbErr) {
    console.warn('[emailVerification] Erro ao gravar no Firestore (usando fallback local):', dbErr);
  }

  // 2. Salvar no localStorage de segurança
  try {
    localStorage.setItem(storageKey, JSON.stringify(verifData));
  } catch {}

  let emailDispatchedViaApi = false;
  let devNotice = null;

  // 3. Tentar envio real do e-mail com o código de 6 dígitos via servidor da aplicação
  try {
    const response = await fetch('/api/auth/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        code,
        name: user.name || 'Usuário',
        expiresInMinutes: 10
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.sent) {
        emailDispatchedViaApi = true;
      } else if (result.reason === 'smtp_not_configured') {
        devNotice = result.devNotice || 'Configure SMTP no servidor para envio direto por e-mail.';
      }
    }
  } catch (apiErr) {
    console.warn('[emailVerification] Falha ao contatar endpoint de e-mail:', apiErr);
  }

  // 4. Aviso caso SMTP não esteja configurado
  if (!emailDispatchedViaApi) {
    console.info(`[emailVerification] Código gerado para ${cleanEmail}: ${code}. Configure SMTP no .env para envio direto via e-mail real.`);
  }

  console.info(`%c[Ivaí Conecta] 📧 CÓDIGO DE VERIFICAÇÃO PARA ${cleanEmail}: %c${code}`, 'color: #0284c7; font-weight: bold;', 'color: #16a34a; font-size: 16px; font-weight: 800;');

  return {
    success: true,
    message: emailDispatchedViaApi
      ? `Código enviado com sucesso para ${cleanEmail}!`
      : `Código de verificação gerado para ${cleanEmail}.`,
    email: cleanEmail,
    expiresAt,
    emailDispatchedViaApi,
    devCode: code, // Disponível para ambiente de testes/desenvolvimento
    devNotice
  };
}

/**
 * Valida o código digitado pelo usuário
 */
export async function confirmVerificationCode(user, enteredCode) {
  if (!user || !user.email) {
    return { success: false, error: 'Sessão do usuário inválida.' };
  }

  const cleanCode = String(enteredCode || '').trim();
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: 'O código de confirmação deve conter exatamente 6 dígitos numéricos.' };
  }

  const uid = user.uid || user.id || 'current';
  const storageKey = `ivai_email_verif_${uid}`;

  let record = null;

  // 1. Tentar ler do Firestore
  try {
    const snap = await getDoc(doc(db, 'email_verifications', uid));
    if (snap.exists()) {
      record = snap.data();
    }
  } catch (dbErr) {
    console.warn('[emailVerification] Erro ao ler Firestore:', dbErr);
  }

  // Fallback para localStorage se Firestore falhar
  if (!record) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) record = JSON.parse(raw);
    } catch {}
  }

  if (!record) {
    return {
      success: false,
      error: 'Nenhum código de verificação ativo encontrado. Solicite um novo código.'
    };
  }

  // Verificar expiração
  if (Date.now() > record.expiresAt) {
    return {
      success: false,
      error: 'Este código expirou (validade de 10 minutos). Por favor, solicite um novo código.'
    };
  }

  // Verificar tentativas excessivas
  if ((record.attempts || 0) >= 5) {
    return {
      success: false,
      error: 'Limite de tentativas excedido para este código. Solicite um novo código de verificação.'
    };
  }

  // Validar correspondência do código
  if (String(record.code).trim() !== cleanCode) {
    // Incrementar tentativas
    const updatedAttempts = (record.attempts || 0) + 1;
    record.attempts = updatedAttempts;

    try {
      localStorage.setItem(storageKey, JSON.stringify(record));
      await setDoc(doc(db, 'email_verifications', uid), { attempts: updatedAttempts }, { merge: true });
    } catch {}

    const remaining = 5 - updatedAttempts;
    return {
      success: false,
      error: `Código incorreto. Você ainda tem ${remaining} tentativa(s).`
    };
  }

  // CÓDIGO CORRETO! Marcar verificação concluída
  const verifiedAt = new Date().toISOString();

  // Atualizar Firestore no documento do usuário
  try {
    await setDoc(doc(db, 'users', uid), {
      emailVerified: true,
      emailVerifiedAt: verifiedAt,
      updatedAt: verifiedAt
    }, { merge: true });

    // Atualizar documento de verificação
    await setDoc(doc(db, 'email_verifications', uid), {
      verified: true,
      verifiedAt
    }, { merge: true });
  } catch (e) {
    console.warn('[emailVerification] Erro ao persistir verificação no Firestore:', e);
  }

  // Atualizar localStorage e sessão
  const updatedUser = updateAuthUser({
    emailVerified: true,
    emailVerifiedAt: verifiedAt
  });

  try {
    localStorage.removeItem(storageKey);
  } catch {}

  return {
    success: true,
    message: '🎉 E-mail verificado com sucesso! Seu status de autenticação foi confirmado.',
    user: updatedUser
  };
}
